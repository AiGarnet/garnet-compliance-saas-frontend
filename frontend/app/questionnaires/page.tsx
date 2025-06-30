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
  ChevronDown,
  Trash2
} from "lucide-react";
import Header from '@/components/Header';
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { vendors as vendorAPI } from '@/lib/api';
import { safeMap } from '@/lib/utils/arrayUtils';
import { ChecklistService } from '@/lib/services/checklistService';

interface ExtractedQuestion {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'completed' | 'needs-support';
  answer?: string;
  confidence?: number;
  requiresDoc?: boolean;
  docDescription?: string;
  supportingDocs?: File[];
  checklistId?: string;
  checklistName?: string;
}

interface ChecklistFile {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  questions: ExtractedQuestion[];
  extractionStatus: 'uploading' | 'extracting' | 'completed' | 'error';
  checklistId?: string;
}

interface SupportTicket {
  id: string;
  questionId: string;
  title: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

interface UploadedSupportingDocument {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  spacesUrl?: string;
  spacesKey?: string;
  description?: string;
  category?: string;
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

// Helper function to validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const QuestionnairesPage = () => {
  const router = useRouter();
  
  // State declarations
  const [hasMounted, setHasMounted] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(false);
  const [isLoadingChecklists, setIsLoadingChecklists] = useState<boolean>(false);
  
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
  
  // Supporting document upload states
  const [isUploadingSupportDoc, setIsUploadingSupportDoc] = useState(false);
  const [supportDocUploadError, setSupportDocUploadError] = useState<string | null>(null);
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  
  // Independent supporting documents state
  const [uploadedSupportingDocs, setUploadedSupportingDocs] = useState<UploadedSupportingDocument[]>([]);
  const [supportDocDescription, setSupportDocDescription] = useState('');
  const [supportDocCategory, setSupportDocCategory] = useState('');
  
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

  // Add state for "Send to AI" functionality
  const [sendingToAI, setSendingToAI] = useState(false);
  
  // File refs
  const checklistFileRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const standaloneSupportDocRef = useRef<HTMLInputElement>(null);

  const { isLoading: authLoading } = useAuthGuard();

