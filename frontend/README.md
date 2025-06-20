

## Environment Variables for Deployment

To support different domains (localhost, IP, or real domain), configure the following environment variables in a `.env` file in the `frontend` directory:

```
VITE_API_URL=http://your-backend-domain-or-ip:5000
VITE_AUTH_CALLBACK_URL=http://your-backend-domain-or-ip:5000/callback
```

- For local development, you can use `http://localhost:5000`.
- For production, set these to your actual backend domain or public IP.

**Example `.env` file:**
```
API_URL=https://api.yourdomain.com
```

After updating the `.env` file, rebuild your frontend Docker image or restart the Vite dev server to apply changes.
