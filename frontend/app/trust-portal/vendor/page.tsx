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
  HelpCircle,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  FileUp,
  Paperclip,
  X,
  AlertCircle
} from 'lucide-react';
import { vendors as vendorAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import Header from '@/components/Header';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  VendorTrustPortalData
} from '@/types/trustPortal';
import { safeMap } from '@/lib/utils/arrayUtils';
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

function VendorTrustPortalContent() {
  const searchParams = useSearchParams();
  const vendorId = searchParams?.get('id') || null;
  const { user, isAuthenticated } = useAuth();
  
  const [vendorData, setVendorData] = useState<VendorTrustPortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Enhanced state for checklist management
  const [trustPortalItems, setTrustPortalItems] = useState<TrustPortalItem[]>([]);
  const [checklistDetails, setChecklistDetails] = useState<{ [key: string]: ChecklistDetails }>({});
  const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(new Set());
  const [supportingDocuments, setSupportingDocuments] = useState<SupportingDocument[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<{ [key: string]: boolean }>({});
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [inviteToken, setInviteToken] = useState<string>('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Generate invite token for enterprise access
  const generateInviteToken = async () => {
    if (!vendorId) return;

    setIsGeneratingToken(true);
    try {
      const response = await fetch(`/api/vendors/${vendorId}/generate-invite-token`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result); // Debug log
        
        if (result.success && result.data?.inviteToken) {
          setInviteToken(result.data.inviteToken);
          setShowInviteModal(true);
        } else {
          throw new Error(result.error?.message || 'Failed to generate invite token');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate invite token');
      }
    } catch (error) {
      console.error('Error generating invite token:', error);
      alert('Failed to generate invite token. Please try again.');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  // Copy invite link to clipboard
  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/trust-portal/invite?token=${inviteToken}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

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

      // Removed feedback-related code since vendors can't provide feedback

      // Fetch real-time trust portal items and supporting documents
      await Promise.all([
        fetchTrustPortalItems(),
        fetchSupportingDocuments()
      ]);
      
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
      const response = await fetch(`/api/trust-portal/vendor/${vendorId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Filter for questionnaire items only (sent via "Send to Trust Portal")
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
  const fetchSupportingDocuments = async () => {
    if (!vendorId) return;

    try {
      const documents = await ChecklistService.getVendorSupportingDocuments(vendorId);
      setSupportingDocuments(documents);
    } catch (error) {
      console.error('Error fetching supporting documents:', error);
    }
  };

  // Load detailed checklist information when expanded
  const loadChecklistDetails = async (trustPortalItem: TrustPortalItem) => {
    if (!vendorId || !trustPortalItem.questionnaireId) return;

    const checklistId = trustPortalItem.questionnaireId;
    
    if (checklistDetails[checklistId]) {
      return; // Already loaded
    }

    setIsLoadingDetails(prev => ({ ...prev, [checklistId]: true }));

    try {
      const [checklistData, questions] = await Promise.all([
        ChecklistService.getChecklist(checklistId, vendorId),
        ChecklistService.getChecklistQuestions(checklistId, vendorId)
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

  // Delete checklist from trust portal
  const deleteChecklistFromTrustPortal = async (trustPortalItem: TrustPortalItem) => {
    if (!window.confirm(`Are you sure you want to remove "${trustPortalItem.title}" from the trust portal? This action cannot be undone.`)) {
      return;
    }

    setDeletingItems(prev => new Set(prev).add(trustPortalItem.id));

    try {
      const response = await fetch(`/api/trust-portal/items/${trustPortalItem.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trust portal item');
      }

      // Remove from local state
      setTrustPortalItems(prev => prev.filter(item => item.id !== trustPortalItem.id));
      
      // Remove from checklist details if expanded
      if (trustPortalItem.questionnaireId) {
        setChecklistDetails(prev => {
          const updated = { ...prev };
          delete updated[trustPortalItem.questionnaireId!];
          return updated;
        });
        setExpandedChecklists(prev => {
          const updated = new Set(prev);
          updated.delete(trustPortalItem.questionnaireId!);
          return updated;
        });
      }

      alert('Checklist successfully removed from trust portal!');
    } catch (error) {
      console.error('Error deleting trust portal item:', error);
      alert('Failed to remove checklist from trust portal. Please try again.');
    } finally {
      setDeletingItems(prev => {
        const updated = new Set(prev);
        updated.delete(trustPortalItem.id);
        return updated;
      });
    }
  };

  // Download supporting document
  const downloadSupportingDocument = async (doc: SupportingDocument) => {
    try {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = `/api/checklists/documents/${doc.id}/download`;
      link.download = doc.filename;
      link.target = '_blank';
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
      // Open the document in a new tab for viewing
      window.open(`/api/checklists/documents/${doc.id}/download`, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document. Please try again.');
    }
  };

  // Format answer text to make specific phrases bold
  const formatAnswerText = (text: string) => {
    if (!text) return text;
    
    // List of phrases to make bold
    const boldPhrases = [
      'Defined Incident Response Times',
      'Response Time',
      'SLA',
      'Service Level Agreement',
      'Critical',
      'High Priority',
      'Emergency Response'
    ];
    
    let formattedText = text;
    
    boldPhrases.forEach(phrase => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      formattedText = formattedText.replace(regex, '<strong>$1</strong>');
    });
    
    return formattedText;
  };

  // Removed feedback submission function since vendors can't provide feedback

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
                    onClick={generateInviteToken}
                    disabled={isGeneratingToken}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {isGeneratingToken ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Generate Invite Link
                      </>
                    )}
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
                        const isDeleting = deletingItems.has(item.id);

                        return (
                          <div key={item.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
                            {/* Checklist Header */}
                            <div className="p-6 border-b border-gray-100">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mb-3">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                                    {content?.status || 'Submitted'}
                                  </span>
                                  <button
                                    onClick={() => deleteChecklistFromTrustPortal(item)}
                                    disabled={isDeleting}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Remove from Trust Portal"
                                  >
                                    {isDeleting ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
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
                                    <div className="text-2xl font-bold text-purple-600">
                                      {details?.supportingDocuments?.length || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">Support Docs</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600">Submitted</div>
                                    <div className="text-sm font-medium">{new Date(item.createdAt).toLocaleDateString()}</div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                    {item.category}
                                  </span>
                                  {content?.checklistName && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {content.checklistName}
                                    </span>
                                  )}
                                </div>
                                {checklistId && (
                                  <button
                                    onClick={() => toggleChecklistExpansion(item)}
                                    className="flex items-center text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <EyeOff className="h-4 w-4 mr-1" />
                                        Hide Details
                                        <ChevronUp className="h-4 w-4 ml-1" />
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Details
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Expanded Checklist Details */}
                            {isExpanded && checklistId && (
                              <div className="p-6 bg-gray-50">
                                {isLoadingDetail ? (
                                  <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading checklist details...</p>
                                  </div>
                                ) : details ? (
                                  <div className="space-y-6">
                                    {/* Questions and Answers */}
                                    <div>
                                      <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
                                        Questions & Answers
                                      </h5>
                                      <div className="space-y-4">
                                        {details.questions.map((question, index) => (
                                          <div key={question.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-start justify-between mb-2">
                                              <h6 className="font-medium text-gray-900">
                                                {index + 1}. {question.questionText}
                                              </h6>
                                              <div className="flex items-center space-x-2 ml-4">
                                                {question.status === 'completed' ? (
                                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                  <Clock className="h-5 w-5 text-yellow-500" />
                                                )}
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                  question.status === 'completed' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                  {question.status}
                                                </span>
                                              </div>
                                            </div>
                                            {question.aiAnswer && (
                                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: formatAnswerText(question.aiAnswer) }}></p>
                                                {question.confidenceScore && (
                                                  <div className="mt-2 flex items-center text-xs text-gray-500">
                                                    <span>Confidence: {Math.round(question.confidenceScore * 100)}%</span>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            {question.requiresDocument && question.documentDescription && (
                                              <div className="mt-2 p-2 bg-amber-50 border-l-4 border-amber-400">
                                                <p className="text-sm text-amber-800">
                                                  <Paperclip className="h-4 w-4 inline mr-1" />
                                                  Supporting document required: {question.documentDescription}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Supporting Documents for this checklist */}
                                    {details.supportingDocuments.length > 0 && (
                                      <div>
                                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                          <FileUp className="h-5 w-5 mr-2 text-green-600" />
                                          Supporting Documents
                                        </h5>
                                        <div className="grid gap-3">
                                          {details.supportingDocuments.map((doc) => (
                                            <div key={doc.id} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                                              <div className="flex items-center">
                                                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                                                <div>
                                                  <p className="font-medium text-gray-900">{doc.filename}</p>
                                                  <p className="text-sm text-gray-500">
                                                    {doc.fileType?.toUpperCase()} • {doc.fileSize ? Math.round(doc.fileSize / 1024) : 0} KB
                                                    • {new Date(doc.uploadedAt).toLocaleDateString()}
                                                  </p>
                                                </div>
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
                                ) : (
                                  <div className="text-center py-8">
                                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">Failed to load checklist details</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting Documents Overview */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileUp className="h-6 w-6 mr-2 text-green-600" />
                    All Supporting Documents
                    <span className="ml-2 bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                      {supportingDocuments.length}
                    </span>
                  </h2>
                </div>
                <div className="p-6">
                  {supportingDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Supporting Documents</h3>
                      <p className="text-gray-600">No supporting documents have been uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {supportingDocuments.map((doc) => (
                        <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-8 w-8 text-blue-600 mr-4" />
                              <div>
                                <h4 className="font-medium text-gray-900">{doc.filename}</h4>
                                <p className="text-sm text-gray-500">
                                  {doc.fileType?.toUpperCase()} • {doc.fileSize ? Math.round(doc.fileSize / 1024) : 0} KB
                                  • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
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
                        </div>
                      ))}
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
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{vendor.contactName}</span>
                    </div>
                  )}
                  {vendor.contactEmail && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <a href={`mailto:${vendor.contactEmail}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {vendor.contactEmail}
                      </a>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-2" />
                      <a 
                        href={vendor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {vendor.website}
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
                    <span className="text-gray-600">Checklists Shared:</span>
                    <span className="font-medium">{trustPortalItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supporting Documents:</span>
                    <span className="font-medium">{supportingDocuments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium text-sm">
                      {trustPortalItems.length > 0 
                        ? new Date(Math.max(...trustPortalItems.map(item => new Date(item.updatedAt).getTime()))).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Invite Token Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Share Trust Portal
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Share this link with enterprises to give them secure access to your trust portal without requiring login.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Invite Link:</p>
                <p className="text-sm font-mono text-gray-800 break-all">
                  {window.location.origin}/trust-portal/invite?token={inviteToken}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={copyInviteLink}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Copy Link
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
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