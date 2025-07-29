"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { getApiEndpoint } from "@/lib/api";
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
  ChevronRight,
  Trash2,
  Eye,
  Send,
  BarChart3
} from "lucide-react";
import Header from '@/components/Header';
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import { vendors as vendorAPI } from '@/lib/api';
import { safeMap } from '@/lib/utils/arrayUtils';
import { ChecklistService } from '@/lib/services/checklistService';
import { showToast } from '@/components/ui/Toast';
import { AIService } from '@/lib/services/aiService';
import ChatbotAssistance from '@/components/help/ChatbotAssistance';
import { EvidenceFilePreview } from '@/components/questionnaire/EvidenceFilePreview';
import { TextFileViewer } from '@/components/questionnaire/TextFileViewer';
import { EvidenceSelectionModal } from '@/components/modals/EvidenceSelectionModal';
import { DocumentRelevanceModal } from '@/components/modals/DocumentRelevanceModal';

interface ExtractedQuestion {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'completed' | 'needs-support' | 'done' | 'edit';
  answer?: string;
  confidence?: number;
  requiresDoc?: boolean;
  docDescription?: string;
  supportingDocs?: File[];
  checklistId?: string;
  checklistName?: string;
  isDone?: boolean;
  isEditing?: boolean;
}

interface ChecklistFile {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  questions: ExtractedQuestion[];
  extractionStatus: 'uploading' | 'extracting' | 'completed' | 'error';
  checklistId?: string;
  sentToTrustPortal?: boolean;
  trustPortalSubmissionDate?: Date;
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
  questionId?: string; // Link to question
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

const QuestionnairesContent = () => {
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
  
  // Manual question states
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [manualQuestionText, setManualQuestionText] = useState('');
  const [manualQuestionRequiresDoc, setManualQuestionRequiresDoc] = useState(false);
  const [manualQuestionDocDescription, setManualQuestionDocDescription] = useState('');
  const [isAddingManualQuestion, setIsAddingManualQuestion] = useState(false);
  
  // Question expansion states
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  
  // Independent supporting documents state
  const [uploadedSupportingDocs, setUploadedSupportingDocs] = useState<UploadedSupportingDocument[]>([]);
  const [supportDocDescription, setSupportDocDescription] = useState('');
  const [supportDocCategory, setSupportDocCategory] = useState('');
  
  // Evidence files state
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [evidenceUploadError, setEvidenceUploadError] = useState<string | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceCategory, setEvidenceCategory] = useState('');
  const evidenceFileRef = useRef<HTMLInputElement>(null);
  
  // Evidence selection modal state
  const [showEvidenceSelectionModal, setShowEvidenceSelectionModal] = useState(false);
  const [pendingGenerationRequest, setPendingGenerationRequest] = useState<{
    checklistId: string;
    vendorId: string;
    question?: string;
  } | null>(null);
  
