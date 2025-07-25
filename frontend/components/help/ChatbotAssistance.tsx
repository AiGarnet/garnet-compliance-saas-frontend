'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiCall } from '../../lib/api';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  category?: string;
  confidence?: number;
  isComplianceRelated?: boolean;
  followUpSuggestions?: string[];
}

interface ChatHistoryItem {
  id?: string;
  userQuestion: string;
  aiResponse: string;
  category: string;
  createdAt: string;
  sessionId?: string;
  messages?: ChatMessage[];
}

interface ChatbotAssistanceProps {
  vendorId: string;
  onClose?: () => void;
}

const ChatbotAssistance: React.FC<ChatbotAssistanceProps> = ({ vendorId, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, [vendorId]);

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await apiCall(`/api/help/vendor/${vendorId}/history`);
      setChatHistory(history.history || []);
      
      // Add welcome message if no current session
      if (!currentSessionId) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'bot',
          content: 'Hello! I\'m your compliance assistant. I can help you with:\n\n• Data privacy and GDPR compliance\n• Cybersecurity frameworks and controls\n• Financial regulations and risk management\n• Vendor risk assessment processes\n• Supporting documentation requirements\n\nWhat compliance question can I help you with today?',
          timestamp: new Date(),
          category: 'Welcome',
          confidence: 1,
          isComplianceRelated: true,
          followUpSuggestions: [
            'What documents do I need for GDPR compliance?',
            'How do I assess cybersecurity risks?',
            'What are the key financial compliance requirements?'
          ]
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Still show welcome message even if history fails to load
      if (!currentSessionId) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'bot',
          content: 'Hello! I\'m your compliance assistant. I can help you with:\n\n• Data privacy and GDPR compliance\n• Cybersecurity frameworks and controls\n• Financial regulations and risk management\n• Vendor risk assessment processes\n• Supporting documentation requirements\n\nWhat compliance question can I help you with today?',
          timestamp: new Date(),
          category: 'Welcome',
          confidence: 1,
          isComplianceRelated: true,
          followUpSuggestions: [
            'What documents do I need for GDPR compliance?',
            'How do I assess cybersecurity risks?',
            'What are the key financial compliance requirements?'
          ]
        };
        setMessages([welcomeMessage]);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load a previous conversation
  const loadPreviousConversation = async (historyItem: ChatHistoryItem) => {
    try {
      setIsLoading(true);
      
      // If the history item has a sessionId, load the full conversation
      if (historyItem.sessionId) {
        const response = await apiCall(`/api/help/vendor/${vendorId}/session/${historyItem.sessionId}`);
        if (response.messages && response.messages.length > 0) {
          setMessages(response.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
          setCurrentSessionId(historyItem.sessionId);
          setShowHistory(false);
          return;
        }
      }
      
      // Fallback: create a basic conversation from the history item
      const conversationMessages: ChatMessage[] = [
        {
          id: `user-${Date.now()}`,
          type: 'user',
          content: historyItem.userQuestion,
          timestamp: new Date(historyItem.createdAt),
          category: historyItem.category
        },
        {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: historyItem.aiResponse,
          timestamp: new Date(historyItem.createdAt),
          category: historyItem.category,
          confidence: 0.8,
          isComplianceRelated: true
        }
      ];
      
      setMessages(conversationMessages);
      setCurrentSessionId(historyItem.sessionId || `session-${Date.now()}`);
      setShowHistory(false);
      
    } catch (error) {
      console.error('Error loading previous conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new conversation
  const startNewConversation = () => {
    setCurrentSessionId(null);
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'bot',
      content: 'Hello! I\'m your compliance assistant. I can help you with:\n\n• Data privacy and GDPR compliance\n• Cybersecurity frameworks and controls\n• Financial regulations and risk management\n• Vendor risk assessment processes\n• Supporting documentation requirements\n\nWhat compliance question can I help you with today?',
      timestamp: new Date(),
      category: 'Welcome',
      confidence: 1,
      isComplianceRelated: true,
      followUpSuggestions: [
        'What documents do I need for GDPR compliance?',
        'How do I assess cybersecurity risks?',
        'What are the key financial compliance requirements?'
      ]
    };
    setMessages([welcomeMessage]);
    setShowHistory(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const data = await apiCall('/api/help/chat', {
        method: 'POST',
        body: JSON.stringify({
          question: inputMessage,
          vendorId: vendorId,
        }),
      });

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.answer,
        timestamp: new Date(),
        category: data.category,
        confidence: data.confidence,
        isComplianceRelated: data.isComplianceRelated,
        followUpSuggestions: data.followUpSuggestions,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'I apologize, but I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date(),
        category: 'Error',
        confidence: 0,
        isComplianceRelated: false,
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsConnected(false);
      setTimeout(() => setIsConnected(true), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const regenerateResponse = async (messageIndex: number) => {
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.type !== 'user') return;

    setIsLoading(true);
    try {
      const data = await apiCall('/api/help/chat', {
        method: 'POST',
        body: JSON.stringify({
          question: userMessage.content,
          vendorId: vendorId,
        }),
      });

      const newBotMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: data.answer,
        timestamp: new Date(),
        category: data.category,
        confidence: data.confidence,
        isComplianceRelated: data.isComplianceRelated,
        followUpSuggestions: data.followUpSuggestions,
      };

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[messageIndex] = newBotMessage;
        return newMessages;
      });
    } catch (error) {
      console.error('Error regenerating response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertCircle;
    return AlertCircle;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Compliance Assistant</h3>
              <p className="text-sm opacity-90">
                {isConnected ? 'Ready to help' : 'Reconnecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-1 text-white hover:text-gray-200 transition-colors px-2 py-1 rounded"
              title="View chat history"
            >
              <Clock className="h-4 w-4" />
              <span className="text-sm">History</span>
              {showHistory ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showHistory ? (
          /* Chat History */
          <div className="h-full overflow-y-auto p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-white text-lg">Previous Conversations</h4>
                <button
                  onClick={startNewConversation}
                  className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm border border-gray-200"
                >
                  + New Chat
                </button>
              </div>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="ml-2 text-white font-semibold">Loading history...</span>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 text-white opacity-70" />
                  <p className="text-white font-bold">No previous conversations found.</p>
                  <p className="text-sm text-white opacity-90 font-medium">Start a new conversation to see your chat history here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatHistory.map((item, index) => (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg p-4 cursor-pointer transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-md"
                      onClick={() => loadPreviousConversation(item)}
                    >
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 mb-2">{item.userQuestion}</p>
                          <div className="flex items-start space-x-2 mb-3">
                            <Bot className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 font-medium line-clamp-2">{item.aiResponse}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-semibold">
                              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded">{item.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Current Chat */
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' && (
                        <Bot className="h-5 w-5 mt-0.5 text-blue-600" />
                      )}
                      {message.type === 'user' && (
                        <User className="h-5 w-5 mt-0.5 text-white" />
                      )}
                      <div className="flex-1">
                        <div className="prose prose-sm max-w-none">
                          {message.content.split('\n').map((line, index) => (
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
                        
                        {/* Bot message metadata */}
                        {message.type === 'bot' && (
                          <div className="mt-2 flex items-center space-x-2 text-sm">
                            {message.category && (
                              <span className="text-gray-600">{message.category}</span>
                            )}
                            <button
                              onClick={() => regenerateResponse(index)}
                              className="ml-2 text-gray-500 hover:text-gray-700"
                              title="Regenerate response"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* Follow-up suggestions */}
                        {message.type === 'bot' && message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center space-x-1 mb-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-700">Suggested questions:</span>
                            </div>
                            <div className="space-y-1">
                              {message.followUpSuggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="block w-full text-left text-sm bg-white border border-gray-200 rounded p-2 hover:bg-gray-50 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs opacity-75 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <div className="flex items-center space-x-1">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input - only show in current chat mode */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a compliance question..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                I can only help with compliance-related questions. Press Enter to send.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotAssistance; 