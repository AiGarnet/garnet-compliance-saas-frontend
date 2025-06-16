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

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('Waitlist-signup function: Received request');
    console.log('Event body:', event.body);

    // Parse the request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Invalid JSON in request body' 
        }),
      };
    }

    // Validate required fields
    if (!requestData.email || !requestData.full_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Missing required fields: email and full_name are required' 
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Invalid email format' 
        }),
      };
    }

    // Railway backend URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';
    const waitlistEndpoint = `${BACKEND_URL}/join-waitlist`;

    console.log('Waitlist-signup function: Forwarding to Railway backend:', waitlistEndpoint);
    console.log('Data being sent:', JSON.stringify({
      email: requestData.email,
      full_name: requestData.full_name,
      role: requestData.role || null,
      organization: requestData.organization || null,
    }));

    // Forward the request to Railway backend
    const railwayResponse = await fetch(waitlistEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function/waitlist-signup',
      },
      body: JSON.stringify({
        email: requestData.email,
        full_name: requestData.full_name,
        role: requestData.role || null,
        organization: requestData.organization || null,
      }),
      timeout: 30000, // 30 second timeout
    });

    console.log('Railway response status:', railwayResponse.status);

    // Parse Railway response
    let railwayData;
    try {
      railwayData = await railwayResponse.json();
      console.log('Railway response data:', railwayData);
    } catch (parseError) {
      console.error('Error parsing Railway response:', parseError);
      const responseText = await railwayResponse.text().catch(() => 'Unknown response');
      console.error('Raw response:', responseText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Invalid response from backend service' 
        }),
      };
    }

    // Return the Railway response with appropriate status code
    if (railwayResponse.ok) {
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: railwayData.message || 'Successfully joined the waitlist!',
          data: railwayData.data,
        }),
      };
    } else {
      // Handle different error cases
      let statusCode = railwayResponse.status;
      let errorMessage = railwayData.error || railwayData.message || 'Unknown error occurred';

      // Map specific error cases
      if (statusCode === 409) {
        errorMessage = 'Email already registered in waitlist';
      } else if (statusCode === 400) {
        errorMessage = railwayData.error || 'Invalid request data';
      } else if (statusCode >= 500) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        statusCode = 503;
      }

      console.error('Railway backend error:', errorMessage);
      
      return {
        statusCode,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: errorMessage 
        }),
      };
    }

  } catch (error) {
    console.error('Waitlist-signup function error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Backend service unavailable. Please try again later.' 
        }),
      };
    }

    // Handle fetch timeout or other network issues
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Network error. Please check your connection and try again.' 
        }),
      };
    }

    // Generic error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error. Please try again later.' 
      }),
    };
  }
}; 