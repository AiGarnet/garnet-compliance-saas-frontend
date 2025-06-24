"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  Bot, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Download, 
  Send, 
  Building2,
  Plus,
  Trash2,
  Eye,
  Share,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/Alert';
import VendorSelector from './VendorSelector';

interface QuestionnaireQuestion {
  id: string;
  question: string;
  aiAnswer?: string;
  isAiAnswerLoading?: boolean;
  uploadedDocument?: File;
  needsAssistance?: boolean;
  assistanceRequest?: string;
  status: 'empty' | 'ai-answered' | 'manually-answered' | 'assistance-requested' | 'completed';
}

interface EnhancedQuestionnaireViewProps {
  vendorId: string;
  enterpriseId?: string;
}

const EnhancedQuestionnaireView: React.FC<EnhancedQuestionnaireViewProps> = ({ 
  vendorId, 
  enterpriseId 
}) => {
  const router = useRouter();
  
  // State management
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>(vendorId);
  const [enterpriseChecklist, setEnterpriseChecklist] = useState<File | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'review' | 'submit'>('upload');
  const [trustPortalStatus, setTrustPortalStatus] = useState<'draft' | 'in-review' | 'approved'>('draft');
  
  // Refs
  const checklistInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  // Initialize with the passed vendorId if provided
  useEffect(() => {
    if (vendorId && !selectedVendor) {
      console.log('Setting initial vendor:', vendorId);
      setSelectedVendor(vendorId);
    }
  }, [vendorId, selectedVendor]);

  // Handle checklist file upload
  const handleChecklistUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setEnterpriseChecklist(file);
    setIsProcessing(true);
    
    try {
      // Extract questions from checklist file
      const questionsFromFile = await extractQuestionsFromFile(file);
      setQuestions(questionsFromFile.map(q => ({
        id: generateQuestionId(),
        question: q,
        status: 'empty' as const
      })));
      setCurrentStep('processing');
    } catch (error) {
      console.error('Error processing checklist:', error);
      alert('Error processing checklist file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle evidence files upload
  const handleEvidenceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setEvidenceFiles(prev => [...prev, ...files]);
    
    if (questions.length > 0) {
      await generateAIAnswers(files);
    }
  };

  // Extract questions from uploaded file
  const extractQuestionsFromFile = async (file: File): Promise<string[]> => {
    const text = await readFileAsText(file);
    
    // Simple extraction logic - split by lines and filter non-empty
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // More sophisticated extraction could be added here
    return lines.filter(line => 
      line.includes('?') || 
      line.toLowerCase().includes('policy') ||
      line.toLowerCase().includes('procedure') ||
      line.toLowerCase().includes('describe') ||
      line.toLowerCase().includes('explain')
    );
  };

  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  // Generate AI answers for all questions
  const generateAIAnswers = async (evidenceFiles: File[]) => {
    setIsProcessing(true);
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      // Mark question as loading
      setQuestions(prev => prev.map(q => 
        q.id === question.id 
          ? { ...q, isAiAnswerLoading: true }
          : q
      ));

      try {
        // Generate AI answer using evidence context
        const aiAnswer = await generateAIAnswerForQuestion(question.question, evidenceFiles);
        
        // Update question with AI answer
        setQuestions(prev => prev.map(q => 
          q.id === question.id 
            ? { 
                ...q, 
                aiAnswer, 
                isAiAnswerLoading: false,
                status: aiAnswer ? 'ai-answered' : 'empty'
              }
            : q
        ));
      } catch (error) {
        console.error('Error generating AI answer:', error);
        setQuestions(prev => prev.map(q => 
          q.id === question.id 
            ? { ...q, isAiAnswerLoading: false }
            : q
        ));
      }
    }
    
    setIsProcessing(false);
    setCurrentStep('review');
  };

  // Generate AI answer for a single question
  const generateAIAnswerForQuestion = async (question: string, evidenceFiles: File[]): Promise<string> => {
    // Use the correct backend AI endpoint with proper format
    try {
      const context = evidenceFiles.length > 0 
        ? `Context: This question is part of an enterprise compliance questionnaire. Evidence files available: ${evidenceFiles.map(f => f.name).join(', ')}` 
        : 'Context: This question is part of an enterprise compliance questionnaire.';

      const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `${context}\n\nQuestion: ${question}`,
          vendorId: selectedVendor ? parseInt(selectedVendor) : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.answer || data.response || 'Unable to generate AI answer at this time.';
      } else {
        console.error('AI API error:', response.status, response.statusText);
        return 'AI service temporarily unavailable. Please try manual answer or request assistance.';
      }
    } catch (error) {
      console.error('AI answer generation failed:', error);
      return 'Network error occurred. Please check your connection and try again.';
    }
  };

  // Handle manual document upload for specific question
  const handleManualDocumentUpload = (questionId: string, file: File) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            uploadedDocument: file,
            status: 'manually-answered'
          }
        : q
    ));
  };

  // Handle assistance request
  const handleAssistanceRequest = (questionId: string, request: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            needsAssistance: true,
            assistanceRequest: request,
            status: 'assistance-requested'
          }
        : q
    ));
    
    // In real implementation, this would create a support ticket
    alert('Assistance request submitted. Our team will contact you within 24 hours.');
  };

  // Submit to Trust Portal
  const submitToTrustPortal = async (vendorId: string, questionnaireId: string, questions: QuestionnaireQuestion[]) => {
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

    const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/api/trust-portal/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary),
    });

    if (!response.ok) {
      throw new Error(`Trust Portal API error: ${response.status}`);
    }

    return await response.json();
  };

  // Submit questionnaire for review
  const handleSubmitForReview = async () => {
    setIsProcessing(true);
    
    try {
      // Submit to backend using correct questionnaire endpoint
      const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Enterprise Questionnaire - ${new Date().toLocaleDateString()}`,
          vendorId: parseInt(selectedVendor),
          questions: questions.map(q => ({
            questionText: q.question,
            answer: q.aiAnswer || (q.uploadedDocument ? `Document uploaded: ${q.uploadedDocument.name}` : ''),
            status: q.status === 'ai-answered' || q.status === 'manually-answered' ? 'Completed' : 'Not Started',
            needsAssistance: q.status === 'assistance-requested',
            assistanceRequest: q.assistanceRequest
          })),
          generateAnswers: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        const questionnaireId = result.questionnaire?.id;
        
        // Submit to Trust Portal
        if (questionnaireId) {
          try {
            await submitToTrustPortal(selectedVendor, questionnaireId, questions);
          } catch (trustPortalError) {
            console.error('Trust Portal submission error:', trustPortalError);
          }
        }
        
        setTrustPortalStatus('in-review');
        setCurrentStep('submit');
        
        // Redirect to trust portal
        router.push(`/trust-portal/vendor/${selectedVendor}`);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate unique question ID
  const generateQuestionId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check if all questions are addressed
  const allQuestionsAddressed = questions.every(q => 
    q.status !== 'empty' && !q.isAiAnswerLoading
  );

  // Render question status icon
  const renderStatusIcon = (question: QuestionnaireQuestion) => {
    if (question.isAiAnswerLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    switch (question.status) {
      case 'ai-answered':
        return <Bot className="w-4 h-4 text-green-500" />;
      case 'manually-answered':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'assistance-requested':
        return <HelpCircle className="w-4 h-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Enterprise Questionnaire</h1>
              <p className="text-lg text-gray-600 font-medium">Complete compliance assessment with AI-powered assistance</p>
            </div>
            <div className="flex items-center space-x-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Four-Column Submission System</span>
            </div>
          </div>
        </div>

        {/* Vendor Selection - Always Visible */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <VendorSelector 
            onVendorSelect={(vendorId) => {
              console.log('Vendor selected:', vendorId);
              setSelectedVendor(vendorId);
            }}
            selectedVendorId={selectedVendor}
          />
          
          {/* Show warning if no vendor selected */}
          {!selectedVendor && (
            <div className="p-4 bg-yellow-50 border-t border-yellow-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Please select a vendor to continue with the questionnaire submission.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${currentStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                currentStep === 'upload' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
              }`}>1</div>
              <div>
                <div className="font-semibold text-sm">Upload Files</div>
                <div className="text-xs text-gray-500">Checklist & Evidence</div>
              </div>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                ['processing', 'review', 'submit'].includes(currentStep) ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            
            <div className={`flex items-center space-x-3 ${currentStep === 'processing' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                currentStep === 'processing' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
              }`}>2</div>
              <div>
                <div className="font-semibold text-sm">AI Processing</div>
                <div className="text-xs text-gray-500">Generate Answers</div>
              </div>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                ['review', 'submit'].includes(currentStep) ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            
            <div className={`flex items-center space-x-3 ${currentStep === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                currentStep === 'review' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
              }`}>3</div>
              <div>
                <div className="font-semibold text-sm">Review & Complete</div>
                <div className="text-xs text-gray-500">Verify Responses</div>
              </div>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                currentStep === 'submit' ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            
            <div className={`flex items-center space-x-3 ${currentStep === 'submit' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                currentStep === 'submit' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
              }`}>4</div>
              <div>
                <div className="font-semibold text-sm">Submit</div>
                <div className="text-xs text-gray-500">Trust Portal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Selection Required Message */}
        {!selectedVendor && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Vendor Selection Required</h3>
                <p className="text-sm text-amber-700 mt-1">Please select your company from the dropdown above to continue with the questionnaire submission.</p>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Section */}
        {currentStep === 'upload' && selectedVendor && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900 font-semibold">Enterprise Checklist</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Upload the compliance checklist provided by the enterprise</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Upload Checklist File</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Supports TXT, PDF, DOCX, and XLSX formats
                  </p>
                  <input
                    ref={checklistInputRef}
                    type="file"
                    accept=".txt,.pdf,.docx,.xlsx"
                    onChange={handleChecklistUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => checklistInputRef.current?.click()}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Select Checklist File
                      </>
                    )}
                  </Button>
                  {enterpriseChecklist && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm font-medium text-green-800">
                        ✓ {enterpriseChecklist.name}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        File uploaded successfully
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <Upload className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900 font-semibold">Internal Evidence</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Upload your company's compliance evidence files</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Upload Evidence Files</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Multiple files supported (PDF, DOCX, TXT, XLSX)
                  </p>
                  <input
                    ref={evidenceInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.xlsx"
                    onChange={handleEvidenceUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => evidenceInputRef.current?.click()}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 font-medium px-6 py-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Evidence Files
                  </Button>
                  {evidenceFiles.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md text-left">
                      <h5 className="font-semibold text-green-800 mb-2">
                        Uploaded files ({evidenceFiles.length}):
                      </h5>
                      <div className="space-y-1">
                        {evidenceFiles.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generate Answers Button */}
        {currentStep === 'upload' && selectedVendor && enterpriseChecklist && evidenceFiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Process</h3>
                <p className="text-sm text-gray-600 mt-1">All files uploaded. Click below to generate AI answers from your evidence files.</p>
              </div>
                             <Button
                 onClick={() => generateAIAnswers(evidenceFiles)}
                 disabled={isProcessing}
                 className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3"
               >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate AI Answers
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Four-Column Questionnaire Table */}
        {(currentStep === 'processing' || currentStep === 'review') && questions.length > 0 && (
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900">Questionnaire Review</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">{questions.filter(q => q.status === 'completed').length} of {questions.length} complete</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-200">
                      <th className="text-left p-4 w-1/4 font-bold text-gray-800 text-sm">
                        Checklist Questions
                      </th>
                      <th className="text-left p-4 w-1/4 font-bold text-gray-800 text-sm">
                        AI-Generated Answers
                      </th>
                      <th className="text-left p-4 w-1/4 font-bold text-gray-800 text-sm">
                        Upload Supporting Doc
                      </th>
                      <th className="text-left p-4 w-1/4 font-bold text-gray-800 text-sm">
                        Request Assistance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question, index) => (
                      <QuestionRow
                        key={question.id}
                        question={question}
                        index={index}
                        onManualUpload={(file) => handleManualDocumentUpload(question.id, file)}
                        onAssistanceRequest={(request) => handleAssistanceRequest(question.id, request)}
                        renderStatusIcon={renderStatusIcon}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Section */}
        {currentStep === 'review' && questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Submit for Enterprise Review</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {allQuestionsAddressed 
                    ? "All questions have been addressed. Ready to submit to Trust Portal."
                    : "Some questions still need attention before submission."
                  }
                </p>
              </div>
              <Button
                onClick={handleSubmitForReview}
                disabled={!allQuestionsAddressed || isProcessing}
                className={`font-semibold px-8 py-3 ${
                  allQuestionsAddressed 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Submit to Trust Portal
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {currentStep === 'submit' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">Questionnaire Submitted Successfully!</h3>
            <p className="text-green-700 mb-4">
              Your questionnaire has been submitted to the Trust Portal and the enterprise has been notified for review.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Submit Another Questionnaire
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Question Row Component
interface QuestionRowProps {
  question: QuestionnaireQuestion;
  index: number;
  onManualUpload: (file: File) => void;
  onAssistanceRequest: (request: string) => void;
  renderStatusIcon: (question: QuestionnaireQuestion) => React.ReactNode;
}

const QuestionRow: React.FC<QuestionRowProps> = ({
  question,
  index,
  onManualUpload,
  onAssistanceRequest,
  renderStatusIcon
}) => {
  const [assistanceText, setAssistanceText] = useState('');
  const [showAssistanceInput, setShowAssistanceInput] = useState(false);
  const manualUploadRef = useRef<HTMLInputElement>(null);

  const handleManualFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onManualUpload(file);
    }
  };

  const handleAssistanceSubmit = () => {
    if (assistanceText.trim()) {
      onAssistanceRequest(assistanceText);
      setAssistanceText('');
      setShowAssistanceInput(false);
    }
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Column 1: Checklist Questions */}
      <td className="p-4 align-top">
        <div className="flex items-start space-x-3">
          {renderStatusIcon(question)}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Q{index + 1}</span>
            </div>
            <p className="text-sm text-gray-900 leading-relaxed">{question.question}</p>
          </div>
        </div>
      </td>

      {/* Column 2: AI-Generated Answers */}
      <td className="p-4 align-top">
        {question.isAiAnswerLoading ? (
          <div className="flex items-center space-x-2 text-blue-600 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Generating answer...</span>
          </div>
        ) : question.aiAnswer ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">AI Generated</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{question.aiAnswer}</p>
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic p-3 bg-gray-50 rounded-lg border border-gray-200">
            No AI answer generated yet
          </div>
        )}
      </td>

      {/* Column 3: Upload Supporting Doc */}
      <td className="p-4 align-top">
        <div className="space-y-2">
          {question.uploadedDocument ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Document Uploaded</span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{question.uploadedDocument.name}</p>
            </div>
          ) : (
            <div>
              <input
                ref={manualUploadRef}
                type="file"
                accept=".pdf,.docx,.txt,.xlsx"
                onChange={handleManualFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => manualUploadRef.current?.click()}
                className="w-full border-gray-300 hover:border-green-500 hover:text-green-600 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          )}
        </div>
      </td>

      {/* Column 4: Request Assistance */}
      <td className="p-4 align-top">
        <div className="space-y-2">
          {question.needsAssistance ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <HelpCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">Assistance Requested</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{question.assistanceRequest}</p>
            </div>
          ) : (
            <div>
              {showAssistanceInput ? (
                <div className="space-y-3">
                  <textarea
                    value={assistanceText}
                    onChange={(e) => setAssistanceText(e.target.value)}
                    placeholder="Describe what help you need with this question..."
                    className="w-full text-sm border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleAssistanceSubmit}
                      disabled={!assistanceText.trim()}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Submit Request
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAssistanceInput(false);
                        setAssistanceText('');
                      }}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAssistanceInput(true)}
                  className="w-full border-gray-300 hover:border-orange-500 hover:text-orange-600 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Need Help
                </Button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default EnhancedQuestionnaireView;