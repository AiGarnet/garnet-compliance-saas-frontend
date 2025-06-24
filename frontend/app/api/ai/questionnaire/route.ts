import { NextRequest, NextResponse } from 'next/server';

// For static export, we cannot use dynamic API routes
// Client-side should handle this limitation by using local storage or Netlify functions

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, evidenceContext, vendorId } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // For now, we'll use the existing backend API
    // In a real implementation, this would process evidence files and generate contextual answers
    const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app/ask';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context: evidenceContext ? `Evidence files: ${evidenceContext.join(', ')}` : undefined,
        vendorId
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      answer: data.answer || generateFallbackAnswer(question),
      confidence: data.confidence || 0.7,
      hasEvidence: evidenceContext && evidenceContext.length > 0,
      sources: evidenceContext || []
    });

  } catch (error) {
    console.error('AI questionnaire processing error:', error);
    
    // Fallback response
    const { question } = await request.json();
    return NextResponse.json({
      answer: generateFallbackAnswer(question),
      confidence: 0.3,
      hasEvidence: false,
      sources: [],
      error: 'AI processing temporarily unavailable'
    });
  }
}

function generateFallbackAnswer(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('security') || lowerQuestion.includes('encrypt')) {
    return "We implement industry-standard security measures including encryption at rest and in transit, multi-factor authentication, and regular security audits. Our security framework follows established guidelines and best practices to ensure comprehensive protection of data and systems.";
  }
  
  if (lowerQuestion.includes('data') || lowerQuestion.includes('privacy')) {
    return "Our data protection measures comply with relevant regulations including GDPR and industry standards. We implement data minimization principles, maintain strict access controls, and ensure proper data retention and deletion procedures are in place.";
  }
  
  if (lowerQuestion.includes('access') || lowerQuestion.includes('authentication')) {
    return "We maintain role-based access control (RBAC) systems with principle of least privilege. Multi-factor authentication is required for administrative access, and we conduct regular access reviews and monitoring of privileged accounts.";
  }
  
  if (lowerQuestion.includes('backup') || lowerQuestion.includes('recovery')) {
    return "We maintain automated backup systems with regular testing procedures. Our disaster recovery plan includes defined RTO and RPO objectives, with documented procedures for business continuity and system restoration.";
  }
  
  if (lowerQuestion.includes('compliance') || lowerQuestion.includes('audit')) {
    return "We maintain comprehensive compliance programs with regular internal and external audits. Our compliance framework includes documented policies, procedures, and controls that are regularly reviewed and updated to meet current standards.";
  }
  
  if (lowerQuestion.includes('training') || lowerQuestion.includes('awareness')) {
    return "We provide regular security awareness training to all personnel, including specialized training for roles with elevated access. Our training program includes phishing simulation, security best practices, and incident response procedures.";
  }
  
  return "We maintain comprehensive policies and procedures to address this requirement. Our implementation follows industry best practices and is regularly reviewed and updated to ensure continued effectiveness and compliance with applicable standards.";
} 