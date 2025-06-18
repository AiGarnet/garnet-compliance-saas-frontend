const fetch = require('node-fetch');

// Backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    console.log('🔄 Netlify Function - Questionnaires API');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);
    console.log('Query:', event.queryStringParameters);

    // Parse the path to determine the endpoint
    const path = event.path.replace('/.netlify/functions/questionnaires', '');
    let backendPath = '/api/questionnaires';
    
    // Handle vendor-specific requests
    if (path.startsWith('/vendor/')) {
      backendPath = `/api/questionnaires${path}`;
    } else if (path && path !== '/') {
      backendPath = `/api/questionnaires${path}`;
    }

    console.log('🎯 Backend path:', backendPath);

    // Forward the request to the backend API
    const backendUrl = `${BACKEND_API_URL}${backendPath}`;
    console.log('📡 Calling backend:', backendUrl);

    const fetchOptions = {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add body for POST/PUT requests
    if (event.body && (event.httpMethod === 'POST' || event.httpMethod === 'PUT')) {
      fetchOptions.body = event.body;
    }

    const backendResponse = await fetch(backendUrl, fetchOptions);
    const responseText = await backendResponse.text();
    
    console.log(`📊 Backend response status: ${backendResponse.status}`);

    if (!backendResponse.ok) {
      console.error(`❌ Backend error: ${responseText}`);
      
      return {
        statusCode: backendResponse.status,
        headers,
        body: JSON.stringify({
          error: 'Backend API error',
          details: responseText,
          status: backendResponse.status
        }),
      };
    }

    // Try to parse as JSON, fallback to text
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { data: responseText };
    }

    console.log(`✅ Successfully processed questionnaire request`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData),
    };

  } catch (error) {
    console.error('❌ Netlify Function Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
}; 