// Try to import local config for development, fallback to production
let API_BASE;
let CLIENT_URL;
try {
  const localConfig = require('./config.local.js');
  API_BASE = localConfig.API_BASE;
  CLIENT_URL = localConfig.CLIENT_URL;
} catch (e) {
  API_BASE = 'https://ecommerce-app-8nbo.onrender.com/api';
  CLIENT_URL = 'http://localhost:5173';
}

export { API_BASE, CLIENT_URL };

