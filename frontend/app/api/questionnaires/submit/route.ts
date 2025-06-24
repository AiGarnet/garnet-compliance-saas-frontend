import { NextRequest, NextResponse } from 'next/server';

interface QuestionSubmission {
  id: string;
  question: string;
  aiAnswer?: string;
  uploadedDocument?: string;
  assistanceRequest?: string;
  status: 'empty' | 'ai-answered' | 'manually-answered' | 'assistance-requested' | 'completed';
}

interface SubmissionRequest {
  vendorId: string;
  enterpriseId?: string;
  questions: QuestionSubmission[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmissionRequest = await request.json();
    const { vendorId, enterpriseId, questions } = body;

    if (!vendorId || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'VendorId and questions array are required' },
        { status: 400 }
      );
    }

    // Transform questions for backend storage
    const transformedQuestions = questions.map(q => ({
      questionText: q.question,
      answer: q.aiAnswer || (q.uploadedDocument ? `Document uploaded: ${q.uploadedDocument}` : ''),
      status: mapStatusToBackend(q.status),
      needsAssistance: q.status === 'assistance-requested',
      assistanceRequest: q.assistanceRequest,
      hasManualUpload: !!q.uploadedDocument,
      uploadedDocument: q.uploadedDocument
    }));

    // Create questionnaire in backend
    const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app/api/questionnaires';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Enterprise Questionnaire - ${new Date().toLocaleDateString()}`,
        vendorId: parseInt(vendorId),
        questions: transformedQuestions,
        generateAnswers: false, // Answers are already provided
        status: 'In Review'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend submission error:', errorData);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Submit to Trust Portal
    try {
      await submitToTrustPortal(vendorId, result.questionnaire.id, questions);
    } catch (trustPortalError) {
      console.error('Trust Portal submission error:', trustPortalError);
      // Don't fail the main submission if trust portal fails
    }

    // Send notification if assistance was requested
    const assistanceRequests = questions.filter(q => q.status === 'assistance-requested');
    if (assistanceRequests.length > 0) {
      try {
        await notifyAssistanceTeam(vendorId, assistanceRequests);
      } catch (notificationError) {
        console.error('Assistance notification error:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      questionnaireId: result.questionnaire.id,
      trustPortalUrl: `/trust-portal/vendor/${vendorId}`,
      message: 'Questionnaire submitted successfully',
      assistanceRequestsCount: assistanceRequests.length
    });

  } catch (error) {
    console.error('Questionnaire submission error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit questionnaire',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function mapStatusToBackend(status: string): string {
  switch (status) {
    case 'ai-answered':
      return 'Completed';
    case 'manually-answered':
      return 'Completed';
    case 'assistance-requested':
      return 'Pending';
    case 'completed':
      return 'Completed';
    default:
      return 'Not Started';
  }
}

async function submitToTrustPortal(vendorId: string, questionnaireId: string, questions: QuestionSubmission[]) {
  const trustPortalUrl = 'https://garnet-compliance-saas-production.up.railway.app/api/trust-portal/items';
  
  // Create a summary document for the trust portal
  const completedQuestions = questions.filter(q => q.status !== 'empty');
  const summary = {
    title: `Compliance Questionnaire Submission`,
    description: `Completed questionnaire with ${completedQuestions.length} answered questions`,
    category: 'Compliance Documentation',
    content: JSON.stringify({
      questionnaireId,
      totalQuestions: questions.length,
      completedQuestions: completedQuestions.length,
      aiAnsweredQuestions: questions.filter(q => q.status === 'ai-answered').length,
      manuallyAnsweredQuestions: questions.filter(q => q.status === 'manually-answered').length,
      assistanceRequestedQuestions: questions.filter(q => q.status === 'assistance-requested').length,
      submissionDate: new Date().toISOString(),
      status: 'In Review'
    }),
    vendorId: parseInt(vendorId),
    isQuestionnaireAnswer: true,
    questionnaireId
  };

  const response = await fetch(trustPortalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(summary),
  });

  if (!response.ok) {
    throw new Error(`Trust Portal API error: ${response.status}`);
  }

  return await response.json();
}

async function notifyAssistanceTeam(vendorId: string, assistanceRequests: QuestionSubmission[]) {
  // In a real implementation, this would send notifications to the assistance team
  // For now, we'll log the requests
  console.log(`Assistance requested for vendor ${vendorId}:`, assistanceRequests.map(q => ({
    question: q.question,
    request: q.assistanceRequest
  })));

  // You could integrate with email service, Slack, ticketing system, etc.
  // Example notification payload:
  const notificationPayload = {
    vendorId,
    requestCount: assistanceRequests.length,
    requests: assistanceRequests.map(q => ({
      questionId: q.id,
      question: q.question.substring(0, 100) + (q.question.length > 100 ? '...' : ''),
      assistanceRequest: q.assistanceRequest,
      priority: 'normal'
    })),
    timestamp: new Date().toISOString()
  };

  // Simulate notification (replace with actual service)
  return Promise.resolve(notificationPayload);
} 