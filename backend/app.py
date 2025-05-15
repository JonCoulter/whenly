import os
import pathlib
import requests
import google.auth.transport.requests
from flask import Flask, session, abort, redirect, request, jsonify
from flask_cors import CORS
from google.oauth2 import id_token, credentials as google_credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from pip._vendor import cachecontrol
from functools import wraps
from datetime import datetime, timezone
from dateutil.parser import parse
import uuid
import json

from config import config
from models import db, Event, AvailabilitySlot, Response, init_app

# === Flask App Factory ===
def create_app(config_name='default'):
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Allows http traffic for local development
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    
    # === OAuth Setup ===
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    client_secrets_file = os.path.join(pathlib.Path(__file__).parent, 'client_secret.json')
    
    SCOPES = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar.readonly'
    ]
    
    flow = Flow.from_client_secrets_file(
        client_secrets_file=client_secrets_file,
        scopes=SCOPES,
        redirect_uri='http://localhost:5000/callback'
    )
    
    # === Auth Decorator ===
    def login_is_required(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            if 'google_id' not in session:
                return abort(401)
            return function(*args, **kwargs)
        return wrapper
    
    # === Routes ===
    @app.route('/')
    def index():
        return 'Hello World <a href="/login"><button>Login</button></a>'
    
    @app.route('/login')
    def login():
        authorization_url, state = flow.authorization_url(prompt='consent')
        session['state'] = state
        return redirect(authorization_url)
    
    @app.route('/callback')
    def callback():
        flow.fetch_token(authorization_response=request.url)
    
        if session['state'] != request.args['state']:
            abort(500)
    
        credentials = flow.credentials
    
        # Save credentials for later use
        session['credentials'] = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
    
        # Verify ID token
        request_session = requests.session()
        cached_session = cachecontrol.CacheControl(request_session)
        token_request = google.auth.transport.requests.Request(session=cached_session)
    
        id_info = id_token.verify_oauth2_token(
            credentials.id_token,
            token_request,
            audience=GOOGLE_CLIENT_ID
        )
    
        session['google_id'] = id_info['sub']
        session['name'] = id_info['name']
    
        return redirect('/protected_area')
    
    @app.route('/protected_area')
    @login_is_required
    def protected_area():
        return f'Hello {session["name"]}! <br/> <a href="/calendar"><button>View Calendar</button></a> <br/> <a href="/logout"><button>Logout</button></a>'
    
    @app.route('/logout')
    def logout():
        session.clear()
        return redirect('/')
    
    @app.route('/calendar')
    @login_is_required
    def calendar():
        creds_data = session.get('credentials')
        if not creds_data:
            return redirect('/login')
    
        creds = google_credentials.Credentials(
            token=creds_data['token'],
            refresh_token=creds_data['refresh_token'],
            token_uri=creds_data['token_uri'],
            client_id=creds_data['client_id'],
            client_secret=creds_data['client_secret'],
            scopes=creds_data['scopes']
        )
    
        service = build('calendar', 'v3', credentials=creds)
        now = datetime.now(timezone.utc).isoformat()
    
        calendar_list = service.calendarList().list().execute()
        all_events = []
    
        for calendar_entry in calendar_list.get('items', []):
            cal_id   = calendar_entry['id']
            cal_name = calendar_entry.get('summary', 'Unnamed Calendar')
    
            events = service.events().list(
                calendarId=cal_id,
                timeMin=now,
                maxResults=5,
                singleEvents=True,
                orderBy='startTime'
            ).execute().get('items', [])
    
            for e in events:
                raw_start = e['start'].get('dateTime', e['start'].get('date'))
                summary   = e.get('summary', 'No Title')
                try:
                    parsed_start = parse(raw_start)
                    if parsed_start.tzinfo is None:
                        parsed_start = parsed_start.replace(tzinfo=timezone.utc)
                except Exception:
                    parsed_start = datetime.max.replace(tzinfo=timezone.utc)
                all_events.append((parsed_start, f"[{cal_name}] {raw_start}: {summary}"))
    
        # Sort *once* by the datetime key
        all_events.sort(key=lambda x: x[0])
    
        if not all_events:
            return 'No upcoming events found across calendars.'
    
        event_list = '<br/>'.join([item[1] for item in all_events])
        return (
            "<h3>Upcoming Events from All Calendars:</h3>"
            f"<p>{event_list}</p>"
            "<a href='/protected_area'><button>Back</button></a>"
        )
    
    # === Event API Routes ===
    @app.route('/api/events/create', methods=['POST'])
    def create_event():
        """
        Create a new event based on form data
        Expected payload:
        {
            "eventName": "Event Name",
            "eventType": "specificDays" | "daysOfWeek",
            "timeRange": {
                "start": "09:00 AM",
                "end": "05:00 PM"
            },
            "specificDays": ["2023-11-01", "2023-11-02"] (if eventType is "specificDays")
            OR
            "daysOfWeek": ["Monday", "Wednesday", "Friday"] (if eventType is "daysOfWeek")
        }
        """
        try:
            # Get JSON data from request
            data = request.json
            
            # Basic validation
            if not data or not isinstance(data, dict):
                return jsonify({"success": False, "message": "Invalid request data"}), 400
            
            required_fields = ['eventName', 'eventType', 'timeRange']
            for field in required_fields:
                if field not in data:
                    return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400
            
            # Validate event type and corresponding data
            event_type = data['eventType']
            if event_type not in ['specificDays', 'daysOfWeek']:
                return jsonify({"success": False, "message": "Invalid event type"}), 400
            
            if event_type == 'specificDays' and ('specificDays' not in data or not data['specificDays']):
                return jsonify({"success": False, "message": "specificDays is required for this event type"}), 400
            
            if event_type == 'daysOfWeek' and ('daysOfWeek' not in data or not data['daysOfWeek']):
                return jsonify({"success": False, "message": "daysOfWeek is required for this event type"}), 400
            
            # Generate a unique ID for the event
            event_id = str(uuid.uuid4())
            created_at = datetime.now()
            
            # Create event in database
            # NOTE: This code is commented out until database integration is complete
            """
            new_event = Event(
                id=event_id,
                name=data['eventName'],
                event_type=event_type,
                time_start=data['timeRange']['start'],
                time_end=data['timeRange']['end'],
                specific_days=json.dumps(data.get('specificDays', [])) if event_type == 'specificDays' else None,
                days_of_week=json.dumps(data.get('daysOfWeek', [])) if event_type == 'daysOfWeek' else None,
                created_at=created_at,
                created_by=session.get('google_id', 'anonymous')
            )
            db.session.add(new_event)
            
            # Create availability slots
            if event_type == 'specificDays':
                for date_str in data.get('specificDays', []):
                    slot = AvailabilitySlot(
                        event_id=event_id,
                        date=datetime.strptime(date_str, '%Y-%m-%d').date(),
                        start_time=data['timeRange']['start'],
                        end_time=data['timeRange']['end']
                    )
                    db.session.add(slot)
            else:  # daysOfWeek
                for day in data.get('daysOfWeek', []):
                    slot = AvailabilitySlot(
                        event_id=event_id,
                        day_of_week=day,
                        start_time=data['timeRange']['start'],
                        end_time=data['timeRange']['end']
                    )
                    db.session.add(slot)
                    
            db.session.commit()
            """
            
            # Mock response for now
            event_data = {
                "id": event_id,
                "name": data['eventName'],
                "eventType": event_type,
                "timeRange": data['timeRange'],
                "specificDays": data.get('specificDays', []),
                "daysOfWeek": data.get('daysOfWeek', []),
                "createdAt": created_at.isoformat()
            }
            
            return jsonify({
                "success": True,
                "message": "Event created successfully",
                "data": event_data
            }), 201
        
        except Exception as e:
            # In a real app with database, would rollback the session
            # db.session.rollback()
            app.logger.error(f"Error creating event: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Server error: {str(e)}"
            }), 500
    
    @app.route('/api/events/<event_id>', methods=['GET'])
    def get_event(event_id):
        """Get event details by ID"""
        try:
            # In a real app with database, would query the event
            # event = Event.query.filter_by(id=event_id).first()
            # if not event:
            #     return jsonify({"success": False, "message": "Event not found"}), 404
            # event_data = event.to_dict()
            
            # Mock response for now
            event_data = {
                "id": event_id,
                "name": "Sample Event",
                "eventType": "specificDays",
                "timeRange": {
                    "start": "09:00 AM",
                    "end": "05:00 PM"
                },
                "specificDays": ["2023-11-01", "2023-11-02"],
                "createdAt": datetime.now().isoformat()
            }
            
            return jsonify({
                "success": True,
                "data": event_data
            }), 200
        
        except Exception as e:
            app.logger.error(f"Error retrieving event: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Server error: {str(e)}"
            }), 500
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

# === Run ===
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0')
