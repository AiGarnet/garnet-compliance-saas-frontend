"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Video, 
  Calendar, 
  FileText, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Search,
  Filter,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Bot,
  Zap,
  Shield,
  HelpCircle,
  BookOpen,
  Download,
  ExternalLink
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'vendor' | 'admin' | 'system' | 'ai';
  timestamp: Date;
  type: 'text' | 'file' | 'system' | 'ai-response';
  attachments?: Array<{
    name: string;
    size: string;
    type: string;
    url: string;
  }>;
  priority?: 'low' | 'medium' | 'high';
  status?: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  participants: Array<{
    name: string;
    role: string;
    avatar?: string;
  }>;
  status: 'active' | 'resolved' | 'pending';
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'compliance' | 'technical' | 'urgent';
}

interface VendorCommunicationCenterProps {
  vendor: any;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_RESPONSES = [
  "Thank you for the update!",
  "I need more information about this.",
  "When can we schedule a call?",
  "Could you please clarify this requirement?",
  "I've uploaded the requested documents.",
  "What's the next step in the process?"
];

const FAQ_ITEMS = [
  {
    question: "What documents do I need to provide?",
    answer: "You'll need to provide your SOC 2 report, privacy policy, data processing agreement, and security architecture documentation.",
    category: "compliance"
  },
  {
    question: "How long does the review process take?",
    answer: "The typical review process takes 2-3 weeks, depending on the complexity of your security posture and completeness of documentation.",
    category: "process"
  },
  {
    question: "Can I update my information after submission?",
    answer: "Yes, you can update your information at any time through the vendor portal. Changes will be reviewed by our compliance team.",
    category: "general"
  },
  {
    question: "Who can I contact for urgent issues?",
    answer: "For urgent compliance issues, you can mark your message as high priority or use the emergency contact feature.",
    category: "support"
  }
];

export function VendorCommunicationCenter({ vendor, isOpen, onClose }: VendorCommunicationCenterProps) {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: '1',
        title: 'SOC 2 Documentation Review',
        lastMessage: 'We\'ve reviewed your SOC 2 report and have a few questions...',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        unreadCount: 2,
        participants: [
          { name: 'Sarah Johnson', role: 'Compliance Manager' },
          { name: 'You', role: 'Vendor' }
        ],
        status: 'active',
        priority: 'high',
        category: 'compliance'
      },
      {
        id: '2',
        title: 'General Onboarding Questions',
        lastMessage: 'Thank you for the clarification!',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        unreadCount: 0,
        participants: [
          { name: 'Mike Chen', role: 'Technical Reviewer' },
          { name: 'You', role: 'Vendor' }
        ],
        status: 'resolved',
        priority: 'medium',
        category: 'general'
      }
    ];

    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Welcome to the GarnetAI compliance platform! We\'re here to help you through the onboarding process.',
        sender: 'system',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        type: 'system'
      },
      {
        id: '2',
        content: 'Hi! I have a question about the SOC 2 requirements. What specific controls do you need to see documented?',
        sender: 'vendor',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        type: 'text',
        status: 'read'
      },
      {
        id: '3',
        content: 'Great question! We need to see documentation for the following SOC 2 Type II controls: CC6.1 (Logical Access), CC6.2 (Authentication), and CC6.3 (Authorization). I\'ll send you a detailed checklist.',
        sender: 'admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        type: 'text'
      },
      {
        id: '4',
        content: 'I can help you understand the SOC 2 requirements better. Based on your company profile, here are the key areas you should focus on...',
        sender: 'ai',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        type: 'ai-response'
      }
    ];

    setConversations(mockConversations);
    setMessages(mockMessages);
    if (mockConversations.length > 0) {
      setActiveConversation(mockConversations[0].id);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'vendor',
      timestamp: new Date(),
      type: 'text',
      priority: selectedPriority,
      status: 'sent'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for your message. I\'m analyzing your question and will provide a detailed response shortly. In the meantime, you might find our FAQ section helpful.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'ai-response'
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleQuickResponse = (response: string) => {
    setNewMessage(response);
    setShowQuickResponses(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'admin': return <User className="h-4 w-4" />;
      case 'ai': return <Bot className="h-4 w-4" />;
      case 'system': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Communication Center</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowFAQ(true)}
                className="flex items-center justify-center p-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                FAQ
              </button>
              <button className="flex items-center justify-center p-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                <Calendar className="h-4 w-4 mr-1" />
                Schedule
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => setActiveConversation(conversation.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  activeConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{conversation.title}</h3>
                  <div className="flex items-center space-x-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
                      {conversation.priority}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 truncate mb-2">{conversation.lastMessage}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {conversation.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                    {conversation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {conversations.find(c => c.id === activeConversation)?.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>with </span>
                      {conversations.find(c => c.id === activeConversation)?.participants
                        .filter(p => p.role !== 'Vendor')
                        .map(p => p.name)
                        .join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Video className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'vendor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${
                      message.sender === 'vendor' 
                        ? 'bg-primary text-white' 
                        : message.sender === 'ai'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : message.sender === 'system'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-white text-gray-900 border border-gray-200'
                    } rounded-lg p-3 shadow-sm`}>
                      {message.sender !== 'vendor' && message.sender !== 'system' && (
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                            {getSenderIcon(message.sender)}
                          </div>
                          <span className="text-xs font-medium">
                            {message.sender === 'ai' ? 'AI Assistant' : 'Compliance Team'}
                          </span>
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${
                          message.sender === 'vendor' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.sender === 'vendor' && message.status && (
                          <div className="flex items-center">
                            {message.status === 'read' && <CheckCircle className="h-3 w-3 text-white/70" />}
                            {message.status === 'delivered' && <CheckCircle className="h-3 w-3 text-white/50" />}
                            {message.status === 'sent' && <Clock className="h-3 w-3 text-white/50" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Responses */}
              <AnimatePresence>
                {showQuickResponses && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 bg-white border-t border-gray-200"
                  >
                    <div className="flex flex-wrap gap-2">
                      {QUICK_RESPONSES.map((response, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickResponse(response)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {response}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Input */}
              <div className="bg-white p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <button
                    onClick={() => setShowQuickResponses(!showQuickResponses)}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Quick Responses
                  </button>
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* FAQ Modal */}
        <AnimatePresence>
          {showFAQ && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h3>
                    <button
                      onClick={() => setShowFAQ(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="space-y-4">
                    {FAQ_ITEMS.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{item.question}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.answer}</p>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {item.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 