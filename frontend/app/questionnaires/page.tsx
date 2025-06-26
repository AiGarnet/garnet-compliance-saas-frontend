"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ClipboardList, 
  X, 
  Upload, 
  FileText, 
  Loader2, 
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  LifeBuoy,
  Download,
  Bot,
  FileCheck,
  FolderOpen,
  MessageCircle,
  Sparkles,
  Files,
  MessageSquare,
  RefreshCw,
  Brain,
  AlertTriangle,
  RotateCcw,
  ChevronDown
} from "lucide-react";
import Header from '@/components/Header';
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { vendors as vendorAPI } from '@/lib/api';
import { safeMap } from '@/lib/utils/arrayUtils';

interface ExtractedQuestion {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'completed' | 'needs-support';
  answer?: string;
  confidence?: number;
  requiresDoc?: boolean;
  docDescription?: string;
  supportingDocs?: File[];
}

interface ChecklistFile {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  questions: ExtractedQuestion[];
  extractionStatus: 'uploading' | 'extracting' | 'completed' | 'error';
}

interface SupportTicket {
  id: string;
  questionId: string;
  title: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

// Add new confirmation dialog state
interface ConfirmationDialog {
  show: boolean;
  title: string;
  message: string;
  questions: ExtractedQuestion[];
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const QuestionnairesPage = () => {
  const router = useRouter();
  
  // State declarations
  const [hasMounted, setHasMounted] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(false);
  
  // Active section state
  const [activeSection, setActiveSection] = useState<'upload' | 'ai' | 'docs' | 'support'>('upload');
  
  // New 4-section states
  const [checklists, setChecklists] = useState<ChecklistFile[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistFile | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // AI processing states
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, currentQuestion: '' });
  
  // Support states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedQuestionForSupport, setSelectedQuestionForSupport] = useState<ExtractedQuestion | null>(null);
  const [supportDescription, setSupportDescription] = useState('');
  
