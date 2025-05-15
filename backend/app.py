import os
import pathlib
import requests
import google.auth.transport.requests
from flask import Flask, session, abort, redirect, request
from google.oauth2 import id_token, credentials as google_credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from pip._vendor import cachecontrol
from functools import wraps
from datetime import datetime, timezone
from dateutil.parser import parse

# === Flask Setup ===
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY')

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
    @wraps(function)  # <-- This line is the fix
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


# === Run ===
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
