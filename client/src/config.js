// Try to import local config for development, fallback to production
let API_BASE;
try {
  const localConfig = require('./config.local.js');
  API_BASE = localConfig.API_BASE;
} catch (e) {
  API_BASE = 'https://ecommerce-app-8nbo.onrender.com/api';
}

export { API_BASE };


