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
  Sparkles,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/Alert';
import VendorSelector from './VendorSelector';
import { useAuth } from '@/lib/auth/AuthContext';

// Define the UploadedDocument interface at the top level
interface UploadedDocument {
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  questionId?: string;
  id?: string;
}

interface QuestionnaireQuestion {
  id: string;
  question: string;
  aiAnswer?: string;
  isAiAnswerLoading?: boolean;
  needsAssistance?: boolean;
  assistanceRequest?: string;
  supporting_doc_required: boolean;
  uploadedDocument?: File;
  status: 'empty' | 'ai-answered' | 'manually-answered' | 'assistance-requested' | 'completed';
}

interface EnhancedQuestionnaireViewProps {
  vendorId: string;
  enterpriseId?: string;
}

const EnhancedQuestionnaireView: React.FC<EnhancedQuestionnaireViewProps> = ({ 
  vendorId, 
  enterpriseId 
}): JSX.Element => {
  const router = useRouter();
  const { isAuthenticated, token, logout } = useAuth();
  
  // State management
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>(vendorId);
  const [enterpriseChecklist, setEnterpriseChecklist] = useState<File | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [generalSupportingDocs, setGeneralSupportingDocs] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'review' | 'submit'>('upload');
  const [trustPortalStatus, setTrustPortalStatus] = useState<'draft' | 'in-review' | 'approved'>('draft');
  const [authError, setAuthError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'idle' | 'uploading' | 'success' | 'error'}>({});
  
  // Refs
  const checklistInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const generalDocsInputRef = useRef<HTMLInputElement>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setAuthError("Authentication required. Please log in to continue.");
      setTimeout(() => {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }, 3000);
    }
  }, [isAuthenticated, token, router]);

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

    // Check authentication before proceeding
    if (!isAuthenticated || !token) {
      setAuthError("Authentication required. Please log in to continue.");
      setTimeout(() => {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }, 2000);
      return;
    }

    setEnterpriseChecklist(file);
    setIsProcessing(true);
    
    try {
      // Extract questions from checklist file
      const questionsFromFile = await extractQuestionsFromFile(file);
      setQuestions(questionsFromFile.map(q => ({
        id: generateQuestionId(),
        question: q,
        supporting_doc_required: determineIfDocumentRequired(q),
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

  // Determine if a question requires supporting documentation using AI
  const determineIfDocumentRequired = (question: string): boolean => {
    // Simple heuristic - in production, this would use AI to analyze the question
    const documentKeywords = [
      'policy', 'procedure', 'document', 'certificate', 'license', 'contract',
      'agreement', 'compliance', 'audit', 'report', 'evidence', 'proof',
      'certification', 'accreditation', 'standard', 'framework'
    ];
    
    const lowerQuestion = question.toLowerCase();
    return documentKeywords.some(keyword => lowerQuestion.includes(keyword));
  };

  // Handle evidence files upload
  const handleEvidenceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Check authentication before proceeding
    if (!isAuthenticated || !token) {
      setAuthError("Authentication required. Please log in to continue.");
      setTimeout(() => {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }, 2000);
      return;
    }
    
    setEvidenceFiles(prev => [...prev, ...files]);
    
    if (questions.length > 0) {
      await generateAIAnswers(files);
    }
  };

  // Handle general supporting documents upload
  const handleGeneralDocsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (!isAuthenticated || !token) {
      setAuthError("Authentication required. Please log in to continue.");
      setTimeout(() => {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }, 2000);
      return;
    }
    
    setGeneralSupportingDocs(prev => [...prev, ...files]);
  };

  // Handle question-specific document upload
  const handleQuestionDocumentUpload = async (questionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated || !token) {
      setAuthError("Authentication required. Please log in to continue.");
      setTimeout(() => {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }, 2000);
      return;
    }

    // Update the question with the uploaded file
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, uploadedDocument: file, status: 'manually-answered' }
        : q
    ));
  };

  // Upload file to DigitalOcean Spaces
  const uploadFileToSpaces = async (file: File, questionId?: string): Promise<UploadedDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vendorId', selectedVendor);
    formData.append('category', questionId ? 'supporting-document' : 'evidence');
    if (questionId) {
      formData.append('questionId', questionId);
    }

    const response = await fetch(`/api/vendors/${selectedVendor}/evidence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    const result = await response.json();
    
    return {
      filename: file.name,
      fileUrl: result.evidenceFile.spacesUrl,
      fileType: file.type,
      fileSize: file.size,
      category: questionId ? 'supporting-document' : 'evidence',
      questionId,
      id: result.evidenceFile.id
    };
  };

  // Upload all documents with progress tracking
  const uploadAllDocuments = async (): Promise<UploadedDocument[]> => {
    const allDocuments: UploadedDocument[] = [];
    const totalFiles = questions.filter(q => q.uploadedDocument).length + generalSupportingDocs.length;
    let uploadedCount = 0;

    // Upload question-specific documents
    for (const question of questions) {
      if (question.uploadedDocument) {
        setUploadStatus(prev => ({ ...prev, [`question_${question.id}`]: 'uploading' }));
        
        try {
          const uploadedDoc = await uploadFileToSpaces(question.uploadedDocument, question.id);
          allDocuments.push(uploadedDoc);
          setUploadStatus(prev => ({ ...prev, [`question_${question.id}`]: 'success' }));
        } catch (error) {
          console.error(`Failed to upload document for question ${question.id}:`, error);
          setUploadStatus(prev => ({ ...prev, [`question_${question.id}`]: 'error' }));
          throw error;
        }
        
        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }
    }

    // Upload general supporting documents
    for (const file of generalSupportingDocs) {
      setUploadStatus(prev => ({ ...prev, [`general_${file.name}`]: 'uploading' }));
      
      try {
        const uploadedDoc = await uploadFileToSpaces(file);
        allDocuments.push(uploadedDoc);
        setUploadStatus(prev => ({ ...prev, [`general_${file.name}`]: 'success' }));
      } catch (error) {
        console.error(`Failed to upload general document ${file.name}:`, error);
        setUploadStatus(prev => ({ ...prev, [`general_${file.name}`]: 'error' }));
        throw error;
      }
      
      uploadedCount++;
      setUploadProgress((uploadedCount / totalFiles) * 100);
    }

    return allDocuments;
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
    // Check authentication before proceeding
    if (!isAuthenticated || !token) {
      setAuthError("Authentication required. Please log in to continue.");
      setTimeout(() => {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }, 2000);
      return;
    }
    
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
        console.error(`Error generating AI answer for question ${i + 1}:`, error);
        setQuestions(prev => prev.map(q => 
          q.id === question.id 
            ? { ...q, isAiAnswerLoading: false }
            : q
        ));
      }
    }
    
    setIsProcessing(false);
  };

  // Generate AI answer for a specific question
  const generateAIAnswerForQuestion = async (question: string, evidenceFiles: File[]): Promise<string> => {
    try {
      // Prepare evidence content
      const evidenceContent = await Promise.all(
        evidenceFiles.map(async (file) => {
          const text = await readFileAsText(file);
          return `File: ${file.name}\nContent: ${text}\n`;
        })
      );

      const response = await fetch('/api/ai/questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          evidence: evidenceContent.join('\n'),
          vendorId: selectedVendor
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI answer');
      }

      const result = await response.json();
      return result.answer || 'Unable to generate answer at this time.';
    } catch (error) {
      console.error('Error generating AI answer:', error);
      return 'Unable to generate answer at this time.';
    }
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
  };

  // Submit questionnaire for review
  const handleSubmitForReview = async () => {
    if (!selectedVendor) {
      alert('Please select a vendor first');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Upload all documents first
      const uploadedDocs = await uploadAllDocuments();
      setUploadedDocuments(uploadedDocs);

      // Submit questionnaire data
      const questionnaireData = {
        vendorId: selectedVendor,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          aiAnswer: q.aiAnswer,
          status: q.status,
          assistanceRequest: q.assistanceRequest,
          supporting_doc_required: q.supporting_doc_required,
          uploadedDocument: q.uploadedDocument ? {
            filename: q.uploadedDocument.name,
            fileType: q.uploadedDocument.type,
            fileSize: q.uploadedDocument.size
          } : null
        })),
        documents: uploadedDocs
      };

      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(questionnaireData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit questionnaire');
      }

      setTrustPortalStatus('in-review');
      router.push(`/trust-portal/vendor/${selectedVendor}`);
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      alert('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const generateQuestionId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const renderStatusIcon = (question: QuestionnaireQuestion) => {
    if (question.isAiAnswerLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }

    switch (question.status) {
      case 'ai-answered':
        return <Bot className="w-4 h-4 text-blue-600" />;
      case 'manually-answered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'assistance-requested':
        return <HelpCircle className="w-4 h-4 text-orange-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  // Add handler for removing question documents
  const handleRemoveQuestionDocument = (questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, uploadedDocument: undefined, status: 'empty' }
        : q
    ));
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
                  {questions.every(q => q.status !== 'empty' && !q.isAiAnswerLoading) 
                    ? "All questions have been addressed. Ready to submit to Trust Portal."
                    : "Some questions still need attention before submission."
                  }
                </p>
              </div>
              <Button
                onClick={handleSubmitForReview}
                disabled={!questions.every(q => q.status !== 'empty' && !q.isAiAnswerLoading) || isProcessing}
                className={`font-semibold px-8 py-3 ${
                  questions.every(q => q.status !== 'empty' && !q.isAiAnswerLoading) 
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

        {/* Supporting Documents Section */}
        <SupportingDocumentsSection
          questions={questions}
          evidenceFiles={evidenceFiles}
          generalSupportingDocs={generalSupportingDocs}
          setEvidenceFiles={setEvidenceFiles}
          setGeneralSupportingDocs={setGeneralSupportingDocs}
          evidenceInputRef={evidenceInputRef}
          generalDocsInputRef={generalDocsInputRef}
          handleEvidenceUpload={handleEvidenceUpload}
          handleGeneralDocsUpload={handleGeneralDocsUpload}
          handleQuestionDocumentUpload={handleQuestionDocumentUpload}
          handleRemoveQuestionDocument={handleRemoveQuestionDocument}
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
        />
      </div>
    </div>
  );
};

