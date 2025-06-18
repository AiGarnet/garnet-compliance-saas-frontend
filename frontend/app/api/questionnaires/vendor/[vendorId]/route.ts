import { NextRequest, NextResponse } from 'next/server';

// Backend API URL - adjust based on environment
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';

export async function GET(request: NextRequest, { params }: { params: { vendorId: string } }) {
  try {
    const { vendorId } = params;
    
    console.log(`🔄 Fetching questionnaires for vendor ${vendorId}`);
    
    // Forward the request to the backend API
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/questionnaires/vendor/${vendorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`📡 Backend response status: ${backendResponse.status}`);
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`❌ Backend error: ${errorText}`);
      
      if (backendResponse.status === 404) {
        return NextResponse.json({ 
          error: 'No questionnaires found for this vendor',
          details: 'The vendor may not have any questionnaires yet.'
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch vendor questionnaires from backend',
        details: errorText,
        status: backendResponse.status
      }, { status: backendResponse.status });
    }
    
    const backendData = await backendResponse.json();
    console.log(`✅ Successfully fetched ${backendData.questionnaires?.length || 0} questionnaires for vendor ${vendorId}`);
    
    return NextResponse.json(backendData);
    
  } catch (error) {
    console.error('❌ Error fetching vendor questionnaires:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 