export interface TrustPortalItem {
  id: number;
  vendorId: number;
  title: string;
  description?: string;
  category: TrustPortalCategory;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  content?: string;
  isQuestionnaireAnswer: boolean;
  questionnaireId?: string;
  createdAt: Date;
  updatedAt: Date;
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
  id: number;
  vendorId: number;
  enterpriseContactName?: string;
  enterpriseContactEmail: string;
  enterpriseCompanyName?: string;
  feedbackType: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  inviteToken?: string;
  createdAt: Date;
  updatedAt: Date;
  responses?: TrustPortalFeedbackResponse[];
}

export enum FeedbackType {
  GENERAL = 'general',
  DOCUMENT_REQUEST = 'document_request',
  CLARIFICATION = 'clarification',
  COMPLIANCE_ISSUE = 'compliance_issue',
  FOLLOW_UP = 'follow_up'
}

export enum FeedbackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TrustPortalFeedbackResponse {
  id: number;
  feedbackId: number;
  responderType: ResponderType;
  responderName?: string;
  responderEmail?: string;
  message: string;
  attachments?: string[];
  isInternalNote: boolean;
  createdAt: Date;
}

export enum ResponderType {
  VENDOR = 'vendor',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin'
}

// Shared Documents Types
export interface TrustPortalSharedDocument {
  id: number;
  vendorId: number;
  documentTitle: string;
  documentDescription?: string;
  documentCategory: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  isEvidenceFile: boolean;
  isQuestionnaireAnswer: boolean;
  questionnaireId?: string;
  workId?: string;
  shareToTrustPortal: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Complete Trust Portal Data
export interface VendorTrustPortalData {
  vendor: {
    vendorId: number;
    companyName: string;
    region?: string;
    industry?: string;
    description?: string;
    website?: string;
    contactEmail?: string;
    contactName?: string;
    status?: string;
  };
  sharedDocuments: TrustPortalSharedDocument[];
  vendorWorks: VendorWork[];
  questionnaireAnswers: QuestionnaireAnswer[];
  evidenceFiles: EvidenceFile[];
  feedback: TrustPortalFeedback[];
  inviteToken?: string;
  // Frontend-specific fields
  checklists?: Array<{
    id: string;
    name: string;
    questions: Array<{
      id: string;
      questionText: string;
      aiAnswer?: string;
      confidenceScore?: number;
      status: string;
      requiresDocument: boolean;
      documentDescription?: string;
      supportingDocuments?: any[];
    }>;
  }>;
  documents?: Array<{
    id: string;
    filename: string;
    fileType: string;
    spacesUrl?: string;
    uploadedAt: string;
  }>;
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