// Question Row Component
interface QuestionRowProps {
  question: QuestionnaireQuestion;
  index: number;
  onAssistanceRequest: (request: string) => void;
  renderStatusIcon: (question: QuestionnaireQuestion) => React.ReactNode;
}

const QuestionRow: React.FC<QuestionRowProps> = ({
  question,
  index,
  onAssistanceRequest,
  renderStatusIcon
}) => {
  const [showAssistanceInput, setShowAssistanceInput] = useState(false);
  const [assistanceText, setAssistanceText] = useState('');

  const handleAssistanceSubmit = () => {
    if (assistanceText.trim()) {
      onAssistanceRequest(assistanceText);
      setAssistanceText('');
      setShowAssistanceInput(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-700">Q{index + 1}.</span>
            <p className="text-gray-800">{question.question}</p>
            {renderStatusIcon(question)}
          </div>
          
          {question.aiAnswer && (
            <div className="mt-2 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">{question.aiAnswer}</p>
            </div>
          )}

          {question.needsAssistance && !showAssistanceInput && (
            <div className="mt-2">
              <p className="text-sm text-yellow-600">
                <AlertCircle className="inline-block w-4 h-4 mr-1" />
                Assistance requested: {question.assistanceRequest}
              </p>
            </div>
          )}

          {showAssistanceInput && (
            <div className="mt-2">
              <textarea
                value={assistanceText}
                onChange={(e) => setAssistanceText(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Describe what help you need..."
              />
              <div className="mt-2 flex gap-2">
                <Button onClick={handleAssistanceSubmit}>
                  Submit Request
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowAssistanceInput(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!showAssistanceInput && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssistanceInput(true)}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Need Help
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Update the SupportingDocumentsSection component to handle conditional uploads
interface SupportingDocumentsSectionProps {
  questions: QuestionnaireQuestion[];
  evidenceFiles: File[];
  generalSupportingDocs: File[];
  setEvidenceFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setGeneralSupportingDocs: React.Dispatch<React.SetStateAction<File[]>>;
  evidenceInputRef: React.RefObject<HTMLInputElement>;
  generalDocsInputRef: React.RefObject<HTMLInputElement>;
  handleEvidenceUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleGeneralDocsUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleQuestionDocumentUpload: (questionId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveQuestionDocument: (questionId: string) => void;
  uploadStatus: {[key: string]: 'idle' | 'uploading' | 'success' | 'error'};
  uploadProgress: number;
}

const SupportingDocumentsSection: React.FC<SupportingDocumentsSectionProps> = ({
  questions,
  evidenceFiles,
  generalSupportingDocs,
  setEvidenceFiles,
  setGeneralSupportingDocs,
  evidenceInputRef,
  generalDocsInputRef,
  handleEvidenceUpload,
  handleGeneralDocsUpload,
  handleQuestionDocumentUpload,
  handleRemoveQuestionDocument,
  uploadStatus,
  uploadProgress
}) => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Supporting Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Question-Specific Documents */}
          {questions.filter(q => q.supporting_doc_required).length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Question-Specific Documents</h4>
              <p className="text-sm text-gray-600 mb-4">
                Upload supporting documents for questions that require them.
              </p>
              
              <div className="space-y-4">
                {questions
                  .filter(q => q.supporting_doc_required)
                  .map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Q{questions.indexOf(question) + 1}: {question.question.substring(0, 100)}...
                          </p>
                          <p className="text-xs text-gray-500">
                            Supporting document required
                          </p>
                        </div>
                      </div>
                      
                      {question.uploadedDocument ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {question.uploadedDocument.name}
                            </span>
                            <span className="text-xs text-green-600">
                              ({(question.uploadedDocument.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {uploadStatus[`question_${question.id}`] === 'uploading' && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            )}
                            {uploadStatus[`question_${question.id}`] === 'success' && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {uploadStatus[`question_${question.id}`] === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveQuestionDocument(question.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`question-doc-${question.id}`}
                            className="hidden"
                            onChange={(e) => handleQuestionDocumentUpload(question.id, e)}
                            accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.png,.jpg,.jpeg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`question-doc-${question.id}`)?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* General Supporting Documents */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Supporting Documents</h4>
            <p className="text-sm text-gray-600 mb-4">
              Upload any additional supporting documents that provide evidence for your questionnaire responses.
            </p>
            
            <div className="flex flex-col gap-4">
              {generalSupportingDocs.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadStatus[`general_${file.name}`] === 'uploading' && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                    {uploadStatus[`general_${file.name}`] === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {uploadStatus[`general_${file.name}`] === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setGeneralSupportingDocs(files => files.filter((_, i) => i !== index));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <input
                type="file"
                ref={generalDocsInputRef}
                className="hidden"
                onChange={handleGeneralDocsUpload}
                multiple
                accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.png,.jpg,.jpeg"
              />
              <Button
                variant="outline"
                onClick={() => generalDocsInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Additional Documents
              </Button>
            </div>
          </div>

          {/* Evidence Files (existing functionality) */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Evidence Files</h4>
            <p className="text-sm text-gray-600 mb-4">
              Upload evidence files that will be used to generate AI answers for your questions.
            </p>
            
            <div className="flex flex-col gap-4">
              {evidenceFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEvidenceFiles(files => files.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <input
                type="file"
                ref={evidenceInputRef}
                className="hidden"
                onChange={handleEvidenceUpload}
                multiple
                accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.png,.jpg,.jpeg"
              />
              <Button
                variant="outline"
                onClick={() => evidenceInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Evidence Files
              </Button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading documents...</span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedQuestionnaireView;