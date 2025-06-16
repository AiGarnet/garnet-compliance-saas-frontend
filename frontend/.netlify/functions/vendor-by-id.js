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

console.log('Vendor-by-id function - Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  BACKEND_URL: BACKEND_URL
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, POST, OPTIONS',
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
    const { path, queryStringParameters } = event;
    
    // Extract vendor ID from path or query parameters
    const pathSegments = path.split('/');
    const vendorId = pathSegments[pathSegments.length - 1] || queryStringParameters?.id;
    
    console.log('Vendor-by-id function called:', {
      method,
      vendorId,
      path,
      backendUrl: BACKEND_URL,
      queryParams: queryStringParameters,
      hasAuth: !!event.headers.authorization
    });
    
    if (!vendorId || vendorId === 'vendor-by-id') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Vendor ID is required' }),
      };
    }

    // Prepare headers for backend request
    const backendHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Netlify-Function/vendor-by-id'
    };

    // Forward Authorization header if present
    if (event.headers.authorization) {
      backendHeaders['Authorization'] = event.headers.authorization;
      console.log('Forwarding Authorization header to backend');
    }

    let backendUrl = `${BACKEND_URL}/api/vendors/${vendorId}`;
    let fetchOptions = {
      method: method,
      headers: backendHeaders,
      timeout: 30000,
    };

    if (method === 'GET') {
      // Check for specific sub-endpoints
      if (path.includes('/answers')) {
        backendUrl = `${BACKEND_URL}/api/vendors/${vendorId}/answers`;
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
            error: 'Failed to fetch vendor',
            backendStatus: response.status,
            backendResponse: errorText,
            vendorId: vendorId
          }),
        };
      }

      const data = await response.json();
      console.log('Successfully fetched vendor:', data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
      
    } else if (method === 'PUT') {
      // Update vendor
      const requestBody = JSON.parse(event.body || '{}');
      console.log('Updating vendor with data:', requestBody);

      // Transform frontend data to match backend DTO
      const backendData = {
        companyName: requestBody.name || requestBody.companyName,
        region: requestBody.region,
        contactEmail: requestBody.contactEmail,
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

      fetchOptions.body = JSON.stringify(backendData);
      
      console.log(`Making PUT request to: ${backendUrl}`);
      console.log('Transformed backend data:', backendData);

      const response = await fetch(backendUrl, fetchOptions);
      console.log('Backend PUT response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend PUT error response:', errorText);
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to update vendor',
            backendStatus: response.status,
            backendResponse: errorText,
            vendorId: vendorId,
            requestBody: backendData
          }),
        };
      }

      const data = await response.json();
      console.log('Successfully updated vendor:', data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
      
    } else if (method === 'POST') {
      // Handle saving questionnaire answers
      if (path.includes('/answers') && event.body) {
        const requestData = JSON.parse(event.body);
        backendUrl = `${BACKEND_URL}/api/vendors/${vendorId}/answers`;
        fetchOptions.body = JSON.stringify(requestData.answers || requestData);
        
        console.log(`Making POST request to: ${backendUrl}`);
        console.log('Saving questionnaire answers:', requestData);

        const response = await fetch(backendUrl, fetchOptions);
        console.log('Backend POST response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend POST error response:', errorText);
          
          return {
            statusCode: response.status,
            headers,
            body: JSON.stringify({ 
              error: 'Failed to save questionnaire answers',
              backendStatus: response.status,
              backendResponse: errorText,
              vendorId: vendorId
            }),
          };
        }

        const data = await response.json();
        console.log('Successfully saved questionnaire answers:', data);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data),
        };
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid POST request' }),
        };
      }
      
    } else if (method === 'DELETE') {
      // Delete vendor
      console.log(`Making DELETE request to: ${backendUrl}`);
      
      const response = await fetch(backendUrl, fetchOptions);
      console.log('Backend DELETE response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend DELETE error response:', errorText);
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to delete vendor',
            backendStatus: response.status,
            backendResponse: errorText,
            vendorId: vendorId
          }),
        };
      }

      const data = await response.json();
      console.log('Successfully deleted vendor:', data);
      
      return {
        statusCode: 200,
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
    console.error('Vendor-by-id function error:', error);
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
          function: 'vendor-by-id'
        }),
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        function: 'vendor-by-id',
        backendUrl: BACKEND_URL
      }),
    };
  }
}; 