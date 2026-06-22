interface IConfig {
  oauth: {
    google: {
      clientId: string;
      redirectUri: string;
    };
    facebook: {
      clientId: string;
      redirectUri: string;
    };
    apple: {
      clientId: string;
      redirectUri: string;
    };
  };
  apiBaseUrl: string;
  wsBaseUrl: string;
  node_env: string;
}

export const config: IConfig = {
  oauth: {
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    },
    facebook: {
      clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID,
      redirectUri: import.meta.env.VITE_FACEBOOK_REDIRECT_URI,
    },
    apple: {
      clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
      redirectUri: import.meta.env.VITE_APPLE_REDIRECT_URI,
    },
  },
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || (import.meta.env.DEV ? 'http://localhost:5001/api' : ''),
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:5000',
  node_env: import.meta.env.VITE_NODE_ENV!,
};

