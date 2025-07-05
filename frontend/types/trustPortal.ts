export interface TrustPortalItem {
  id: string;
  vendorId: string;
  title: string;
  description?: string;
  category: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  content?: string;
  isQuestionnaireAnswer: boolean;
  questionnaireId?: string;
  createdAt: string;
  updatedAt: string;
}

export type TrustPortalCategory = 
  | 'Certification'
  | 'Statement'
  | 'Policy'
  | 'Evidence'
  | 'Questionnaire';

export interface TrustPortalVendor {
  id: string;
  name: string;
  status: string;
  industry?: string;
  region?: string;
  description?: string;
  website?: string;
}

// Feedback System Types
export interface TrustPortalFeedback {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface TrustPortalFeedbackResponse {
  id: string;
  feedbackId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Shared Documents Types
export interface TrustPortalSharedDocument {
  id: string;
  vendorId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

// Complete Trust Portal Data
export interface TrustPortalData {
  vendor: TrustPortalVendor;
  items: TrustPortalItem[];
  feedback?: TrustPortalFeedback[];
  sharedDocuments?: TrustPortalSharedDocument[];
}

export interface VendorWork {
  id: string;
  vendorId: number;
  projectName: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  clientName?: string;
  technologies: string[];
  category: string;
  evidenceFiles?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionnaireAnswer {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  category: string;
}

// Form DTOs
export interface CreateFeedbackDto {
  vendorId: number;
  enterpriseContactName?: string;
  enterpriseContactEmail: string;
  enterpriseCompanyName?: string;
  feedbackType: FeedbackType;
  subject: string;
  message: string;
  priority?: FeedbackPriority;
  inviteToken?: string;
}

export interface CreateFeedbackResponseDto {
  feedbackId: number;
  responderType: ResponderType;
  responderName?: string;
  responderEmail?: string;
  message: string;
  attachments?: string[];
  isInternalNote?: boolean;
} 