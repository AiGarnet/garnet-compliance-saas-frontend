// Try to use built-in fetch first, fallback to node-fetch
let fetch;
try {
  // Check if global fetch is available (Node 18+)
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (error) {
  console.log('Falling back to node-fetch:', error.message);
  fetch = require('node-fetch');
}

// Railway Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL 
  || (process.env.NODE_ENV === 'production' ? 'https://garnet-compliance-saas-production.up.railway.app' : null)
  || 'https://garnet-compliance-saas-production.up.railway.app';

console.log('Vendor-stats function - Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  BACKEND_URL: BACKEND_URL
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('Vendor-stats function called:', {
      backendUrl: BACKEND_URL,
      hasAuth: !!event.headers.authorization
    });

    // Prepare headers for backend request
    const backendHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Netlify-Function/vendor-stats'
    };

    // Forward Authorization header if present
    if (event.headers.authorization) {
      backendHeaders['Authorization'] = event.headers.authorization;
      console.log('Forwarding Authorization header to backend');
    }

    const backendUrl = `${BACKEND_URL}/api/vendors/stats`;
    
    console.log(`Making GET request to: ${backendUrl}`);

    // Make request to Railway backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: backendHeaders,
      timeout: 30000, // 30 second timeout
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to fetch vendor statistics',
          backendStatus: response.status,
          backendResponse: errorText,
          backendUrl: backendUrl
        }),
      };
    }

    const data = await response.json();
    console.log('Successfully fetched vendor stats:', data);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Vendor-stats function error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Check if it's a network/connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Backend service unavailable',
          details: error.message,
          errorCode: error.code,
          backendUrl: BACKEND_URL,
          function: 'vendor-stats'
        }),
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        function: 'vendor-stats',
        backendUrl: BACKEND_URL
      }),
    };
  }
}; 