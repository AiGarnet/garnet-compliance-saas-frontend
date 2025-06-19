"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  User, 
  Bot, 
  ArrowLeft, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Copy,
  Download,
  Edit,
  Save,
  X,
  Check,
  Shield,
  Target,
  TrendingUp,
  Award,
  Lightbulb,
  BookOpen,
  Zap,
  ChevronRight,
  Star,
  Timer,
  BarChart3,
  Clipboard,
  Building2
} from 'lucide-react';
import Header from '@/components/Header';

interface QuestionAnswer {
  id: string;
  questionId?: string;
  question: string;
  answer: string;
  isLoading?: boolean;
  isMandatory?: boolean;
  needsAttention?: boolean;
  category?: string;
  status?: string;
}

interface Vendor {
  vendorId: number;
  companyName: string;
  region: string;
  status: string;
  contactEmail: string;
  contactName?: string;
  website?: string;
  industry?: string;
  questionnaireAnswers?: QuestionAnswer[];
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  questionIndex?: number;
  isEditing?: boolean;
  category?: string;
  suggestions?: string[];
}

const QUESTION_CATEGORIES = {
  'Security Policy': { icon: Shield, color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
  'Data Protection': { icon: Shield, color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-700' },
  'Access Control': { icon: Target, color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-700' },
  'Compliance': { icon: Award, color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-700' },
  'Business Continuity': { icon: TrendingUp, color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-700' },
  'Training': { icon: BookOpen, color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  'Default': { icon: FileText, color: 'bg-gray-500', lightColor: 'bg-gray-50', textColor: 'text-gray-700' }
};

const SMART_SUGGESTIONS = {
  'security': [
    "We implement industry-standard security measures including...",
    "Our security framework follows ISO 27001 guidelines...",
    "We conduct regular security audits and assessments...",
    "Our incident response plan includes immediate containment..."
  ],
  'data': [
    "We ensure data protection through encryption at rest and in transit...",
    "Our data retention policy complies with GDPR requirements...",
    "We implement data minimization principles...",
    "Access to personal data is restricted based on need-to-know..."
  ],
  'access': [
    "We implement role-based access control (RBAC)...",
    "Multi-factor authentication is required for all administrative access...",
    "We conduct quarterly access reviews...",
    "Privileged accounts are monitored continuously..."
  ],
  'compliance': [
    "We maintain compliance with SOC 2 Type II, GDPR, and ISO 27001...",
    "Our compliance program includes regular internal audits...",
    "We have a dedicated compliance officer who oversees...",
    "Documentation is maintained for all compliance activities..."
  ],
  'backup': [
    "We maintain automated daily backups with offsite storage...",
    "Our RTO is 4 hours and RPO is 1 hour for critical systems...",
    "Backup testing is performed quarterly...",
    "We have documented disaster recovery procedures..."
  ]
};

export function VendorQuestionnaireClient({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [questions, setQuestions] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editedQuestionText, setEditedQuestionText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to detect question category
  const detectQuestionCategory = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes('security') || q.includes('encrypt') || q.includes('incident')) return 'Security Policy';
    if (q.includes('data') || q.includes('privacy') || q.includes('gdpr')) return 'Data Protection';
    if (q.includes('access') || q.includes('authentication') || q.includes('authorization')) return 'Access Control';
    if (q.includes('compliance') || q.includes('audit') || q.includes('regulation')) return 'Compliance';
    if (q.includes('backup') || q.includes('recovery') || q.includes('disaster')) return 'Business Continuity';
    if (q.includes('training') || q.includes('awareness') || q.includes('education')) return 'Training';
    return 'Default';
  };

  // Function to get smart suggestions based on question content
  const getSmartSuggestions = (question: string): string[] => {
    const q = question.toLowerCase();
    if (q.includes('security') || q.includes('encrypt')) return SMART_SUGGESTIONS.security;
    if (q.includes('data') || q.includes('privacy')) return SMART_SUGGESTIONS.data;
    if (q.includes('access') || q.includes('authentication')) return SMART_SUGGESTIONS.access;
    if (q.includes('compliance') || q.includes('audit')) return SMART_SUGGESTIONS.compliance;
    if (q.includes('backup') || q.includes('recovery')) return SMART_SUGGESTIONS.backup;
    return [];
  };

  // Function to generate AI answer for a question
  const generateAIAnswer = async (question: string): Promise<string> => {
    try {
      const apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/ask`;
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate answer');
      }
      
      const data = await response.json();
      return data.answer || "We apologize, but we couldn't generate a response at this time. Please contact our compliance team directly for this information.";
    } catch (error) {
      console.error('Error generating AI answer:', error);
      return "We apologize, but we couldn't generate a response at this time. Please contact our compliance team directly for this information.";
    }
  };

  // Load vendor and questionnaire answers
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        console.log('🔍 Loading vendor questionnaire data for vendor:', vendorId);
        
        // Load vendor basic info
        const vendorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/vendors/${vendorId}`);
        
        if (!vendorResponse.ok) {
          throw new Error(`Vendor not found: ${vendorResponse.status}`);
        }
        
        const vendorData = await vendorResponse.json();
        const vendorInfo = vendorData.vendor;
        console.log('✅ Loaded vendor info:', vendorInfo);
        
        // Load questionnaire answers for this vendor
        const answersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/vendors/${vendorId}/answers`);
        
        let questionnaireAnswers: QuestionAnswer[] = [];
        
        if (answersResponse.ok) {
          const answersData = await answersResponse.json();
          const rawAnswers = answersData.answers || [];
          console.log('✅ Raw questionnaire answers from database:', rawAnswers);
          
          // Filter out metadata entries and transform to frontend format
          questionnaireAnswers = rawAnswers
            .filter((answer: any) => {
              // Exclude metadata entries like __QUESTIONNAIRE_TITLE__
              return answer.question !== '__QUESTIONNAIRE_TITLE__' && 
                     answer.status !== 'Metadata' &&
                     answer.question && 
                     answer.question.trim() !== '';
            })
            .map((answer: any) => ({
              id: answer.id,
              questionId: answer.question_id,
              question: answer.question,
              answer: answer.answer || '',
              isLoading: false,
              isMandatory: true,
              needsAttention: Boolean(!answer.answer || answer.answer.trim() === '' || answer.status === 'Not Started'),
              category: detectQuestionCategory(answer.question),
              status: answer.status || 'Not Started'
            }));
          
          console.log('✅ Processed questionnaire answers:', questionnaireAnswers);
        } else {
          console.log('⚠️ No questionnaire answers found for vendor, will show empty state');
        }
        
        // Transform vendor data from database format to frontend format
        const transformedVendor = {
          vendorId: vendorInfo.vendor_id || vendorInfo.vendorId,
          companyName: vendorInfo.company_name || vendorInfo.companyName,
          region: vendorInfo.region,
          status: vendorInfo.status,
          contactEmail: vendorInfo.contact_email || vendorInfo.contactEmail,
          contactName: vendorInfo.contact_name || vendorInfo.contactName,
          website: vendorInfo.website,
          industry: vendorInfo.industry,
          questionnaireAnswers
        };
        
        console.log('✅ Transformed vendor data:', transformedVendor);
        setVendor(transformedVendor);
        
        setQuestions(questionnaireAnswers);
        
        // Setup initial chat messages
        setupChatMessages(vendorInfo, questionnaireAnswers);
        
      } catch (error) {
        console.error('❌ Error loading vendor data:', error);
        // Redirect back to vendors list if vendor not found
        router.push('/vendors');
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      loadVendorData();
    }
  }, [vendorId, router]);

  // Helper function to determine if a question is completed
  const isQuestionCompleted = (question: QuestionAnswer): boolean => {
    return Boolean(
      (question.status === 'Completed') || 
      (question.status === 'Pending') || 
      (question.answer && question.answer.trim() !== '')
    );
  };

  const setupChatMessages = (vendorInfo: Vendor, questionnaireAnswers: QuestionAnswer[]) => {
    const initialMessages: Message[] = [
      {
        id: 'welcome',
        type: 'system',
        content: `Welcome to the questionnaire chat for **${vendorInfo.companyName}**! 
        
${questionnaireAnswers.length > 0 
  ? `Found ${questionnaireAnswers.length} questionnaire items. You can review and update answers, or ask me to generate new responses.`
  : 'No questionnaire answers found yet. You can start by asking me to generate answers for specific questions, or create a new questionnaire.'
}

I'm here to help you:
- 📝 Generate AI-powered answers to compliance questions
- ✏️ Edit and improve existing responses  
- 💡 Provide suggestions based on best practices
- 🔍 Review and validate questionnaire responses`,
        timestamp: new Date(),
      }
    ];

    if (questionnaireAnswers.length > 0) {
      // Add status summary with better status detection
      const completedCount = questionnaireAnswers.filter(isQuestionCompleted).length;
      const pendingCount = questionnaireAnswers.length - completedCount;
      
      initialMessages.push({
        id: 'status',
        type: 'assistant',
        content: `📊 **Questionnaire Status:**
- ✅ **${completedCount} completed** answers
- ⏳ **${pendingCount} pending** responses
- 📈 **${Math.round((completedCount / questionnaireAnswers.length) * 100)}%** completion rate

Would you like me to help complete the pending responses or review existing answers?`,
        timestamp: new Date(),
        suggestions: [
          "Generate answers for pending questions",
          "Review completed answers",
          "Show questions by category",
          "Export questionnaire summary"
        ]
      });
    }

    setMessages(initialMessages);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEditQuestion = (questionIndex: number) => {
    setEditingQuestion(questionIndex);
    setEditedQuestionText(questions[questionIndex].question);
  };

  const handleSaveQuestion = async () => {
    if (editingQuestion === null) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[editingQuestion].question = editedQuestionText;
    setQuestions(updatedQuestions);
    setEditingQuestion(null);
    setEditedQuestionText('');
    
    // Add system message about the update
    const newMessage: Message = {
      id: `edit-${Date.now()}`,
      type: 'system',
      content: `Question ${editingQuestion + 1} has been updated.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditedQuestionText('');
  };

  const saveAnswerToBackend = async (questionIndex: number, answer: string) => {
    try {
      const question = questions[questionIndex];
      
      // Save to backend via vendor answers endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/vendors/${vendorId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          questionId: question.questionId || question.id || `q_${questionIndex}`,
          question: question.question,
          answer: answer,
          status: 'Completed'
        }]),
      });

      if (response.ok) {
        console.log('✅ Answer saved to backend successfully');
        return true;
      } else {
        console.warn('⚠️ Failed to save to backend, keeping local copy');
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving answer to backend:', error);
      return false;
    }
  };

  const handleGenerateAnswer = async (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].isLoading = true;
    setQuestions(updatedQuestions);

    try {
      const question = questions[questionIndex].question;
      const generatedAnswer = await generateAIAnswer(question);
      
      updatedQuestions[questionIndex].answer = generatedAnswer;
      updatedQuestions[questionIndex].isLoading = false;
      updatedQuestions[questionIndex].needsAttention = false;
      setQuestions(updatedQuestions);

      // Save to backend
      await saveAnswerToBackend(questionIndex, generatedAnswer);

      // Add AI response message
      const newMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        content: `I've generated an answer for question ${questionIndex + 1}: "${question}"

**Generated Answer:**
${generatedAnswer}

You can edit this response if needed or ask me to regenerate it with different focus.`,
        timestamp: new Date(),
        questionIndex,
        category: detectQuestionCategory(question),
        suggestions: [
          "Regenerate this answer",
          "Make it more technical",
          "Make it more business-focused",
          "Add more detail"
        ]
      };
      setMessages(prev => [...prev, newMessage]);

    } catch (error) {
      updatedQuestions[questionIndex].isLoading = false;
      updatedQuestions[questionIndex].needsAttention = true;
      setQuestions(updatedQuestions);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: `Failed to generate answer for question ${questionIndex + 1}. Please try again or contact support.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || isTyping) return;

    // Add user message
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsTyping(true);

    try {
      // Generate AI response
      const aiResponse = await generateAIAnswer(userMessage);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        suggestions: getSmartSuggestions(userMessage)
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string, questionIndex?: number) => {
    setUserMessage(suggestion);
    setShowSuggestions(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getCategoryInfo = (category: string) => {
    return QUESTION_CATEGORIES[category as keyof typeof QUESTION_CATEGORIES] || QUESTION_CATEGORIES.Default;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="animate-spin h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Vendor Questionnaire</h2>
            <p className="text-gray-600">Please wait while we load the questionnaire data...</p>
          </div>
        </div>
      </>
    );
  }

  if (!vendor) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Vendor Not Found</h2>
            <p className="text-gray-600 mb-6">The vendor with ID {vendorId} could not be found.</p>
            <button
              onClick={() => router.push('/vendors')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Back to Vendors
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/vendors')}
                  className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Vendors
                </button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <h1 className="text-lg font-semibold text-gray-800">
                      {vendor.companyName}
                    </h1>
                    <p className="text-sm text-gray-600">
                      Questionnaire Chat • {questions.length} questions
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  vendor.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  vendor.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {vendor.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Questions Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Clipboard className="h-5 w-5 mr-2 text-primary" />
                    Questionnaire Items
                  </h2>
                  {questions.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {questions.filter(q => q.answer && q.answer.trim() !== '').length} of {questions.length} completed
                    </p>
                  )}
                </div>
                
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {questions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">No questionnaire items found</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Use the chat to create new questions
                      </p>
                    </div>
                  ) : (
                    questions.map((question, index) => {
                      const category = question.category || detectQuestionCategory(question.question);
                      const categoryInfo = getCategoryInfo(category);
                      const IconComponent = categoryInfo.icon;
                      
                      return (
                        <div
                          key={question.id || index}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setActiveCategory(category)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <IconComponent className={`h-4 w-4 ${categoryInfo.textColor}`} />
                                <span className={`text-xs px-2 py-1 rounded-full ${categoryInfo.lightColor} ${categoryInfo.textColor}`}>
                                  {category}
                                </span>
                              </div>
                              
                              {editingQuestion === index ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editedQuestionText}
                                    onChange={(e) => setEditedQuestionText(e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none"
                                    rows={3}
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={handleSaveQuestion}
                                      className="flex items-center px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark"
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="flex items-center px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-800 line-clamp-2 mb-2">
                                    {question.question}
                                  </p>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1">
                                      {question.isLoading ? (
                                        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                                      ) : question.status === 'Completed' || (question.answer && question.answer.trim() !== '') ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : question.status === 'Pending' ? (
                                        <Clock className="h-4 w-4 text-yellow-500" />
                                      ) : (
                                        <Clock className="h-4 w-4 text-orange-500" />
                                      )}
                                      <span className={`text-xs ${
                                        question.isLoading ? 'text-primary' :
                                        question.status === 'Completed' || (question.answer && question.answer.trim() !== '') ? 'text-green-600' :
                                        question.status === 'Pending' ? 'text-yellow-600' : 'text-orange-600'
                                      }`}>
                                        {question.isLoading ? 'Generating...' :
                                         question.status === 'Completed' || (question.answer && question.answer.trim() !== '') ? 'Completed' :
                                         question.status === 'Pending' ? 'Pending Review' : 'Not Started'}
                                      </span>
                                    </div>
                                    
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditQuestion(index);
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Edit question"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleGenerateAnswer(index);
                                        }}
                                        disabled={question.isLoading}
                                        className="p-1 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
                                        title="Generate AI answer"
                                      >
                                        <Sparkles className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
                
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Online</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className={`p-2 rounded-md transition-colors ${
                        showSuggestions ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Toggle suggestions"
                    >
                      <Lightbulb className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-3xl flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                        
                        {/* Avatar */}
                        <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.type === 'user' ? 'bg-primary text-white' :
                            message.type === 'system' ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {message.type === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : message.type === 'system' ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                        </div>

                        {/* Message Content */}
                        <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block px-4 py-2 rounded-lg ${
                            message.type === 'user' ? 'bg-primary text-white' :
                            message.type === 'system' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            <div className="prose prose-sm max-w-none">
                              {message.content.split('\n').map((line, index) => (
                                <div key={index}>
                                  {line.startsWith('**') && line.endsWith('**') ? (
                                    <strong className="font-semibold">{line.slice(2, -2)}</strong>
                                  ) : line.startsWith('- ') ? (
                                    <div className="ml-4">• {line.slice(2)}</div>
                                  ) : (
                                    line
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Message Actions */}
                          {message.type === 'assistant' && (
                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={() => copyToClipboard(message.content)}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </button>
                              <span className="text-xs text-gray-400">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          )}

                          {/* Suggestions */}
                          {message.suggestions && message.suggestions.length > 0 && showSuggestions && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSuggestionClick(suggestion, message.questionIndex)}
                                  className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-gray-100 px-4 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        placeholder="Ask me about questionnaire responses, compliance, or request help..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        disabled={isTyping}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!userMessage.trim() || isTyping}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 