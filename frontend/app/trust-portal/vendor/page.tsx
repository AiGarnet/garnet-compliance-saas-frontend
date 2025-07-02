'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Building2, 
  Shield, 
  FileText, 
  ChevronLeft, 
  ExternalLink, 
  Download, 
  Calendar, 
  MapPin, 
  Globe, 
  Mail, 
  MessageSquare,
  Star,
  CheckCircle,
  AlertTriangle,
  Info,
  Send,
  Clock,
  User,
  MessageCircle,
  ArrowLeft,
  List,
  HelpCircle
} from 'lucide-react';
import { vendors as vendorAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import Header from '@/components/Header';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  VendorTrustPortalData, 
  CreateFeedbackDto, 
  FeedbackType, 
  FeedbackPriority,
  TrustPortalFeedback,
  CreateFeedbackResponseDto,
  ResponderType
} from '@/types/trustPortal';
import { safeMap } from '@/lib/utils/arrayUtils';

function VendorTrustPortalContent() {
  const searchParams = useSearchParams();
  const vendorId = searchParams?.get('id') || null;
  const { user, isAuthenticated } = useAuth();
  
  const [vendorData, setVendorData] = useState<VendorTrustPortalData | null>(null);
  const [feedback, setFeedback] = useState<TrustPortalFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<CreateFeedbackDto>({
    vendorId: 0,
    enterpriseContactEmail: '',
    enterpriseContactName: '',
    enterpriseCompanyName: '',
    feedbackType: FeedbackType.GENERAL,
    subject: '',
    message: '',
    priority: FeedbackPriority.MEDIUM
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // New state for real-time trust portal data
  const [trustPortalItems, setTrustPortalItems] = useState<any[]>([]);
  const [checklistsCount, setChecklistsCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);

  // Fetch vendor trust portal data
  const fetchVendorData = async () => {
    if (!vendorId) {
      setError('Vendor ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching trust portal data for vendor:', vendorId);
      const data = await vendorAPI.trustPortal.getData(vendorId);
      setVendorData(data);

      // Set vendor ID for feedback form
      setFeedbackForm(prev => ({
        ...prev,
        vendorId: data.vendor.vendorId
      }));

      // Fetch feedback if authenticated as vendor
      if (isAuthenticated) {
        try {
          const feedbackData = await vendorAPI.trustPortal.getVendorFeedback(vendorId);
          setFeedback(feedbackData);
        } catch (feedbackError) {
          console.log('Could not fetch feedback - user may not have permission');
        }
      }

      // Fetch real-time trust portal items (questionnaires sent to trust portal)
      await fetchTrustPortalItems();
      
    } catch (err: any) {
      console.error('Error fetching vendor data:', err);
      setError('Failed to load vendor trust portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch trust portal items that were explicitly sent to trust portal
  const fetchTrustPortalItems = async () => {
    if (!vendorId) return;

    try {
      // Fetch trust portal items (questionnaires/checklists sent to trust portal)
      const response = await fetch(`/api/trust-portal/vendor/${vendorId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Filter for questionnaire items only (sent via "Send to Trust Portal")
        const questionnaireItems = (data.trustPortalItems || []).filter((item: any) => 
          item.isQuestionnaireAnswer === true || 
          item.category === 'Compliance Questionnaire'
        );
        
        setTrustPortalItems(questionnaireItems);
        
        // Count checklists and documents that were sent to trust portal
        const checklistItems = questionnaireItems.filter((item: any) => 
          item.category === 'Compliance Questionnaire'
        );
        const documentItems = (data.sharedDocuments || []).filter((doc: any) => 
          doc.shareToTrustPortal === true
        );
        
        setChecklistsCount(checklistItems.length);
        setDocumentsCount(documentItems.length);
      }
    } catch (error) {
      console.error('Error fetching trust portal items:', error);
    }
  };

  // Handle feedback form submission
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackForm.enterpriseContactEmail || !feedbackForm.subject || !feedbackForm.message) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmittingFeedback(true);
    
    try {
      await vendorAPI.trustPortal.createFeedback(feedbackForm);
      
      // Reset form
      setFeedbackForm(prev => ({
        ...prev,
        enterpriseContactEmail: '',
        enterpriseContactName: '',
        enterpriseCompanyName: '',
        subject: '',
        message: '',
        feedbackType: FeedbackType.GENERAL,
        priority: FeedbackPriority.MEDIUM
      }));
      
      setShowFeedbackForm(false);
      alert('Feedback submitted successfully! The vendor will be notified.');
      
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [vendorId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trust portal...</p>
        </div>
      </div>
    );
  }

  if (error || !vendorData || !vendorId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Trust Portal</h1>
          <p className="text-gray-600 mb-4">{error || 'Vendor ID is required'}</p>
          <Link
            href="/trust-portal"
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Trust Portal
          </Link>
        </div>
      </div>
    );
  }

  const { vendor } = vendorData;

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link
                href="/trust-portal"
                className="flex items-center text-gray-600 hover:text-primary transition-colors mr-4"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to Trust Portal
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mr-6">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {vendor.companyName}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {vendor.industry && (
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {vendor.industry}
                        </span>
                      )}
                      {vendor.region && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {vendor.region}
                        </span>
                      )}
                      {vendor.website && (
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowFeedbackForm(true)}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Provide Feedback
                </button>
              </div>
              
              {vendor.description && (
                <p className="mt-6 text-gray-700 leading-relaxed">
                  {vendor.description}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shared Documents */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileText className="h-6 w-6 mr-2 text-blue-600" />
                    Compliance Documents
                  </h2>
                </div>
                <div className="p-6">
                  {trustPortalItems.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No documents shared</h3>
                      <p className="text-gray-600">This vendor hasn't shared any compliance documents yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {trustPortalItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900 mb-1">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {item.category}
                                </span>
                                {item.fileType && (
                                  <span>{item.fileType.toUpperCase()}</span>
                                )}
                                {item.fileSize && (
                                  <span>{Math.round(item.fileSize / 1024)} KB</span>
                                )}
                              </div>
                            </div>
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-4 flex items-center text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Questionnaires */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <HelpCircle className="h-6 w-6 mr-2 text-blue-600" />
                    Questionnaires
                  </h2>
                </div>
                <div className="p-6">
                  {trustPortalItems.length === 0 ? (
                    <div className="text-center py-8">
                      <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No questionnaires shared</h3>
                      <p className="text-gray-600">This vendor hasn't submitted any questionnaires to the trust portal yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {trustPortalItems.map((questionnaire) => {
                        let content;
                        try {
                          content = questionnaire.content ? JSON.parse(questionnaire.content) : null;
                        } catch (e) {
                          content = null;
                        }
                        
                        return (
                          <div key={questionnaire.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                                  {questionnaire.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {questionnaire.description}
                                </p>
                              </div>
                              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                                {content?.status || 'Submitted'}
                              </span>
                            </div>
                            
                            {content && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-600">{content.questionCount || 0}</div>
                                  <div className="text-sm text-gray-600">Total Questions</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">{content.completedQuestions || 0}</div>
                                  <div className="text-sm text-gray-600">Completed</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-purple-600">{content.checklistName ? 1 : 0}</div>
                                  <div className="text-sm text-gray-600">Checklists</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-600">Submitted</div>
                                  <div className="text-sm font-medium">{new Date(questionnaire.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                  {questionnaire.category}
                                </span>
                                {content?.checklistName && (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                    From: {content.checklistName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(questionnaire.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {vendor.contactName && (
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">{vendor.contactName}</span>
                    </div>
                  )}
                  {vendor.contactEmail && (
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <a
                        href={`mailto:${vendor.contactEmail}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {vendor.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents Shared:</span>
                    <span className="font-medium">{documentsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Checklists Uploaded:</span>
                    <span className="font-medium">{checklistsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium text-sm">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Feedback Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Provide Feedback to {vendor.companyName}
              </h3>
            </div>
            
            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={feedbackForm.enterpriseContactEmail}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      enterpriseContactEmail: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="your.email@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={feedbackForm.enterpriseContactName}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      enterpriseContactName: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={feedbackForm.enterpriseCompanyName}
                  onChange={(e) => setFeedbackForm(prev => ({
                    ...prev,
                    enterpriseCompanyName: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Your Company Inc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <select
                    value={feedbackForm.feedbackType}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      feedbackType: e.target.value as FeedbackType
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value={FeedbackType.GENERAL}>General Feedback</option>
                    <option value={FeedbackType.DOCUMENT_REQUEST}>Document Request</option>
                    <option value={FeedbackType.CLARIFICATION}>Clarification Needed</option>
                    <option value={FeedbackType.COMPLIANCE_ISSUE}>Compliance Issue</option>
                    <option value={FeedbackType.FOLLOW_UP}>Follow Up</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={feedbackForm.priority}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      priority: e.target.value as FeedbackPriority
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value={FeedbackPriority.LOW}>Low</option>
                    <option value={FeedbackPriority.MEDIUM}>Medium</option>
                    <option value={FeedbackPriority.HIGH}>High</option>
                    <option value={FeedbackPriority.URGENT}>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Brief description of your feedback"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Please provide detailed feedback..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function VendorTrustPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trust portal...</p>
        </div>
      </div>
    }>
      <VendorTrustPortalContent />
    </Suspense>
  );
} 