// Netlify function to handle questionnaire creation
exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const body = JSON.parse(event.body);
    const { title, questions } = body;
    
    // Generate a timestamp ID matching backend format (numeric timestamp)
    const id = Date.now();
    
    // Generate a random due date in the next 30 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 1);
    const formattedDueDate = dueDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Note: This function is now DEPRECATED and not used by the frontend
    // The frontend calls the Railway backend API directly for questionnaire operations
    console.log('⚠️ DEPRECATED: This Netlify function is no longer used. Frontend calls Railway backend directly.');
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        message: 'Questionnaire created successfully (via deprecated Netlify function)',
        questionnaire: {
          id: id.toString(),
          name: title,
          status: 'Not Started',
          dueDate: formattedDueDate,
          progress: 0,
          questions: questions || []
        },
        warning: 'This function is deprecated. Frontend should call Railway backend directly.'
      })
    };
  } catch (error) {
    console.error('Error processing questionnaire:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to process questionnaire (deprecated function)',
        error: error.message
      })
    };
  }
}; 