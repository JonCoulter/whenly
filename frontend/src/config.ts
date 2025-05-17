interface Config {
  apiUrl: string;
  authCallbackUrl: string;
  environment: 'development' | 'production';
}

const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  authCallbackUrl: import.meta.env.VITE_AUTH_CALLBACK_URL || 'http://localhost:5000/callback',
  environment: (import.meta.env.MODE || 'development') as 'development' | 'production'
};

export default config; 