  useEffect(() => {
    setHasMounted(true);
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setIsLoadingVendors(true);
    try {
      console.log('Loading vendors from API...');
      const response = await vendorAPI.getAll();
      console.log('Vendor API response:', response);
      
      // Handle the API response structure properly (like in vendors page)
      if (response && response.data && Array.isArray(response.data)) {
        // Handle response with .data structure
        const transformedVendors = response.data.map((vendor: any) => ({
          id: vendor.uuid || vendor.id || vendor.vendorId?.toString(),
          name: vendor.companyName || vendor.name || 'Unknown Vendor',
          status: vendor.status || 'Active'
        }));
        setVendors(transformedVendors);
        console.log('Successfully loaded vendors:', transformedVendors);
      } else if (response && response.vendors && Array.isArray(response.vendors)) {
        // Handle response with .vendors structure
        const transformedVendors = response.vendors.map((vendor: any) => ({
          id: vendor.uuid || vendor.id || vendor.vendorId?.toString(),
          name: vendor.companyName || vendor.name || 'Unknown Vendor',
          status: vendor.status || 'Active'
        }));
        setVendors(transformedVendors);
        console.log('Successfully loaded vendors:', transformedVendors);
      } else if (response && Array.isArray(response)) {
        // Handle case where response is directly an array
        const transformedVendors = response.map((vendor: any) => ({
          id: vendor.uuid || vendor.id || vendor.vendorId?.toString(),
          name: vendor.companyName || vendor.name || 'Unknown Vendor',
          status: vendor.status || 'Active'
        }));
        setVendors(transformedVendors);
        console.log('Successfully loaded vendors:', transformedVendors);
      } else {
        console.log('No vendors found or unexpected response structure');
        setVendors([]);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Load existing checklists for selected vendor
  const loadVendorChecklists = async (vendorId: string) => {
    if (!vendorId || !isValidUUID(vendorId)) return;
    
    setIsLoadingChecklists(true);
    try {
      console.log(`📋 LOADING: Fetching existing checklists for vendor ${vendorId}`);
      const existingChecklists = await ChecklistService.getVendorChecklists(vendorId);
      console.log(`📋 LOADING: Found ${existingChecklists.length} existing checklists:`, existingChecklists);
      
      // Convert database checklists to our local format
      const convertedChecklists: ChecklistFile[] = existingChecklists.map(checklist => ({
        id: checklist.id,
        name: checklist.name,
        type: checklist.fileType,
        uploadDate: new Date(checklist.uploadDate),
        questions: [], // Will be loaded when needed
        extractionStatus: checklist.extractionStatus as any,
        checklistId: checklist.id
      }));
      
      setChecklists(convertedChecklists);
      console.log(`📋 LOADING: Successfully loaded ${convertedChecklists.length} checklists`);
      
      // If there are checklists, select the most recent one by default
      if (convertedChecklists.length > 0) {
        const mostRecent = convertedChecklists.sort((a, b) => 
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        )[0];
        setSelectedChecklist(mostRecent);
        console.log(`📋 LOADING: Auto-selected most recent checklist: ${mostRecent.name}`);
      }
      
    } catch (error) {
      console.error('❌ Error loading vendor checklists:', error);
      setChecklists([]);
    } finally {
      setIsLoadingChecklists(false);
    }
  };

  // Load questions for an existing checklist
  const loadChecklistQuestions = async (checklist: ChecklistFile) => {
    if (!checklist.checklistId || !selectedVendorId) return;
    
    setIsLoadingChecklists(true);
    try {
      console.log(`📋 LOADING: Fetching questions for checklist ${checklist.checklistId}`);
      const questions = await ChecklistService.getChecklistQuestions(checklist.checklistId, selectedVendorId);
      console.log(`📋 LOADING: Found ${questions.length} questions for checklist ${checklist.name}`);
      
      // Convert database questions to our local format
      const convertedQuestions: ExtractedQuestion[] = questions.map(q => ({
        id: q.id,
        text: q.questionText,
        status: q.status as any,
        answer: q.aiAnswer,
        confidence: q.confidenceScore,
        requiresDoc: q.requiresDocument,
        docDescription: q.documentDescription,
        checklistId: q.checklistId,
        checklistName: checklist.name
      }));
      
      // Update the checklist with loaded questions
      setChecklists(prev => prev.map(c => 
        c.id === checklist.id 
          ? { ...c, questions: convertedQuestions }
          : c
      ));
      
      // Update selected checklist if it's the current one
      if (selectedChecklist?.id === checklist.id) {
        setSelectedChecklist({ ...checklist, questions: convertedQuestions });
      }
      
      console.log(`📋 LOADING: Successfully loaded questions for ${checklist.name}`);
      
    } catch (error) {
      console.error('❌ Error loading checklist questions:', error);
      setUploadError('Failed to load checklist questions. Please try again.');
    } finally {
      setIsLoadingChecklists(false);
    }
  };

  // Load supporting documents for selected vendor
  const loadVendorSupportingDocuments = async (vendorId: string) => {
    if (!vendorId || !isValidUUID(vendorId)) return;
    
    try {
      console.log(`📁 LOADING: Fetching supporting documents for vendor ${vendorId}`);
      const documents = await ChecklistService.getVendorSupportingDocuments(vendorId);
      console.log(`📁 LOADING: Found ${documents.length} supporting documents:`, documents);
      
      // Convert database documents to our local format
      const convertedDocs: UploadedSupportingDocument[] = documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        originalName: doc.filename, // Backend only stores filename
        fileType: doc.fileType,
        fileSize: doc.fileSize || 0,
        uploadDate: new Date(doc.uploadedAt),
        spacesUrl: doc.spacesUrl,
        spacesKey: doc.spacesKey,
        description: 'Uploaded document', // Default description
        category: 'General' // Default category
      }));
      
      setUploadedSupportingDocs(convertedDocs);
      console.log(`📁 LOADING: Successfully loaded ${convertedDocs.length} supporting documents`);
      
    } catch (error) {
      console.error('❌ Error loading supporting documents:', error);
      setUploadedSupportingDocs([]);
    }
  };

  // Load checklists when vendor is selected
  useEffect(() => {
    if (selectedVendorId && isValidUUID(selectedVendorId)) {
      loadVendorChecklists(selectedVendorId);
      loadVendorSupportingDocuments(selectedVendorId);
    } else {
      setChecklists([]);
      setSelectedChecklist(null);
      setUploadedSupportingDocs([]);
    }
  }, [selectedVendorId]);

  // CHECKLIST UPLOAD ONLY - Enhanced file upload with database integration
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadError('Please upload a PDF, TXT, DOC, or DOCX file');
      return;
    }

    if (!selectedVendorId || selectedVendorId.trim() === '') {
      setUploadError('Please select a vendor first');
      return;
    }

    if (!isValidUUID(selectedVendorId)) {
      setUploadError(`Invalid vendor ID format: "${selectedVendorId}". Please refresh the page and try again.`);
      console.error('❌ INVALID VENDOR UUID:', {
        selectedVendorId,
        isValid: false,
        vendors: vendors
      });
      return;
    }

    console.log(`📋 CHECKLIST UPLOAD: Starting upload for checklist file: ${file.name}`);
    
