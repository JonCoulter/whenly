import os
import re
import pathlib
import requests
import google.auth.transport.requests
from flask import Flask, session, Response as FlaskResponse, abort, redirect, request, jsonify, send_from_directory
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
from meta_middleware import MetaTagMiddleware

# === Flask App Factory ===
def create_app(config_name='default'):
    app = Flask(
        __name__,
        static_folder=os.path.join(pathlib.Path(__file__).parent, "frontend", "dist"),
        static_url_path=""
    )
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS
    CORS(app, 
         resources={r"/api/*": {
             "origins": app.config['CORS_ORIGINS'],
             "supports_credentials": app.config['CORS_SUPPORTS_CREDENTIALS'],
             "allow_headers": ["Content-Type"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
         }},
         supports_credentials=app.config['CORS_SUPPORTS_CREDENTIALS']
    )
    
    # Allows http traffic for local development
    if app.config['DEBUG']:
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
    
    # Configure OAuth redirect URI based on environment
    redirect_uri = os.environ.get('OAUTH_REDIRECT_URI', 'http://localhost:5000/api/callback')
    
    flow = Flow.from_client_secrets_file(
        client_secrets_file=client_secrets_file,
        scopes=SCOPES,
        redirect_uri=redirect_uri
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
    @app.route('/api/login')
    def login():
        # Store the referrer URL in the session
        referrer = request.referrer or '/'
        session['redirect_after_login'] = referrer
        print(session['redirect_after_login'])
        
        authorization_url, state = flow.authorization_url(prompt='consent')
        session['state'] = state
        return redirect(authorization_url)
    
    @app.route('/api/callback')
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
    
        # Store user information in session
        session['google_id'] = id_info['sub']
        session['name'] = id_info['name']
        session['email'] = id_info.get('email', '')
        session['picture'] = id_info.get('picture', '')
        
        # Get the stored redirect URL or default to home
        redirect_url = session.pop('redirect_after_login', '/')
        return redirect(redirect_url)
    
    @app.route('/api/logout')
    def logout():
        session.clear()
        return jsonify({
            "success": True,
            "message": "Successfully logged out"
        })
    
    @app.route('/api/auth/status')
    def auth_status():
        """Check if user is authenticated and return user info if they are"""
        if 'google_id' not in session:
            return jsonify({
                "authenticated": False
            })
        
        # Get user info from session
        user_info = {
            "authenticated": True,
            "user": {
                "name": session.get('name'),
                "googleId": session.get('google_id'),
                "email": session.get('email', ''),  # Add email if available
                "picture": session.get('picture', '')  # Add picture if available
            }
        }
        
        return jsonify(user_info)
    
    @app.route('/api/calendar/events', methods=['GET'])
    @login_is_required
    def get_calendar_events():
        """Get calendar events for a specific date range"""
        try:
            # Get date range from query parameters
            start_date = request.args.get('startDate')
            end_date = request.args.get('endDate')
            
            if not start_date or not end_date:
                return jsonify({
                    "success": False,
                    "message": "startDate and endDate are required"
                }), 400
            
            # Get credentials from session
            creds_data = session.get('credentials')
            if not creds_data:
                return jsonify({
                    "success": False,
                    "message": "Not authenticated with Google Calendar"
                }), 401
            
            # Create credentials object
            creds = google_credentials.Credentials(
                token=creds_data['token'],
                refresh_token=creds_data['refresh_token'],
                token_uri=creds_data['token_uri'],
                client_id=creds_data['client_id'],
                client_secret=creds_data['client_secret'],
                scopes=creds_data['scopes']
            )
            
            # Build calendar service
            service = build('calendar', 'v3', credentials=creds)
            
            # Get calendar list
            calendar_list = service.calendarList().list().execute()
            all_events = []
            
            # Convert dates to ISO format
            time_min = f"{start_date}T00:00:00Z"
            time_max = f"{end_date}T23:59:59Z"
            
            # Fetch events from each calendar
            for calendar_entry in calendar_list.get('items', []):
                cal_id = calendar_entry['id']
                cal_name = calendar_entry.get('summary', 'Unnamed Calendar')
                
                # # Skip task calendars
                # if 'tasks' in cal_name.lower():
                #     continue
                
                events = service.events().list(
                    calendarId=cal_id,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute().get('items', [])
                
                for event in events:
                    # # Skip all-day events and tasks
                    # if 'date' in event['start'] or event.get('eventType') == 'default':
                    #     continue
                    
                    # Get event start and end times
                    start = event['start'].get('dateTime')
                    end = event['end'].get('dateTime')
                    
                    # Skip if no specific time (all-day event)
                    if not start or not end:
                        continue
                    
                    # Parse dates
                    try:
                        start_dt = parse(start)
                        end_dt = parse(end)
                        
                        # Convert to local time if needed
                        if start_dt.tzinfo is None:
                            start_dt = start_dt.replace(tzinfo=timezone.utc)
                        if end_dt.tzinfo is None:
                            end_dt = end_dt.replace(tzinfo=timezone.utc)
                        
                        all_events.append({
                            'summary': event.get('summary', 'No Title'),
                            'start': start_dt.isoformat(),
                            'end': end_dt.isoformat(),
                            'calendar': cal_name
                        })
                    except Exception as e:
                        print(f"Error parsing event date: {str(e)}")
                        continue
            
            return jsonify({
                "success": True,
                "data": {
                    "events": all_events
                }
            }), 200
            
        except Exception as e:
            print(f"Error fetching calendar events: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Failed to fetch calendar events: {str(e)}"
            }), 500
    
    # === Event API Routes ===
    @app.route('/api/events/create', methods=['POST'])
    def create_event():
        """
        Create a new event based on form data
        Expected payload:
        {
            "eventName": "Event Name",
            "eventType": "specificDays" | "daysOfWeek",
            "createdBy": "user@email.com",
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
            
            required_fields = ['eventName', 'eventType', 'timeRange', 'createdBy']
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
            
            # Get creator's name from session
            creator_name = data['creatorName'] if 'creatorName' in data else 'Anonymous'
            
            # Generate a unique ID for the event
            event_id = str(uuid.uuid4())
            created_at = datetime.now()
            
            # Create event in database
            new_event = Event(
                id=event_id,
                name=data['eventName'],
                event_type=event_type,
                time_start=data['timeRange']['start'],
                time_end=data['timeRange']['end'],
                specific_days=json.dumps(data.get('specificDays', [])) if event_type == 'specificDays' else None,
                days_of_week=json.dumps(data.get('daysOfWeek', [])) if event_type == 'daysOfWeek' else None,
                created_at=created_at,
                created_by=data['createdBy'],
                creator_name=creator_name
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
            
            return jsonify({
                "success": True,
                "message": "Event created successfully",
                "data": {
                    "eventId": event_id,
                    "event": new_event.to_dict()
                }
            }), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating event: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Failed to create event: {str(e)}"
            }), 500
    
    @app.route('/api/events/<event_id>', methods=['GET'])
    def get_event(event_id):
        """Get event details by ID"""
        try:
            # Get event details by ID
            event = Event.query.filter_by(id=event_id).first()
            if not event:
                return jsonify({"success": False, "message": "Event not found"}), 404
            event_data = event.to_dict()
            
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
    
    @app.route('/api/events/<event_id>/availability', methods=['POST'])
    def submit_availability(event_id):
        """
        Submit availability for an event
        Expected payload:
        {
            "userName": "John Doe",
            "userId": "user@email.com",  # Optional
            "selectedSlots": ["Monday-09:00", "Monday-09:30", ...] for daysOfWeek events
            OR
            "selectedSlots": ["2024-03-20-09:00", "2024-03-20-09:30", ...] for specificDays events
        }
        """
        try:
            # Get JSON data from request
            data = request.json
            
            # Basic validation
            if not data or not isinstance(data, dict):
                return jsonify({"success": False, "message": "Invalid request data"}), 400
            
            required_fields = ['userName', 'selectedSlots']
            for field in required_fields:
                if field not in data:
                    return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400
            
            # Get event and validate it exists
            event = Event.query.filter_by(id=event_id).first()
            if not event:
                return jsonify({"success": False, "message": "Event not found"}), 404
            
            # Get or create availability slots
            for slot_id in data['selectedSlots']:
                if event.event_type == 'daysOfWeek':
                    # Parse the slot ID (format: "DAY-HH:mm")
                    # Handle potential -undefined suffix
                    clean_slot_id = slot_id.split('-undefined')[0]
                    day_of_week, time_str = clean_slot_id.split('-')
                    
                    # Find or create the slot
                    slot = AvailabilitySlot.query.filter_by(
                        event_id=event_id,
                        day_of_week=day_of_week,
                        start_time=time_str
                    ).first()
                    
                    if not slot:
                        # Create new slot if it doesn't exist
                        slot = AvailabilitySlot(
                            event_id=event_id,
                            day_of_week=day_of_week,
                            start_time=time_str,
                            end_time=time_str  # You might want to calculate this based on slot duration
                        )
                        db.session.add(slot)
                        db.session.flush()  # Get the slot ID
                else:  # specificDays event
                    # Parse the slot ID (format: "YYYY-MM-DD-HH:mm")
                    parts = slot_id.split('-')
                    date_str = '-'.join(parts[:3])  # Join YYYY-MM-DD
                    time_str = parts[3]  # Get HH:mm
                    
                    date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    
                    # Find or create the slot
                    slot = AvailabilitySlot.query.filter_by(
                        event_id=event_id,
                        date=date,
                        start_time=time_str
                    ).first()
                    
                    if not slot:
                        # Create new slot if it doesn't exist
                        slot = AvailabilitySlot(
                            event_id=event_id,
                            date=date,
                            start_time=time_str,
                            end_time=time_str  # You might want to calculate this based on slot duration
                        )
                        db.session.add(slot)
                        db.session.flush()  # Get the slot ID
                
                # Create response
                response = Response(
                    event_id=event_id,
                    slot_id=slot.id,
                    user_id=data.get('userId'),
                    user_name=data['userName'],
                    is_available=True
                )
                db.session.add(response)
            
            db.session.commit()
            
            return jsonify({
                "success": True,
                "message": "Availability submitted successfully"
            }), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"Error submitting availability: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Failed to submit availability: {str(e)}"
            }), 500

    @app.route('/api/events/<event_id>/responses', methods=['GET'])
    def get_event_responses(event_id):
        """Get all responses for an event"""
        try:
            # Get event and validate it exists
            event = Event.query.filter_by(id=event_id).first()
            if not event:
                return jsonify({"success": False, "message": "Event not found"}), 404
            
            # Get unique users who have responded
            unique_users = db.session.query(Response.user_name).filter_by(event_id=event_id).distinct().count()
            
            # Get all responses with slot information
            responses = db.session.query(Response, AvailabilitySlot).join(
                AvailabilitySlot,
                Response.slot_id == AvailabilitySlot.id
            ).filter(Response.event_id == event_id).all()
            
            # Format response data
            formatted_responses = []
            for response, slot in responses:
                response_data = response.to_dict()
                # Add slot information based on event type
                if event.event_type == 'daysOfWeek':
                    response_data['slotId'] = f"{slot.day_of_week}-{slot.start_time}"
                else:
                    response_data['slotId'] = f"{slot.date}-{slot.start_time}"
                formatted_responses.append(response_data)
            
            return jsonify({
                "success": True,
                "data": {
                    "totalResponses": len(formatted_responses),
                    "uniqueUsers": unique_users,
                    "responses": formatted_responses
                }
            }), 200
            
        except Exception as e:
            print(f"Error getting responses: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Failed to get responses: {str(e)}"
            }), 500
    
    @app.route('/api/events/<event_id>/availability', methods=['PUT'])
    def update_availability(event_id):
        """
        Update availability for an event (replace all previous slots for this user).
        Expected payload:
        {
            "userName": "John Doe",
            "userId": "user@email.com",  # Optional
            "selectedSlots": ["Monday-09:00", ...] or ["2024-03-20-09:00", ...]
        }
        """
        try:
            data = request.json
            if not data or not isinstance(data, dict):
                return jsonify({"success": False, "message": "Invalid request data"}), 400

            required_fields = ['userName', 'selectedSlots']
            for field in required_fields:
                if field not in data:
                    return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

            user_id = data.get('userId')
            user_name = data['userName']

            # Get event and validate it exists
            event = Event.query.filter_by(id=event_id).first()
            if not event:
                return jsonify({"success": False, "message": "Event not found"}), 404

            # Delete all previous responses for this user/event
            if user_id:
                Response.query.filter_by(event_id=event_id, user_id=user_id).delete()
            else:
                Response.query.filter_by(event_id=event_id, user_name=user_name).delete()
            db.session.commit()

            # Insert new responses (same as POST logic)
            for slot_id in data['selectedSlots']:
                if event.event_type == 'daysOfWeek':
                    clean_slot_id = slot_id.split('-undefined')[0]
                    day_of_week, time_str = clean_slot_id.split('-')
                    slot = AvailabilitySlot.query.filter_by(
                        event_id=event_id,
                        day_of_week=day_of_week,
                        start_time=time_str
                    ).first()
                    if not slot:
                        slot = AvailabilitySlot(
                            event_id=event_id,
                            day_of_week=day_of_week,
                            start_time=time_str,
                            end_time=time_str
                        )
                        db.session.add(slot)
                        db.session.flush()
                else:
                    parts = slot_id.split('-')
                    date_str = '-'.join(parts[:3])
                    time_str = parts[3]
                    date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    slot = AvailabilitySlot.query.filter_by(
                        event_id=event_id,
                        date=date,
                        start_time=time_str
                    ).first()
                    if not slot:
                        slot = AvailabilitySlot(
                            event_id=event_id,
                            date=date,
                            start_time=time_str,
                            end_time=time_str
                        )
                        db.session.add(slot)
                        db.session.flush()
                response = Response(
                    event_id=event_id,
                    slot_id=slot.id,
                    user_id=user_id,
                    user_name=user_name,
                    is_available=True
                )
                db.session.add(response)
            db.session.commit()

            return jsonify({
                "success": True,
                "message": "Availability updated successfully"
            }), 200

        except Exception as e:
            db.session.rollback()
            print(f"Error updating availability: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Failed to update availability: {str(e)}"
            }), 500
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Apply meta tag middleware for dynamic SEO
    # app.wsgi_app = MetaTagMiddleware(app.wsgi_app)
    
    def inject_meta_tags(html: str, event_data: dict, request_url: str) -> str:
        """Inject dynamic meta tags based on event data"""
        
        event_name = event_data.get('name', 'Whenly Event')
        creator_name = event_data.get('creatorName', 'Anonymous')
        
        # Escape HTML entities in the data
        def escape_html(text):
            return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&#x27;')
        
        event_name = escape_html(event_name)
        creator_name = escape_html(creator_name)
        
        # Create description based on event type
        if event_data.get('eventType') == 'specificDays':
            days = event_data.get('specificDays', [])
            description = f"Join {creator_name} for '{event_name}' on {len(days)} selected day(s). Find the best time to meet with Whenly."
        else:
            days = event_data.get('daysOfWeek', [])
            if days:
                description = f"Join {creator_name} for '{event_name}' on {', '.join(days)}. Find the best time to meet with Whenly."
            else:
                description = f"Join {creator_name} for '{event_name}'. Find the best time to meet with Whenly."
        
        description = escape_html(description)
        
        # Build meta tags
        title = f"{event_name} - Whenly"
        og_image = f"{request_url.split('/e/')[0]}/og-image.png"
        
        # Remove existing meta tags that we want to replace
        patterns_to_remove = [
            r'<title>.*?</title>',
            r'<meta name="description"[^>]*>',
            r'<meta property="og:title"[^>]*>',
            r'<meta property="og:description"[^>]*>',
            r'<meta property="og:url"[^>]*>',
            r'<meta property="og:type"[^>]*>',
            r'<meta property="og:image"[^>]*>',
            r'<meta name="twitter:card"[^>]*>',
            r'<meta name="twitter:title"[^>]*>',
            r'<meta name="twitter:description"[^>]*>',
            r'<meta name="twitter:image"[^>]*>',
            r'<meta name="twitter:url"[^>]*>'
        ]
        
        for pattern in patterns_to_remove:
            html = re.sub(pattern, '', html, flags=re.IGNORECASE | re.DOTALL)
        
        # Build new meta tags
        meta_tags = f"""<title>{title}</title>
    <meta name="description" content="{description}">
    <meta property="og:title" content="{event_name}">
    <meta property="og:description" content="{description}">
    <meta property="og:url" content="{request_url}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="{og_image}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{event_name}">
    <meta name="twitter:description" content="{description}">
    <meta name="twitter:image" content="{og_image}">
    <meta name="twitter:url" content="{request_url}">"""
        
        # Insert meta tags before closing head tag
        return html.replace("</head>", f"    {meta_tags}\n</head>", 1)

    @app.route("/e/<event_id>")
    def event_page(event_id):
        """Serve index.html with dynamic meta tags for event pages"""
        
        # Get event data from database
        try:
            event = Event.query.filter_by(id=event_id).first()
            if not event:
                return Response("Event not found", status=404)
            
            event_data = event.to_dict()
        except Exception as e:
            print(f"Error fetching event: {e}")
            return Response("Error loading event", status=500)
        
        # Read the index.html file
        index_path = os.path.join(app.static_folder, "index.html")
        
        if not os.path.exists(index_path):
            return Response("Frontend not built. Run 'npm run build' first.", status=500)
        
        try:
            with open(index_path, "r", encoding='utf-8') as f:
                html = f.read()
        except Exception as e:
            print(f"Error reading index.html: {e}")
            return Response("Error loading page", status=500)
        
        # Inject meta tags
        full_url = f"{request.url_root.rstrip('/')}/e/{event_id}"
        html_with_meta = inject_meta_tags(html, event_data, full_url)
        
        return Response(html_with_meta, mimetype="text/html")
    
    @app.route("/api/<path:path>")
    def api_routes(path):
        """Handle API routes - add your API logic here"""
        # Your existing API routes go here
        pass
    
    # Static file serving for assets
    @app.route("/<path:filename>")
    def static_files(filename):
        """Serve static files (JS, CSS, images, etc.)"""
        file_path = os.path.join(app.static_folder, filename)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(app.static_folder, filename)
        # If file doesn't exist, fall through to catch_all
        return catch_all(filename)
    
    # Catch-all route for React Router
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        """Serve React app for all other routes"""
        # Don't serve index.html for event pages - they're handled above
        if path.startswith("e/"):
            return Response("Event not found", status=404)
            
        # For all other routes, serve the React app
        return send_from_directory(app.static_folder, "index.html")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0')