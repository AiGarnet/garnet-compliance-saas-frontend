"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  RefreshCw, 
  MessageSquare, 
  Loader2,
  FileText,
  HelpCircle,
  Clock,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isRegenerating?: boolean;
  questionId?: string;
  metadata?: {
    confidence?: number;
    sources?: string[];
    category?: string;
  };
}

interface ChatBotProps {
  vendorId: string;
  onQuestionnaireComplete?: (questions: Array<{ question: string; answer: string }>) => void;
  initialContext?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ 
  vendorId, 
  onQuestionnaireComplete, 
  initialContext 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState<Array<{ question: string; answer: string }>>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `👋 Hi! I'm your AI Compliance Assistant. I'm here to help you complete your compliance questionnaire efficiently and accurately.

I can help you with:
📋 **Compliance Questions** - Answer specific regulatory queries
🔍 **Technical Requirements** - Explain implementation details  
📖 **Best Practices** - Provide industry-standard guidance
🔄 **Regenerate Answers** - Refine responses as needed

You can ask me questions like:
• "How do we handle GDPR data subject requests?"
• "What are our AML/KYC procedures?"
• "Describe our cybersecurity incident response"
• "What is our data breach notification process?"

💡 **Tip**: Be specific about your compliance area (data privacy, financial crime, cybersecurity, etc.) for the most accurate responses.

What would you like to know about your compliance requirements?`,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      await generateAIResponse(userMessage.content);
    } catch (error) {
      console.error('Error sending message:', error);
      addErrorMessage('I apologize, but I encountered an error. Please try again or contact support if the issue persists.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userInput: string) => {
    try {
      // Build conversation context
      const conversationHistory = messages
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const requestPayload = {
        question: userInput,
        vendorId: vendorId ? parseInt(vendorId) : undefined,
        context: buildEnhancedContext(userInput, conversationHistory),
        sessionId,
        chatMode: true
      };

      console.log('Sending chat request:', requestPayload);

      const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.answer || data.response || "I'm sorry, I couldn't generate a response right now.";

      // Determine if this is a compliance question
      const isComplianceQuestion = detectComplianceQuestion(userInput);
      
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        questionId: isComplianceQuestion ? `q_${Date.now()}` : undefined,
        metadata: {
          confidence: data.confidence || 0.85,
          sources: data.sources || [],
          category: categorizeQuestion(userInput)
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Add to questionnaire if it's a compliance question
      if (isComplianceQuestion) {
        setQuestionsAnswered(prev => [...prev, {
          question: userInput,
          answer: aiResponse
        }]);
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      addErrorMessage('I encountered an issue generating a response. Please try rephrasing your question or contact our support team.');
    }
  };

  const buildEnhancedContext = (userInput: string, conversationHistory: string): string => {
    const baseContext = `
ROLE: You are Garnet AI's expert compliance assistant, specializing in global regulatory frameworks including GDPR, CCPA, PIPEDA, AML/CFT, FCPA, UK Bribery Act, ISO 27001, SOC 2, and NIST cybersecurity frameworks.

PERSONALITY: Professional, knowledgeable, and helpful. You communicate in a friendly but authoritative manner, always providing specific, actionable guidance.

CONVERSATION CONTEXT: 
${conversationHistory}

VENDOR CONTEXT: You're assisting a vendor/service provider (ID: ${vendorId}) in completing their compliance questionnaire. This vendor maintains robust compliance programs and needs specific, implementation-focused responses.

RESPONSE GUIDELINES:
1. Always respond from the vendor's organizational perspective ("We implement...", "Our organization maintains...")
2. Provide specific procedures, timelines, and compliance measures
3. Reference relevant standards and frameworks when applicable
4. Include implementation details rather than generic compliance advice
5. For vague or non-compliance questions, politely redirect to compliance topics
6. Offer to regenerate or clarify responses when needed

CURRENT QUESTION ANALYSIS:
- Question: "${userInput}"
- Detected compliance areas: ${categorizeQuestion(userInput)}
- Is compliance-related: ${detectComplianceQuestion(userInput)}

${initialContext ? `ADDITIONAL CONTEXT: ${initialContext}` : ''}
`;

    return baseContext;
  };

  const categorizeQuestion = (question: string): string => {
    const questionLower = question.toLowerCase();
    const categories = [];

    if (questionLower.includes('gdpr') || questionLower.includes('privacy') || questionLower.includes('data protection') || questionLower.includes('ccpa') || questionLower.includes('pipeda')) {
      categories.push('Data Privacy');
    }
    if (questionLower.includes('aml') || questionLower.includes('kyc') || questionLower.includes('beneficial ownership') || questionLower.includes('sanctions') || questionLower.includes('pep')) {
      categories.push('Financial Crime');
    }
    if (questionLower.includes('bribery') || questionLower.includes('corruption') || questionLower.includes('fcpa') || questionLower.includes('gifts')) {
      categories.push('Anti-Bribery');
    }
    if (questionLower.includes('security') || questionLower.includes('cyber') || questionLower.includes('iso 27001') || questionLower.includes('soc 2') || questionLower.includes('incident')) {
      categories.push('Cybersecurity');
    }
    if (questionLower.includes('employee') || questionLower.includes('training') || questionLower.includes('background') || questionLower.includes('screening')) {
      categories.push('HR Compliance');
    }

    return categories.length > 0 ? categories.join(', ') : 'General Compliance';
  };

  const detectComplianceQuestion = (question: string): boolean => {
    const complianceKeywords = [
      'policy', 'procedure', 'compliance', 'regulation', 'standard', 'framework',
      'gdpr', 'ccpa', 'privacy', 'data protection', 'breach', 'notification',
      'aml', 'kyc', 'sanctions', 'beneficial ownership', 'pep', 'screening',
      'bribery', 'corruption', 'fcpa', 'anti-bribery', 'due diligence',
      'security', 'cybersecurity', 'iso 27001', 'soc 2', 'nist', 'incident response',
      'audit', 'assessment', 'certification', 'training', 'monitoring'
    ];

    return complianceKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    );
  };

  const addErrorMessage = (content: string) => {
    const errorMessage: ChatMessage = {
      id: `msg_${Date.now()}_error`,
      role: 'assistant',
      content: `⚠️ ${content}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMessage]);
  };

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    const previousUserMessage = messages[messageIndex - 1];
    
    if (!previousUserMessage || previousUserMessage.role !== 'user') return;

    // Mark message as regenerating
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isRegenerating: true } : msg
    ));

    try {
      await generateAIResponse(previousUserMessage.content);
      
      // Remove the old message
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error regenerating response:', error);
      // Unmark regenerating state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isRegenerating: false } : msg
      ));
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const exportQuestionnaire = () => {
    if (questionsAnswered.length === 0) {
      alert('No compliance questions answered yet.');
      return;
    }

    const exportData = {
      vendorId,
      sessionId,
      questionsAnswered,
      exportedAt: new Date().toISOString(),
      totalQuestions: questionsAnswered.length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-questionnaire-${vendorId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[800px] bg-gray-50 rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span className="font-bold">AI Compliance Assistant</span>
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>{questionsAnswered.length} Q&A</span>
            {questionsAnswered.length > 0 && (
              <Button
                onClick={exportQuestionnaire}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-blue-600"
              >
                <FileText className="w-4 h-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div
                className={`rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className={`mt-1 ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className={`flex-1 ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    
                    {/* Message metadata */}
                    {message.metadata && (
                      <div className="mt-2 text-xs text-gray-500">
                        {message.metadata.category && (
                          <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                            {message.metadata.category}
                          </span>
                        )}
                        {message.metadata.confidence && (
                          <span className="inline-block">
                            Confidence: {Math.round(message.metadata.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Message actions */}
              <div className="flex items-center justify-between mt-2 px-2">
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTimestamp(message.timestamp)}
                </span>
                
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => copyToClipboard(message.content)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => regenerateResponse(message.id)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-500 hover:text-gray-700"
                      disabled={message.isRegenerating}
                    >
                      {message.isRegenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-3 max-w-[80%]">
              <div className="flex items-center space-x-2 text-gray-600">
                <Bot className="w-4 h-4 text-blue-600" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about compliance requirements, policies, or procedures..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          💡 Try: "How do we handle GDPR requests?" or "What's our incident response procedure?"
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