    setIsUploading(true);
    setUploadError(null);

    // Create initial checklist entry
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

    try {
      console.log(`📋 CHECKLIST: Calling ChecklistService.uploadChecklist()`);
      console.log(`📋 API Call: POST /api/checklists/upload`);
      
      // Upload to backend and extract questions (goes to checklists/ folder)
      const uploadResponse = await ChecklistService.uploadChecklist(file, selectedVendorId, file.name);
      
      console.log('📋 CHECKLIST: Upload successful, file stored in checklists/ folder:', uploadResponse);
      
      // Convert database questions to our local format
      const extractedQuestions: ExtractedQuestion[] = uploadResponse.questions.map(q => ({
        id: q.id,
        text: q.questionText,
        status: q.status as any,
        answer: q.aiAnswer,
        confidence: q.confidenceScore,
        requiresDoc: q.requiresDocument,
        docDescription: q.documentDescription,
        checklistId: q.checklistId,
        checklistName: file.name
      }));

      // Update checklist with extracted questions and database ID
      newChecklist.questions = extractedQuestions;
      newChecklist.extractionStatus = 'completed';
      newChecklist.checklistId = uploadResponse.checklist.id;
      
      setChecklists(prev => prev.map(c => c.id === newChecklist.id ? newChecklist : c));
      
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadError('Failed to process file. Please try again.');
      
      // Update status to error
      setChecklists(prev => prev.map(c => 
        c.id === newChecklist.id ? { ...c, extractionStatus: 'error' } : c
      ));
    } finally {
      setIsUploading(false);
    }
  };

  // New function to send questions to AI
  const sendQuestionsToAI = async (checklist: ChecklistFile) => {
    if (!checklist.checklistId || !selectedVendorId) {
      setUploadError('Missing checklist or vendor information');
      return;
    }

    setSendingToAI(true);
    try {
      // Load questions from database to get latest data
      const dbQuestions = await ChecklistService.getChecklistQuestions(checklist.checklistId, selectedVendorId);
      
      // Convert to our local format for AI questionnaire section
      const questionsForAI: ExtractedQuestion[] = dbQuestions.map(q => ({
        id: q.id,
        text: q.questionText,
        status: q.status as any,
        answer: q.aiAnswer,
        confidence: q.confidenceScore,
        requiresDoc: q.requiresDocument,
        docDescription: q.documentDescription,
        checklistId: q.checklistId,
        checklistName: checklist.name
      }));

      // Set questions for AI section
      setExtractedQuestions(questionsForAI);
      
      // Switch to AI section
      setActiveSection('ai');
      
      // Auto-generate AI answers for pending questions
      const pendingQuestions = questionsForAI.filter(q => q.status === 'pending');
      if (pendingQuestions.length > 0) {
        await generateAIResponsesFromDatabase(checklist.checklistId, selectedVendorId);
      }
      
    } catch (error) {
      console.error('Error sending questions to AI:', error);
      setUploadError('Failed to send questions to AI. Please try again.');
    } finally {
      setSendingToAI(false);
    }
  };