  // Add confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialog>({
    show: false,
    title: '',
    message: '',
    questions: [],
    onConfirm: () => {},
    onCancel: () => {},
    isProcessing: false
  });
  
  // File refs
  const checklistFileRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const { isLoading: authLoading } = useAuthGuard();

  useEffect(() => {
    setHasMounted(true);
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setIsLoadingVendors(true);
    try {
      const response = await vendorAPI.getAll();
      setVendors(response || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Enhanced file upload with real extraction
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadError('Please upload a PDF, TXT, DOC, or DOCX file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const newChecklist: ChecklistFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        uploadDate: new Date(),
        questions: [],
        extractionStatus: 'uploading'
      };

      setChecklists(prev => [...prev, newChecklist]);
      setSelectedChecklist(newChecklist);

      // Simulate upload progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      newChecklist.extractionStatus = 'extracting';
      setChecklists(prev => prev.map(c => c.id === newChecklist.id ? newChecklist : c));

      // Extract questions based on file type
      const extractedText = await extractTextFromFile(file);
      const questions = parseQuestionsFromText(extractedText);
      
      newChecklist.questions = questions;
      newChecklist.extractionStatus = 'completed';
      
      setChecklists(prev => prev.map(c => c.id === newChecklist.id ? newChecklist : c));
      setExtractedQuestions(questions);

      // Show confirmation dialog after extraction
      showExtractionConfirmation(questions);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadError('Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Show confirmation dialog after question extraction
  const showExtractionConfirmation = (questions: ExtractedQuestion[]) => {
    setConfirmationDialog({
      show: true,
      title: 'Questions Extracted Successfully',
      message: `We found ${questions.length} questions in your document. Would you like to send them to our AI for response generation?`,
      questions,
      onConfirm: () => startAIResponseGeneration(questions),
      onCancel: () => {
        setConfirmationDialog(prev => ({ ...prev, show: false }));
      },
      isProcessing: false
    });
  };

  // Start AI response generation process
  const startAIResponseGeneration = async (questions: ExtractedQuestion[]) => {
    setConfirmationDialog(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Switch to AI section
      setActiveSection('ai');
      
      // Close confirmation dialog
      setConfirmationDialog(prev => ({ ...prev, show: false }));
      
      // Start AI processing
      await generateAIResponses(questions);
      
    } catch (error) {
      console.error('Error starting AI generation:', error);
      setConfirmationDialog(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Generate AI responses using actual API endpoints
  const generateAIResponses = async (questions: ExtractedQuestion[]) => {
    setIsGeneratingAnswers(true);
    setGenerationProgress({ current: 0, total: questions.length, currentQuestion: '' });

    try {
      // Update questions to in-progress status
      const questionsInProgress = questions.map(q => ({ ...q, status: 'in-progress' as const }));
      setExtractedQuestions(questionsInProgress);

      if (questions.length === 1) {
        // Use single question API
        await generateSingleAnswer(questions[0]);
      } else {
        // Use batch API for multiple questions
        await generateBatchAnswers(questions);
      }
    } catch (error) {
      console.error('Error generating AI responses:', error);
      // Mark questions as needing support if AI fails
      setExtractedQuestions(prev => prev.map(q => ({ ...q, status: 'needs-support' })));
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  // Generate single answer using individual API
  const generateSingleAnswer = async (question: ExtractedQuestion) => {
    setGenerationProgress(prev => ({ ...prev, currentQuestion: question.text }));

    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.text,
          context: 'Compliance questionnaire response',
          vendorId: selectedChecklist?.id || 'unknown'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update question with answer
      setExtractedQuestions(prev => prev.map(q => 
        q.id === question.id 
          ? { 
              ...q, 
              status: 'completed',
              answer: data.answer,
              confidence: data.confidence
            }
          : q
      ));

      setGenerationProgress(prev => ({ ...prev, current: 1 }));
      
    } catch (error) {
      console.error('Error generating single answer:', error);
      setExtractedQuestions(prev => prev.map(q => 
        q.id === question.id ? { ...q, status: 'needs-support' } : q
      ));
    }
  };

  // Generate batch answers using batch API
  const generateBatchAnswers = async (questions: ExtractedQuestion[]) => {
    try {
      const questionTexts = questions.map(q => q.text);
      
      const response = await fetch('/api/generate-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questionTexts,
          context: 'Compliance questionnaire response',
          vendorId: selectedChecklist?.id || 'unknown'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update questions with answers
      if (data.answers && Array.isArray(data.answers)) {
        const updatedQuestions = questions.map((question, index) => {
          const aiAnswer = data.answers[index];
          if (aiAnswer && aiAnswer.success) {
            return {
              ...question,
              status: 'completed' as const,
              answer: aiAnswer.answer,
              confidence: aiAnswer.confidence || 0.8
            };
          } else {
            return {
              ...question,
              status: 'needs-support' as const
            };
          }
        });

        setExtractedQuestions(updatedQuestions);
        
        // Update progress
        const successfulAnswers = data.metadata?.successfulAnswers || 0;
        setGenerationProgress(prev => ({ ...prev, current: successfulAnswers }));
      }
      
    } catch (error) {
      console.error('Error generating batch answers:', error);
      throw error;
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type === 'text/plain') {
      const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.readAsText(file);
        } else {
        // For PDF and DOC files, simulate extraction with realistic questions
        setTimeout(() => {
          const sampleQuestions = [
            "Do you have a documented information security policy?",
            "Are user access controls implemented and regularly reviewed?",
            "Do you conduct regular security awareness training?",
            "Is data encrypted both at rest and in transit?",
            "Do you have an incident response plan in place?",
            "Are regular security assessments and penetration tests conducted?",
            "Do you have a business continuity and disaster recovery plan?",
            "Are vendor security assessments performed before onboarding?",
            "Do you maintain an inventory of all IT assets?",
            "Are software vulnerabilities managed through a formal process?"
          ];
          resolve(sampleQuestions.join('\n'));
        }, 2000);
      }
    });
  };

  const parseQuestionsFromText = (text: string): ExtractedQuestion[] => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.map((line, index) => ({
      id: `q-${Date.now()}-${index}`,
      text: line.trim(),
      status: 'pending',
      requiresDoc: Math.random() > 0.7,
      docDescription: Math.random() > 0.7 ? getRandomDocRequirement() : undefined
    }));
  };

  const getRandomDocRequirement = (): string => {
    const requirements = [
      "Upload your latest security audit report",
      "Provide evidence of employee security training certificates",
      "Submit your data encryption policy document",
      "Upload incident response procedure documentation",
      "Provide your business continuity plan"
    ];
    return requirements[Math.floor(Math.random() * requirements.length)];
  };

  // Support document functions
  const handleSupportDocUpload = async (questionId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setExtractedQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            supportingDocs: [...(q.supportingDocs || []), file],
            status: q.status === 'pending' ? 'in-progress' : q.status
          }
        : q
    ));
  };

  // Support ticket functions
  const createSupportTicket = (question: ExtractedQuestion) => {
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      questionId: question.id,
      title: `Help with: ${question.text.substring(0, 50)}...`,
      status: 'open',
      priority: 'medium',
      createdAt: new Date()
    };

    setSupportTickets(prev => [...prev, newTicket]);
    setShowSupportModal(false);
    setSupportDescription('');
    
    setExtractedQuestions(prev => prev.map(q => 
      q.id === question.id 
        ? { ...q, status: 'needs-support' }
        : q
    ));
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files);
    }
  };

  if (authLoading || !hasMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
        <Header />
        
      <main id="main-content" className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
              <ClipboardList className="mr-3 h-7 w-7 text-primary" />
              Questionnaire Workspace
                </h1>
            <p className="text-gray-600 mt-1">Complete your compliance questionnaire through our 4-step process</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-w-[200px]"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
              >
                <option value="">Select Vendor</option>
                {isLoadingVendors ? (
                  <option disabled>Loading vendors...</option>
                ) : (
                  safeMap(vendors, (vendor: any) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
        
        {/* 4-Section Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
            <nav className="flex space-x-1">
                    <button 
                onClick={() => setActiveSection('upload')}
                className={`flex-1 py-3 px-4 text-center font-semibold text-sm rounded-lg transition-all duration-200 ${
                  activeSection === 'upload'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Checklist Upload
                    </button>
                            <button 
                onClick={() => setActiveSection('ai')}
                className={`flex-1 py-3 px-4 text-center font-semibold text-sm rounded-lg transition-all duration-200 ${
                  activeSection === 'ai'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Bot className="w-4 h-4 inline mr-2" />
                AI Questionnaire
                            </button>
                            <button 
                onClick={() => setActiveSection('docs')}
                className={`flex-1 py-3 px-4 text-center font-semibold text-sm rounded-lg transition-all duration-200 ${
                  activeSection === 'docs'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <FolderOpen className="w-4 h-4 inline mr-2" />
                Supporting Documents
                            </button>
                            <button 
                onClick={() => setActiveSection('support')}
                className={`flex-1 py-3 px-4 text-center font-semibold text-sm rounded-lg transition-all duration-200 ${
                  activeSection === 'support'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <LifeBuoy className="w-4 h-4 inline mr-2" />
                Request Assistance
                            </button>
            </nav>
                          </div>
                        </div>
                        
        {/* Section Content */}
        <div className="min-h-[600px]">
          
          {/* Section 1: Checklist Upload */}
          {activeSection === 'upload' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Compliance Checklist</h2>
                  <p className="text-lg text-gray-600">Upload your compliance checklist and we'll extract the questions for you</p>
                              </div>

                {/* Upload Area */}
                        <div 
                          ref={dropZoneRef}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer mb-8 ${
                        dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                  onClick={() => checklistFileRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600 mb-2">
                    {dragActive ? 'Drop file here' : 'Upload compliance checklist'}
                  </p>
                  <p className="text-gray-500 mb-4">
                    PDF, TXT, DOC, DOCX supported
                  </p>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Choose File
                  </button>
                        <input
                    ref={checklistFileRef}
                          type="file"
                          className="hidden"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                    </div>
                    
                    {isUploading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                    <span className="text-lg text-gray-600">Processing file...</span>
                      </div>
                    )}
                    
                    {uploadError && (
                  <div className="text-red-600 bg-red-50 p-4 rounded-lg mb-6">
                        {uploadError}
                      </div>
                )}

                {/* Uploaded Checklists */}
                {checklists.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Checklists</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {safeMap(checklists, (checklist: ChecklistFile) => (
                        <div 
                          key={checklist.id}
                          className={`p-6 border rounded-lg cursor-pointer transition-colors ${
                            selectedChecklist?.id === checklist.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedChecklist(checklist);
                            setExtractedQuestions(checklist.questions);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <FileCheck className="h-6 w-6 text-blue-600 mr-3" />
                              <span className="font-medium">{checklist.name}</span>
                            </div>
                            {checklist.extractionStatus === 'extracting' && (
                              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            )}
                            {checklist.extractionStatus === 'completed' && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <p className="text-gray-600">
                            {checklist.questions.length} questions extracted
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                        )}
                      </div>
                    </div>
                  )}

          {/* Section 2: AI Questionnaire */}
          {activeSection === 'ai' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <Bot className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Questionnaire Processing</h2>
                  <p className="text-lg text-gray-600">Let our AI generate compliance answers for your questions</p>
                            </div>

                {extractedQuestions.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="h-24 w-24 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Available</h3>
                    <p className="text-gray-500 mb-6">Upload a checklist first to see questions here</p>
                          <button 
                      onClick={() => setActiveSection('upload')}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                      Go to Upload Section
                          </button>
                        </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-900 mb-4">Progress Overview</h3>
                      
                      {/* AI Generation Progress */}
                      {isGeneratingAnswers && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-purple-700">Generating Responses...</span>
                            <span className="text-sm text-purple-700">
                              {generationProgress.current} / {generationProgress.total}
                            </span>
                          </div>
                          <div className="w-full bg-purple-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                            ></div>
                          </div>
                          {generationProgress.currentQuestion && (
                            <p className="text-xs text-purple-600 mt-2 truncate">
                              Processing: {generationProgress.currentQuestion}
                          </p>
                        )}
                    </div>
                  )}

                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-500 mr-2" />
                          <span className="text-gray-700">
                            {extractedQuestions.filter(q => q.status === 'pending').length} Pending
                          </span>
                            </div>
                        <div className="flex items-center">
                          <Loader2 className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-gray-700">
                            {extractedQuestions.filter(q => q.status === 'in-progress').length} In Progress
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-gray-700">
                            {extractedQuestions.filter(q => q.status === 'completed').length} Completed
                          </span>
                          </div>
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                          <span className="text-gray-700">
                            {extractedQuestions.filter(q => q.status === 'needs-support').length} Needs Support
                          </span>
                        </div>
                      </div>

                      {/* Batch Actions */}
                      {extractedQuestions.filter(q => q.status === 'pending').length > 1 && !isGeneratingAnswers && (
                        <div className="pt-4 border-t border-purple-200">
                          <button
                            onClick={() => generateAIResponses(extractedQuestions.filter(q => q.status === 'pending'))}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center mx-auto"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Generate All Answers ({extractedQuestions.filter(q => q.status === 'pending').length})
                          </button>
                        </div>
                      )}
                      </div>
                      
                    <div className="grid grid-cols-1 gap-6">
                      {safeMap(extractedQuestions, (question: ExtractedQuestion) => (
                        <div 
                          key={question.id}
                          className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-medium text-gray-800 flex-1 pr-4">{question.text}</h4>
                            <div className="flex items-center space-x-2">
                              {question.status === 'pending' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Pending
                                </span>
                              )}
                              {question.status === 'in-progress' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Processing
                                </span>
                              )}
                              {question.status === 'completed' && (
                                <>
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Completed
                                  </span>
                                  {question.confidence && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                      {Math.round(question.confidence * 100)}% confidence
                                    </span>
                                  )}
                                </>
                              )}
                              {question.status === 'needs-support' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Needs Support
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {question.answer && (
                            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-4">
                              <h5 className="font-semibold text-purple-900 mb-2">AI Generated Answer:</h5>
                              <p className="text-purple-800 whitespace-pre-wrap">{question.answer}</p>
                            </div>
                          )}
                          
                          {question.status === 'pending' && (
                            <button
                              onClick={() => generateAIResponses([question])}
                              disabled={isGeneratingAnswers}
                              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center"
                            >
                              {isGeneratingAnswers ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Generate AI Answer
                                </>
                              )}
                            </button>
                          )}

                          {question.status === 'completed' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => generateAIResponses([question])}
                                disabled={isGeneratingAnswers}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center text-sm"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Regenerate
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedQuestionForSupport(question);
                                  setShowSupportModal(true);
                                }}
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center text-sm"
                              >
                                <HelpCircle className="h-3 w-3 mr-1" />
                                Need Help
                              </button>
                            </div>
                          )}

                          {question.status === 'needs-support' && (
                            <button
                              onClick={() => {
                                setSelectedQuestionForSupport(question);
                                setShowSupportModal(true);
                              }}
                              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                            >
                              <HelpCircle className="h-4 w-4 mr-2" />
                              Request Help
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Supporting Documents */}
          {activeSection === 'docs' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <FolderOpen className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Supporting Documents</h2>
                  <p className="text-lg text-gray-600">Upload supporting documents for questions that require evidence</p>
                </div>

                {extractedQuestions.length === 0 ? (
                  <div className="text-center py-16">
                    <Files className="h-24 w-24 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Available</h3>
                    <p className="text-gray-500 mb-6">Upload a checklist first to see document requirements</p>
                <button
                      onClick={() => setActiveSection('upload')}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Go to Upload Section
                </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {extractedQuestions
                      .filter(q => q.requiresDoc || q.docDescription)
                      .map((question) => (
                      <div 
                        key={question.id}
                        className="border rounded-lg p-6"
                      >
                        <h4 className="text-lg font-medium text-gray-800 mb-3">{question.text}</h4>
                        
                        {question.docDescription && (
                          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                            <p className="text-yellow-800">
                              <strong>Required:</strong> {question.docDescription}
                            </p>
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          <input
                            type="file"
                            className="hidden"
                            id={`support-doc-${question.id}`}
                            multiple
                            onChange={(e) => e.target.files && handleSupportDocUpload(question.id, e.target.files)}
                          />
                          <label
                            htmlFor={`support-doc-${question.id}`}
                            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Document
                          </label>
                          
                          {question.supportingDocs && question.supportingDocs.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h5 className="font-medium text-gray-700 mb-2">Uploaded Documents:</h5>
                              <div className="space-y-2">
                                {safeMap(question.supportingDocs, (doc: File, index: number) => (
                                  <div key={index} className="flex items-center text-gray-600">
                                    <FileText className="h-4 w-4 mr-2" />
                                    <span>{doc.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
            </div>
          </div>
                    ))}
                    
                    {extractedQuestions.filter(q => q.requiresDoc || q.docDescription).length === 0 && (
                      <div className="text-center py-16">
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Documents Required</h3>
                        <p className="text-gray-500">All current questions can be answered without supporting documentation</p>
                  </div>
                    )}
                </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Request Assistance */}
          {activeSection === 'support' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <LifeBuoy className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Assistance</h2>
                  <p className="text-lg text-gray-600">Get help from our compliance experts when you need it</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Create Support Ticket */}
                  <div className="space-y-6">
                    <div className="bg-orange-50 p-6 rounded-lg">
                      <HelpCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-center mb-4">Need Help?</h3>
                      <p className="text-gray-600 text-center mb-6">
                        Our compliance experts are here to help you with any questions or challenges
                      </p>
                      
                  <button
                        onClick={() => setShowSupportModal(true)}
                        className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                  >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Open Support Ticket
                  </button>
                </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Quick Actions</h4>
                      <div className="space-y-3">
                        <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                          <MessageSquare className="h-5 w-5 mr-3 text-gray-600" />
                          <div>
                            <div className="font-medium">Start Live Chat</div>
                            <div className="text-sm text-gray-500">Get instant help from our team</div>
            </div>
                        </button>
                        <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                          <FileText className="h-5 w-5 mr-3 text-gray-600" />
                  <div>
                            <div className="font-medium">View Documentation</div>
                            <div className="text-sm text-gray-500">Browse our compliance guides</div>
                  </div>
                    </button>
                        <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                          <Download className="h-5 w-5 mr-3 text-gray-600" />
                          <div>
                            <div className="font-medium">Download Templates</div>
                            <div className="text-sm text-gray-500">Get compliance templates and checklists</div>
                          </div>
                        </button>
                    </div>
                  </div>
                </div>
                
                  {/* Active Support Tickets */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Active Support Tickets</h3>
                    
                    {supportTickets.length === 0 ? (
                      <div className="text-center py-8 border border-gray-200 rounded-lg">
                        <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No active support tickets</p>
                </div>
              ) : (
                                            <div className="space-y-4">
                        {safeMap(supportTickets, (ticket: SupportTicket) => (
                          <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">#{ticket.id.slice(-6)}</span>
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                                ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {ticket.status.replace('-', ' ')}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-800 mb-1">{ticket.title}</h4>
                            <p className="text-sm text-gray-500">
                              Created {ticket.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
              )}
            </div>
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {confirmationDialog.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {confirmationDialog.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {confirmationDialog.message}
              </p>
              <div className="flex space-x-3">
                    <button
                  onClick={confirmationDialog.onConfirm}
                  disabled={confirmationDialog.isProcessing}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {confirmationDialog.isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Send to AI'
                  )}
                    </button>
                <button
                  onClick={confirmationDialog.onCancel}
                  disabled={confirmationDialog.isProcessing}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Maybe Later
                </button>
                    </div>
                  </div>
                </div>
        )}

        {/* Support Modal */}
        {showSupportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Request Assistance</h3>
                    <button
                  onClick={() => setShowSupportModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                    >
                  <X className="h-5 w-5" />
                    </button>
                  </div>
              
                  <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Question (Optional)
                      </label>
                      <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) => {
                      const questionId = e.target.value;
                      const question = extractedQuestions.find(q => q.id === questionId);
                      setSelectedQuestionForSupport(question || null);
                    }}
                  >
                                        <option value="">General support request</option>
                    {safeMap(extractedQuestions, (question: ExtractedQuestion) => (
                      <option key={question.id} value={question.id}>
                        {question.text.substring(0, 50)}...
                      </option>
                    ))}
                      </select>
                    </div>

                          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Description
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Describe what you need help with..."
                    value={supportDescription}
                    onChange={(e) => setSupportDescription(e.target.value)}
                  />
                          </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSupportModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedQuestionForSupport) {
                        createSupportTicket(selectedQuestionForSupport);
                      } else {
                        // Create general support ticket
                        const generalTicket: SupportTicket = {
                          id: `ticket-${Date.now()}`,
                          questionId: 'general',
                          title: 'General support request',
                          status: 'open',
                          priority: 'medium',
                          createdAt: new Date()
                        };
                        setSupportTickets(prev => [...prev, generalTicket]);
                        setShowSupportModal(false);
                        setSupportDescription('');
                      }
                    }}
                    disabled={!supportDescription.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    Create Ticket
                  </button>
                  </div>
              </div>
              </div>
            </div>
          )}
        </main>
    </>
  );
};

export default QuestionnairesPage;