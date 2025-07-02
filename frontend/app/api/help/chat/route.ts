import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, vendorId } = body;

    // Validate required fields
    if (!question || !vendorId) {
      return NextResponse.json(
        { error: 'Question and vendorId are required' },
        { status: 400 }
      );
    }

    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Make request to backend help service
    const response = await fetch(`${backendUrl}/help/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        vendorId,
      }),
    });

    if (!response.ok) {
      console.error(`Backend help API error: ${response.status} ${response.statusText}`);
      
      // Return a fallback response
      return NextResponse.json({
        answer: 'I apologize, but our assistance service is temporarily unavailable. Please try again later or contact support directly.',
        category: 'Service Unavailable',
        confidence: 0,
        metadata: {
          error: 'Backend service unavailable',
          isComplianceRelated: false,
        },
        canRegenerate: true,
        isComplianceRelated: false,
        followUpSuggestions: [
          'Try refreshing the page',
          'Contact support for immediate assistance',
          'Check our documentation for common solutions'
        ]
      });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Help chat API error:', error);
    
    return NextResponse.json({
      answer: 'I encountered an error processing your request. Please try again or contact support if the issue persists.',
      category: 'Error',
      confidence: 0,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        isComplianceRelated: false,
      },
      canRegenerate: true,
      isComplianceRelated: false,
    }, { status: 500 });
  }
} 