  // Generate AI responses using database integration
  const generateAIResponsesFromDatabase = async (checklistId: string, vendorId: string) => {
    setIsGeneratingAnswers(true);
    setGenerationProgress({ current: 0, total: 0, currentQuestion: 'Preparing...' });

    try {
      console.log(`🤖 AI GENERATION: Starting AI answer generation for checklist ${checklistId}`);
      
      // First, get the current questions to show progress
      const initialQuestions = await ChecklistService.getChecklistQuestions(checklistId, vendorId);
      const pendingQuestions = initialQuestions.filter(q => q.status === 'pending');
      
      setGenerationProgress({ 
        current: 0, 
        total: pendingQuestions.length, 
        currentQuestion: `Found ${pendingQuestions.length} questions to process...` 
      });

      if (pendingQuestions.length === 0) {
        console.log('🤖 AI GENERATION: No pending questions found');
        setGenerationProgress({ current: 0, total: 0, currentQuestion: 'No questions need AI answers' });
        return;
      }

      console.log(`🤖 AI GENERATION: Calling generateAllPendingAnswers for ${pendingQuestions.length} questions`);
      
      // Generate answers using the checklist service
      const response = await ChecklistService.generateAllPendingAnswers(vendorId, 'Security compliance questionnaire', checklistId);
      console.log('🤖 AI GENERATION: Generate answers response:', response);
      
      // Poll for updates every 2 seconds to show progress
      let attempts = 0;
      const maxAttempts = 30; // 1 minute timeout
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        try {
          // Reload questions from database to get updated answers
          const updatedQuestions = await ChecklistService.getChecklistQuestions(checklistId, vendorId);
          const completedQuestions = updatedQuestions.filter(q => q.status === 'completed');
          const stillPending = updatedQuestions.filter(q => q.status === 'pending');
          
          console.log(`🤖 AI GENERATION: Poll ${attempts + 1}: ${completedQuestions.length}/${updatedQuestions.length} completed`);
          
          // Update progress
          setGenerationProgress({ 
            current: completedQuestions.length, 
            total: updatedQuestions.length, 
            currentQuestion: stillPending.length > 0 
              ? `Processing: ${stillPending[0]?.questionText?.substring(0, 100)}...`
              : 'Finalizing answers...'
          });
          
          // Convert to local format and update UI
          const questionsWithAnswers: ExtractedQuestion[] = updatedQuestions.map(q => ({
            id: q.id,
            text: q.questionText,
            status: q.status as any,
            answer: q.aiAnswer,
            confidence: q.confidenceScore,
            requiresDoc: q.requiresDocument,
            docDescription: q.documentDescription,
            checklistId: q.checklistId,
            checklistName: 'Current Checklist' // We'll improve this with proper mapping later
          }));

          setExtractedQuestions(questionsWithAnswers);
          
          // Check if all questions are processed
          if (stillPending.length === 0) {
            console.log('🤖 AI GENERATION: All questions completed!');
            setGenerationProgress({ 
              current: completedQuestions.length, 
              total: updatedQuestions.length, 
              currentQuestion: 'All answers generated successfully!' 
            });
            break;
          }
          
        } catch (pollError) {
          console.error('🤖 AI GENERATION: Error during polling:', pollError);
        }
        
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        console.warn('🤖 AI GENERATION: Timeout reached, some answers may still be processing');
        setUploadError('AI answer generation is taking longer than expected. Some answers may still be processing in the background.');
      }
      
    } catch (error) {
      console.error('❌ AI GENERATION: Error generating AI responses:', error);
      setUploadError('Failed to generate AI responses. Please try again.');
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  // Generate AI answer for a single question
  const generateSingleAIAnswer = async (question: ExtractedQuestion) => {
    setIsGeneratingAnswers(true);
    setGenerationProgress({ current: 0, total: 1, currentQuestion: question.text });

    try {
      // Update question status to in-progress
      setExtractedQuestions(prev => prev.map(q => 
        q.id === question.id ? { ...q, status: 'in-progress' } : q
      ));

      // Generate answer using individual API call
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.text,
          context: 'Security compliance questionnaire',
          vendorId: selectedVendorId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update question with AI answer
      setExtractedQuestions(prev => prev.map(q => 
        q.id === question.id 
          ? { 
              ...q, 
              status: 'completed',
              answer: data.answer,
              confidence: data.confidence || 0.8
            }
          : q
      ));

      setGenerationProgress({ current: 1, total: 1, currentQuestion: 'Completed' });
      
    } catch (error) {
      console.error('Error generating single AI answer:', error);
      // Mark question as needing support
      setExtractedQuestions(prev => prev.map(q => 
        q.id === question.id ? { ...q, status: 'needs-support' } : q
      ));
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  // Generate answers for all pending questions
  const generateAllPendingAnswers = async () => {
    if (!selectedVendorId) return;

    const pendingQuestions = extractedQuestions.filter(q => q.status === 'pending');
    setIsGeneratingAnswers(true);
    setGenerationProgress({ current: 0, total: pendingQuestions.length, currentQuestion: 'Preparing...' });

    try {
      // Update all pending questions to in-progress
      setExtractedQuestions(prev => prev.map(q => 
        q.status === 'pending' ? { ...q, status: 'in-progress' } : q
      ));

      // Generate answers using the checklist service  
      await ChecklistService.generateAllPendingAnswers(selectedVendorId, 'Security compliance questionnaire');
      
      // Reload questions from database to get the updated answers
      const allQuestions = await ChecklistService.getVendorQuestions(selectedVendorId);
      
      // Convert back to local format and update only the questions we have in extractedQuestions
      const questionMap = new Map(allQuestions.map(q => [q.id, q]));
      
      setExtractedQuestions(prev => prev.map(q => {
        const dbQuestion = questionMap.get(q.id);
        if (dbQuestion) {
          return {
            ...q,
            status: dbQuestion.status as any,
            answer: dbQuestion.aiAnswer,
            confidence: dbQuestion.confidenceScore
          };
        }
        return q;
      }));

      setGenerationProgress({ 
        current: pendingQuestions.length, 
        total: pendingQuestions.length, 
        currentQuestion: 'Completed' 
      });
      
    } catch (error) {
      console.error('Error generating all AI answers:', error);
      // Mark questions as needing support
      setExtractedQuestions(prev => prev.map(q => 
        q.status === 'in-progress' ? { ...q, status: 'needs-support' } : q
      ));
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  // Create questionnaire from AI responses
  const createQuestionnaireFromAI = async () => {
    if (!selectedVendorId || extractedQuestions.length === 0) {
      setUploadError('No questions available to create questionnaire');
      return;
    }

    setSendingToAI(true);
    try {
      // First, sync to questionnaire system if we have a checklist
      const completedQuestions = extractedQuestions.filter(q => q.status === 'completed' && q.answer);
      
      if (completedQuestions.length === 0) {
        setUploadError('No completed questions with AI answers to create questionnaire');
        return;
      }

      // Use the checklist name for the questionnaire title
      const checklistName = selectedChecklist?.name || 'AI Generated Questionnaire';
      
      // If we have a checklist ID, sync to questionnaire system
      if (selectedChecklist?.checklistId) {
        await ChecklistService.syncToQuestionnaire(selectedChecklist.checklistId, selectedVendorId);
        
        // Navigate to the questionnaire chat interface
        router.push(`/questionnaires/${selectedVendorId}/chat`);
      } else {
        // Fallback: create questionnaire directly
        const response = await fetch('/api/questionnaires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: checklistName,
            vendorId: selectedVendorId,
            questions: completedQuestions.map(q => ({ questionText: q.text })),
            generateAnswers: false // Don't regenerate, use existing answers
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create questionnaire');
        }

        const questionnaire = await response.json();
        
        // Navigate to the questionnaire chat interface
        router.push(`/questionnaires/${questionnaire.id}/chat`);
      }
      
    } catch (error) {
      console.error('Error creating questionnaire:', error);
      setUploadError('Failed to create questionnaire. Please try again.');
    } finally {
      setSendingToAI(false);
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

  // STANDALONE Supporting Document Upload (Independent of questions)
  const handleStandaloneSupportDocUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    if (!selectedVendorId) {
      setSupportDocUploadError('Please select a vendor first');
      return;
    }

    const file = files[0];
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setSupportDocUploadError('Please upload a PDF, image, or document file');
      return;
    }

    console.log(`📁 STANDALONE SUPPORTING DOC: Starting upload for file: ${file.name}`);
    
    setIsUploadingSupportDoc(true);
    setSupportDocUploadError(null);

    try {
      console.log(`📁 STANDALONE: Calling ChecklistService.uploadSupportingDocument() for general upload`);
      
      // Use a generic question ID for standalone uploads
      const standaloneQuestionId = `standalone-${Date.now()}`;
      
      // Upload supporting document to DigitalOcean Spaces via backend (supporting-docs/ folder)
      const uploadResult = await ChecklistService.uploadSupportingDocument(
        standaloneQuestionId,
        selectedVendorId,
        file
      );

      console.log('📁 STANDALONE: Upload successful:', uploadResult);
      console.log('📁 File stored in: supporting-docs/ folder');

      // Refresh the documents list from the database instead of just adding locally
      await loadVendorSupportingDocuments(selectedVendorId);
      
      // Clear form
      setSupportDocDescription('');
      setSupportDocCategory('');
      
      // Clear file input
      if (standaloneSupportDocRef.current) {
        standaloneSupportDocRef.current.value = '';
      }

      console.log('✅ Standalone supporting document uploaded successfully!');
      
    } catch (error) {
      console.error('❌ Error uploading standalone supporting document:', error);
      setSupportDocUploadError('Failed to upload supporting document. Please try again.');
    } finally {
      setIsUploadingSupportDoc(false);
    }
  };

  // Delete standalone supporting document
  const deleteStandaloneSupportDoc = (docId: string) => {
    setUploadedSupportingDocs(prev => prev.filter(doc => doc.id !== docId));
  };

  // Support document functions - COMPLETELY SEPARATE FROM CHECKLIST UPLOAD
  const handleSupportDocUpload = async (questionId: string, files: FileList) => {
    if (!files || files.length === 0) return;
    if (!selectedVendorId) {
      setSupportDocUploadError('Please select a vendor first');
      return;
    }

    const file = files[0];
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setSupportDocUploadError('Please upload a PDF, image, or document file');
      return;
    }

    console.log(`🔹 SUPPORTING DOCUMENT UPLOAD: Starting upload for question ${questionId}, file: ${file.name}`);
    
    setIsUploadingSupportDoc(true);
    setUploadingQuestionId(questionId);
    setSupportDocUploadError(null);

    try {
      console.log(`🔹 SUPPORTING DOCUMENT: Calling ChecklistService.uploadSupportingDocument()`);
      console.log(`🔹 API Call: POST /api/checklists/questions/${questionId}/documents/vendor/${selectedVendorId}`);
      
      // Upload supporting document to DigitalOcean Spaces via backend (supporting-docs/ folder)
      const uploadResult = await ChecklistService.uploadSupportingDocument(
        questionId,
        selectedVendorId,
        file
      );

      console.log('🔹 SUPPORTING DOCUMENT: Upload successful:', uploadResult);
      console.log('🔹 File stored in: supporting-docs/ folder');

      // Update question status and add file reference
      setExtractedQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              supportingDocs: [...(q.supportingDocs || []), file],
              status: q.status === 'pending' ? 'in-progress' : q.status
            }
          : q
      ));

      console.log('✅ Supporting document uploaded successfully to DigitalOcean Spaces!');
      
    } catch (error) {
      console.error('❌ Error uploading supporting document:', error);
      setSupportDocUploadError('Failed to upload supporting document. Please try again.');
    } finally {
      setIsUploadingSupportDoc(false);
      setUploadingQuestionId(null);
    }
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

  // Drag and drop handlers for CHECKLIST UPLOAD ONLY
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only activate drag for upload section
    if (activeSection === 'upload') {
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Only handle drop for checklist upload in upload section
    if (activeSection === 'upload' && e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files);
    }
  };

  // Delete checklist
  const deleteChecklist = async (checklist: ChecklistFile) => {
    if (!checklist.checklistId || !selectedVendorId) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${checklist.name}"?\n\nThis will permanently remove:\n• The checklist file\n• All ${checklist.questions.length} extracted questions\n• Any AI-generated answers\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      console.log(`🗑️ DELETING: Checklist ${checklist.checklistId}`);
      await ChecklistService.deleteChecklist(checklist.checklistId, selectedVendorId);
      
      // Remove from local state
      setChecklists(prev => prev.filter(c => c.id !== checklist.id));
      
      // Clear selected checklist if it was the deleted one
      if (selectedChecklist?.id === checklist.id) {
        setSelectedChecklist(null);
        setExtractedQuestions([]);
      }
      
      console.log(`✅ Successfully deleted checklist: ${checklist.name}`);
      
    } catch (error) {
      console.error('❌ Error deleting checklist:', error);
      setUploadError('Failed to delete checklist. Please try again.');
    }
  };

