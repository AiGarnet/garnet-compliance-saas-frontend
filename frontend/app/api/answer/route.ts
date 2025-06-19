import { NextRequest, NextResponse } from 'next/server';

// Backend API URL - adjust based on environment
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context, vendorId } = body;
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }
    
    // Forward the request to the backend AI service with OpenAI integration
    const backendResponse = await fetch(`${BACKEND_API_URL}/ai/generate-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context,
        vendorId
      }),
    });
    
    if (!backendResponse.ok) {
      // If backend fails, provide a graceful fallback
      console.error('Backend AI service failed:', backendResponse.status, backendResponse.statusText);
      return NextResponse.json({ 
        answer: 'We apologize, but we couldn\'t generate a response at this time. Please contact our compliance team directly for this information.'
      });
    }
    
    const backendData = await backendResponse.json();
    
    // Return the AI-generated answer from the backend
    return NextResponse.json({ 
      answer: backendData.answer || 'We apologize, but we couldn\'t generate a response at this time. Please contact our compliance team directly for this information.',
      success: backendData.success,
      confidence: backendData.confidence,
      sources: backendData.sources
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      answer: 'We apologize, but we couldn\'t generate a response at this time. Please contact our compliance team directly for this information.'
    }, { status: 500 });
  }
} 
