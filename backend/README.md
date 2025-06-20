# Backend Setup

## Environment Variables for Deployment

To support different domains (localhost, IP, or real domain), configure the following in your `.env` file (usually in the `secrets` directory):

```
CORS_ORIGINS=http://localhost,http://yourdomain.com,http://your-server-ip
OAUTH_REDIRECT_URI=http://yourdomain.com/api/callback
```

- For local development, you can use `http://localhost`.
- For production, set these to your actual frontend/backend domain or public IP.

**Example `.env` file:**
```
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
OAUTH_REDIRECT_URI=https://yourdomain.com/api/callback
```

After updating the `.env` file, rebuild your backend Docker image or restart the backend service to apply changes. 