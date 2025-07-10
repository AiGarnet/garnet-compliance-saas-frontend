'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Shield, 
  FileText, 
  Download, 
  Calendar, 
  MapPin, 
  Globe, 
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  ArrowLeft,
  List,
  ChevronDown,
  ChevronUp,
  Eye,
  Paperclip,
  MessageSquare,
  Send,
  Star
} from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';
import { ChecklistService } from '@/lib/services/checklistService';
import type { Checklist, ChecklistQuestion, SupportingDocument } from '@/lib/services/checklistService';

interface TrustPortalItem {
  id: string;
  vendorId: number;
  title: string;
  description?: string;
  category: string;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  isQuestionnaireAnswer: boolean;
  questionnaireId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistDetails {
  checklist: Checklist;
  questions: ChecklistQuestion[];
  supportingDocuments: SupportingDocument[];
}

interface VendorData {
  vendorId: number;
  companyName: string;
  description?: string;
  website?: string;
  industry?: string;
  region?: string;
  status?: string;
}

interface FeedbackForm {
  enterpriseContactEmail: string;
  enterpriseContactName: string;
  enterpriseCompanyName: string;
  feedbackType: string;
  priority: string;
  subject: string;
  message: string;
}

export default function EnterpriseInvitePage({ params }: { params: { token: string } }) {
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [trustPortalItems, setTrustPortalItems] = useState<TrustPortalItem[]>([]);
  const [checklistDetails, setChecklistDetails] = useState<{ [key: string]: ChecklistDetails }>({});
  const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(new Set());
  const [supportingDocuments, setSupportingDocuments] = useState<SupportingDocument[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    enterpriseContactEmail: '',
    enterpriseContactName: '',
    enterpriseCompanyName: '',
    feedbackType: 'GENERAL',
    priority: 'MEDIUM',
    subject: '',
    message: ''
  });

  const { token } = params;

