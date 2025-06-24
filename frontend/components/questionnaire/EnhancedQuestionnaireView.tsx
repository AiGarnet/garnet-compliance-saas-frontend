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
  Share
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
    // This would integrate with your AI service
    try {
      const response = await fetch('/api/ai/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          evidenceContext: evidenceFiles.map(f => f.name), // In real implementation, file content would be sent
          vendorId: selectedVendor
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.answer || '';
      }
    } catch (error) {
      console.error('AI answer generation failed:', error);
    }
    
    return '';
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

  // Submit questionnaire for review
  const handleSubmitForReview = async () => {
    setIsProcessing(true);
    
    try {
      // Submit to backend
      const response = await fetch('/api/questionnaires/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: selectedVendor,
          enterpriseId,
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            aiAnswer: q.aiAnswer,
            uploadedDocument: q.uploadedDocument?.name,
            assistanceRequest: q.assistanceRequest,
            status: q.status
          }))
        })
      });

      if (response.ok) {
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Enterprise Questionnaire</h1>
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">Four-Column Submission System</span>
        </div>
      </div>

      {/* Vendor Selection */}
      {currentStep === 'upload' && (
        <VendorSelector 
          onVendorSelect={(vendorId) => setSelectedVendor(vendorId)}
          selectedVendorId={selectedVendor}
        />
      )}

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>1</div>
          <span>Upload Files</span>
        </div>
        <div className="flex-1 h-px bg-gray-300"></div>
        
        <div className={`flex items-center space-x-2 ${currentStep === 'processing' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>2</div>
          <span>AI Processing</span>
        </div>
        <div className="flex-1 h-px bg-gray-300"></div>
        
        <div className={`flex items-center space-x-2 ${currentStep === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>3</div>
          <span>Review & Complete</span>
        </div>
        <div className="flex-1 h-px bg-gray-300"></div>
        
        <div className={`flex items-center space-x-2 ${currentStep === 'submit' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep === 'submit' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>4</div>
          <span>Submit</span>
        </div>
      </div>

      {/* File Upload Section */}
      {currentStep === 'upload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Enterprise Checklist</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Upload the enterprise's compliance checklist file
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
                  className="mb-2"
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
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {enterpriseChecklist.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Internal Evidence</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Upload your internal evidence files
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
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Evidence Files
                </Button>
                {evidenceFiles.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Uploaded files ({evidenceFiles.length}):
                    </p>
                    {evidenceFiles.map((file, index) => (
                      <p key={index} className="text-sm text-green-600">
                        ✓ {file.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Four-Column Questionnaire Table */}
      {(currentStep === 'processing' || currentStep === 'review') && questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questionnaire Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 w-1/4 font-semibold text-gray-700">
                      Checklist Questions
                    </th>
                    <th className="text-left p-4 w-1/4 font-semibold text-gray-700">
                      AI-Generated Answers
                    </th>
                    <th className="text-left p-4 w-1/4 font-semibold text-gray-700">
                      Upload Supporting Doc
                    </th>
                    <th className="text-left p-4 w-1/4 font-semibold text-gray-700">
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Submit</h3>
                <p className="text-sm text-gray-600">
                  {questions.filter(q => q.status !== 'empty').length} of {questions.length} questions addressed
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('upload')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Review Files
                </Button>
                <Button
                  onClick={handleSubmitForReview}
                  disabled={!allQuestionsAddressed || isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {!allQuestionsAddressed && (
              <Alert className="mt-4">
                <AlertCircle className="w-4 h-4" />
                <span>Please address all questions before submitting.</span>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {currentStep === 'submit' && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Questionnaire Submitted Successfully!
            </h3>
            <p className="text-gray-600 mb-4">
              Your submission is now in review status and has been added to the Trust Portal.
            </p>
            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/trust-portal/vendor/${selectedVendor}`)}
              >
                <Share className="w-4 h-4 mr-2" />
                View in Trust Portal
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
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
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      {/* Column 1: Checklist Questions */}
      <td className="p-4 align-top">
        <div className="flex items-start space-x-2">
          {renderStatusIcon(question)}
          <div>
            <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
            <p className="text-sm text-gray-900 mt-1">{question.question}</p>
          </div>
        </div>
      </td>

      {/* Column 2: AI-Generated Answers */}
      <td className="p-4 align-top">
        {question.isAiAnswerLoading ? (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generating answer...</span>
          </div>
        ) : question.aiAnswer ? (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">AI Generated</span>
            </div>
            <p className="text-sm text-gray-700">{question.aiAnswer}</p>
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">
            No AI answer generated
          </div>
        )}
      </td>

      {/* Column 3: Upload Supporting Doc */}
      <td className="p-4 align-top">
        <div className="space-y-2">
          {question.uploadedDocument ? (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Document Uploaded</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{question.uploadedDocument.name}</p>
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
                className="w-full"
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
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="flex items-center space-x-2 mb-2">
                <HelpCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Assistance Requested</span>
              </div>
              <p className="text-sm text-gray-700">{question.assistanceRequest}</p>
            </div>
          ) : (
            <div>
              {showAssistanceInput ? (
                <div className="space-y-2">
                  <textarea
                    value={assistanceText}
                    onChange={(e) => setAssistanceText(e.target.value)}
                    placeholder="Describe what help you need..."
                    className="w-full text-sm border border-gray-300 rounded p-2 resize-none"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleAssistanceSubmit}
                      disabled={!assistanceText.trim()}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Submit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAssistanceInput(false);
                        setAssistanceText('');
                      }}
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
                  className="w-full"
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