  // AI processing states
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, currentQuestion: '' });
  
  // Document generation states
  const [showGenerateDocModal, setShowGenerateDocModal] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [generateDocTitle, setGenerateDocTitle] = useState('');
  const [generateDocInstructions, setGenerateDocInstructions] = useState('');
  const [generateDocCategory, setGenerateDocCategory] = useState('');
  const [generateDocQuestionId, setGenerateDocQuestionId] = useState<string | null>(null);
  const [documentGenerationError, setDocumentGenerationError] = useState<string | null>(null);
  

  

  
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

  // Add state for "Generate Responses" functionality
  const [sendingToAI, setSendingToAI] = useState(false);
  
  // NEW: Add state for trust portal functionality
  const [sendingToTrustPortal, setSendingToTrustPortal] = useState(false);
  const [sendingQuestionId, setSendingQuestionId] = useState<string | null>(null);
  const [sendingDocumentId, setSendingDocumentId] = useState<string | null>(null);
  const [trustPortalProgress, setTrustPortalProgress] = useState({ current: 0, total: 0, item: '' });
  
  // Follow-up modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    isFollowUp: false,
    followUpType: 'initial' as string,
    followUpReason: '',
    parentSubmissionId: null as number | null
  });
  const [pendingSubmissionData, setPendingSubmissionData] = useState<any>(null);
  
  // File refs
  const checklistFileRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const standaloneSupportDocRef = useRef<HTMLInputElement>(null);

  // New component states
  const [showEvidencePreview, setShowEvidencePreview] = useState(false);
  const [pendingEvidenceFiles, setPendingEvidenceFiles] = useState<any[]>([]);
  const [showTextViewer, setShowTextViewer] = useState(false);
  const [textViewerData, setTextViewerData] = useState<{file?: File, url?: string, filename?: string}>({});

  const { isLoading: authLoading } = useAuthGuard();
  const { token } = useAuth();

  // Document relevance modal state
  const [showRelevanceModal, setShowRelevanceModal] = useState(false);
  const [relevanceResult, setRelevanceResult] = useState<any>(null);
  const [pendingUpload, setPendingUpload] = useState<{
    questionId: string;
    file: File;
  } | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Separate effect for loading vendors after authentication is ready
  useEffect(() => {
    if (!authLoading && hasMounted) {
      // Load vendors when auth is ready (token will be handled by apiCall)
      loadVendors();
    }
  }, [authLoading, hasMounted]);

  // Load vendor-specific data when vendor is selected
  useEffect(() => {
    if (selectedVendorId && selectedVendorId.trim() !== '') {
      loadVendorData();
    }
  }, [selectedVendorId]);

  // New function to load all checklist questions for AI Questionnaire section
  const loadAllVendorQuestionsForAI = async (vendorId: string) => {
    if (!vendorId || !isValidUUID(vendorId)) return;
    
    try {
      console.log(`🤖 AI QUESTIONNAIRE: Loading all questions for vendor ${vendorId}`);
      
      // Get all checklists for this vendor
      const vendorChecklists = await ChecklistService.getVendorChecklists(vendorId);
      console.log(`🤖 AI QUESTIONNAIRE: Found ${vendorChecklists.length} checklists`);
      
      // Load questions from all checklists
      const allQuestions: ExtractedQuestion[] = [];
      
      for (const checklist of vendorChecklists) {
        try {
          const questions = await ChecklistService.getChecklistQuestions(checklist.id, vendorId);
          
          // Convert to our format and check for saved "done" status from vendor_questionnaire_answers
          const convertedQuestions: ExtractedQuestion[] = await Promise.all(questions.map(async (q) => {
            // Check if this question has a saved answer in vendor_questionnaire_answers
            let savedAnswer = null;
            let isDone = false;
            let answerStatus: 'pending' | 'in-progress' | 'completed' | 'needs-support' | 'done' | 'edit' = q.aiAnswer ? 'completed' : 'pending';
            
            try {
              const vendorIdInteger = await getVendorIdFromUuid(selectedVendorId);
              if (vendorIdInteger) {
                const baseUrl = getApiBaseUrl();
                const response = await fetch(`${baseUrl}/api/questionnaires/vendor/${vendorIdInteger}/answers/${q.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (response.ok) {
                  const data = await response.json();
                  savedAnswer = data.answer;
                  isDone = savedAnswer.status === 'done' || savedAnswer.status === 'completed';
                  // Map database status to frontend status types
                  if (savedAnswer.status === 'done') {
                    answerStatus = 'done';
                  } else if (savedAnswer.status === 'completed') {
                    answerStatus = 'completed';
                  } else if (savedAnswer.status === 'pending') {
                    answerStatus = 'pending';
                  } else if (savedAnswer.status === 'in-progress') {
                    answerStatus = 'in-progress';
                  } else if (savedAnswer.status === 'needs-support') {
                    answerStatus = 'needs-support';
                  }
                }
              }
            } catch (error) {
              console.log('No saved answer found for question:', q.id);
            }
            
            return {
              id: q.id,
              text: q.questionText,
              status: q.aiAnswer ? 'done' : 'pending', // Auto-mark as done if AI answer exists
              answer: q.aiAnswer || '',
              confidence: q.confidenceScore,
              requiresDoc: q.requiresDocument,
              docDescription: q.documentDescription,
              checklistId: q.checklistId,
              checklistName: checklist.name,
              isDone: !!q.aiAnswer, // Auto-done if AI answer exists
              isEditing: false
            };
          }));
          
          allQuestions.push(...convertedQuestions);
          
        } catch (error) {
          console.error(`Failed to load questions for checklist ${checklist.id}:`, error);
        }
      }
      
      console.log(`🤖 AI QUESTIONNAIRE: Loaded ${allQuestions.length} total questions`);
      
      // Set the questions for AI Questionnaire section
      setExtractedQuestions(allQuestions);
      
      // Also update questionnaire answers from backend
      await loadVendorQuestionnaireAnswers(vendorId);
      
    } catch (error) {
      console.error('Error loading vendor questions for AI:', error);
    }
  };

  // New function to load all vendor-specific data
  const loadVendorData = async () => {
    if (!selectedVendorId) return;
    
    try {
      setIsLoadingChecklists(true);
      
      // Load checklists from bucket and database
      await loadVendorChecklists(selectedVendorId);
      
      // Load ALL questions for AI Questionnaire section automatically
      await loadAllVendorQuestionsForAI(selectedVendorId);
      
      // Sync any existing checklist questions to questionnaire system
      await syncChecklistToQuestionnaire(selectedVendorId);
      
      // Load supporting documents
      await loadVendorSupportingDocuments(selectedVendorId);
      
      // Load evidence files
      await loadVendorEvidenceFiles(selectedVendorId);
      
    } catch (error) {
      console.error('Error loading vendor data:', error);
      setUploadError('Failed to load vendor data');
    } finally {
      setIsLoadingChecklists(false);
    }
  };

  // Helper function to get the correct API base URL
  const getApiBaseUrl = () => {
    // Use the getApiEndpoint function but just return the base URL part
    const fullEndpoint = getApiEndpoint('/api/checklists');
    return fullEndpoint.replace('/api/checklists', '');
  };

  // New function to sync checklist questions to questionnaire system
  // Note: This functionality will be handled by the backend questionnaires service
  const syncChecklistToQuestionnaire = async (vendorId: string, checklistId?: string) => {
    try {
      console.log(`🔄 Auto-sync will be handled by backend questionnaires service for vendor ${vendorId}`);
      // For now, we'll rely on the backend's existing questionnaire management
      // The backend already has endpoints to manage questionnaires and answers
    } catch (error) {
      console.error('Error syncing checklist to questionnaire:', error);
    }
  };

  // New function to load questionnaire answers from database
  const loadVendorQuestionnaireAnswers = async (vendorId: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      // Convert UUID to vendor ID for backend call
      const vendorIdInteger = await getVendorIdFromUuid(vendorId);
      if (!vendorIdInteger) {
        console.error('Could not convert vendor UUID to ID');
        return;
      }
      
      // Use the correct backend endpoint
      const response = await fetch(`${baseUrl}/api/questionnaires/vendor/${vendorIdInteger}/with-answers`);
      if (response.ok) {
        const data = await response.json();
        const questionnaires = data.questionnaires || [];
        
        console.log('✅ Loaded questionnaires with answers:', questionnaires);
        
        // Extract answers from questionnaires and update extracted questions
        const allAnswers: any[] = [];
        questionnaires.forEach((q: any) => {
          if (q.questions && Array.isArray(q.questions)) {
            q.questions.forEach((question: any) => {
              if (question.answer) {
                allAnswers.push({
                  questionId: question.id || question.questionId,
                  question: question.questionText || question.question,
                  answer: question.answer,
                  status: 'completed'
                });
              }
            });
          }
        });
        
        if (allAnswers.length > 0) {
          console.log('📊 Found saved answers:', allAnswers);
          setExtractedQuestions(prev => {
            const answerMap = new Map(allAnswers.map((a: any) => [a.questionId, a]));
            
            return prev.map(q => {
              const savedAnswer = answerMap.get(q.id);
              if (savedAnswer && savedAnswer.answer) {
                return {
                  ...q,
                  answer: savedAnswer.answer,
                  status: 'completed',
                  isDone: true
                };
              }
              return q;
            });
          });
        }
      } else {
        console.log('No existing questionnaires found for vendor');
      }
    } catch (error) {
      console.error('Error loading questionnaire answers:', error);
    }
  };

  // Helper function to convert vendor UUID to integer ID (for backend compatibility)
  const getVendorIdFromUuid = async (vendorUuid: string): Promise<number | null> => {
    // If it's already a number, return it
    if (/^\d+$/.test(vendorUuid)) {
      return parseInt(vendorUuid);
    }
    
    try {
      console.log('🔍 UUID->ID: Converting vendor UUID to ID:', vendorUuid);
      
      // Get auth token and user data
      const authToken = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (!authToken || !userData) {
        console.error('❌ UUID->ID: No authentication data found');
        return null;
      }
      
      // Parse user data to get organization ID
      let organizationId: string;
      try {
        const user = JSON.parse(userData);
        organizationId = user.organization_id;
        
        if (!organizationId) {
          console.error('❌ UUID->ID: No organization ID found in user data');
          return null;
        }
        
        console.log('✅ UUID->ID: Using organization ID:', organizationId);
      } catch (parseError) {
        console.error('❌ UUID->ID: Failed to parse user data:', parseError);
        return null;
      }
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Build URL with organization filtering
      const baseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      params.append('organization_id', organizationId);
      const url = `${baseUrl}/api/vendors?${params.toString()}`;
      
      console.log('🔍 UUID->ID: Making authenticated API call to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        console.error('❌ UUID->ID: API call failed:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('📊 UUID->ID: API response:', data);
      
      // Handle different response formats
      let vendors: any[] = [];
      if (data.success && data.data) {
        vendors = data.data;
      } else if (Array.isArray(data)) {
        vendors = data;
      } else if (data.vendors) {
        vendors = data.vendors;
      } else {
        console.error('❌ UUID->ID: Unexpected response format:', data);
        return null;
      }
      
      if (Array.isArray(vendors)) {
        const vendor = vendors.find((v: any) => v.uuid === vendorUuid);
        if (vendor) {
          // Try different possible field names for the numeric vendor ID
          const vendorId = vendor.vendorId || vendor.vendor_id || vendor.id;
          console.log('✅ UUID->ID conversion successful:', {
            uuid: vendorUuid,
            found: vendor.companyName || vendor.company_name || vendor.name,
            vendorId: vendorId,
            allFields: Object.keys(vendor)
          });
          return vendorId ? parseInt(vendorId.toString()) : null;
        } else {
          console.warn('⚠️ UUID->ID: Vendor not found with UUID:', vendorUuid);
          console.log('Available vendors:', vendors.map(v => ({ uuid: v.uuid, name: v.companyName || v.company_name || v.name })));
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ UUID->ID: Error converting vendor UUID to ID:', error);
      return null;
    }
  };

  // New function to save questionnaire answer to database
  const saveQuestionnaireAnswer = async (question: ExtractedQuestion) => {
    if (!selectedVendorId || !question.answer) return;
    
    try {
      const baseUrl = getApiBaseUrl();
      const vendorIdInteger = await getVendorIdFromUuid(selectedVendorId);
      if (!vendorIdInteger) {
        console.error('Could not convert vendor UUID to ID');
        return;
      }
      
      console.log('💾 SAVING: Question answer to database', {
        questionId: question.id,
        vendorId: vendorIdInteger,
        status: question.status,
        isDone: question.isDone
      });
      
      // Save or update the answer in vendor_questionnaire_answers table
      const answerData = {
        vendor_id: vendorIdInteger,
        question_id: question.id,
        question: question.text,
        answer: question.answer,
        status: question.isDone ? 'done' : question.status,
        question_title: question.checklistName || 'Questionnaire'
      };
      
      // Check if answer already exists
      const checkResponse = await fetch(`${baseUrl}/api/questionnaires/vendor/${vendorIdInteger}/answers/${question.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      let method = 'POST';
      let endpoint = `${baseUrl}/api/questionnaires/vendor/${vendorIdInteger}/answers`;
      
      if (checkResponse.ok) {
        // Answer exists, update it
        method = 'PUT';
        endpoint = `${baseUrl}/api/questionnaires/vendor/${vendorIdInteger}/answers/${question.id}`;
      }
      
      const saveResponse = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData),
      });
      
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to save answer');
      }
      
      console.log('✅ Successfully saved question answer to database');
      
      // First, check if a questionnaire exists for this vendor
      let questionnaire: any = null;
      try {
        const getResponse = await fetch(`${baseUrl}/api/questionnaires/vendor/${vendorIdInteger}`);
        if (getResponse.ok) {
          const data = await getResponse.json();
          const questionnaires = data.questionnaires || [];
          // Find a questionnaire with the same checklist name, or use the first one
          questionnaire = questionnaires.find((q: any) => 
            q.title === (question.checklistName || 'AI Generated Questionnaire')
          ) || questionnaires[0];
        }
      } catch (error) {
        console.log('No existing questionnaire found, will create new one');
      }
      
      if (!questionnaire) {
        // Create new questionnaire with proper DTO format
        const createResponse = await fetch(`${baseUrl}/api/questionnaires`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: question.checklistName || 'AI Generated Questionnaire',
            vendorId: vendorIdInteger,
            questions: [{
              questionText: question.text,
              questionOrder: 1,
              isRequired: false
            }],
            generateAnswers: false
          })
        });
        
        if (createResponse.ok) {
          const createData = await createResponse.json();
          questionnaire = createData.questionnaire;
          console.log('✅ Created new questionnaire:', questionnaire);
        } else {
          const errorText = await createResponse.text();
          console.error('❌ Failed to create questionnaire:', errorText);
          return;
        }
      }
      
      // Save the answer to the questionnaire
      if (questionnaire && questionnaire.id) {
        const saveResponse = await fetch(`${baseUrl}/api/questionnaires/${questionnaire.id}/vendor/${vendorIdInteger}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{
            question: question.text,
            answer: question.answer
          }])
        });
        
        if (saveResponse.ok) {
          console.log('✅ Saved answer to database for question:', question.id);
        } else {
          const errorText = await saveResponse.text();
          console.error('❌ Failed to save answer:', errorText);
        }
      }
    } catch (error) {
      console.error('❌ Error saving questionnaire answer:', error);
    }
  };



  // New function to toggle edit mode
  const toggleEditMode = (questionId: string) => {
    setExtractedQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, isEditing: !q.isEditing, isDone: false, status: 'edit' }
        : q
    ));
  };

  // New function to update question answer
  const updateQuestionAnswer = async (questionId: string, newAnswer: string) => {
    const question = extractedQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    setExtractedQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, answer: newAnswer, status: 'in-progress' }
        : q
    ));
    
    // Save to database
    await saveQuestionnaireAnswer({
      ...question,
      answer: newAnswer,
      status: 'in-progress'
    });
  };

  const loadVendors = async () => {
    try {
      setIsLoadingVendors(true);
      setUploadError(null);
      
      console.log('🔍 VENDORS: Starting to load vendors...');
      
      // Check authentication status first
      const authToken = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      console.log('🔐 AUTH CHECK (Required for vendors):', {
        hasToken: !!authToken,
        hasUserData: !!userData,
        tokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'NO TOKEN',
        isAuthenticated: !!authToken && !!userData,
        note: 'Authentication required for vendor access but services remain public'
      });

      // If no authentication, show a helpful error for vendor access
      if (!authToken) {
        console.error('❌ VENDORS: No authentication token found');
        setUploadError('Authentication required to access vendors. Please log in to select a vendor and use questionnaire features.');
        
        // Don't redirect, just show the error - services can still work without vendor selection
        setVendors([]);
        return;
      }

      // Validate token format
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        const now = Date.now() / 1000;
        
        if (payload.exp <= now) {
          console.error('❌ VENDORS: Authentication token is expired');
          setUploadError('Your session has expired. Please log in again to access vendors.');
          setVendors([]);
          return;
        }
        
        console.log('✅ VENDORS: Token is valid, expires at:', new Date(payload.exp * 1000));
      } catch (tokenError) {
        console.error('❌ VENDORS: Invalid token format:', tokenError);
        setUploadError('Invalid authentication token. Please log in again to access vendors.');
        setVendors([]);
        return;
      }

      console.log('🔍 VENDORS: Making API call to load vendors...');
      
      // Parse user data to get organization ID
      let organizationId: string;
      try {
        const user = JSON.parse(userData!);
        const userOrgId = user.organization_id;
        
        if (!userOrgId) {
          console.error('❌ VENDORS: No organization ID found in user data');
          setUploadError('User account is not associated with an organization. Please contact support.');
          setVendors([]);
          return;
        }
        
        organizationId = userOrgId;
        
        console.log('✅ VENDORS: Using organization ID:', organizationId);
      } catch (parseError) {
        console.error('❌ VENDORS: Failed to parse user data:', parseError);
        setUploadError('Invalid user data. Please log in again.');
        setVendors([]);
        return;
      }
      
      const response = await vendorAPI.getAll();
      
      console.log('📊 VENDORS: API Response:', {
        success: response?.success,
        dataLength: response?.data?.length,
        hasData: !!response?.data,
        responseType: typeof response,
        organizationId: organizationId
      });

      if (response?.success && response?.data) {
        setVendors(response.data);
        console.log(`✅ VENDORS: Successfully loaded ${response.data.length} vendors`);
      } else if (response?.data && Array.isArray(response.data)) {
        // Handle case where response doesn't have success flag but has data
        setVendors(response.data);
        console.log(`✅ VENDORS: Successfully loaded ${response.data.length} vendors (fallback format)`);
      } else {
        console.warn('⚠️ VENDORS: Unexpected response format:', response);
        setVendors([]);
        setUploadError('No vendors found or unexpected response format.');
      }
    } catch (error: any) {
      console.error('❌ VENDORS: Error loading vendors:', error);
      
      // Handle specific error types
      if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        setUploadError('Network error. Please check your connection and try again.');
      } else {
        setUploadError(`Failed to load vendors: ${error.message || 'Unknown error'}`);
      }
      
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

  // Load supporting documents for selected vendor and link them to questions
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
        category: 'General', // Default category
        questionId: doc.questionId // Store the question relationship
      }));
      
      setUploadedSupportingDocs(convertedDocs);
      
      // Update questions with their associated documents
      setExtractedQuestions(prev => prev.map(question => ({
        ...question,
        supportingDocs: convertedDocs
          .filter(doc => doc.questionId === question.id)
          .map(doc => ({
            name: doc.filename,
            size: doc.fileSize,
            type: doc.fileType
          })) as File[]
      })));
      
      console.log(`📁 LOADING: Successfully loaded ${convertedDocs.length} supporting documents and linked to questions`);
      
    } catch (error) {
      console.error('❌ Error loading supporting documents:', error);
      setUploadedSupportingDocs([]);
    }
  };

  // Load checklists when vendor is selected
  useEffect(() => {
    if (selectedVendorId && isValidUUID(selectedVendorId)) {
      // Clear previous vendor's data first
      setExtractedQuestions([]);
      setChecklists([]);
      setSelectedChecklist(null);
      setUploadedSupportingDocs([]);
      
      // Load all data for the new vendor
      loadVendorData();
    } else {
      // Clear all data when no vendor is selected
      setExtractedQuestions([]);
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
      setUploadError(`File type "${fileExtension}" is not supported. Please upload a document in one of these formats: PDF (recommended), TXT, DOC, or DOCX. PDFs provide the best content extraction for compliance checking.`);
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
      
      // Upload to backend and extract questions (goes to checklists/ folder in bucket)
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
        checklistName: file.name,
        isDone: false,
        isEditing: false
      }));

      // Update checklist with extracted questions and database ID
      newChecklist.questions = extractedQuestions;
      newChecklist.extractionStatus = 'completed';
      newChecklist.checklistId = uploadResponse.checklist.id;
      
      setChecklists(prev => prev.map(c => c.id === newChecklist.id ? newChecklist : c));
      
      // Refresh the AI Questionnaire section with ALL vendor questions (including the new one)
      await loadAllVendorQuestionsForAI(selectedVendorId);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadError('Failed to process the uploaded file. This could be due to file corruption, unsupported content, or network issues. Please ensure your file is valid and try again. For best results, use PDF format.');
      
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
        checklistName: checklist.name,
        isDone: q.status === 'completed' || (q.status as string) === 'done' // Ensure isDone is set properly
      }));

      // Set questions for AI section
      setExtractedQuestions(questionsForAI);
      
      // Switch to AI section
      setActiveSection('ai');
      
      // Auto-generate AI answers for pending questions
      const pendingQuestions = questionsForAI.filter(q => q.status === 'pending');
      if (pendingQuestions.length > 0) {
        await showEvidenceSelectionIfNeeded(checklist.checklistId, selectedVendorId);
      }
      
    } catch (error) {
      console.error('Error sending questions to AI:', error);
      setUploadError('Failed to send questions to AI. Please try again.');
    } finally {
      setSendingToAI(false);
    }
  };

  // Show evidence selection modal if evidence files exist, otherwise proceed directly
  const showEvidenceSelectionIfNeeded = async (checklistId: string, vendorId: string, question?: string) => {
    try {
      // Check if there are evidence files for this vendor
      if (evidenceFiles.length > 0) {
        // Show evidence selection modal
        setPendingGenerationRequest({ checklistId, vendorId, question });
        setShowEvidenceSelectionModal(true);
      } else {
        // No evidence files, proceed directly with generation
        await generateAIResponsesFromDatabase(checklistId, vendorId);
      }
    } catch (error) {
      console.error('Error checking evidence files:', error);
      // On error, proceed without evidence files
      await generateAIResponsesFromDatabase(checklistId, vendorId);
    }
  };

  // Handle evidence file selection confirmation
  const handleEvidenceSelectionConfirm = async (selectedFileIds: string[]) => {
    setShowEvidenceSelectionModal(false);
    
    if (pendingGenerationRequest) {
      const { checklistId, vendorId, question } = pendingGenerationRequest;
      setPendingGenerationRequest(null);
      
      if (question) {
        // This is for single question generation
        const questionObj = extractedQuestions.find(q => q.text === question);
        if (questionObj) {
          await generateSingleAIAnswerWithEvidence(questionObj, selectedFileIds);
        }
      } else {
        // This is for batch generation
        await generateAIResponsesFromDatabase(checklistId, vendorId, selectedFileIds);
      }
    }
  };

  // Handle evidence selection modal cancel
  const handleEvidenceSelectionCancel = () => {
    setShowEvidenceSelectionModal(false);
    setPendingGenerationRequest(null);
  };

  // Show evidence selection for single question generation
  const showEvidenceSelectionForSingleQuestion = async (question: ExtractedQuestion) => {
    try {
      // Check if there are evidence files for this vendor
      if (evidenceFiles.length > 0) {
        // Show evidence selection modal for single question
        setPendingGenerationRequest({ 
          checklistId: question.checklistId || '', 
          vendorId: selectedVendorId, 
          question: question.text 
        });
        setShowEvidenceSelectionModal(true);
      } else {
        // No evidence files, proceed directly with generation
        await generateSingleAIAnswer(question);
      }
    } catch (error) {
      console.error('Error checking evidence files for single question:', error);
      // On error, proceed without evidence files
      await generateSingleAIAnswer(question);
    }
  };

  // Generate single AI answer with selected evidence files
  const generateSingleAIAnswerWithEvidence = async (question: ExtractedQuestion, selectedFileIds: string[]) => {
    // For now, we'll modify the existing generateSingleAIAnswer to accept selected evidence files
    // In the future, this could be enhanced to use the backend API with selected evidence files
    await generateSingleAIAnswer(question, selectedFileIds);
  };

  // Generate AI responses using database integration
  const generateAIResponsesFromDatabase = async (checklistId: string, vendorId: string, selectedEvidenceFiles?: string[]) => {
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
      
      // Generate answers using the checklist service with selected evidence files
      const response = await ChecklistService.generateAllPendingAnswers(
        vendorId, 
        'Security compliance questionnaire', 
        checklistId, 
        selectedEvidenceFiles
      );
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
            checklistName: 'Current Checklist', // We'll improve this with proper mapping later
            isDone: q.status === 'completed' || (q.status as string) === 'done' // Ensure isDone is set properly
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

  // Generate AI answer for a single question with enhanced evidence context
  const generateSingleAIAnswer = async (question: ExtractedQuestion, selectedEvidenceFiles?: string[]) => {
    setIsGeneratingAnswers(true);
    setGenerationProgress({ current: 0, total: 1, currentQuestion: question.text });

    try {
      // Update question status to in-progress
      setExtractedQuestions(prev => prev.map(q => 
        q.id === question.id ? { ...q, status: 'in-progress' } : q
      ));

      // Enhanced context generation with evidence files
      let enhancedContext = 'Security compliance questionnaire';
      
      // Add evidence file context if available
      if (evidenceFiles.length > 0) {
        const evidenceContext = evidenceFiles.map(file => 
          `Evidence: ${file.originalFilename} (${file.category || 'General'})${file.description ? ' - ' + file.description : ''}`
        ).join('. ');
        
        enhancedContext += '. Available evidence files: ' + evidenceContext + '. Please reference relevant evidence when applicable.';
      }

      // Add checklist context if available
      if (question.checklistName) {
        enhancedContext += ` Source: ${question.checklistName}.`;
      }

      // Use the backend API for generating individual answers with database persistence
      if (question.checklistId && selectedVendorId) {
        try {
          // Try to update the question in the database using the checklist service
          const updateResponse = await ChecklistService.updateQuestion(
            question.id,
            selectedVendorId,
            { status: 'in-progress' }
          );
          
          console.log('Updated question status to in-progress');
        } catch (dbError) {
          console.warn('Failed to update question status in database:', dbError);
        }
      }

      // Fallback: Generate answer using individual API call with enhanced context
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.text,
          context: enhancedContext,
          vendorId: selectedVendorId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Post-process the answer to ensure quality
      let processedAnswer = data.answer;
      
      // Boost confidence if evidence files are available
      const enhancedConfidence = Math.min((data.confidence || 0.8) + (evidenceFiles.length > 0 ? 0.1 : 0), 1.0);
      
      // Update question with enhanced AI answer
      setExtractedQuestions(prev => prev.map(q => 
        q.id === question.id 
          ? { 
              ...q, 
              status: 'completed',
              answer: processedAnswer,
              confidence: enhancedConfidence
            }
          : q
      ));

      // Save the enhanced answer to database
      await saveQuestionnaireAnswer({
        ...question,
        answer: processedAnswer,
        confidence: enhancedConfidence,
        status: 'completed'
      });

      setGenerationProgress({ current: 1, total: 1, currentQuestion: 'Completed with enhanced context' });
      
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
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            title: checklistName,
            vendorId: selectedVendorId,
            questions: completedQuestions.map(q => ({ questionText: q.text })),
            generateAnswers: false // Don't regenerate, use existing answers
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          
          // Check if error is due to feature limits
          if (response.status === 403 && errorData?.error?.code === 'QUESTIONNAIRE_LIMIT_REACHED') {
            setUploadError(`${errorData.error.message} Please upgrade your plan to create more questionnaires.`);
            
            // Redirect to pricing page after a short delay
            setTimeout(() => {
              router.push('/pricing?upgrade=questionnaire_limit');
            }, 3000);
            return;
          }
          
          throw new Error(errorData?.message || 'Failed to create questionnaire');
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
      setSupportDocUploadError(`File type "${fileExtension}" is not supported. Please upload a file in one of these formats: PDF (recommended for text documents), images (JPG, PNG, GIF), or document files (DOC, DOCX, TXT). PDFs provide the most accurate content analysis.`);
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

      // Force refresh the documents list from the database instead of just adding locally
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for backend processing
      await loadVendorSupportingDocuments(selectedVendorId);
      
      // Clear form
      setSupportDocDescription('');
      setSupportDocCategory('');
      
      // Clear file input
      if (standaloneSupportDocRef.current) {
        standaloneSupportDocRef.current.value = '';
      }

      console.log('✅ Standalone supporting document uploaded successfully!');
      
      // Show success notification
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Supporting document uploaded successfully!
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }
      
    } catch (error) {
      console.error('❌ Error uploading standalone supporting document:', error);
      setSupportDocUploadError('Upload failed. This could be due to file size limits, network issues, or unsupported content in the document. Please check your file and try again. If the issue persists, try converting to PDF format.');
    } finally {
      setIsUploadingSupportDoc(false);
    }
  };

  // Delete standalone supporting document
  const deleteStandaloneSupportDoc = async (docId: string) => {
    if (!selectedVendorId) {
      console.error('No vendor selected for deletion');
      return;
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this supporting document?\n\nThis action cannot be undone.'
    );
    
    if (!confirmDelete) return;

    try {
      console.log(`🗑️ DELETING: Supporting document ${docId} for vendor ${selectedVendorId}`);
      
      // Call API to delete from database and DigitalOcean Spaces
      await ChecklistService.deleteSupportingDocument(docId, selectedVendorId);
      
      // Refresh the documents list from the database
      await loadVendorSupportingDocuments(selectedVendorId);
      
      console.log('✅ Supporting document deleted successfully!');
      
    } catch (error) {
      console.error('❌ Error deleting supporting document:', error);
      setSupportDocUploadError('Failed to delete supporting document. Please try again.');
    }
  };

  // Evidence file functions
  const loadVendorEvidenceFiles = async (vendorId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/vendors/${vendorId}/evidence`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load evidence files');
      }

      const data = await response.json();
      setEvidenceFiles(data.evidenceFiles || []);
    } catch (error: any) {
      console.error('Error loading evidence files:', error);
      setEvidenceUploadError(error.message || 'Failed to load evidence files');
    }
  };

  const handleEvidenceFileUpload = async (files: FileList) => {
    if (!selectedVendorId) {
      setEvidenceUploadError('Please select a vendor first');
      return;
    }

    // Create pending evidence files for preview
    const pendingFiles = Array.from(files).map(file => ({
      file,
      description: evidenceDescription,
      category: evidenceCategory,
      status: 'pending' as const
    }));

    setPendingEvidenceFiles(pendingFiles);
    setShowEvidencePreview(true);
  };

  const handleEvidenceApproval = async (approvedFiles: any[]) => {
    if (!selectedVendorId) {
      setEvidenceUploadError('Please select a vendor first');
      return;
    }

    setIsUploadingEvidence(true);
    setEvidenceUploadError(null);

    try {
      for (const evidenceFile of approvedFiles) {
        const formData = new FormData();
        formData.append('file', evidenceFile.file);
        formData.append('vendorId', selectedVendorId);
        if (evidenceFile.description) {
          formData.append('description', evidenceFile.description);
        }
        if (evidenceFile.category) {
          formData.append('category', evidenceFile.category);
        }

        const response = await fetch(`${getApiBaseUrl()}/api/vendors/${selectedVendorId}/evidence`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload evidence file');
        }

        const result = await response.json();
        console.log('Evidence file uploaded successfully:', result);
      }

      // Reload evidence files
      await loadVendorEvidenceFiles(selectedVendorId);
      
      // Clear form and close preview
      setEvidenceDescription('');
      setEvidenceCategory('');
      if (evidenceFileRef.current) {
        evidenceFileRef.current.value = '';
      }
      setShowEvidencePreview(false);
      setPendingEvidenceFiles([]);

      // Show success notification
      alert(`Successfully uploaded ${approvedFiles.length} evidence file(s)!`);

    } catch (error: any) {
      console.error('Error uploading evidence file:', error);
      setEvidenceUploadError(error.message || 'Failed to upload evidence file');
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const deleteEvidenceFile = async (fileId: string) => {
    if (!selectedVendorId) return;

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this evidence file?\n\nThis action cannot be undone.'
    );
    
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/vendors/${selectedVendorId}/evidence/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete evidence file');
      }

      // Remove from state
      setEvidenceFiles(prev => prev.filter(file => file.id !== fileId));
      
      console.log('Evidence file deleted successfully');
    } catch (error: any) {
      console.error('Error deleting evidence file:', error);
      setEvidenceUploadError(error.message || 'Failed to delete evidence file');
    }
  };

  const handleTextFileView = async (file: any) => {
    try {
      if (file.fileType === 'text/plain' || file.originalFilename.toLowerCase().endsWith('.txt')) {
        // For text files, get the content directly through the backend
        const response = await fetch(`${getApiBaseUrl()}/api/vendors/${selectedVendorId}/evidence/${file.id}/content`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to get file content');
        }

        const data = await response.json();
        
        // Create a blob URL for the content
        const blob = new Blob([data.content], { type: 'text/plain' });
        const blobUrl = URL.createObjectURL(blob);
        
        setTextViewerData({
          url: blobUrl,
          filename: file.originalFilename
        });
        setShowTextViewer(true);
        
        // Clean up the blob URL when the viewer is closed
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000); // Clean up after 1 minute
      } else {
        // For non-text files, get signed URL and open in new tab
        const response = await fetch(`${getApiBaseUrl()}/api/vendors/${selectedVendorId}/evidence/${file.id}/download`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to generate download URL');
        }

        const data = await response.json();
        window.open(data.downloadUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error viewing file:', error);
      alert('Failed to open file. Please try again.');
    }
  };

  // Document generation functions
  const openGenerateDocModal = (questionId?: string) => {
    setGenerateDocQuestionId(questionId || null);
    setShowGenerateDocModal(true);
    setDocumentGenerationError(null);
    setGenerateDocTitle('');
    setGenerateDocInstructions('');
    setGenerateDocCategory('');
  };

  const closeGenerateDocModal = () => {
    setShowGenerateDocModal(false);
    setGenerateDocQuestionId(null);
    setDocumentGenerationError(null);
    setGenerateDocTitle('');
    setGenerateDocInstructions('');
    setGenerateDocCategory('');
  };

  const openGenerateEvidenceModal = () => {
    setGenerateDocQuestionId(null); // No specific question for evidence files
    setGenerateDocTitle('Evidence Document');
    setGenerateDocInstructions('Generate comprehensive evidence file for compliance documentation');
    setGenerateDocCategory('Evidence File');
    setDocumentGenerationError(null);
    setShowGenerateDocModal(true);
  };

  const generateAndSaveDocument = async () => {
    if (!generateDocTitle.trim()) {
      setDocumentGenerationError('Please enter a document title');
      return;
    }

    if (!selectedVendorId) {
      setDocumentGenerationError('Please select a vendor first');
      return;
    }

    setIsGeneratingDocument(true);
    setDocumentGenerationError(null);

    try {
      console.log('🤖 GENERATING: Starting document generation...');
      
      // Get vendor ID as number
      const vendorIdNum = await getVendorIdFromUuid(selectedVendorId);
      if (!vendorIdNum) {
        throw new Error('Invalid vendor selected');
      }

      const result = await AIService.generateAndSaveDocument({
        documentTitle: generateDocTitle,
        instructions: generateDocInstructions || undefined,
        category: generateDocCategory || undefined,
        vendorId: vendorIdNum,
        questionId: generateDocQuestionId || undefined,
      });

      if (result.success) {
        console.log('✅ Document generated and saved successfully!');
        
        // Refresh appropriate list based on document type
        if (generateDocQuestionId) {
          // This is a supporting document for a specific question
          await loadVendorSupportingDocuments(selectedVendorId);
        } else {
          // This is an evidence file (general document)
          await loadVendorEvidenceFiles(selectedVendorId);
        }
        
        // Close modal
        closeGenerateDocModal();
        
        // Show success message
        alert('Evidence document generated and saved successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate document');
      }
    } catch (error: any) {
      console.error('❌ Error generating document:', error);
      setDocumentGenerationError(error.message || 'Failed to generate document. Please try again.');
    } finally {
      setIsGeneratingDocument(false);
    }
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
      setSupportDocUploadError(`File type "${fileExtension}" is not supported. Please upload a file in one of these formats: PDF (recommended for text documents), images (JPG, PNG, GIF), or document files (DOC, DOCX, TXT). PDFs provide the most accurate content analysis for compliance validation.`);
      return;
    }

    console.log(`🔹 SUPPORTING DOCUMENT UPLOAD: Starting relevance check for question ${questionId}, file: ${file.name}`);
    
    setIsUploadingSupportDoc(true);
    setUploadingQuestionId(questionId);
    setSupportDocUploadError(null);

    try {
      // Step 1: Validate document relevance before uploading
      console.log(`🔍 DOCUMENT VALIDATION: Checking relevance for file: ${file.name}`);
      
      let validationResult;
      try {
        validationResult = await ChecklistService.validateDocumentRelevance(questionId, file);
        console.log('🔍 VALIDATION RESULT:', validationResult);
      } catch (validationError) {
        console.warn('⚠️ Document validation failed, proceeding with upload:', validationError);
        // Continue with upload even if validation fails (graceful degradation)
        await proceedWithUpload(questionId, file);
        return;
      }

      // Step 2: Show modal for user decision
      if (validationResult) {
        setRelevanceResult(validationResult);
        setPendingUpload({ questionId, file });
        setShowRelevanceModal(true);
      } else {
        // Fallback to direct upload if no validation result
        await proceedWithUpload(questionId, file);
      }

    } catch (error) {
      console.error('❌ Error during document validation:', error);
      setSupportDocUploadError('Document validation failed. Please try again.');
    } finally {
      if (!pendingUpload) {
        setIsUploadingSupportDoc(false);
        setUploadingQuestionId(null);
      }
    }
  };

  // Separate function to handle the actual upload
  const proceedWithUpload = async (questionId: string, file: File) => {
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
      console.log('🔹 File stored in: supporting-docs/ folder, linked to vendor and questionnaire');

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

      // Force refresh supporting documents list with delay to allow backend processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadVendorSupportingDocuments(selectedVendorId);
      
      // Clear the file input
      const fileInput = document.getElementById(`support-doc-${questionId}`) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      console.log('✅ Supporting document uploaded successfully to DigitalOcean Spaces and linked to vendor!');
      
      // Show success notification
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Document uploaded for question successfully!
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }
      
    } catch (error) {
      console.error('❌ Error uploading supporting document:', error);
      setSupportDocUploadError('Upload failed. This could be due to unsupported content in the document. Please check your file and try again.');
    } finally {
      setIsUploadingSupportDoc(false);
      setUploadingQuestionId(null);
      setPendingUpload(null);
    }
  };

  // Handle modal actions
  const handleModalConfirm = async () => {
    if (pendingUpload) {
      await proceedWithUpload(pendingUpload.questionId, pendingUpload.file);
    }
    setShowRelevanceModal(false);
    setRelevanceResult(null);
    setPendingUpload(null);
  };

  const handleModalCancel = () => {
    const questionId = pendingUpload?.questionId;
    
    setShowRelevanceModal(false);
    setRelevanceResult(null);
    setPendingUpload(null);
    setIsUploadingSupportDoc(false);
    setUploadingQuestionId(null);
    
    // Clear file input
    if (questionId) {
      const fileInput = document.getElementById(`support-doc-${questionId}`) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
        // Automatically open file dialog to choose different document
        setTimeout(() => {
          fileInput.click();
        }, 100); // Small delay to ensure modal is closed first
      }
    }
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

  // Add manual question to checklist or create standalone question
  const addManualQuestion = async () => {
    if (!selectedVendorId || !manualQuestionText.trim()) {
      setUploadError('Please provide question text and select a vendor');
      return;
    }

    setIsAddingManualQuestion(true);
    try {
      let newQuestion;
      
      if (selectedChecklist?.checklistId) {
        // Add to existing checklist
        console.log(`📝 MANUAL QUESTION: Adding to checklist ${selectedChecklist.checklistId}`);
        newQuestion = await ChecklistService.addManualQuestion(
          selectedChecklist.checklistId,
          selectedVendorId,
          manualQuestionText.trim(),
          manualQuestionRequiresDoc,
          manualQuestionDocDescription.trim() || undefined
        );
      } else {
        // Create standalone question (will create default checklist if needed)
        console.log(`📝 MANUAL QUESTION: Adding standalone question for vendor ${selectedVendorId}`);
        newQuestion = await ChecklistService.addStandaloneManualQuestion(
          selectedVendorId,
          manualQuestionText.trim(),
          manualQuestionRequiresDoc,
          manualQuestionDocDescription.trim() || undefined
        );
      }

      console.log('📝 MANUAL QUESTION: Successfully added:', newQuestion);

      // Convert to our local format
      const localQuestion: ExtractedQuestion = {
        id: newQuestion.id,
        text: newQuestion.questionText,
        status: 'pending',
        answer: '',
        confidence: 0,
        requiresDoc: newQuestion.requiresDocument,
        docDescription: newQuestion.documentDescription,
        checklistId: newQuestion.checklistId,
        checklistName: selectedChecklist?.name || 'Manual Questions',
        isDone: false,
        isEditing: false
      };

      if (selectedChecklist) {
        // Update the selected checklist with the new question
        const updatedChecklist = {
          ...selectedChecklist,
          questions: [...(selectedChecklist.questions || []), localQuestion]
        };
        
        setSelectedChecklist(updatedChecklist);
        
        // Update checklists list
        setChecklists(prev => prev.map(c => 
          c.id === selectedChecklist.id ? updatedChecklist : c
        ));
             } else {
         // Refresh checklists to show the newly created default checklist
         await loadVendorChecklists(selectedVendorId);
       }

      // Refresh the AI Questionnaire section with updated questions
      await loadAllVendorQuestionsForAI(selectedVendorId);

      // Reset form and close modal
      setManualQuestionText('');
      setManualQuestionRequiresDoc(false);
      setManualQuestionDocDescription('');
      setShowAddQuestionModal(false);
      
    } catch (error) {
      console.error('❌ Error adding manual question:', error);
      setUploadError('Failed to add manual question. Please try again.');
    } finally {
      setIsAddingManualQuestion(false);
    }
  };

  // Toggle question expansion
  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
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
      
      // Clear all related state immediately
      setChecklists(prev => prev.filter(c => c.id !== checklist.id));
      
      // Clear selected checklist if it was the deleted one
      if (selectedChecklist?.id === checklist.id) {
        setSelectedChecklist(null);
        setExtractedQuestions([]);
      }
      
      // Remove questions from extractedQuestions that belong to this checklist
      setExtractedQuestions(prev => prev.filter(q => q.checklistId !== checklist.checklistId));
      
      console.log(`✅ Successfully deleted checklist: ${checklist.name}`);
      
      // Clear any previous error messages and show success
      setUploadError(null);
      
      // Force reload vendor checklists to ensure fresh data (in separate try-catch to not affect deletion success)
      if (selectedVendorId) {
        try {
          await loadVendorChecklists(selectedVendorId);
          // Also refresh AI Questionnaire section
          await loadAllVendorQuestionsForAI(selectedVendorId);
        } catch (reloadError) {
          console.warn('⚠️ Warning: Failed to reload data after successful deletion:', reloadError);
          // Don't show error to user since deletion was successful
        }
      }
      
    } catch (error) {
      console.error('❌ Error deleting checklist:', error);
      setUploadError('Failed to delete checklist. Please try again.');
      
      // Force reload on error to ensure UI state matches backend
      if (selectedVendorId) {
        try {
          await loadVendorChecklists(selectedVendorId);
          // Also refresh AI Questionnaire section
          await loadAllVendorQuestionsForAI(selectedVendorId);
        } catch (reloadError) {
          console.warn('⚠️ Warning: Failed to reload data after deletion error:', reloadError);
        }
      }
    }
  };

  // Helper function to group questions by checklist
  const groupQuestionsByChecklist = (questions: ExtractedQuestion[]) => {
    const checklistMap = new Map();
    
    questions.forEach(question => {
      const checklistId = question.checklistId || 'manual';
      const checklistName = question.checklistName || 'Manual Questions';
      
      if (!checklistMap.has(checklistId)) {
        checklistMap.set(checklistId, {
          id: checklistId,
          name: checklistName,
          questions: []
        });
      }
      
      checklistMap.get(checklistId).questions.push(question);
    });
    
    return Array.from(checklistMap.values());
  };

  // NEW: Trust Portal Functions

  /**
   * Send supporting document to trust portal (one-click)
   */
  const sendSupportingDocumentToTrustPortal = async (document: UploadedSupportingDocument) => {
    if (!selectedVendorId) {
      setUploadError('Please select a vendor first');
      return;
    }

    setSendingDocumentId(document.id);
    setSendingToTrustPortal(true);

    try {
      // Convert selectedVendorId (UUID) to numeric ID
      const vendorIdNumber = await getVendorIdFromUuid(selectedVendorId);
      if (!vendorIdNumber) {
        setUploadError('Invalid vendor selected. Please select a valid vendor.');
        return;
      }

      console.log('🏛️ TRUST PORTAL: Sending supporting document to trust portal...');

      // Create trust portal entry for supporting document
      const trustPortalData = {
        title: `${document.originalName}`,
        description: document.description || `Supporting document for compliance review`,
        category: 'Evidence',
        fileUrl: document.spacesUrl,
        fileType: document.fileType,
        fileSize: document.fileSize.toString(),
        vendorId: vendorIdNumber,
        isQuestionnaireAnswer: false,
        content: JSON.stringify({
          documentType: 'supporting_document',
          documentId: document.id,
          filename: document.filename,
          originalName: document.originalName,
          uploadDate: document.uploadDate,
          description: document.description,
          category: document.category || 'General',
          fileSize: document.fileSize,
          submissionDate: new Date().toISOString()
        })
      };

      console.log('🔄 Sending trust portal data:', trustPortalData);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/trust-portal/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify(trustPortalData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to send document to trust portal');
      }

      const result = await response.json();
      console.log('✅ Successfully sent document to trust portal:', result);

      // Show success notification for documents
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Document sent to Trust Portal successfully!
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }

    } catch (error) {
      console.error('❌ Error sending document to trust portal:', error);
      
      // Show error notification
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          Failed to send document to trust portal
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }
    } finally {
      setSendingDocumentId(null);
      setSendingToTrustPortal(false);
    }
  };

  /**
   * Send individual question to trust portal (for manual questions)
   */
  // Function to handle individual question submission after follow-up modal
  const processQuestionSubmission = async (submissionData: any) => {
    setSendingQuestionId(submissionData.questionId);
    setSendingToTrustPortal(true);
    
    try {
      // Add follow-up data to the submission
      const enhancedSubmissionData = {
        ...submissionData,
        isFollowUp: followUpData.isFollowUp,
        followUpType: followUpData.followUpType,
        followUpReason: followUpData.followUpReason,
        parentSubmissionId: followUpData.parentSubmissionId
      };
      
      console.log('🏛️ TRUST PORTAL: Sending question with follow-up data:', enhancedSubmissionData);
      
      // Continue with the original submission logic
      const vendorIdNumber = await getVendorIdFromUuid(selectedVendorId);
      if (!vendorIdNumber) {
        throw new Error('Invalid vendor selected. Please select a valid vendor.');
      }

      const trustPortalData = {
        ...enhancedSubmissionData,
        vendorId: vendorIdNumber,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/trust-portal/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify(trustPortalData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to send question to trust portal');
      }

      const result = await response.json();
      
      console.log('✅ Successfully sent question to trust portal:', result);
      
      // Show success notification for questions
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Question sent to Trust Portal successfully!
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }
      
      // Reset follow-up data
      setFollowUpData({
        isFollowUp: false,
        followUpType: 'initial',
        followUpReason: '',
        parentSubmissionId: null
      });
      
    } catch (error) {
      console.error('❌ Error sending question to trust portal:', error);
      setUploadError('Failed to send question to trust portal. Please try again.');
    } finally {
      setSendingQuestionId(null);
      setSendingToTrustPortal(false);
      setPendingSubmissionData(null);
    }
  };

  const sendQuestionToTrustPortal = async (question: ExtractedQuestion) => {
    if (!selectedVendorId) {
      setUploadError('Please select a vendor first');
      return;
    }

    if (!question.answer || question.answer.trim() === '') {
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          Question must have an answer before sending to trust portal
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }
      return;
    }

    setSendingQuestionId(question.id);
    setSendingToTrustPortal(true);

    try {
      // Convert selectedVendorId (UUID) to numeric ID
      const vendorIdNumber = await getVendorIdFromUuid(selectedVendorId);
      if (!vendorIdNumber) {
        setUploadError('Invalid vendor selected. Please select a valid vendor.');
        return;
      }

      console.log('🏛️ TRUST PORTAL: Preparing individual question submission...');

      // Prepare submission data
      const submissionData = {
        questionId: question.id,
        title: `Q&A: ${question.text.length > 80 ? question.text.substring(0, 80) + '...' : question.text}`,
        description: question.answer,
        category: 'Questionnaire',
        isQuestionnaireAnswer: true,
        questionnaireId: question.id,
        content: JSON.stringify({
          documentType: 'individual_question',
          questionId: question.id,
          questionText: question.text,
          answer: question.answer,
          status: question.status,
          confidence: question.confidence,
          checklistId: question.checklistId,
          checklistName: question.checklistName,
          isManualQuestion: !question.checklistId || question.checklistId === 'manual',
          submissionDate: new Date().toISOString()
        })
      };

      // For now, automatically use initial submission to simplify the flow
      // TODO: Add follow-up modal support later if needed
      const enhancedSubmissionData = {
        ...submissionData,
        isFollowUp: false,
        followUpType: 'initial', 
        followUpReason: '',
        parentSubmissionId: null
      };
      
      // Directly process the submission with initial submission data
      await processQuestionSubmission(enhancedSubmissionData);
      return;

      // Show success notification
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Checklist sent to Trust Portal successfully!
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }

    } catch (error) {
      console.error('❌ Error sending question to trust portal:', error);
      
      // Show error notification
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          Failed to send question to trust portal
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }
    } finally {
      setSendingQuestionId(null);
      setSendingToTrustPortal(false);
    }
  };

  /**
   * Check if checklist is ready for trust portal (all questions completed)
   */
  const checkChecklistReadyForTrustPortal = async (checklistId: string): Promise<{
    isReady: boolean;
    completionStatus: any;
  }> => {
    if (!selectedVendorId || !checklistId || checklistId === 'manual') {
      return { isReady: false, completionStatus: null };
    }

    try {
      const completionStatus = await ChecklistService.checkChecklistCompletionStatus(checklistId, selectedVendorId);
      return {
        isReady: completionStatus.isComplete,
        completionStatus
      };
    } catch (error) {
      console.error('Error checking checklist completion:', error);
      return { isReady: false, completionStatus: null };
    }
  };

  /**
   * Send complete checklist to trust portal (when all questions are completed)
   */
  // Function to handle the actual submission after follow-up modal
  const processTrustPortalSubmission = async (submissionData: any) => {
    setSendingToTrustPortal(true);
    
    try {
      // Enhanced logging for debugging
      console.log('🔍 TRUST PORTAL DEBUG: Starting submission process');
      console.log('🔍 TRUST PORTAL DEBUG: Selected vendor ID:', selectedVendorId);
      console.log('🔍 TRUST PORTAL DEBUG: Auth token exists:', !!token);
      console.log('🔍 TRUST PORTAL DEBUG: Token preview:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('🔍 TRUST PORTAL DEBUG: Submission data:', submissionData);
      
      // Validate authentication before proceeding
      if (!token) {
        console.error('❌ TRUST PORTAL DEBUG: No authentication token available');
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Validate vendor selection
      if (!selectedVendorId || selectedVendorId.trim() === '') {
        console.error('❌ TRUST PORTAL DEBUG: No vendor selected');
        throw new Error('Please select a vendor before sending to trust portal.');
      }
      
      // Use the follow-up data from submissionData (which includes our defaults)
      const enhancedSubmissionData = {
        ...submissionData,
        // Use submissionData follow-up values if available, otherwise fall back to followUpData state
        isFollowUp: submissionData.isFollowUp ?? followUpData.isFollowUp,
        followUpType: submissionData.followUpType ?? followUpData.followUpType,
        followUpReason: submissionData.followUpReason ?? followUpData.followUpReason,
        parentSubmissionId: submissionData.parentSubmissionId ?? followUpData.parentSubmissionId
      };
      
      console.log('🏛️ TRUST PORTAL: Input submissionData:', submissionData);
      console.log('🏛️ TRUST PORTAL: Enhanced submission data:', enhancedSubmissionData);
      
      // Continue with the original submission logic
      const vendorIdNumber = await getVendorIdFromUuid(selectedVendorId);
      console.log('🔍 TRUST PORTAL DEBUG: Vendor ID number:', vendorIdNumber);
      
      if (!vendorIdNumber) {
        throw new Error('Invalid vendor selected. Please select a valid vendor.');
      }

      const trustPortalData = {
        ...enhancedSubmissionData,
        vendorId: vendorIdNumber,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔍 TRUST PORTAL DEBUG: Added authorization header');
      } else {
        console.log('⚠️ TRUST PORTAL DEBUG: No auth token available');
      }

      const baseUrl = getApiBaseUrl();
      console.log('🔍 TRUST PORTAL DEBUG: Base URL:', baseUrl);
      
      // Check if this is a checklist submission vs individual question
      let response;
      if (submissionData.checklistId) {
        console.log('🔍 TRUST PORTAL DEBUG: Using checklist endpoint');
        console.log('🔍 TRUST PORTAL DEBUG: Checklist ID:', submissionData.checklistId);
        
        const endpoint = `${baseUrl}/api/checklists/${submissionData.checklistId}/vendor/${selectedVendorId}/send-to-trust-portal`;
        console.log('🔍 TRUST PORTAL DEBUG: Full endpoint:', endpoint);
        
        const requestBody = {
          title: submissionData.title,
          message: submissionData.message,
          isFollowUp: enhancedSubmissionData.isFollowUp,
          followUpType: enhancedSubmissionData.followUpType,
          followUpReason: enhancedSubmissionData.followUpReason,
          parentSubmissionId: enhancedSubmissionData.parentSubmissionId
        };
        
        console.log('🔍 TRUST PORTAL DEBUG: Request body:', requestBody);
        
        // For checklist submissions, use the specialized checklist endpoint
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
      } else {
        console.log('🔍 TRUST PORTAL DEBUG: Using general trust portal endpoint');
        console.log('🔍 TRUST PORTAL DEBUG: Trust portal data:', trustPortalData);
        
        // For individual questions, use the general trust portal endpoint
        response = await fetch(`${baseUrl}/api/trust-portal/items`, {
          method: 'POST',
          headers,
          body: JSON.stringify(trustPortalData),
        });
      }

      console.log('🔍 TRUST PORTAL DEBUG: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.log('🔍 TRUST PORTAL DEBUG: Error response:', errorData);
        throw new Error(errorData?.message || 'Failed to send checklist to trust portal');
      }

      const result = await response.json();
      
      console.log('✅ Successfully sent to trust portal:', result);
      
      // Show success notification
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Checklist sent to Trust Portal successfully!
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }
      
      // Reset follow-up data
      setFollowUpData({
        isFollowUp: false,
        followUpType: 'initial',
        followUpReason: '',
        parentSubmissionId: null
      });
      
    } catch (error: any) {
      console.error('❌ Error sending to trust portal:', error);
      console.error('🔍 TRUST PORTAL DEBUG: Full error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        selectedVendorId,
        submissionData,
        hasToken: !!token
      });
      setUploadError('Failed to send to trust portal. Please try again.');
    } finally {
      setSendingToTrustPortal(false);
      setPendingSubmissionData(null);
    }
  };

  const sendChecklistToTrustPortal = async (checklistGroup: any) => {
    if (!selectedVendorId) {
      setUploadError('Please select a vendor first');
      return;
    }

    if (checklistGroup.id === 'manual') {
      if (typeof window !== 'undefined') {
        const notification = window.document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          Manual questions cannot be sent as a group. Please send individual questions separately.
        `;
        window.document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
      }
      return;
    }

    setSendingToTrustPortal(true);
    setTrustPortalProgress({ current: 0, total: 5, item: 'Checking completion status...' });

    try {
      // Step 1: Check if checklist is ready
      setTrustPortalProgress({ current: 1, total: 5, item: 'Validating checklist completion...' });
      const { isReady, completionStatus } = await checkChecklistReadyForTrustPortal(checklistGroup.id);

      // Simplified validation - check if questions have AI answers or are completed
      const questionsWithAnswers = checklistGroup.questions.filter((q: ExtractedQuestion) => 
        (q.answer && q.answer.trim() !== '') || q.status === 'completed'
      );
      const totalQuestions = checklistGroup.questions.length;
      const incompleteQuestions = checklistGroup.questions.filter((q: ExtractedQuestion) => 
        (!q.answer || q.answer.trim() === '') && q.status !== 'completed'
      );
      
      const dbIsComplete = questionsWithAnswers.length === totalQuestions && totalQuestions > 0;
      
      if (!isReady && !dbIsComplete) {
        const incomplete = completionStatus?.incompleteQuestions?.length || 0;
        const needingDocs = Math.max(0, (completionStatus?.questionsNeedingDocs || 0) - (completionStatus?.questionsWithDocs || 0));
        
        let message = `❌ Checklist is not ready for Trust Portal:\n\n`;
        if (incomplete > 0) {
          message += `• ${incomplete} questions need answers\n`;
        }
        if (needingDocs > 0) {
          message += `• ${needingDocs} questions need supporting documents\n`;
        }
        if (incompleteQuestions.length > 0) {
          message += `• ${incompleteQuestions.length} questions without answers\n`;
          message += `  - ${incompleteQuestions.slice(0, 3).map((q: ExtractedQuestion) => q.text.substring(0, 40) + '...').join('\n  - ')}\n`;
          if (incompleteQuestions.length > 3) {
            message += `  - ... and ${incompleteQuestions.length - 3} more\n`;
          }
        }
        message += `\n📋 Current Status:\n`;
        message += `• Total Questions: ${totalQuestions}\n`;
        message += `• Questions with Answers: ${questionsWithAnswers.length}\n`;
        message += `• Documents Required: ${completionStatus?.questionsNeedingDocs || 0}\n`;
        message += `• Documents Uploaded: ${completionStatus?.questionsWithDocs || 0}\n\n`;
        message += `✅ Please ensure all questions have answers and upload required documents before sending to Trust Portal.`;
        
                 // Show detailed error notification
         if (typeof window !== 'undefined') {
           const notification = window.document.createElement('div');
           notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md';
           notification.innerHTML = `
             <div class="flex items-start">
               <svg class="h-5 w-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
               </svg>
               <div>
                 <div class="font-semibold">Checklist Not Ready</div>
                 <div class="text-sm mt-1">
                   ${incomplete > 0 ? `${incomplete} questions need answers. ` : ''}
                   ${needingDocs > 0 ? `${needingDocs} questions need documents.` : ''}
                 </div>
               </div>
             </div>
           `;
           window.document.body.appendChild(notification);
           setTimeout(() => notification.remove(), 6000);
         }
        
        return;
      }

      // Step 2: Prepare checklist data
      setTrustPortalProgress({ current: 2, total: 5, item: 'Preparing checklist data...' });
      
      // Step 3: Show follow-up modal before sending
      setTrustPortalProgress({ current: 3, total: 5, item: 'Preparing submission...' });
      
      const submitData = {
        checklistId: checklistGroup.id,
        title: `${checklistGroup.name} - Complete Compliance Questionnaire`,
        message: `Completed compliance questionnaire with ${checklistGroup.questions.length} answered questions. All requirements verified and ready for enterprise review.`
      };

      // For now, automatically use initial submission to simplify the flow
      // TODO: Add follow-up modal support later if needed
      const enhancedSubmitData = {
        ...submitData,
        isFollowUp: false,
        followUpType: 'initial',
        followUpReason: '',
        parentSubmissionId: null
      };
      
      // Directly process the submission with initial submission data
      console.log('🚀 SENDING TO TRUST PORTAL: enhancedSubmitData:', enhancedSubmitData);
      await processTrustPortalSubmission(enhancedSubmitData);
      return;

    } catch (error) {
      console.error('❌ Error sending checklist to trust portal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
             // Show error notification
       if (typeof window !== 'undefined') {
         const notification = window.document.createElement('div');
         notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md';
         notification.innerHTML = `
           <div class="flex items-start">
             <svg class="h-5 w-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
             </svg>
             <div>
               <div class="font-semibold">Failed to Send</div>
               <div class="text-sm mt-1">${errorMessage}</div>
             </div>
           </div>
         `;
         window.document.body.appendChild(notification);
         setTimeout(() => notification.remove(), 5000);
       }
    } finally {
      setSendingToTrustPortal(false);
      setTrustPortalProgress({ current: 0, total: 0, item: '' });
    }
  };

  if (authLoading || !hasMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Follow-up modal component
  const FollowUpModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Submission Type</h3>
        <p className="text-gray-600 mb-4">
          Is this a follow-up submission in response to enterprise feedback, or an initial submission?
        </p>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="submissionType"
              value="initial"
              checked={!followUpData.isFollowUp}
              onChange={() => setFollowUpData(prev => ({ ...prev, isFollowUp: false, followUpType: 'initial' }))}
              className="w-4 h-4 text-indigo-600"
            />
            <div>
              <div className="font-medium">Initial Submission</div>
              <div className="text-sm text-gray-500">This is a new, original submission</div>
            </div>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="submissionType"
              value="follow_up"
              checked={followUpData.isFollowUp}
              onChange={() => setFollowUpData(prev => ({ ...prev, isFollowUp: true, followUpType: 'follow_up' }))}
              className="w-4 h-4 text-indigo-600"
            />
            <div>
              <div className="font-medium">Follow-up Submission</div>
              <div className="text-sm text-gray-500">This is in response to enterprise feedback</div>
            </div>
          </label>
        </div>
        
        {followUpData.isFollowUp && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow-up Type
              </label>
              <select
                value={followUpData.followUpType}
                onChange={(e) => setFollowUpData(prev => ({ ...prev, followUpType: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="follow_up">General Follow-up</option>
                <option value="resubmission">Resubmission</option>
                <option value="clarification">Clarification</option>
                <option value="additional_docs">Additional Documents</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Follow-up
              </label>
              <textarea
                value={followUpData.followUpReason}
                onChange={(e) => setFollowUpData(prev => ({ ...prev, followUpReason: e.target.value }))}
                placeholder="Please describe why this is a follow-up submission..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setShowFollowUpModal(false);
              setPendingSubmissionData(null);
              setFollowUpData({
                isFollowUp: false,
                followUpType: 'initial',
                followUpReason: '',
                parentSubmissionId: null
              });
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (pendingSubmissionData) {
                setShowFollowUpModal(false);
                if (pendingSubmissionData.checklistId) {
                  await processTrustPortalSubmission(pendingSubmissionData);
                } else if (pendingSubmissionData.questionId) {
                  await processQuestionSubmission(pendingSubmissionData);
                }
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

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
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-3 shadow-md">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <select
                  className="px-4 py-3 border border-blue-300 rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[250px] font-medium text-gray-900"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                >
                  <option value="">
                    {uploadError && uploadError.includes('Authentication') 
                      ? 'Please Login to Access Vendors'
                      : isLoadingVendors 
                        ? 'Loading vendors...'
                        : '🔽 Select Client to Get Started'
                    }
                  </option>
                  {!uploadError && !isLoadingVendors ? (
                    safeMap(vendors, (vendor: any) => (
                      <option key={vendor.uuid || vendor.id} value={vendor.uuid || vendor.id}>
                        {vendor.name || vendor.companyName}
                      </option>
                    ))
                  ) : null}
                </select>
              </div>
              
              {selectedVendorId && (
                <div className="mt-2 text-center">
                  <div className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vendor Selected!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        
        {/* Enhanced 4-Section Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
            <nav className="flex space-x-2">
              <button 
                onClick={() => setActiveSection('upload')}
                className={`flex-1 py-4 px-4 text-center font-semibold text-sm rounded-xl transition-all duration-300 relative overflow-hidden ${
                  activeSection === 'upload'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <Upload className="w-5 h-5" />
                  <span className="hidden sm:block">Checklist & Evidence</span>
                  <span className="sm:hidden">Upload</span>
                </div>
                {activeSection === 'upload' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-300 rounded-full"></div>
                )}
              </button>
              
              <button 
                onClick={() => setActiveSection('ai')}
                className={`flex-1 py-4 px-4 text-center font-semibold text-sm rounded-xl transition-all duration-300 relative overflow-hidden ${
                  activeSection === 'ai'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <Bot className="w-5 h-5" />
                  <span className="hidden sm:block">AI Questionnaire</span>
                  <span className="sm:hidden">AI</span>
                </div>
                {activeSection === 'ai' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-300 rounded-full"></div>
                )}
              </button>
              
              <button 
                onClick={() => setActiveSection('docs')}
                className={`flex-1 py-4 px-4 text-center font-semibold text-sm rounded-xl transition-all duration-300 relative overflow-hidden ${
                  activeSection === 'docs'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <FolderOpen className="w-5 h-5" />
                  <span className="hidden sm:block">Supporting Documents</span>
                  <span className="sm:hidden">Documents</span>
                </div>
                {activeSection === 'docs' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-300 rounded-full"></div>
                )}
              </button>
              
              <button 
                onClick={() => setActiveSection('support')}
                className={`flex-1 py-4 px-4 text-center font-semibold text-sm rounded-xl transition-all duration-300 relative overflow-hidden ${
                  activeSection === 'support'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <LifeBuoy className="w-5 h-5" />
                  <span className="hidden sm:block">Request Assistance</span>
                  <span className="sm:hidden">Support</span>
                </div>
                {activeSection === 'support' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-300 rounded-full"></div>
                )}
              </button>
            </nav>
          </div>
        </div>
                        
        {/* Authentication Notice for Services */}
        {uploadError && uploadError.includes('Authentication') && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Vendor Selection Requires Authentication
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Vendor Selection:</strong> Requires login to maintain organization security</p>
              <p><strong>Services Available:</strong> AI responses, document generation, and assistance features work without vendor selection</p>
            </div>
            <div className="mt-3">
              <button 
                onClick={() => window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname)}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Login to Access Vendors
              </button>
            </div>
          </div>
        )}

        {/* Section Content */}
        <div className="min-h-[600px]">
          
          {/* Section 1: Checklist Upload */}
          {activeSection === 'upload' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="max-w-7xl mx-auto">
                {/* Top Section: Parallel Upload Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Visual separator indicator */}
                  <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gray-300 to-transparent transform -translate-x-1/2 z-10"></div>
                  
                  {/* Left Side: Checklist Upload */}
                  <div className="bg-blue-50 rounded-xl p-6 relative">
                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      STEP 1
                    </div>
                    <div className="text-center mb-6">
                      <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Compliance Checklist</h2>
                      <p className="text-gray-600">Upload your compliance checklist document and we'll extract the questions for AI processing</p>
                      <div className="text-xs mt-2 space-y-1">
                        <p className="text-blue-600 font-medium">
                          📋 Checklist Processing - Questions extracted and stored for AI questionnaire
                        </p>
                        <p className="text-green-600">
                          🚀 Fast Upload: Direct file processing with automatic question extraction
                        </p>
                      </div>
                    </div>

                    {/* Upload Area */}
                    <div 
                      ref={dropZoneRef}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer mb-6 ${
                        dragActive 
                          ? 'border-blue-500 bg-blue-100' 
                          : 'border-blue-300 hover:border-blue-400 bg-white'
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => checklistFileRef.current?.click()}
                    >
                      <Upload className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                      <p className="text-lg text-gray-600 mb-2">
                        {dragActive ? 'Drop file here' : 'Upload compliance checklist'}
                      </p>
                      <p className="text-gray-500 mb-4">
                        PDF, TXT, DOC, DOCX supported
                      </p>
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
                    
                    {/* Add Manual Question Button */}
                    {selectedVendorId && (
                      <div className="text-center">
                        <button
                          onClick={() => setShowAddQuestionModal(true)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Add Manual Question
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                          {selectedChecklist 
                            ? `Add custom questions to: "${selectedChecklist.name}"`
                            : `Add custom questions for selected vendor`
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Evidence Files */}
                  <div className="bg-orange-50 rounded-xl p-6 relative">
                    <div className="absolute top-3 right-3 bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      STEP 2
                    </div>
                    <div className="text-center mb-6">
                      <Files className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Evidence Files</h2>
                      <p className="text-gray-600">Upload internal evidence files to enhance AI responses and provide better compliance context</p>
                      <div className="text-xs mt-2 space-y-1">
                        <p className="text-orange-600 font-medium">
                          📝 Internal Evidence - Stored securely in Digital Ocean
                        </p>
                        <p className="text-blue-600">
                          ✨ Enhanced workflow: Review files before saving • Better text file viewing
                        </p>
                        <p className="text-purple-600">
                          🤖 AI Integration: Files are used to generate more accurate compliance responses
                        </p>
                      </div>
                    </div>

                    {/* Evidence File Upload Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <input
                          type="text"
                          value={evidenceDescription}
                          onChange={(e) => setEvidenceDescription(e.target.value)}
                          placeholder="Description (optional)..."
                          className="w-full px-3 py-2 text-sm border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        
                        <select
                          value={evidenceCategory}
                          onChange={(e) => setEvidenceCategory(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Category (optional)...</option>
                          <option value="Security">Security</option>
                          <option value="Data Privacy">Data Privacy</option>
                          <option value="Compliance">Compliance</option>
                          <option value="Policies">Policies</option>
                          <option value="Procedures">Procedures</option>
                          <option value="Certifications">Certifications</option>
                          <option value="Contracts">Contracts</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="flex flex-col space-y-3">
                        <input
                          ref={evidenceFileRef}
                          type="file"
                          className="hidden"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt,.csv,.xlsx"
                          onChange={(e) => e.target.files && handleEvidenceFileUpload(e.target.files)}
                        />
                        <button
                          onClick={() => evidenceFileRef.current?.click()}
                          disabled={isUploadingEvidence || !selectedVendorId}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center text-sm"
                        >
                          {isUploadingEvidence ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Processing & Saving...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Evidence Files
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => openGenerateEvidenceModal()}
                          disabled={isGeneratingDocument || !selectedVendorId}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center text-sm"
                        >
                          {isGeneratingDocument ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Evidence File
                            </>
                          )}
                        </button>
                        
                        <span className="text-xs text-gray-500 text-center">
                          PDF, images, documents supported
                        </span>
                      </div>

                      {evidenceUploadError && (
                        <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                          {evidenceUploadError}
                        </div>
                      )}
                    </div>

                    {/* Evidence Files List */}
                    {evidenceFiles.length > 0 && (
                      <div className="mt-6 bg-white rounded-lg border border-orange-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          Evidence Files ({evidenceFiles.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {evidenceFiles.map((file: any) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                              <div className="flex items-center min-w-0 flex-1">
                                <FileText className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900 text-xs truncate">{file.originalFilename}</p>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                                    {file.category && (
                                      <span className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded text-xs">
                                        {file.category}
                                      </span>
                                    )}
                                    {file.fileType === 'text/plain' && (
                                      <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                                        📝 Enhanced Viewer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleTextFileView(file)}
                                  className="text-blue-600 hover:text-blue-700 p-1 flex-shrink-0"
                                  title={file.fileType === 'text/plain' ? 'View with enhanced text viewer' : 'View file'}
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => deleteEvidenceFile(file.id)}
                                  className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                                  title="Delete evidence file"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {evidenceFiles.length === 0 && !isUploadingEvidence && (
                      <div className="mt-6 text-center py-4 text-gray-500">
                        <Files className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      </div>
                    )}
                  </div>
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
                                    {checklist.sentToTrustPortal && (
                                      <span className="ml-2 inline-flex items-center text-xs">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                        Sent to Trust Portal
                                        {checklist.trustPortalSubmissionDate && (
                                          <span className="ml-1 text-gray-400">
                                            ({checklist.trustPortalSubmissionDate.toLocaleDateString()})
                                          </span>
                                        )}
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
                                          Generate Responses
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

                {/* Uploaded Evidence Files Section */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Files className="h-6 w-6 text-orange-600 mr-3" />
                    Uploaded Evidence Files
                    {evidenceFiles.length > 0 && (
                      <span className="ml-2 text-sm text-gray-500">({evidenceFiles.length})</span>
                    )}
                  </h3>
                  
                  {evidenceFiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {evidenceFiles.map((file: any) => (
                        <div key={file.id} className="bg-white border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                              <FileText className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm truncate" title={file.originalFilename}>
                                {file.originalFilename}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {(file.fileSize / 1024).toFixed(1)} KB
                                </span>
                                {file.category && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                    {file.category}
                                  </span>
                                )}
                                {file.fileType === 'text/plain' && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    📝 Text
                                  </span>
                                )}
                              </div>
                              {file.description && (
                                <p className="text-xs text-gray-600 mt-2 line-clamp-2" title={file.description}>
                                  {file.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-3">
                                <button
                                  onClick={() => handleTextFileView(file)}
                                  className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center"
                                  title={file.fileType === 'text/plain' ? 'View with enhanced text viewer' : 'View file (secure download)'}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </button>
                                <button
                                  onClick={() => deleteEvidenceFile(file.id)}
                                  className="text-red-600 hover:text-red-700 text-xs font-medium flex items-center"
                                  title="Delete evidence file"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 text-center">
                      <Files className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Evidence Files Uploaded</h4>
                      <p className="text-gray-600 mb-4">
                        Upload evidence files above or generate them using AI to enhance your compliance documentation.
                      </p>
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => evidenceFileRef.current?.click()}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center text-sm"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Files
                        </button>
                        <button
                          onClick={() => openGenerateEvidenceModal()}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate with AI
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Section 2: AI Questionnaire */}
          {activeSection === 'ai' && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg border border-purple-200 p-8">
                            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <Bot className="h-20 w-20 text-purple-600 mx-auto relative z-10" />
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                    AI Questionnaire Processing
                  </h2>
                  <p className="text-xl text-gray-700 mb-6">Let our AI generate compliance answers for your questions</p>
                  
                  {/* Supporting Document Note */}
                  <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl max-w-3xl mx-auto shadow-sm">
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-amber-100 rounded-full p-2 mr-3">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="font-semibold text-amber-800">Important Note</span>
                    </div>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      To submit the checklist to the Trust Portal, please upload the relevant supporting documents for the required questions.
                    </p>
                  </div>
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
                  <div className="space-y-8">
                    <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl border border-white/50 shadow-lg">
                      <div className="flex items-center mb-6">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-2 mr-3">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Progress Overview</h3>
                      </div>
                      
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
                            {extractedQuestions.filter(q => q.status === 'completed' || q.status === 'done').length} Completed
                          </span>
                          </div>
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                          <span className="text-gray-700">
                            {extractedQuestions.filter(q => q.status === 'needs-support').length} Needs Support
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                          <span className="text-gray-700">
                            {extractedQuestions.filter(q => q.isDone).length} Done
                          </span>
                        </div>
                      </div>

                      {/* Evidence Integration Status */}
                      {evidenceFiles.length > 0 && (
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="bg-emerald-100 rounded-full p-2 mr-3">
                                <Sparkles className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-emerald-900">
                                  Enhanced AI Context: {evidenceFiles.length} evidence file(s) available
                                </span>
                                <p className="text-xs text-emerald-700 mt-1">
                                  AI responses will reference your uploaded evidence files for more accurate answers
                                </p>
                              </div>
                            </div>
                            <div className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                              ⚡ Enhanced
                            </div>
                          </div>
                        </div>
                      )}

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
                            {evidenceFiles.length > 0 && <span className="ml-1">⚡</span>}
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
                                      {checklistGroup.questions.filter((q: ExtractedQuestion) => q.isDone || q.status === 'done' || q.status === 'completed').length} completed
                                    </span> • 
                                    <span className="ml-1 text-yellow-600 font-medium">
                                      {checklistGroup.questions.filter((q: ExtractedQuestion) => !q.isDone && q.status !== 'done' && q.status !== 'completed').length} pending
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {Math.round((checklistGroup.questions.filter((q: ExtractedQuestion) => q.isDone || q.status === 'done' || q.status === 'completed').length / checklistGroup.questions.length) * 100)}% complete
                                </span>
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${(checklistGroup.questions.filter((q: ExtractedQuestion) => q.isDone || q.status === 'done' || q.status === 'completed').length / checklistGroup.questions.length) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                                
                                {/* Send Checklist to Trust Portal Button - Enhanced */}
                                {checklistGroup.id !== 'manual' && 
                                 checklistGroup.questions.filter((q: ExtractedQuestion) => (q.answer && q.answer.trim() !== '') || q.status === 'completed').length === checklistGroup.questions.length &&
                                 checklistGroup.questions.length > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                      ✓ Ready for Portal
                                    </span>
                                    <button
                                      onClick={() => sendChecklistToTrustPortal(checklistGroup)}
                                      disabled={sendingToTrustPortal}
                                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 flex items-center text-sm font-semibold shadow-md hover:shadow-lg"
                                    >
                                      {sendingToTrustPortal && trustPortalProgress.item ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          <span className="hidden sm:inline">{trustPortalProgress.item}</span>
                                          <span className="sm:hidden">Sending...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="h-4 w-4 mr-2" />
                                          <span className="hidden sm:inline">Send Complete Checklist to Trust Portal</span>
                                          <span className="sm:hidden">Send to Portal</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                                
                                {/* Progress indicator for incomplete checklists */}
                                {checklistGroup.id !== 'manual' && 
                                 checklistGroup.questions.filter((q: ExtractedQuestion) => q.isDone || q.status === 'done' || q.status === 'completed').length < checklistGroup.questions.length &&
                                 checklistGroup.questions.length > 0 && (
                                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                                                          {checklistGroup.questions.length - checklistGroup.questions.filter((q: ExtractedQuestion) => q.isDone || q.status === 'done' || q.status === 'completed').length} questions pending
                                  </div>
                                )}
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
                            <div className="flex items-start space-x-3 flex-1">
                              {question.answer && (
                                <button
                                  onClick={() => toggleQuestionExpansion(question.id)}
                                  className="mt-1 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                  title={expandedQuestions.has(question.id) ? "Hide answer" : "Show answer"}
                                >
                                  {expandedQuestions.has(question.id) ? (
                                    <ChevronDown className="h-4 w-4 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-600" />
                                  )}
                                </button>
                              )}
                              <h4 className="text-lg font-medium text-gray-800 flex-1 pr-4">{question.text}</h4>
                            </div>
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
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Completed
                                </span>
                              )}
                              {question.status === 'needs-support' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Needs Support
                                </span>
                              )}
                              {(question.isDone || question.status === 'done' || question.status === 'completed') && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Done
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {question.answer && expandedQuestions.has(question.id) && (
                            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-4">
                              <h5 className="font-semibold text-purple-900 mb-2">Compliance Response:</h5>
                              {question.isEditing ? (
                                <div className="space-y-3">
                                  <textarea
                                    className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-800"
                                    rows={4}
                                    value={question.answer}
                                    onChange={(e) => updateQuestionAnswer(question.id, e.target.value)}
                                    placeholder="Edit the answer..."
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => toggleEditMode(question.id)}
                                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => {
                                        // Auto-save and set as done
                                        setExtractedQuestions(prev => prev.map(q => 
                                          q.id === question.id 
                                            ? { ...q, isEditing: false, status: 'done', isDone: true }
                                            : q
                                        ));
                                      }}
                                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                    >
                                      Save Answer
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-purple-800 prose prose-purple max-w-none">
                                    {question.answer.split('\n').map((line, index) => (
                                      <p key={index} className="mb-2 last:mb-0">
                                        {line.split(/(\*\*.*?\*\*)/).map((part, partIndex) => 
                                          part.startsWith('**') && part.endsWith('**') ? (
                                            <strong key={partIndex} className="font-semibold">
                                              {part.slice(2, -2)}
                                            </strong>
                                          ) : (
                                            part
                                          )
                                        )}
                                      </p>
                                    ))}
                                  </div>
                                  {question.isDone && (
                                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Marked as Done
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Show a preview hint when answer exists but is collapsed */}
                          {question.answer && !expandedQuestions.has(question.id) && (
                            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4">
                              <p className="text-sm text-gray-600 italic">
                                Answer available - click the arrow to expand
                              </p>
                            </div>
                          )}
                          
                          {question.status === 'pending' && (
                            <button
                              onClick={() => showEvidenceSelectionForSingleQuestion(question)}
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

                                                        {(question.status === 'completed' || question.status === 'done') && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => showEvidenceSelectionForSingleQuestion(question)}
                                disabled={isGeneratingAnswers}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center text-sm"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Regenerate
                              </button>
                              <button
                                onClick={() => toggleEditMode(question.id)}
                                disabled={!question.answer}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center text-sm"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Edit Answer
                              </button>

                              {/* Send to Trust Portal - for Manual Questions - Enhanced */}
                              {(!question.checklistId || question.checklistId === 'manual') && question.answer && (
                                <button
                                  onClick={() => sendQuestionToTrustPortal(question)}
                                  disabled={sendingQuestionId === question.id || sendingToTrustPortal}
                                  className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 flex items-center text-sm font-medium shadow-sm hover:shadow-md"
                                  title="Send this individual question and answer to Trust Portal for enterprise review"
                                >
                                  {sendingQuestionId === question.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Sending to Portal...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-2" />
                                      <span className="hidden sm:inline">Send to Trust Portal</span>
                                      <span className="sm:hidden">Send</span>
                                    </>
                                  )}
                                </button>
                              )}

                            </div>
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
                {/* Question-Based Documents (if any exist) - MOVED TO TOP */}
                {extractedQuestions.length > 0 && extractedQuestions.some(q => q.requiresDoc || q.docDescription) && (
                  <div className="mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <ClipboardList className="h-6 w-6 mr-3 text-blue-600" />
                        Question-Specific Document Requirements
                      </h3>
                      <p className="text-sm text-blue-700 mb-4">
                        Upload supporting documents for relevant questions from your checklist:
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
                            
                            {/* Check if documents already exist for this question */}
                            {(() => {
                              const existingDocs = uploadedSupportingDocs.filter(doc => doc.questionId === question.id);
                              const hasDocuments = existingDocs.length > 0;
                              
                              return (
                                <div className="flex items-center gap-3">
                                  {!hasDocuments ? (
                                    <>
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
                                    </>
                                  ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 w-full">
                                      <div className="flex items-center text-green-800">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        <span className="text-sm font-medium">
                                          Document Requirements Fulfilled
                                        </span>
                                      </div>
                                      <div className="mt-2 space-y-1">
                                        {existingDocs.map((doc) => (
                                          <div key={doc.id} className="flex items-center text-sm text-green-700">
                                            <FileText className="h-3 w-3 mr-2" />
                                            <span className="truncate">{doc.filename}</span>
                                            <span className="ml-2 text-green-600">
                                              ({(doc.fileSize / 1024).toFixed(1)} KB)
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                      <p className="text-xs text-green-600 mt-2">
                                        ✓ This question's document requirements are complete. 
                                        No additional uploads needed.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual/General Supporting Documents - Reduced Prominence */}
                <div className="mt-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Upload className="h-4 w-4 mr-2 text-gray-500" />
                      General Supporting Documents (Optional)
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Upload additional documents not specific to any question
                    </p>

                    {supportDocUploadError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-xs">
                        <p className="text-red-700">{supportDocUploadError}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., Security policy document..."
                          value={supportDocDescription}
                          onChange={(e) => setSupportDocDescription(e.target.value)}
                          disabled={isUploadingSupportDoc}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Category (Optional)
                        </label>
                        <select
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
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

                    <div className="flex items-center gap-3">
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
                        className={`inline-flex items-center px-3 py-2 text-sm rounded cursor-pointer transition-colors ${
                          isUploadingSupportDoc
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isUploadingSupportDoc ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3 w-3 mr-1" />
                            Upload File
                          </>
                        )}
                      </label>
                      
                      <div className="text-xs text-gray-500">
                        PDF, Images, DOC, DOCX, TXT
                      </div>
                    </div>

                    {/* Enhanced Uploaded Documents List */}
                    {uploadedSupportingDocs.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-800">
                            Supporting Documents ({uploadedSupportingDocs.length})
                          </h5>
                          <span className="text-xs text-gray-500">
                            Ready for Trust Portal
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {uploadedSupportingDocs.map((doc) => (
                            <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                  <div className="p-2 bg-green-50 rounded-lg">
                                    <FileText className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h6 className="font-medium text-gray-900 text-sm truncate">
                                      {doc.originalName}
                                    </h6>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="text-xs text-gray-500">
                                        {(doc.fileSize / 1024).toFixed(1)} KB
                                      </span>
                                      {doc.category && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                          {doc.category}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400">
                                        {new Date(doc.uploadDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {doc.description && (
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {doc.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-3">
                                  <a
                                    href={`/api/checklists/documents/${doc.id}/download`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                                    title="View document"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </a>
                                  <button
                                    onClick={() => sendSupportingDocumentToTrustPortal(doc)}
                                    disabled={sendingDocumentId === doc.id || sendingToTrustPortal}
                                    className="inline-flex items-center px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                                    title="Send to Trust Portal"
                                  >
                                    {sendingDocumentId === doc.id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="h-3 w-3 mr-1" />
                                        Send to Portal
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => deleteStandaloneSupportDoc(doc.id)}
                                    className="inline-flex items-center px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                                    title="Delete document"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                  <p className="text-lg text-gray-600">Get instant help from our compliance experts using our AI-powered assistant</p>
                </div>

                {selectedVendorId ? (
                  <ChatbotAssistance vendorId={selectedVendorId} />
                ) : (
                  <div className="text-center py-12 border border-gray-200 rounded-lg">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {uploadError && uploadError.includes('Authentication') 
                        ? 'Login Required for Vendor Access'
                        : 'Select a Vendor First'
                      }
                    </h3>
                    <p className="text-gray-500">
                      {uploadError && uploadError.includes('Authentication') 
                        ? 'Please log in to access vendors and use vendor-specific features like assistance.'
                        : 'Please select a vendor from the dropdown above to request assistance.'
                      }
                    </p>
                    {uploadError && uploadError.includes('Authentication') && (
                      <div className="mt-4">
                        <button 
                          onClick={() => window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Login to Access Vendors
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}


        </div>

        {/* Add Manual Question Modal */}
        {showAddQuestionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Manual Question</h3>
                <button
                  onClick={() => setShowAddQuestionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={manualQuestionText}
                    onChange={(e) => setManualQuestionText(e.target.value)}
                    placeholder="Enter your compliance question..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiresDoc"
                    checked={manualQuestionRequiresDoc}
                    onChange={(e) => setManualQuestionRequiresDoc(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="requiresDoc" className="text-sm text-gray-700">
                    Requires supporting document
                  </label>
                </div>
                
                {manualQuestionRequiresDoc && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Description
                    </label>
                    <input
                      type="text"
                      value={manualQuestionDocDescription}
                      onChange={(e) => setManualQuestionDocDescription(e.target.value)}
                      placeholder="Describe what document is needed..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isAddingManualQuestion}
                >
                  Cancel
                </button>
                <button
                  onClick={addManualQuestion}
                  disabled={!manualQuestionText.trim() || isAddingManualQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isAddingManualQuestion ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Add Question
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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
                                            'Generate Responses'
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

        {/* Generate Document Modal */}
        {showGenerateDocModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  Generate Compliance Evidence Document
                </h3>
                <button
                  onClick={closeGenerateDocModal}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isGeneratingDocument}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>


              
              {documentGenerationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{documentGenerationError}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={generateDocTitle}
                    onChange={(e) => setGenerateDocTitle(e.target.value)}
                    placeholder="e.g., Data Privacy Policy, Security Incident Response Plan, Vendor Risk Assessment..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isGeneratingDocument}
                  />
                  <p className="text-xs text-gray-500 mt-1">Be specific about the type of evidence document you need</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Category
                  </label>
                  <select
                    value={generateDocCategory}
                    onChange={(e) => setGenerateDocCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isGeneratingDocument}
                  >
                    <option value="">Select category (helps tailor content)</option>
                    <option value="Security">Security (ISO 27001, NIST, SOC 2)</option>
                    <option value="Data Privacy">Data Privacy (GDPR, CCPA, PIPEDA)</option>
                    <option value="Financial Compliance">Financial Compliance (AML, KYC, SOX)</option>
                    <option value="Policies">Corporate Policies & Procedures</option>
                    <option value="Audit">Audit Reports & Assessments</option>
                    <option value="Risk Management">Risk Management & Controls</option>
                    <option value="Vendor Management">Third-Party & Vendor Management</option>
                    <option value="Business Continuity">Business Continuity & Disaster Recovery</option>
                    <option value="Training">Training & Awareness Programs</option>
                    <option value="General">General Compliance</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Category determines which compliance frameworks and requirements to include</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Requirements & Context
                  </label>
                  <textarea
                    value={generateDocInstructions}
                    onChange={(e) => setGenerateDocInstructions(e.target.value)}
                    placeholder="Examples:
• Include specific technical controls for cloud infrastructure
• Address multi-jurisdictional compliance requirements
• Focus on financial services regulatory requirements
• Include incident response procedures for data breaches
• Address specific audit findings or gaps"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={5}
                    disabled={isGeneratingDocument}
                  />
                  <p className="text-xs text-gray-500 mt-1">AI will combine this with your questionnaire answers and company context</p>
                </div>
                
                {generateDocQuestionId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      <strong>📎 Question-Specific Document:</strong> This evidence will be directly linked to the question that requires supporting documentation.
                    </p>
                  </div>
                )}

                {/* Context Preview */}
                {selectedVendorId && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-700 text-sm font-medium mb-1">Context that will be used:</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>• Vendor company information and industry context</p>
                      <p>• Current questionnaire questions and AI-generated answers</p>
                      <p>• Existing evidence files (to avoid duplication)</p>
                      <p>• Relevant compliance frameworks based on title and category</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={closeGenerateDocModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isGeneratingDocument}
                >
                  Cancel
                </button>
                <button
                  onClick={generateAndSaveDocument}
                  disabled={!generateDocTitle.trim() || isGeneratingDocument}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isGeneratingDocument ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Evidence Document...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Evidence Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}


        </main>

        {/* Evidence File Preview Modal */}
        <EvidenceFilePreview
          files={pendingEvidenceFiles}
          isOpen={showEvidencePreview}
          onClose={() => {
            setShowEvidencePreview(false);
            setPendingEvidenceFiles([]);
          }}
          onApprove={handleEvidenceApproval}
          onReject={(fileId) => {
            setPendingEvidenceFiles(prev => prev.filter((_, index) => `file-${index}` !== fileId));
          }}
          isProcessing={isUploadingEvidence}
        />

        {/* Enhanced Text File Viewer */}
        <TextFileViewer
          file={textViewerData.file}
          url={textViewerData.url}
          filename={textViewerData.filename}
          isOpen={showTextViewer}
          onClose={() => {
            setShowTextViewer(false);
            setTextViewerData({});
          }}
        />
        
        {/* Evidence Selection Modal */}
        <EvidenceSelectionModal
          isOpen={showEvidenceSelectionModal}
          onClose={handleEvidenceSelectionCancel}
          onConfirm={handleEvidenceSelectionConfirm}
          evidenceFiles={evidenceFiles}
          question={pendingGenerationRequest?.question}
          isLoading={isGeneratingAnswers}
        />

        {/* Follow-up Modal */}
        {showFollowUpModal && <FollowUpModal />}

        {/* Document Relevance Modal */}
        {showRelevanceModal && relevanceResult && pendingUpload && (
          <DocumentRelevanceModal
            isOpen={showRelevanceModal}
            onClose={handleModalCancel}
            onConfirm={handleModalConfirm}
            onCancel={handleModalCancel}
            relevanceResult={relevanceResult}
            fileName={pendingUpload.file.name}
          />
        )}
    </>
  );
};

const QuestionnairesPage = () => {
  return <QuestionnairesContent />;
};

export default QuestionnairesPage;