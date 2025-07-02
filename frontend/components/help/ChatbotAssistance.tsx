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
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load previous chat history and add welcome message
    loadChatHistory();
  }, [vendorId]);

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await apiCall(`/api/help/vendor/${vendorId}/history`);
      setChatHistory(history.history || []);
      
      // Add welcome message
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
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Still show welcome message even if history fails to load
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
    } finally {
      setIsLoadingHistory(false);
    }
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
          <div className="h-full overflow-y-auto p-4">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Previous Conversations</h4>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading history...</span>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No previous conversations found.</p>
                  <p className="text-sm">Start a new conversation to see your chat history here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-start space-x-2">
                        <User className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{item.userQuestion}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Bot className="h-4 w-4 text-gray-500" />
                            <p className="text-sm text-gray-600 line-clamp-2">{item.aiResponse}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.category}</span>
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
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {/* Bot message metadata */}
                        {message.type === 'bot' && message.confidence !== undefined && (
                          <div className="mt-2 flex items-center space-x-2 text-sm">
                            <div className="flex items-center space-x-1">
                              {React.createElement(getConfidenceIcon(message.confidence), {
                                className: `h-4 w-4 ${getConfidenceColor(message.confidence)}`
                              })}
                              <span className={getConfidenceColor(message.confidence)}>
                                {(message.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">{message.category}</span>
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