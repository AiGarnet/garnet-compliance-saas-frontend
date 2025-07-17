'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Download, 
  Eye, 
  FileText, 
  AlertTriangle, 
  Building2, 
  Mail, 
  Globe, 
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';

interface ChecklistQuestion {
  id: string;
  questionText: string;
  aiAnswer?: string;
  confidenceScore?: number;
  status: string;
  requiresDocument: boolean;
  documentDescription?: string;
  supportingDocuments?: any[];
}

interface VendorData {
  vendor: {
    id: number;
    vendorId?: number;
    uuid: string;
    companyName: string;
    contactEmail: string;
    website?: string;
    description?: string;
    createdAt: string;
  };
  checklists: Array<{
    id: string;
    name: string;
    questions: ChecklistQuestion[];
  }>;
  documents: Array<{
    id: string;
    filename: string;
    fileType: string;
    spacesUrl?: string;
    uploadedAt: string;
  }>;
}

interface FeedbackFormData {
  enterpriseContactEmail: string;
  enterpriseContactName: string;
  enterpriseCompanyName: string;
  feedbackType: string;
  priority: string;
  subject: string;
  message: string;
}

export default function TrustPortalClient({ token }: { token: string }) {
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(new Set());
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormData>({
    enterpriseContactEmail: '',
    enterpriseContactName: '',
    enterpriseCompanyName: '',
    feedbackType: 'general',
    priority: 'medium',
    subject: '',
    message: ''
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    async function fetchVendorData() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/trust-portal/invite/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Invalid or expired invitation link');
          } else if (response.status === 403) {
            throw new Error('Access denied');
          } else {
            throw new Error('Failed to load vendor information');
          }
        }

        const data = await response.json();
        setVendorData(data);
      } catch (err: any) {
        console.error('Error fetching vendor data:', err);
        setError(err.message || 'Failed to load vendor information');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVendorData();
  }, [token]);

  const toggleChecklist = (checklistId: string) => {
    const newExpanded = new Set(expandedChecklists);
    if (expandedChecklists.has(checklistId)) {
      newExpanded.delete(checklistId);
    } else {
      newExpanded.add(checklistId);
    }
    setExpandedChecklists(newExpanded);
  };

  // Group checklists by follow-up status
  const groupChecklistsByFollowUp = (checklists: any[]) => {
    const initial: any[] = [];
    const followUp: any[] = [];
    
    checklists.forEach(checklist => {
      // Check if this checklist is a follow-up based on trust portal submission data
      // The follow-up info comes from the trust portal item, not individual questions
      const isFollowUpChecklist = checklist.isFollowUp || 
                                  checklist.followUpType !== 'initial' ||
                                  checklist.parentSubmissionId;
      
      if (isFollowUpChecklist) {
        followUp.push(checklist);
      } else {
        initial.push(checklist);
      }
    });
    
    return { initial, followUp };
  };

  const formatAnswerText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const handleDownloadDocument = async (document: any) => {
    try {
      if (document.spacesUrl) {
        const link = window.document.createElement('a');
        link.href = document.spacesUrl;
        link.download = document.filename;
        link.target = '_blank';
        link.click();
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleViewDocument = async (document: any) => {
    try {
      if (document.spacesUrl) {
        window.open(document.spacesUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/trust-portal/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feedbackForm,
          vendorId: vendorData?.vendor.vendorId || vendorData?.vendor.id,
          inviteToken: token
        }),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        setShowFeedbackForm(false);
        setFeedbackForm({
          enterpriseContactEmail: '',
          enterpriseContactName: '',
          enterpriseCompanyName: '',
          feedbackType: 'general',
          priority: 'medium',
          subject: '',
          message: ''
        });
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading vendor information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-sm text-gray-500">
          Please check your invitation link or contact the vendor for a new invitation.
        </p>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-600">
          No vendor information found for this invitation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Vendor Information */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vendorData.vendor.companyName}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {vendorData.vendor.contactEmail}
                </span>
                {vendorData.vendor.website && (
                  <span className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    <a 
                      href={vendorData.vendor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </span>
                )}
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Member since {new Date(vendorData.vendor.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {vendorData.vendor.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Company Description</h3>
            <p className="text-gray-700">{vendorData.vendor.description}</p>
          </div>
        )}
      </section>

      {/* Checklists Section */}
      {vendorData.checklists && vendorData.checklists.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Compliance Checklists
          </h2>
          
          {(() => {
            const { initial, followUp } = groupChecklistsByFollowUp(vendorData.checklists);
            
            return (
              <div className="space-y-6">
                {/* Initial Submissions */}
                {initial.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                      Initial Submissions
                    </h3>
                    <div className="space-y-4">
                      {initial.map((checklist) => (
                        <div key={checklist.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleChecklist(checklist.id)}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
                          >
                            <h3 className="font-medium text-gray-900">{checklist.name}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {checklist.questions?.length || 0} questions
                              </span>
                              {expandedChecklists.has(checklist.id) ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          </button>
                          
                          {expandedChecklists.has(checklist.id) && checklist.questions && (
                            <div className="p-4 space-y-4">
                              {checklist.questions.map((question: ChecklistQuestion, qIndex: number) => (
                                <div key={question.id} className="mb-3">
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

                                  {question.supportingDocuments && question.supportingDocuments.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                      <h6 className="text-sm font-medium text-gray-700 mb-2">Supporting Documents:</h6>
                                      <div className="space-y-1">
                                        {question.supportingDocuments.map((doc: any, docIndex: number) => (
                                          <div key={docIndex} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 flex items-center">
                                              <FileText className="h-3 w-3 mr-1" />
                                              {doc.filename}
                                            </span>
                                            <div className="flex space-x-1">
                                              <button
                                                onClick={() => handleViewDocument(doc)}
                                                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                                title="View document"
                                              >
                                                <Eye className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() => handleDownloadDocument(doc)}
                                                className="text-green-600 hover:text-green-800 p-1 rounded"
                                                title="Download document"
                                              >
                                                <Download className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Follow-up Submissions */}
                {followUp.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
                      Follow-up Submissions
                      <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        In response to feedback
                      </span>
                    </h3>
                    <div className="space-y-4">
                      {followUp.map((checklist) => (
                        <div key={checklist.id} className="border border-orange-200 rounded-lg overflow-hidden bg-orange-50">
                          <button
                            onClick={() => toggleChecklist(checklist.id)}
                            className="w-full px-4 py-3 bg-orange-50 hover:bg-orange-100 flex items-center justify-between text-left transition-colors"
                          >
                            <h3 className="font-medium text-gray-900">{checklist.name}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {checklist.questions?.length || 0} questions
                              </span>
                              {expandedChecklists.has(checklist.id) ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          </button>
                          
                          {expandedChecklists.has(checklist.id) && checklist.questions && (
                            <div className="p-4 space-y-4 bg-white">
                              {checklist.questions.map((question: any, qIndex: number) => (
                                <div key={question.id} className="mb-3">
                                  <h4 className="font-medium text-gray-900 mb-2">
                                    Q{qIndex + 1}: {question.questionText}
                                  </h4>
                                  
                                  {question.aiAnswer && (
                                    <div className="bg-orange-50 rounded-lg p-4 mb-3">
                                      <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                            <CheckCircle className="h-5 w-5 text-orange-600" />
                                          </div>
                                        </div>
                                        <div className="flex-1">
                                          <h5 className="font-medium text-orange-900 mb-1">Follow-up Response</h5>
                                          <div 
                                            className="text-orange-800 text-sm leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: formatAnswerText(question.aiAnswer) }}
                                          />
                                          {question.confidenceScore && (
                                            <div className="mt-2 text-xs text-orange-700">
                                              Confidence: {Math.round(question.confidenceScore * 100)}%
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {question.supportingDocuments && question.supportingDocuments.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                      <h6 className="text-sm font-medium text-gray-700 mb-2">Supporting Documents:</h6>
                                      <div className="space-y-1">
                                        {question.supportingDocuments.map((doc: any, docIndex: number) => (
                                          <div key={docIndex} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 flex items-center">
                                              <FileText className="h-3 w-3 mr-1" />
                                              {doc.filename}
                                            </span>
                                            <div className="flex space-x-1">
                                              <button
                                                onClick={() => handleViewDocument(doc)}
                                                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                                title="View document"
                                              >
                                                <Eye className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() => handleDownloadDocument(doc)}
                                                className="text-green-600 hover:text-green-800 p-1 rounded"
                                                title="Download document"
                                              >
                                                <Download className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </section>
      )}

      {/* Supporting Documents Section */}
      {vendorData.documents && vendorData.documents.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Supporting Documents
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendorData.documents.map((document) => (
              <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{document.filename}</h3>
                    <p className="text-xs text-gray-500">
                      {document.fileType.toUpperCase()} • {new Date(document.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleViewDocument(document)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(document)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feedback Section */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
            Provide Feedback
          </h2>
          {feedbackSubmitted && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Feedback submitted successfully!
            </div>
          )}
        </div>

        {!showFeedbackForm ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Share Your Feedback</h3>
            <p className="text-gray-600 mb-4">
              Have questions or suggestions about this vendor's compliance information? 
              We'd love to hear from you.
            </p>
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center mx-auto"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Provide Feedback
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={feedbackForm.enterpriseContactName}
                  onChange={(e) => setFeedbackForm({...feedbackForm, enterpriseContactName: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={feedbackForm.enterpriseContactEmail}
                  onChange={(e) => setFeedbackForm({...feedbackForm, enterpriseContactEmail: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={feedbackForm.enterpriseCompanyName}
                onChange={(e) => setFeedbackForm({...feedbackForm, enterpriseCompanyName: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={feedbackForm.feedbackType}
                  onChange={(e) => setFeedbackForm({...feedbackForm, feedbackType: e.target.value})}
                >
                  <option value="general">General</option>
                  <option value="document_request">Document Request</option>
                  <option value="clarification">Clarification</option>
                  <option value="compliance_issue">Compliance Issue</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={feedbackForm.priority}
                  onChange={(e) => setFeedbackForm({...feedbackForm, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={feedbackForm.subject}
                onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmittingFeedback ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setShowFeedbackForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
} 