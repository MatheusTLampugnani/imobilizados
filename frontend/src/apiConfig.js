const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL = isLocalhost 
  ? 'http://localhost:3001/api' 
  : '/api';