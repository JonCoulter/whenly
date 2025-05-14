import os
import pathlib

# TODO: Add imports to venv and requirements.txt
import requests
from flask import Flask, session, abort, redirect, request
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from pip._vendor import cachecontrol
import google.auth.transport.requests


#TODO: Setup secret key
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY')

# Allows http traffic for local dev
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

#TODO: Setup client id
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
client_secrets_file = os.path.join(pathlib.Path(__file__).parent, 'client_secret.json')

# Defines how users are authorized
flow = Flow.from_client_secrets_file(
    client_secrets_file=client_secrets_file,
    scopes=['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email', 'openid'],
    redirect_uri='http://localhost:5000/callback'
)


def login_is_required(function):
    """Decorator that requires user to be logged in."""
    def wrapper(*args, **kwargs):
        if 'google_id' not in session:
            return abort(401)
        else:
            return function()

    return wrapper


@app.route('/login')
def login():
    # Redirect to the authorization url from our flow
    authorization_url, state = flow.authorization_url()
    session['state'] = state
    return redirect(authorization_url)


@app.route('/callback')
def callback():
    # Exchange the authorization code for a token using the provided full redirect URL
    flow.fetch_token(authorization_response=request.url)

    # Check if the 'state' parameter in the URL matches the expected state stored in the session
    if not session['state'] == request.args['state']:
        abort(500)

    # Retrieve the credentials object which now contains the access and refresh tokens
    credentials = flow.credentials

    # Create a new session for making http requests with caching
    request_session = requests.session()
    cached_session = cachecontrol.CacheControl(request_session)

    # Create a Google-auth-specific request object that will be used to verify the id token
    token_request = google.auth.transport.requests.Request(session=cached_session)

    # Verify the OAuth2 id token with Google's servers to confirm it's valid
    id_info = id_token.verify_oauth2_token(
        id_token=credentials._id_token,
        request=token_request,
        audience=GOOGLE_CLIENT_ID
    )

    # Store the user's unique google id and name in the session
    session['google_id'] = id_info.get('sub')
    session['name'] = id_info.get('name')

    return redirect('/protected_area')


@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')


@app.route('/')
def index():
    return 'Hello World <a href="/login"><button>Login</button></a>'


@app.route('/protected_area')
@login_is_required
def protected_area():
    return f'Hello {session["name"]}! <br/> <a href="/logout"><button>Logout</button></a>'


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')