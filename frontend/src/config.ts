interface Config {
  apiUrl: string;
  environment: 'development' | 'production';
}

const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL,
  environment: (import.meta.env.MODE || 'development') as 'development' | 'production'
};

export default config; 