  // Fetch vendor data using invite token
  const fetchVendorDataByToken = async () => {
    if (!token) {
      setError('Invalid invite token');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Fetch vendor data using the invite token
      const response = await fetch(`/api/trust-portal/invite/${token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invalid or expired invite link');
        } else if (response.status === 403) {
          throw new Error('Access denied');
        } else {
          throw new Error('Failed to load trust portal');
        }
      }

      const data = await response.json();
      setVendor(data.vendor);

      // Fetch trust portal items for this vendor
      await Promise.all([
        fetchTrustPortalItems(data.vendor.vendorId),
        fetchSupportingDocuments(data.vendor.vendorId)
      ]);
      
    } catch (err: any) {
      console.error('Error fetching vendor data:', err);
      setError(err.message || 'Failed to load trust portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch trust portal items for the vendor
  const fetchTrustPortalItems = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/trust-portal/vendor/${vendorId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Filter for questionnaire items only
        const questionnaireItems = (data.trustPortalItems || []).filter((item: any) => 
          item.isQuestionnaireAnswer === true || 
          item.category === 'Compliance Questionnaire'
        );
        
        setTrustPortalItems(questionnaireItems);
      }
    } catch (error) {
      console.error('Error fetching trust portal items:', error);
    }
  };

  // Fetch supporting documents for the vendor
  const fetchSupportingDocuments = async (vendorId: number) => {
    try {
      const documents = await ChecklistService.getVendorSupportingDocuments(vendorId.toString());
      setSupportingDocuments(documents);
    } catch (error) {
      console.error('Error fetching supporting documents:', error);
    }
  };

  // Load detailed checklist information when expanded
  const loadChecklistDetails = async (trustPortalItem: TrustPortalItem) => {
    if (!vendor || !trustPortalItem.questionnaireId) return;

    const checklistId = trustPortalItem.questionnaireId;
    
    if (checklistDetails[checklistId]) {
      return; // Already loaded
    }

    setIsLoadingDetails(prev => ({ ...prev, [checklistId]: true }));

    try {
      const [checklistData, questions] = await Promise.all([
        ChecklistService.getChecklist(checklistId, vendor.vendorId.toString()),
        ChecklistService.getChecklistQuestions(checklistId, vendor.vendorId.toString())
      ]);

      // Filter supporting documents for this checklist
      const checklistSupportingDocs = supportingDocuments.filter(doc => 
        questions.some(q => q.id === doc.questionId)
      );

      setChecklistDetails(prev => ({
        ...prev,
        [checklistId]: {
          checklist: checklistData.checklist,
          questions: questions,
          supportingDocuments: checklistSupportingDocs
        }
      }));
    } catch (error) {
      console.error('Error loading checklist details:', error);
    } finally {
      setIsLoadingDetails(prev => ({ ...prev, [checklistId]: false }));
    }
  };

  // Toggle checklist expansion
  const toggleChecklistExpansion = async (trustPortalItem: TrustPortalItem) => {
    const checklistId = trustPortalItem.questionnaireId;
    if (!checklistId) return;

    const newExpanded = new Set(expandedChecklists);
    
    if (expandedChecklists.has(checklistId)) {
      newExpanded.delete(checklistId);
    } else {
      newExpanded.add(checklistId);
      await loadChecklistDetails(trustPortalItem);
    }
    
    setExpandedChecklists(newExpanded);
  };

  // Download supporting document
  const downloadSupportingDocument = async (doc: SupportingDocument) => {
    try {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = `/api/checklists/documents/${doc.id}/download`;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  // View supporting document in new tab
  const viewSupportingDocument = async (doc: SupportingDocument) => {
    try {
      window.open(`/api/checklists/documents/${doc.id}/download`, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document. Please try again.');
    }
  };

  // Format answer text with bold formatting for key phrases
  const formatAnswerText = (text: string) => {
    const keyPhrases = [
      'Defined Incident Response Times',
      'Data Encryption Standards',
      'Security Compliance Framework',
      'Access Control Policies',
      'Backup and Recovery Procedures',
      'Third-Party Risk Assessment',
      'Business Continuity Plan',
      'Audit Trail Maintenance',
      'Privacy Policy Framework',
      'Staff Training Programs'
    ];
    
    let formattedText = text;
    keyPhrases.forEach(phrase => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      formattedText = formattedText.replace(regex, '<strong>$1</strong>');
    });
    
    return formattedText;
  };

  // Handle feedback submission
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackForm.enterpriseContactEmail || !feedbackForm.subject || !feedbackForm.message) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!vendor) {
      alert('Vendor information not available.');
      return;
    }

    setIsSubmittingFeedback(true);
    
    try {
      const response = await fetch('/api/trust-portal/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.vendorId,
          ...feedbackForm
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      // Reset form
      setFeedbackForm({
        enterpriseContactEmail: '',
        enterpriseContactName: '',
        enterpriseCompanyName: '',
        subject: '',
        message: '',
        feedbackType: 'GENERAL',
        priority: 'MEDIUM'
      });
      
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
    fetchVendorDataByToken();
  }, [token]);

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

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please check your invite link or contact the vendor for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
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
              {/* Compliance Checklists */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Shield className="h-6 w-6 mr-2 text-blue-600" />
                    Compliance Checklists
                    <span className="ml-2 bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                      {trustPortalItems.length}
                    </span>
                  </h2>
                </div>
                <div className="p-6">
                  {trustPortalItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Compliance Checklists</h3>
                      <p className="text-gray-600">This vendor hasn't shared any compliance checklists yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {trustPortalItems.map((item) => {
                        let content;
                        try {
                          content = item.content ? JSON.parse(item.content) : null;
                        } catch (e) {
                          content = null;
                        }
                        
                        const checklistId = item.questionnaireId;
                        const isExpanded = checklistId ? expandedChecklists.has(checklistId) : false;
                        const details = checklistId ? checklistDetails[checklistId] : null;
                        const isLoadingDetail = checklistId ? isLoadingDetails[checklistId] : false;

                        return (
                          <div key={item.id} className="border border-gray-200 rounded-lg">
                            <div className="p-6 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {item.title}
                                  </h3>
                                  {item.description && (
                                    <p className="text-gray-600 mb-2">{item.description}</p>
                                  )}
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center">
                                      <FileText className="h-4 w-4 mr-1" />
                                      {item.category}
                                    </span>
                                  </div>
                                </div>
                                
                                {checklistId && (
                                  <button
                                    onClick={() => toggleChecklistExpansion(item)}
                                    disabled={isLoadingDetail}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                                  >
                                    {isLoadingDetail ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                        Loading...
                                      </>
                                    ) : (
                                      <>
                                        {isExpanded ? 'Hide Details' : 'View Details'}
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4 ml-1" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 ml-1" />
                                        )}
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Expanded Details */}
                            {isExpanded && details && (
                              <div className="p-6">
                                <div className="space-y-6">
                                  {details.questions.map((question, qIndex) => (
                                    <div key={question.id} className="border-l-4 border-blue-500 pl-4">
                                      <div className="mb-3">
                                        <h4 className="font-medium text-gray-900 mb-2">
                                          Q{qIndex + 1}: {question.questionText}
                                        </h4>
                                        
                                        {question.aiAnswer && (
                                          <div className="bg-blue-50 rounded-lg p-4 mb-3">
                                            <div className="flex items-start space-x-3">
                                              <div className="flex-shrink-0">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                  <CheckCircle className="h-5 w-5 text-blue-600" />
                                                </div>
                                              </div>
                                              <div className="flex-1">
                                                <h5 className="font-medium text-blue-900 mb-1">AI-Generated Answer</h5>
                                                <div 
                                                  className="text-blue-800 text-sm leading-relaxed"
                                                  dangerouslySetInnerHTML={{
                                                    __html: formatAnswerText(question.aiAnswer)
                                                  }}
                                                />
                                                {question.confidenceScore && (
                                                  <div className="mt-2 flex items-center">
                                                    <span className="text-xs text-blue-600 mr-2">Confidence:</span>
                                                    <div className="flex-1 bg-blue-200 rounded-full h-2 max-w-20">
                                                      <div 
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${(question.confidenceScore || 0) * 100}%` }}
                                                      ></div>
                                                    </div>
                                                    <span className="text-xs text-blue-600 ml-2">
                                                      {Math.round((question.confidenceScore || 0) * 100)}%
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Supporting Documents for this question */}
                                        {details.supportingDocuments.filter(doc => doc.questionId === question.id).length > 0 && (
                                          <div className="mt-3">
                                            <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                              <Paperclip className="h-4 w-4 mr-1" />
                                              Supporting Documents
                                            </h6>
                                            <div className="space-y-2">
                                              {details.supportingDocuments
                                                .filter(doc => doc.questionId === question.id)
                                                .map((doc) => (
                                                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center">
                                                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                                      <span className="text-sm font-medium text-gray-900">{doc.filename}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                      <button
                                                        onClick={() => viewSupportingDocument(doc)}
                                                        className="flex items-center text-primary hover:text-primary/80 text-sm font-medium"
                                                      >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                      </button>
                                                      <button
                                                        onClick={() => downloadSupportingDocument(doc)}
                                                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                      >
                                                        <Download className="h-4 w-4 mr-1" />
                                                        Download
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Checklists Shared:</span>
                    <span className="font-medium">{trustPortalItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents Available:</span>
                    <span className="font-medium">{supportingDocuments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">
                      {trustPortalItems.length > 0 
                        ? new Date(Math.max(...trustPortalItems.map(item => new Date(item.updatedAt).getTime()))).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Supporting Documents Overview */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  All Supporting Documents
                </h3>
                {supportingDocuments.length === 0 ? (
                  <p className="text-gray-600 text-sm">No supporting documents available.</p>
                ) : (
                  <div className="space-y-3">
                    {supportingDocuments.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-900 truncate">{doc.filename}</span>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => viewSupportingDocument(doc)}
                            className="flex items-center text-primary hover:text-primary/80 text-sm font-medium"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => downloadSupportingDocument(doc)}
                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                    {supportingDocuments.length > 5 && (
                      <p className="text-sm text-gray-500 italic">
                        +{supportingDocuments.length - 5} more documents
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Feedback Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Provide Feedback to {vendor.companyName}
              </h3>
              <button
                onClick={() => setShowFeedbackForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
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
                      feedbackType: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="GENERAL">General Feedback</option>
                    <option value="DOCUMENT_REQUEST">Document Request</option>
                    <option value="CLARIFICATION">Clarification Needed</option>
                    <option value="COMPLIANCE_ISSUE">Compliance Issue</option>
                    <option value="FOLLOW_UP">Follow Up</option>
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
                      priority: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
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