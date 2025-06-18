import { NextRequest, NextResponse } from 'next/server';

// For static export, we use static data instead of dynamic API routes
// Remove 'force-dynamic' and implement static alternatives

interface QuestionAnswer {
  question: string;
  answer: string;
}

interface QuestionnaireData {
  title: string;
  questions: string[];
  answers?: QuestionAnswer[];
}

// Backend API URL - adjust based on environment
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching all questionnaires from backend');
    
    // Forward the request to the backend API
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/questionnaires`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`📡 Backend response status: ${backendResponse.status}`);
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`❌ Backend error: ${errorText}`);
      
      return NextResponse.json({ 
        error: 'Failed to fetch questionnaires from backend',
        details: errorText,
        status: backendResponse.status
      }, { status: backendResponse.status });
    }
    
    const backendData = await backendResponse.json();
    console.log(`✅ Successfully fetched ${backendData.questionnaires?.length || 0} questionnaires`);
    
    return NextResponse.json(backendData);
    
  } catch (error) {
    console.error('❌ Error fetching questionnaires:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 Creating questionnaire:', body.title);
    
    // Forward the request to the backend API
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/questionnaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log(`📡 Backend response status: ${backendResponse.status}`);
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`❌ Backend error: ${errorText}`);
      
      return NextResponse.json({ 
        error: 'Failed to create questionnaire',
        details: errorText,
        status: backendResponse.status
      }, { status: backendResponse.status });
    }
    
    const backendData = await backendResponse.json();
    console.log(`✅ Successfully created questionnaire: ${backendData.questionnaire?.id}`);
    
    return NextResponse.json(backendData);
    
  } catch (error) {
    console.error('❌ Error creating questionnaire:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 