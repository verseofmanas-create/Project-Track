import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global fetch interceptor to automatically attach mock JWT Authorization headers
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const token = localStorage.getItem('projecttrack_token');
  // Ensure options.headers is initialized properly
  const headers = { ...(options.headers || {}) };
  
  if (token && url.toString().startsWith('/api/')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return originalFetch(url, { ...options, headers });
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

