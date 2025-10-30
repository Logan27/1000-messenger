// Extend window type to include runtime config
declare global {
  interface Window {
    __ENV__?: {
      API_URL?: string;
      WS_URL?: string;
      APP_NAME?: string;
      VERSION?: string;
    };
  }
}

// Use runtime config if available (from Docker), otherwise use build-time env vars
const runtimeConfig = window.__ENV__ || {};

export const config = {
  API_URL: runtimeConfig.API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  WS_URL: runtimeConfig.WS_URL || import.meta.env.VITE_WS_URL || 'http://localhost:3000',
  APP_NAME: runtimeConfig.APP_NAME || 'Chat App',
  VERSION: runtimeConfig.VERSION || '1.0.0',
};
