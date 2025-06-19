/**
 * Vendor status representing stages in the vendor approval process
 */
export enum VendorStatus {
  QUESTIONNAIRE_PENDING = 'Questionnaire Pending',
  IN_REVIEW = 'In Review',
  PENDING_REVIEW = 'Pending Review',
  APPROVED = 'Approved'
}

/**
 * Represents an answer to a specific questionnaire question
 */
export interface QuestionnaireAnswer {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  status: AnswerStatus;
  shareToTrustPortal: boolean;
  workId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Represents a vendor in the system with additional fields for database storage
 */
export interface Vendor {
  id: string;
  name: string;
  contactEmail: string;
  website?: string;
  region?: string;
  status: VendorStatus;
  industry?: string;
  description?: string;
  contactName?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  questionnaireAnswers?: QuestionnaireAnswer[];
}

/**
 * Form data for creating/updating a vendor
 */
export interface VendorFormData {
  companyName: string;
  contactEmail: string;
  website?: string;
  region?: string;
  status?: VendorStatus;
  industry?: string;
  description?: string;
  contactName?: string;
}

export enum AnswerStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed', 
  REVIEWED = 'Reviewed'
}

export interface VendorWork {
  id: string;
  vendorId: number;
  projectName: string;
  description?: string;
  status: WorkStatus;
  startDate?: Date;
  endDate?: Date;
  clientName?: string;
  technologies?: string[];
  category?: string;
  shareToTrustPortal: boolean;
  evidenceFiles?: string[];
  questionnaireAnswers?: string[];
  createdAt: Date;
  updatedAt: Date;
  isDraft: boolean;
  lastSavedAt?: Date;
}

export enum WorkStatus {
  COMPLETED = 'Completed',
  IN_PROGRESS = 'In Progress',
  PLANNED = 'Planned'
} 