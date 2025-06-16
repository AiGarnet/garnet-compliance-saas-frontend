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

console.log('Vendors function - Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  BACKEND_URL: BACKEND_URL
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  try {
    const method = event.httpMethod;
    const { path } = event;
    
    console.log('Vendors function called:', {
      method,
      path,
      backendUrl: BACKEND_URL,
      hasAuth: !!event.headers.authorization
    });

    // Prepare headers for backend request
    const backendHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Netlify-Function/vendors'
    };

    // Forward Authorization header if present
    if (event.headers.authorization) {
      backendHeaders['Authorization'] = event.headers.authorization;
      console.log('Forwarding Authorization header to backend');
    }

    let backendUrl = `${BACKEND_URL}/api/vendors`;
    let fetchOptions = {
      method: method,
      headers: backendHeaders,
      timeout: 30000, // 30 second timeout
    };

    if (method === 'GET') {
      // Check for specific endpoints in the path
      if (path.includes('/stats')) {
        backendUrl = `${BACKEND_URL}/api/vendors/stats`;
      } else if (path.includes('/status/')) {
        const status = path.split('/status/')[1];
        backendUrl = `${BACKEND_URL}/api/vendors/status/${status}`;
      } else if (path.includes('/with-suggestions')) {
        backendUrl = `${BACKEND_URL}/api/vendors/with-suggestions`;
      }
      
      console.log(`Making GET request to: ${backendUrl}`);
      
      const response = await fetch(backendUrl, fetchOptions);
      console.log('Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to fetch vendors',
            backendStatus: response.status,
            backendResponse: errorText,
            backendUrl: backendUrl
          }),
        };
      }

      const data = await response.json();
      console.log('Successfully fetched vendors:', data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
      
    } else if (method === 'POST') {
      // Create new vendor
      const requestBody = JSON.parse(event.body || '{}');
      console.log('Creating vendor with data:', requestBody);

      // Transform frontend data to match backend DTO
      const backendData = {
        companyName: requestBody.name || requestBody.companyName,
        region: requestBody.region || 'Not Specified',
        contactEmail: requestBody.contactEmail || '',
        contactName: requestBody.contactName,
        website: requestBody.website,
        industry: requestBody.industry,
        description: requestBody.description,
        status: requestBody.status,
        riskScore: requestBody.riskScore,
        riskLevel: requestBody.riskLevel
      };

      // Remove undefined values
      Object.keys(backendData).forEach(key => {
        if (backendData[key] === undefined) {
          delete backendData[key];
        }
      });

      // Check if it's a create with answers request
      if (requestBody.answers && Array.isArray(requestBody.answers)) {
        backendUrl = `${BACKEND_URL}/api/vendors/with-answers`;
        backendData.answers = requestBody.answers;
      }

      fetchOptions.body = JSON.stringify(backendData);
      
      console.log(`Making POST request to: ${backendUrl}`);
      console.log('Transformed backend data:', backendData);
      
      const response = await fetch(backendUrl, fetchOptions);
      console.log('Backend POST response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend POST error response:', errorText);
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to create vendor',
            backendStatus: response.status,
            backendResponse: errorText,
            backendUrl: backendUrl,
            requestBody: backendData
          }),
        };
      }

      const data = await response.json();
      console.log('Successfully created vendor:', data);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data),
      };
      
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Vendors function error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      type: error.type
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
          function: 'vendors'
        }),
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        errorType: error.name,
        function: 'vendors',
        backendUrl: BACKEND_URL
      }),
    };
  }
}; 