  // Helper function to group questions by checklist
  const groupQuestionsByChecklist = (questions: ExtractedQuestion[]) => {
    const grouped = questions.reduce((acc, question) => {
      const checklistId = question.checklistId || 'unknown';
      const checklistName = question.checklistName || 'Unknown Checklist';
      
      if (!acc[checklistId]) {
        acc[checklistId] = {
          id: checklistId,
          name: checklistName,
          questions: []
        };
      }
      
      acc[checklistId].questions.push(question);
      return acc;
    }, {} as Record<string, { id: string; name: string; questions: ExtractedQuestion[] }>);
    
    return Object.values(grouped);
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

                                {/* Loading Checklists */}
                {isLoadingChecklists && checklists.length === 0 && (
                  <div className="mt-8 flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />
                    <span className="text-lg text-gray-600">Loading existing checklists...</span>
                  </div>
                )}

                {/* Uploaded Checklists */}
                {checklists.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Uploaded Checklists
                      {isLoadingChecklists && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-2 inline" />
                      )}
                    </h3>
                    <div className="space-y-6">
                      {safeMap(checklists, (checklist: ChecklistFile) => (
                        <div 
                          key={checklist.id}
                          className={`p-6 border rounded-lg transition-colors ${
                            selectedChecklist?.id === checklist.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200'
                          }`}
                        >
                          {/* Checklist Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <FileCheck className="h-6 w-6 text-blue-600 mr-3" />
                              <div>
                                <span className="font-medium text-gray-900">{checklist.name}</span>
                                <p className="text-sm text-gray-500 mt-1">
                                  {checklist.questions.length > 0 
                                    ? `${checklist.questions.length} questions loaded` 
                                    : 'Questions ready to load'
                                  }
                                  {checklist.extractionStatus === 'completed' && (
                                    <span className="ml-2 inline-flex items-center text-xs">
                                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                      Stored securely
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {checklist.extractionStatus === 'extracting' && (
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                              )}
                              {checklist.extractionStatus === 'completed' && (
                                <>
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  <div className="flex items-center space-x-2">
                                    {/* Load Questions Button for existing checklists */}
                                    {checklist.questions.length === 0 && checklist.checklistId && (
                                      <button
                                        onClick={() => loadChecklistQuestions(checklist)}
                                        disabled={isLoadingChecklists}
                                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center text-sm"
                                        title="Load the extracted questions from this checklist to view and work with them"
                                      >
                                        {isLoadingChecklists ? (
                                          <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Loading...
                                          </>
                                        ) : (
                                          <>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Load Questions
                                          </>
                                        )}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => sendQuestionsToAI(checklist)}
                                      disabled={sendingToAI || !checklist.checklistId}
                                      className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center text-sm"
                                      title="Send questions to AI for automatic answer generation"
                                    >
                                      {sendingToAI ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          Sending to AI...
                                        </>
                                      ) : (
                                        <>
                                          <Bot className="h-4 w-4 mr-2" />
                                          Send to AI
                                        </>
                                      )}
                                    </button>
                                    {/* Delete Button */}
                                    <button
                                      onClick={() => deleteChecklist(checklist)}
                                      className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
                                      title="Permanently delete this checklist and all its data"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                              {checklist.extractionStatus === 'error' && (
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                          </div>

                          {/* Questions Preview */}
                          {checklist.questions.length > 0 && (
                            <div className="mt-4">
                              <button
                                onClick={() => {
                                  setSelectedChecklist(checklist);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 mb-3"
                              >
                                {selectedChecklist?.id === checklist.id ? 'Hide Questions' : 'View Questions'} 
                                ({checklist.questions.length})
                              </button>
                              
                              {selectedChecklist?.id === checklist.id && (
                                <div className="border-t pt-4 space-y-3 max-h-60 overflow-y-auto">
                                  {safeMap(checklist.questions.slice(0, 5), (question: ExtractedQuestion, index) => (
                                    <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
                                      <p className="text-sm text-gray-900 font-medium">
                                        {index + 1}. {question.text}
                                      </p>
                                      {question.requiresDoc && (
                                        <p className="text-xs text-orange-600 mt-1">
                                          📎 Requires supporting document
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                  {checklist.questions.length > 5 && (
                                    <p className="text-sm text-gray-500 text-center">
                                      ... and {checklist.questions.length - 5} more questions
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
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
                      {extractedQuestions.filter(q => q.status === 'pending').length > 0 && !isGeneratingAnswers && (
                        <div className="pt-4 border-t border-purple-200">
                          <button
                            onClick={() => generateAllPendingAnswers()}
                            disabled={!selectedVendorId}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center mx-auto"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Generate All Answers ({extractedQuestions.filter(q => q.status === 'pending').length})
                          </button>
                        </div>
                      )}

                      {/* Create Questionnaire Button */}
                      {extractedQuestions.filter(q => q.status === 'completed' && q.answer).length > 0 && !isGeneratingAnswers && (
                        <div className="pt-4 border-t border-purple-200">
                          <button
                            onClick={() => createQuestionnaireFromAI()}
                            disabled={!selectedVendorId || sendingToAI}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center mx-auto"
                          >
                            {sendingToAI ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Creating Questionnaire...
                              </>
                            ) : (
                              <>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Create Questionnaire ({extractedQuestions.filter(q => q.status === 'completed' && q.answer).length} answers)
                              </>
                            )}
                          </button>
                          <p className="text-sm text-center text-gray-600 mt-2">
                            This will create an interactive questionnaire with your AI-generated answers
                          </p>
                        </div>
                      )}
                      </div>
                      
                    {/* Questions grouped by checklist */}
                    <div className="space-y-8">
                      {groupQuestionsByChecklist(extractedQuestions).map(checklistGroup => (
                        <div key={checklistGroup.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {/* Checklist Header */}
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <FileCheck className="h-6 w-6 text-purple-600 mr-3" />
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{checklistGroup.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    {checklistGroup.questions.length} questions • 
                                    <span className="ml-1 text-green-600 font-medium">
                                      {checklistGroup.questions.filter(q => q.status === 'completed').length} completed
                                    </span> • 
                                    <span className="ml-1 text-yellow-600 font-medium">
                                      {checklistGroup.questions.filter(q => q.status === 'pending').length} pending
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {Math.round((checklistGroup.questions.filter(q => q.status === 'completed').length / checklistGroup.questions.length) * 100)}% complete
                                </span>
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${(checklistGroup.questions.filter(q => q.status === 'completed').length / checklistGroup.questions.length) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Questions in this checklist */}
                          <div className="divide-y divide-gray-100">
                            {safeMap(checklistGroup.questions, (question: ExtractedQuestion) => (
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
                              onClick={() => generateSingleAIAnswer(question)}
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
                                onClick={() => generateSingleAIAnswer(question)}
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
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Supporting Documents - INDEPENDENT UPLOAD SYSTEM */}
          {activeSection === 'docs' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <FolderOpen className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Supporting Documents</h2>
                  <p className="text-lg text-gray-600">Upload and manage supporting documents independently</p>

                </div>

                {/* Supporting Document Upload Error */}
                {supportDocUploadError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{supportDocUploadError}</p>
                  </div>
                )}

                {/* Standalone Upload Form */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Upload className="h-6 w-6 mr-3 text-green-600" />
                    Upload Supporting Documents
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., Security policy document, Compliance certificate..."
                        value={supportDocDescription}
                        onChange={(e) => setSupportDocDescription(e.target.value)}
                        disabled={isUploadingSupportDoc}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category (Optional)
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={supportDocCategory}
                        onChange={(e) => setSupportDocCategory(e.target.value)}
                        disabled={isUploadingSupportDoc}
                      >
                        <option value="">Select category</option>
                        <option value="Security">Security</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Privacy">Privacy</option>
                        <option value="Policies">Policies</option>
                        <option value="Certificates">Certificates</option>
                        <option value="Evidence">Evidence</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      ref={standaloneSupportDocRef}
                      type="file"
                      className="hidden"
                      id="standalone-support-doc"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                      onChange={(e) => e.target.files && handleStandaloneSupportDocUpload(e.target.files)}
                      disabled={isUploadingSupportDoc}
                    />
                    <label
                      htmlFor="standalone-support-doc"
                      className={`inline-flex items-center px-6 py-3 rounded-lg cursor-pointer transition-colors font-medium ${
                        isUploadingSupportDoc
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {isUploadingSupportDoc ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Uploading to supporting-docs/...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          Choose & Upload File
                        </>
                      )}
                    </label>
                    
                    <div className="text-sm text-gray-500">
                      Supports: PDF, Images, DOC, DOCX, TXT
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                <div className="bg-white border border-gray-200 rounded-xl">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Files className="h-5 w-5 mr-2 text-gray-600" />
                      Uploaded Supporting Documents
                      <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {uploadedSupportingDocs.length}
                      </span>
                    </h3>
                  </div>

                  {uploadedSupportingDocs.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-600 mb-2">No Documents Uploaded Yet</h4>
                      <p className="text-gray-500">Start by uploading your first supporting document above</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {uploadedSupportingDocs.map((doc) => (
                        <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="flex-shrink-0 mt-1">
                                <FileText className="h-5 w-5 text-green-600" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {doc.originalName}
                                </h4>
                                
                                {doc.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {doc.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center space-x-4 mt-2">
                                  {doc.category && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {doc.category}
                                    </span>
                                  )}
                                  
                                  <span className="text-xs text-gray-500">
                                    {(doc.fileSize / 1024).toFixed(1)} KB
                                  </span>
                                  
                                  <span className="text-xs text-gray-500">
                                    {doc.uploadDate.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              {doc.spacesUrl && (
                                <a
                                  href={doc.spacesUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                                >
                                  View
                                </a>
                              )}
                              
                              <button
                                onClick={() => deleteStandaloneSupportDoc(doc.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Question-Based Documents (if any exist) */}
                {extractedQuestions.length > 0 && extractedQuestions.some(q => q.requiresDoc || q.docDescription) && (
                  <div className="mt-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ClipboardList className="h-5 w-5 mr-2 text-blue-600" />
                        Question-Specific Document Requirements
                      </h3>
                      <p className="text-sm text-blue-700 mb-4">
                        Some questions from your uploaded checklist require specific supporting documents:
                      </p>
                      
                      <div className="space-y-4">
                        {extractedQuestions
                          .filter(q => q.requiresDoc || q.docDescription)
                          .map((question) => (
                          <div 
                            key={question.id}
                            className="bg-white border border-blue-200 rounded-lg p-4"
                          >
                            <h4 className="text-sm font-medium text-gray-800 mb-2">{question.text}</h4>
                            
                            {question.docDescription && (
                              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-3">
                                <p className="text-yellow-800 text-sm">
                                  <strong>Required:</strong> {question.docDescription}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                className="hidden"
                                id={`support-doc-${question.id}`}
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                                onChange={(e) => e.target.files && handleSupportDocUpload(question.id, e.target.files)}
                                disabled={isUploadingSupportDoc && uploadingQuestionId === question.id}
                              />
                              <label
                                htmlFor={`support-doc-${question.id}`}
                                className={`inline-flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                  isUploadingSupportDoc && uploadingQuestionId === question.id
                                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {isUploadingSupportDoc && uploadingQuestionId === question.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload for This Question
                                  </>
                                )}
                              </label>
                              
                              {question.supportingDocs && question.supportingDocs.length > 0 && (
                                <span className="text-sm text-green-600 font-medium">
                                  ✓ {question.supportingDocs.length} file(s) uploaded
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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