import { NextRequest, NextResponse } from 'next/server';

// Backend API URL - adjust based on environment
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions, context, vendorId } = body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Questions array is required' }, { status: 400 });
    }
    
    // Forward the request to the backend AI service for batch processing
    const backendResponse = await fetch(`${BACKEND_API_URL}/ai/generate-batch-answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questions,
        context,
        vendorId
      }),
    });
    
    if (!backendResponse.ok) {
      // If backend fails, provide graceful fallback responses
      console.error('Backend AI service failed:', backendResponse.status, backendResponse.statusText);
      
      const fallbackAnswers = questions.map((question: string) => ({
        question,
        answer: 'We apologize, but we couldn\'t generate a response at this time. Please contact our compliance team directly for this information.',
        success: false,
        error: 'Backend service unavailable'
      }));
      
      return NextResponse.json({
        answers: fallbackAnswers,
        metadata: {
          totalQuestions: questions.length,
          successfulAnswers: 0,
          failedAnswers: questions.length,
          processingTimeMs: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const backendData = await backendResponse.json();
    
    // Return the AI-generated answers from the backend
    return NextResponse.json({
      answers: backendData.answers || [],
      metadata: backendData.metadata || {
        totalQuestions: questions.length,
        successfulAnswers: 0,
        failedAnswers: questions.length,
        processingTimeMs: 0,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error processing batch request:', error);
    
    // Extract questions from the request for fallback
    let questions: string[] = [];
    try {
      const body = await request.json();
      questions = body.questions || [];
    } catch (e) {
      // If we can't parse the request, return a generic error
      return NextResponse.json({ 
        error: 'We apologize, but we couldn\'t generate responses at this time. Please contact our compliance team directly.'
      }, { status: 500 });
    }
    
    const fallbackAnswers = questions.map((question: string) => ({
      question,
      answer: 'We apologize, but we couldn\'t generate a response at this time. Please contact our compliance team directly for this information.',
      success: false,
      error: 'Internal server error'
    }));
    
    return NextResponse.json({
      answers: fallbackAnswers,
      metadata: {
        totalQuestions: questions.length,
        successfulAnswers: 0,
        failedAnswers: questions.length,
        processingTimeMs: 0,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 