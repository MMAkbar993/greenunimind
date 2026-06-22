// Simple test to check if the frontend is using the correct API base URL
console.log('Environment variables:');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('All env vars:', import.meta.env);

// Test the config
import { config } from './src/config/index.ts';
console.log('Config apiBaseUrl:', config.apiBaseUrl);
