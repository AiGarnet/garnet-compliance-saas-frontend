"use client";

import React, { useState, useEffect, useRef, ChangeEvent, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Filter, Plus, Search, SlidersHorizontal, X, Upload, FileText, FileType, Files, RefreshCw, Trash2, Sparkles, MessageSquare, Loader2, Building2 } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { QuestionnaireList, Questionnaire, QuestionnaireStatus } from "@/components/dashboard/QuestionnaireList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Header from '@/components/Header';
import { debounce } from 'lodash';
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { QuestionnaireService } from '@/lib/services/questionnaireService';
import { EnhancedAnswerDisplay } from '@/components/questionnaire/EnhancedAnswerDisplay';
import { vendors as vendorAPI } from '@/lib/api';

interface QuestionAnswer {
  question: string;
  answer: string;
  isLoading?: boolean;
  hasError?: boolean;
  isGenerated?: boolean;
}

interface SimpleVendor {
  id: string;
  name: string;
  status: string;
}

const MAX_QUESTIONS = 500;
const MAX_QUESTION_LENGTH = 200;
const AUTOSAVE_KEY = 'questionnaire_draft';

const QuestionnairesPage = () => {
  // ✅ CORRECT: ALL hooks must be declared at the top level, before any conditional returns
  const router = useRouter();
  
  // State declarations - ALL hooks first
  const [hasMounted, setHasMounted] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Vendor states
  const [vendors, setVendors] = useState<SimpleVendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(false);
  
  // New state variables for the questionnaire input modal
  const [showQuestionnaireInput, setShowQuestionnaireInput] = useState(false);
  const [questionnaireInput, setQuestionnaireInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Add state for file upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New states for enhanced features
  const [questionnaireTitle, setQuestionnaireTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [duplicateLines, setDuplicateLines] = useState<number[]>([]);
  const [longLines, setLongLines] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [findReplaceMode, setFindReplaceMode] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // AI Assistant state for questionnaire creation
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [generatedAnswers, setGeneratedAnswers] = useState<QuestionAnswer[]>([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [answerCache, setAnswerCache] = useState<Record<string, string>>({});

  // Custom hooks - also must be at top level
  const { isLoading: authLoading } = useAuthGuard();

  // useCallback hooks - at top level
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to calculate scrollHeight accurately
    textarea.style.height = 'auto';
    
    // Set new height, with max-height enforced by CSS
    textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
  }, []);
  
  // Create debounced version once
  const debouncedResizeRef = useRef<ReturnType<typeof debounce> | null>(null);
  if (!debouncedResizeRef.current) {
    debouncedResizeRef.current = debounce(resizeTextarea, 100);
  }

  // useEffect hooks - at top level
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Calculate and update question count and validation when input changes
  useEffect(() => {
    const lines = questionnaireInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    setQuestionCount(lines.length);
    
    // Check for duplicates
    const duplicates: number[] = [];
    const seen = new Set<string>();
    
    lines.forEach((line, index) => {
      if (seen.has(line.toLowerCase())) {
        duplicates.push(index + 1);
      } else {
        seen.add(line.toLowerCase());
      }
    });
    
    setDuplicateLines(duplicates);
    
    // Check for long lines
    const longLinesFound: number[] = [];
    lines.forEach((line, index) => {
      if (line.length > MAX_QUESTION_LENGTH) {
        longLinesFound.push(index + 1);
      }
    });
    
    setLongLines(longLinesFound);
    
    // Validate total count
    if (lines.length > MAX_QUESTIONS) {
      setValidationError(`Exceeded maximum of ${MAX_QUESTIONS} questions. Please reduce the number of questions.`);
    } else if (duplicates.length > 0) {
      setValidationError(`Duplicate questions found on lines: ${duplicates.join(', ')}`);
    } else if (longLinesFound.length > 0) {
      setValidationError(`Questions exceeding ${MAX_QUESTION_LENGTH} characters on lines: ${longLinesFound.join(', ')}`);
    } else {
      setValidationError(null);
    }
    
    // Auto-save draft (only on client side)
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
        title: questionnaireTitle,
        questions: questionnaireInput
      }));
    }
    
  }, [questionnaireInput, questionnaireTitle]);

  useEffect(() => {
    resizeTextarea();
    return () => {
      debouncedResizeRef.current?.cancel();
    };
  }, [questionnaireInput, resizeTextarea]);

  // Load autosaved draft
  useEffect(() => {
    if (showQuestionnaireInput && typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
      if (savedDraft) {
        try {
          const { title, questions } = JSON.parse(savedDraft);
          setQuestionnaireTitle(title || '');
          setQuestionnaireInput(questions || '');
        } catch (e) {
          console.error('Error loading saved draft:', e);
        }
      }
    }
  }, [showQuestionnaireInput]);

  // Focus trap for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showQuestionnaireInput || e.key !== 'Tab') return;
      
      const modal = modalRef.current;
      if (!modal) return;
      
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQuestionnaireInput]);

  // Fetch questionnaires from API
  const fetchQuestionnaires = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch questionnaires from database
      const { questionnaires: questionnairesAPI } = await import('@/lib/api');
      
      let apiQuestionnaires: Questionnaire[] = [];
      
      if (selectedVendorId) {
        // Get questionnaires for specific vendor
        const response = await questionnairesAPI.getByVendor(selectedVendorId);
        apiQuestionnaires = response.questionnaires || [];
      } else {
        // Get all questionnaires
        const response = await questionnairesAPI.getAll();
        apiQuestionnaires = response.questionnaires || [];
      }
      
      // Transform API response to match frontend interface
      const transformedQuestionnaires = apiQuestionnaires.map((q: any) => ({
        id: q.id.toString(),
        name: q.title || 'Untitled Questionnaire',
        status: q.status || 'Not Started',
        dueDate: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        progress: q.answerCount > 0 ? 100 : 0,
        vendorId: q.vendorId?.toString() || '',
        vendorName: q.vendorName || 'Unknown Vendor',
        answers: [], // Will be loaded when needed
      }));
      
      setQuestionnaires(transformedQuestionnaires);
      
      // Also keep localStorage as backup (but prioritize database)
      if (typeof window !== 'undefined') {
        const questionnairesData = localStorage.getItem('user_questionnaires');
        
        if (questionnairesData && transformedQuestionnaires.length === 0) {
          try {
            const localQuestionnaires = JSON.parse(questionnairesData);
            setQuestionnaires(localQuestionnaires);
          } catch (e) {
            console.error('Error parsing stored questionnaires:', e);
          }
        }
      }
      
    } catch (err) {
      console.error('Error fetching questionnaires:', err);
      setError('Failed to load questionnaires. Please try again.');
      
      // Fallback to localStorage on API error
      if (typeof window !== 'undefined') {
        const questionnairesData = localStorage.getItem('user_questionnaires');
        
        if (questionnairesData) {
          try {
            const localQuestionnaires = JSON.parse(questionnairesData);
            setQuestionnaires(localQuestionnaires);
          } catch (e) {
            console.error('Error parsing stored questionnaires:', e);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedVendorId]);

  // Fetch vendors from API
  const fetchVendors = useCallback(async () => {
    setIsLoadingVendors(true);
    try {
      const response = await vendorAPI.getAll();
      if (response.vendors && Array.isArray(response.vendors)) {
        const transformedVendors = response.vendors.map((vendor: any) => ({
          id: vendor.vendorId?.toString() || vendor.id || vendor.uuid,
          name: vendor.companyName || vendor.name || 'Unknown Vendor',
          status: vendor.status || 'Questionnaire Pending'
        }));
        setVendors(transformedVendors);
      } else {
        setVendors([]);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setVendors([]);
    } finally {
      setIsLoadingVendors(false);
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    fetchQuestionnaires();
    fetchVendors();
  }, []);
  
  // Focus the textarea when the modal is shown
  useEffect(() => {
    if (showQuestionnaireInput) {
      // Focus on title first, then textarea
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    }
  }, [showQuestionnaireInput]);

  // Handle editing an individual answer
  const handleAnswerEdit = useCallback((index: number, newAnswer: string) => {
    setGeneratedAnswers(prev => {
      const updatedAnswers = prev.map((qa, i) => 
        i === index 
          ? { ...qa, answer: newAnswer, hasError: false, isGenerated: false }
          : qa
      );
      
      // Update answer cache synchronously
      const question = prev[index]?.question;
      if (question) {
        setAnswerCache(cache => ({ ...cache, [question]: newAnswer }));
      }
      
      return updatedAnswers;
    });
  }, []);

  // Handle regenerating a single answer
  const handleRegenerateAnswer = useCallback(async (index: number) => {
    // Access current state directly
    const currentQuestion = generatedAnswers[index]?.question;
    if (!currentQuestion) return;
    
    // Check cache first
    const cachedAnswer = answerCache[currentQuestion];
    if (cachedAnswer) {
      setGeneratedAnswers(prev => 
        prev.map((qa, i) => 
          i === index 
            ? { ...qa, answer: cachedAnswer, hasError: false, isGenerated: true }
            : qa
        )
      );
      return;
    }

    // Set loading state for this specific answer
    setGeneratedAnswers(prev => 
      prev.map((qa, i) => 
        i === index 
          ? { ...qa, isLoading: true, hasError: false }
          : qa
      )
    );

    try {
      const result = await QuestionnaireService.getAnswer(currentQuestion);
      
      if (result.success && result.answer) {
        const newAnswer = result.answer;
        
        // Update the answer and cache in a single operation
        setGeneratedAnswers(prev => 
          prev.map((qa, i) => 
            i === index 
              ? { 
                  ...qa, 
                  answer: newAnswer, 
                  isLoading: false, 
                  hasError: newAnswer.includes('We couldn\'t generate an answer'),
                  isGenerated: true 
                }
              : qa
          )
        );
        
        // Cache the new answer
        setAnswerCache(prev => ({ ...prev, [currentQuestion]: newAnswer }));
      } else {
        throw new Error(result.error || 'Failed to regenerate answer');
      }
    } catch (error) {
      console.error('Error regenerating answer:', error);
      
      // Set error state
      setGeneratedAnswers(prev => 
        prev.map((qa, i) => 
          i === index 
            ? { 
                ...qa, 
                answer: 'We couldn\'t generate an answer—please try again.', 
                isLoading: false, 
                hasError: true,
                isGenerated: false 
              }
            : qa
        )
      );
    }
  }, [generatedAnswers, answerCache]);

  // ✅ CORRECT: Early return AFTER all hooks are declared
  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleNewQuestionnaire = () => {
    setShowQuestionnaireInput(true);
    setQuestionnaireTitle('');
    setQuestionnaireInput('');
    setQuestionAnswers([]);
    setShowPreview(false);
    setFindReplaceMode(false);
    setUploadError(null);
    setValidationError(null);
    setGeneratedAnswers([]);
    setShowAIAssistant(false);
    setSelectedVendorId('');
  };

  // Generate AI answers for questions with enhanced progress tracking
  const handleGenerateAnswers = async (): Promise<QuestionAnswer[]> => {
    const questions = questionnaireInput
      .split('\n')
        .map(line => line.trim())
      .filter(line => line.length > 0);

    if (questions.length === 0) {
      setValidationError("No questions detected – please add questions first.");
      return [];
    }

    setIsGeneratingAnswers(true);
    setValidationError(null);
    
    // Initialize answers with loading states
    const initialAnswers = questions.map(question => ({
      question,
      answer: '',
      isLoading: true,
      isGenerated: true
    }));
    setGeneratedAnswers(initialAnswers);
    setShowAIAssistant(true);
    
    try {
      // Use the enhanced QuestionnaireService with progress tracking
      const result = await QuestionnaireService.generateAnswers(
        questions,
        (completed, total, currentQuestion) => {
          // Update progress for individual questions
          setGeneratedAnswers(prev => 
            prev.map((qa, index) => ({
              ...qa,
              isLoading: index >= completed,
              answer: index < completed ? (prev[index]?.answer || 'Generated successfully') : qa.answer
            }))
          );
        }
      );

      if (result.success && result.data) {
        const finalAnswers = result.data.answers.map(answer => ({
          question: answer.question,
          answer: answer.answer,
          isLoading: false,
          isGenerated: true,
          hasError: answer.answer.includes('We couldn\'t generate an answer')
        }));
        
        setGeneratedAnswers(finalAnswers);
        
        // Show success message with metadata
        if (result.data.metadata) {
          const { successfulAnswers, failedAnswers, totalQuestions } = result.data.metadata;
          if (failedAnswers > 0) {
            setValidationError(
              `Generated ${successfulAnswers}/${totalQuestions} answers successfully. ${failedAnswers} failed - you can regenerate them individually.`
            );
          }
        }
        
        return finalAnswers;
      } else {
        throw new Error(result.error || 'Failed to generate answers');
      }
      
    } catch (error) {
      console.error('Error generating answers:', error);
      
      // Update all answers to show error state
      const errorAnswers = questions.map(question => ({
        question,
        answer: 'We couldn\'t generate an answer—please try again.',
        isLoading: false,
        isGenerated: false,
        hasError: true
      }));
      
      setGeneratedAnswers(errorAnswers);
      setValidationError('Failed to generate AI answers. You can try regenerating individual answers or edit them manually.');
      return errorAnswers;
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  // Wrapper function for button clicks (doesn't return anything)
  const handleGenerateAnswersClick = async () => {
    await handleGenerateAnswers();
  };

  const handleSubmitQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionnaireInput.trim()) {
      setValidationError("No questions detected – please add one per line.");
      return;
    }
    
    if (!questionnaireTitle.trim()) {
      setValidationError("Please provide a title for the questionnaire.");
      return;
    }
    
    // Parse input into separate questions (non-empty lines)
    const questions = questionnaireInput
      .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (questions.length === 0) {
      setValidationError("No questions detected – please add one per line.");
      return;
    }
    
    if (validationError) {
      return; // Don't submit if there are validation errors
    }
    
    setIsSubmitting(true);
    
    try {
      // First, try to save directly to the backend database
      const shouldGenerateAnswers = generatedAnswers.length > 0 || true; // Always generate answers for better UX
      
      const databaseResult = await QuestionnaireService.saveQuestionnaireToDatabase(
        questionnaireTitle,
        questions,
        shouldGenerateAnswers,
        selectedVendorId || undefined
      );
      
      let newQuestionnaire: Questionnaire & { answers?: QuestionAnswer[] };
      
      if (databaseResult.success && databaseResult.questionnaire) {
        // Successfully saved to database
        console.log('✅ Questionnaire saved to database successfully!');
        console.log('📊 Created vendor:', databaseResult.vendor?.name);
        console.log('📝 Questionnaire ID:', databaseResult.questionnaire.id);
        
        // Get selected vendor info
        const selectedVendor = vendors.find(v => v.id === selectedVendorId);
        
        newQuestionnaire = {
          id: databaseResult.questionnaire.id,
          name: databaseResult.questionnaire.name,
          status: "Completed" as QuestionnaireStatus, // Mark as completed since we have answers
          dueDate: databaseResult.questionnaire.dueDate,
          progress: 100, // 100% since we have all answers
          answers: databaseResult.questionnaire.answers,
          vendorId: selectedVendorId || databaseResult.questionnaire.vendorId,
          vendorName: selectedVendor?.name || databaseResult.questionnaire.vendorName,
        };
        
        // Show success message
        setValidationError(null);
        
      } else {
        // Fallback to local storage if database save fails
        console.warn('⚠️ Database save failed, falling back to local storage:', databaseResult.error);
        
        // Use generated answers if available, otherwise generate them
        let finalAnswers = generatedAnswers;
        
        if (finalAnswers.length === 0) {
          // Generate answers if not already done
          finalAnswers = await handleGenerateAnswers();
        }
        
        // Get selected vendor info
        const selectedVendor = vendors.find(v => v.id === selectedVendorId);
        
        newQuestionnaire = {
          id: `q${Date.now()}`,  
          name: questionnaireTitle,
          status: "Not Started" as QuestionnaireStatus,
          dueDate: new Date().toLocaleDateString(),
          progress: finalAnswers.length > 0 ? 100 : 0,
          answers: finalAnswers.length > 0 ? finalAnswers : questions.map(q => ({ question: q, answer: '' })),
          vendorId: selectedVendorId,
          vendorName: selectedVendor?.name,
        };
        
        // Show warning about fallback
        setValidationError(`⚠️ Saved locally only. Database connection issue: ${databaseResult.error}`);
      }
      
      // Always store in local storage for offline access and backup (only on client side)
      if (typeof window !== 'undefined') {
        const existingQuestionnaires = localStorage.getItem('user_questionnaires');
        let userQuestionnaires: Array<Questionnaire & { answers?: QuestionAnswer[] }> = [];
        
        if (existingQuestionnaires) {
          try {
            userQuestionnaires = JSON.parse(existingQuestionnaires);
          } catch (e) {
            console.error('Error parsing stored questionnaires:', e);
          }
        }
        
        // Add the new questionnaire
        userQuestionnaires.push(newQuestionnaire);
        
        // Save back to local storage
        localStorage.setItem('user_questionnaires', JSON.stringify(userQuestionnaires));
        
        // Clear autosaved draft
        localStorage.removeItem(AUTOSAVE_KEY);
      }
      
      // Close modal
      closeQuestionnaireInput();
      
      // Refresh the questionnaire list
      fetchQuestionnaires();
      
      // Redirect to the chat interface instead of answers page
      console.log('🔄 Redirecting to chat page for questionnaire:', newQuestionnaire.id);
      
      // Close modal first to avoid navigation issues
      setShowQuestionnaireInput(false);
      
      // Use setTimeout to ensure modal closes before navigation
      setTimeout(() => {
        router.push(`/questionnaires/${newQuestionnaire.id}/chat`);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error submitting questionnaire:', error);
      setValidationError('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeQuestionnaireInput = () => {
    setShowQuestionnaireInput(false);
    setQuestionnaireTitle('');
    setQuestionnaireInput('');
    setQuestionAnswers([]);
    setShowPreview(false);
    setFindReplaceMode(false);
    setGeneratedAnswers([]);
    setShowAIAssistant(false);
    setSelectedVendorId('');
  };

  // Process file regardless of upload method
  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // File size check (10MB limit as example)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File is unusually large (>10MB). Please check the file before uploading.');
      }
      
      // Sanitize filename
      const sanitizedName = file.name.replace(/[^\w\s.-]/g, '');
      
      // Check file type
      const fileExtension = sanitizedName.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'txt') {
        // Read file content
        const text = await readFileAsText(file);
        
        // Set the text to the textarea
        setQuestionnaireInput(text);
        
        // Auto-generate title from filename if not set
        if (!questionnaireTitle) {
          const baseName = sanitizedName.split('.')[0]
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
          setQuestionnaireTitle(baseName);
        }
      } else if (fileExtension === 'csv') {
        // Read and parse CSV
        const text = await readFileAsText(file);
        const lines = text.split('\n')
          .map(line => {
            // Extract first column if CSV
            const columns = line.split(',');
            return columns[0]?.trim().replace(/^["']|["']$/g, '') || '';
          })
          .filter(line => line.length > 0)
          .join('\n');
        
        setQuestionnaireInput(lines);
        
        // Auto-generate title from filename
        if (!questionnaireTitle) {
          const baseName = sanitizedName.split('.')[0]
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
          setQuestionnaireTitle(baseName);
        }
      } else if (fileExtension === 'md') {
        // Basic Markdown support - extract lines that might be questions
        const text = await readFileAsText(file);
        const lines = text.split('\n')
          .filter(line => {
            // Skip headers, lists markers, etc.
            const trimmed = line.trim();
            return trimmed.length > 0 && 
                  !trimmed.startsWith('#') && 
                  !trimmed.startsWith('-') && 
                  !trimmed.startsWith('*') &&
                  !trimmed.startsWith('```');
          })
          .join('\n');
        
        setQuestionnaireInput(lines);
        
        // Auto-generate title from filename
        if (!questionnaireTitle) {
          const baseName = sanitizedName.split('.')[0]
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
          setQuestionnaireTitle(baseName);
        }
      } else {
        throw new Error('Only .txt, .csv, and .md files are supported at this time');
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadError(error instanceof Error ? error.message : 'An error occurred while processing the file');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file upload via input
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await processFile(file);
  };
  
  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File read error'));
      };
      
      reader.readAsText(file);
    });
  };

  // Clear textarea
  const handleClearTextarea = () => {
    if (confirm('Are you sure you want to clear all questions?')) {
      setQuestionnaireInput('');
      setGeneratedAnswers([]);
      textareaRef.current?.focus();
    }
  };

  // Toggle preview mode
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Execute find and replace
  const handleFindReplace = () => {
    if (!findText) return;
    
    const newText = questionnaireInput.replace(
      new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
      replaceText
    );
    
    setQuestionnaireInput(newText);
    setFindText('');
    setReplaceText('');
    setFindReplaceMode(false);
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  // Remove empty lines
  const handleRemoveEmptyLines = () => {
    const lines = questionnaireInput.split('\n').filter(line => line.trim() !== '');
    setQuestionnaireInput(lines.join('\n'));
  };

  // Get parsed questions for preview
  const getParsedQuestions = () => {
    return questionnaireInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  // Add handling for viewing a questionnaire
  const handleViewQuestionnaire = (questionnaire: Questionnaire) => {
      router.push(`/questionnaires/answers?id=${questionnaire.id}`);
  };
  
  // Add handling for editing a questionnaire
  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    // Set the questionnaire input and title
    setQuestionnaireTitle(questionnaire.name);
    
    // If the questionnaire has answers, get the questions from them
    if ((questionnaire as any).answers) {
      const questions = (questionnaire as any).answers.map((qa: any) => qa.question).join('\n');
      setQuestionnaireInput(questions);
    }
    
    // Show the questionnaire input modal
    setShowQuestionnaireInput(true);
  };
  
  // Add handling for deleting a questionnaire
  const handleDeleteQuestionnaire = (questionnaire: Questionnaire) => {
    if (confirm(`Are you sure you want to delete the questionnaire "${questionnaire.name}"?`)) {
      // Get existing questionnaires from local storage (only on client side)
      if (typeof window !== 'undefined') {
        const savedQuestionnaires = localStorage.getItem('user_questionnaires');
        if (savedQuestionnaires) {
          try {
            const userQuestionnaires = JSON.parse(savedQuestionnaires);
            
            // Filter out the questionnaire to delete
            const updatedQuestionnaires = userQuestionnaires.filter(
              (q: Questionnaire) => q.id !== questionnaire.id
            );
            
            // Save back to local storage
            localStorage.setItem('user_questionnaires', JSON.stringify(updatedQuestionnaires));
            
            // Refresh the questionnaire list
            fetchQuestionnaires();
          } catch (e) {
            console.error('Error deleting questionnaire:', e);
          }
        }
      }
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <>
        <Header />
        
      <main id="main-content" className="container mx-auto py-8 px-4">
        {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
              <ClipboardList className="mr-3 h-7 w-7 text-primary" />
                  Questionnaires
                </h1>
            <p className="text-gray-600 mt-1">Manage and track all your compliance questionnaires</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Vendor Dropdown */}
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-w-[200px]"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
              >
                <option value="">All Vendors</option>
                {isLoadingVendors ? (
                  <option disabled>Loading vendors...</option>
                ) : (
                  vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <button 
              className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors"
              onClick={handleNewQuestionnaire}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Questionnaire
            </button>
          </div>
        </div>
        
        {showQuestionnaireInput ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-auto p-4">
              <div 
                ref={modalRef}
              className="bg-white dark:bg-card-bg rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                role="dialog"
                aria-modal="true"
              aria-labelledby="questionnaire-modal-title"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 id="questionnaire-modal-title" className="text-xl font-semibold text-gray-800 dark:text-white">
                  Create Questionnaire with AI Assistance
                      </h2>
                    <button 
                  onClick={closeQuestionnaireInput}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                </div>
                
              <div className="p-6 overflow-auto flex-grow">
                <form onSubmit={handleSubmitQuestionnaire}>
                  {/* Title input */}
                  <div className="mb-4">
                    <label htmlFor="questionnaire-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Questionnaire Title
                    </label>
                    <input
                      type="text"
                      id="questionnaire-title"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="Enter title for this questionnaire"
                      value={questionnaireTitle}
                      onChange={(e) => setQuestionnaireTitle(e.target.value)}
                      required
                      aria-label="Questionnaire title"
                    />
                  </div>

                  {/* Vendor Selection */}
                  <div className="mb-4">
                    <label htmlFor="vendor-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Building2 className="inline h-4 w-4 mr-1" />
                      Select Vendor (Optional)
                    </label>
                    <select
                      id="vendor-select"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      aria-label="Select vendor for questionnaire"
                    >
                      <option value="">-- No vendor selected --</option>
                      {isLoadingVendors ? (
                        <option disabled>Loading vendors...</option>
                      ) : (
                        vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name} ({vendor.status})
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Choose a vendor to associate this questionnaire with their compliance assessment.
                    </p>
                  </div>

                  {!showPreview && !showAIAssistant && (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-800 dark:text-white">Questions</h3>
                          
                          <div className="flex space-x-2">
                            <button 
                              type="button"
                              onClick={handleGenerateAnswersClick}
                              disabled={isGeneratingAnswers || questionCount === 0}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm transition-all"
                            >
                              <Sparkles className="h-4 w-4 mr-1" />
                              {isGeneratingAnswers ? 'Generating...' : 'Generate AI Answers'}
                            </button>
                            <button 
                              type="button"
                              onClick={() => setFindReplaceMode(!findReplaceMode)}
                              className="text-sm text-primary hover:text-primary/80 flex items-center"
                              aria-label="Find and replace"
                            >
                              Find & Replace
                            </button>
                            <button 
                              type="button"
                              onClick={handleRemoveEmptyLines}
                              className="text-sm text-primary hover:text-primary/80 flex items-center"
                              aria-label="Remove empty lines"
                            >
                              Remove Empty Lines
                            </button>
                            <button 
                              type="button"
                              onClick={handleTogglePreview}
                              className="text-sm text-primary hover:text-primary/80 flex items-center"
                              aria-label="Preview questions"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          Type or paste each question on its own line. Click "Generate AI Answers" to get compliance-based responses.
                        </p>
                        
                        {/* Find and replace section */}
                        {findReplaceMode && (
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label htmlFor="find-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Find
                                </label>
                                <input
                                  type="text"
                                  id="find-text"
                                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary"
                                  value={findText}
                                  onChange={(e) => setFindText(e.target.value)}
                                  placeholder="Text to find"
                                />
                              </div>
                              <div>
                                <label htmlFor="replace-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Replace
                    </label>
                                <input
                                  type="text"
                                  id="replace-text"
                                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary"
                                  value={replaceText}
                                  onChange={(e) => setReplaceText(e.target.value)}
                                  placeholder="Replacement text"
                                />
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                                onClick={handleFindReplace}
                                disabled={!findText}
                              >
                                Replace All
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* File upload area */}
                        <div 
                          ref={dropZoneRef}
                          className={`mb-4 border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                        dragActive 
                          ? 'border-primary bg-primary/5' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                          <div className="flex flex-col items-center justify-center">
                            <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {dragActive ? 'Drop file here' : 'Drag and drop a file here, or click to browse'}
                      </p>
                            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                              <div className="flex items-center mr-3">
                                <FileText className="h-4 w-4 mr-1" />
                                <span>.TXT</span>
                              </div>
                              <div className="flex items-center mr-3">
                                <FileType className="h-4 w-4 mr-1" />
                                <span>.CSV</span>
                              </div>
                              <div className="flex items-center">
                                <Files className="h-4 w-4 mr-1" />
                                <span>.MD</span>
                              </div>
                            </div>
                            <label className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        Browse Files
                        <input
                          type="file"
                          className="hidden"
                                accept=".txt,.csv,.md"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                          disabled={isUploading}
                                aria-label="Upload questions file"
                        />
                      </label>
                          </div>
                    </div>
                    
                    {isUploading && (
                          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                            <svg className="animate-spin h-4 w-4 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                      </div>
                    )}
                    
                    {uploadError && (
                          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                        {uploadError}
                          </p>
                        )}
                      </div>
                    
                      <div className="relative mb-4">
                        <textarea
                          ref={textareaRef}
                          className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-md resize-none text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[200px] max-h-[400px]"
                          placeholder="Type or paste each question on its own line (e.g. 'Do you encrypt data at rest?')."
                          value={questionnaireInput}
                          onChange={(e) => {
                            setQuestionnaireInput(e.target.value);
                            debouncedResizeRef.current?.();
                          }}
                          aria-label="Questionnaire input"
                          aria-describedby="question-counter"
                        />
                        
                        <div className="absolute bottom-3 right-3 flex items-center">
                          <button
                            type="button"
                            onClick={handleClearTextarea}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            aria-label="Clear questions"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Preview Panel */}
                  {showPreview && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Question Preview</h3>
                        <div className="flex space-x-2">
                          <button 
                            type="button"
                            onClick={handleGenerateAnswersClick}
                            disabled={isGeneratingAnswers || questionCount === 0}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm transition-all"
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            {isGeneratingAnswers ? 'Generating...' : 'Generate AI Answers'}
                          </button>
                          <button
                            type="button"
                            onClick={handleTogglePreview}
                            className="text-sm text-primary hover:text-primary/80 flex items-center"
                          >
                            Back to Edit
                          </button>
                        </div>
                  </div>

                      <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 max-h-[400px] overflow-y-auto">
                        {getParsedQuestions().length > 0 ? (
                          <ol className="list-decimal pl-5 space-y-2">
                            {getParsedQuestions().map((question, index) => (
                              <li key={index} className="text-gray-800 dark:text-gray-200">
                                {question}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            No questions added yet. Go back to edit and add some questions.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced AI Assistant Panel */}
                  {showAIAssistant && generatedAnswers.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                            AI-Generated Answers
                          </h3>
                          {isGeneratingAnswers && (
                            <div className="ml-4 flex items-center text-sm text-blue-600">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-sm text-gray-500">
                            {generatedAnswers.filter(qa => !qa.isLoading && qa.answer && !qa.hasError).length} / {generatedAnswers.length} completed
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAIAssistant(false)}
                            className="text-sm text-primary hover:text-primary/80 flex items-center"
                          >
                            Back to Edit
                          </button>
                        </div>
                      </div>
                      
                      <EnhancedAnswerDisplay
                        questionAnswers={generatedAnswers}
                        onAnswerEdit={handleAnswerEdit}
                        onRegenerateAnswer={handleRegenerateAnswer}
                        isGenerating={isGeneratingAnswers}
                        className="max-h-[600px] overflow-y-auto"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div id="question-counter" className="text-sm text-gray-600 dark:text-gray-400">
                      {questionCount > 0 ? (
                        <>You've entered {questionCount} question{questionCount !== 1 ? 's' : ''}</>
                      ) : (
                        <>No questions entered yet</>
                      )}
                      {questionCount > MAX_QUESTIONS && (
                        <span className="text-red-500 ml-1">
                          (exceeds maximum of {MAX_QUESTIONS})
                      </span>
                      )}
                      {generatedAnswers.length > 0 && (
                        <span className="text-purple-600 ml-2">
                          • {generatedAnswers.length} AI answers generated
                      </span>
                      )}
                    </div>
                    
                    {/* Validation errors */}
                    {validationError && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {validationError}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeQuestionnaireInput}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!questionnaireInput.trim() || !questionnaireTitle.trim() || isSubmitting || questionCount > MAX_QUESTIONS}
                      className={`py-2 px-6 rounded-md transition-colors ${
                        questionnaireInput.trim() && questionnaireTitle.trim() && !isSubmitting && questionCount <= MAX_QUESTIONS
                          ? 'bg-primary text-white hover:bg-primary/90' 
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                      aria-live="polite"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        'Create Questionnaire'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}
          
          {/* Questionnaire List Component */}
          <QuestionnaireList 
            questionnaires={questionnaires} 
            isLoading={isLoading}
            error={error}
            onRetry={fetchQuestionnaires}
          onAddQuestionnaire={handleNewQuestionnaire}
            onViewQuestionnaire={handleViewQuestionnaire}
            onEditQuestionnaire={handleEditQuestionnaire}
            onDeleteQuestionnaire={handleDeleteQuestionnaire}
            selectedVendorId={selectedVendorId}
          />
        </main>
    </>
  );
};

export default QuestionnairesPage;