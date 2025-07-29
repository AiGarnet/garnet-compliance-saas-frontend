import { apiCall } from '../api';

export interface Checklist {
  id: string;
  vendorId: string;
  name: string;
  fileType: string;
  fileSize?: number;
  originalFilename: string;
  extractionStatus: 'pending' | 'extracting' | 'completed' | 'error';
  questionCount: number;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
  spacesKey?: string;
  spacesUrl?: string;
}

export interface ChecklistQuestion {
  id: string;
  checklistId: string;
  vendorId: string;
  questionText: string;
  questionOrder: number;
  status: 'pending' | 'in-progress' | 'completed' | 'needs-support';
  aiAnswer?: string;
  confidenceScore?: number;
  requiresDocument: boolean;
  documentDescription?: string;
  createdAt: string;
  updatedAt: string;
  supportingDocuments?: SupportingDocument[];
}

export interface SupportingDocument {
  id: string;
  questionId: string;
  vendorId: string;
  filename: string;
  fileType: string;
  fileSize?: number;
  filePath?: string;
  uploadedAt: string;
  spacesKey?: string;
  spacesUrl?: string;
}

export interface DocumentValidationResponse {
  relevanceScore: number;
  isRelevant: boolean;
  message: string;
  extractedContent: string;
  questionText: string;
}

export interface ChecklistUploadResponse {
  checklist: Checklist;
  questions: ChecklistQuestion[];
}

export interface GenerateAnswersRequest {
  questions: string[];
  context?: string;
  vendorId: string;
  checklistId?: string;
  selectedEvidenceFiles?: string[];
}

export interface GenerateAnswersResponse {
  answers: Array<{
    question: string;
    answer: string;
    confidence: number;
  }>;
}

export class ChecklistService {
  private static readonly BASE_URL = '/api/checklists';

  /**
   * Upload a checklist file and extract questions
   */
  static async uploadChecklist(
    file: File,
    vendorId: string,
    name?: string
  ): Promise<ChecklistUploadResponse> {
    try {
      // Use the uploadFile helper from api.ts which handles Railway URL routing
      const { uploadFile } = await import('../api');
      return await uploadFile(`${this.BASE_URL}/upload`, file, { vendorId, ...(name && { name }) });
    } catch (error) {
      console.error('Error uploading checklist:', error);
      throw error;
    }
  }

  /**
   * Get all checklists for a vendor
   */
  static async getVendorChecklists(vendorId: string): Promise<Checklist[]> {
    try {
      return await apiCall(`${this.BASE_URL}/vendor/${vendorId}`);
    } catch (error) {
      console.error('Error fetching vendor checklists:', error);
      throw error;
    }
  }

  /**
   * Get a specific checklist with its questions
   */
  static async getChecklist(
    checklistId: string,
    vendorId: string
  ): Promise<{ checklist: Checklist; questions: ChecklistQuestion[] }> {
    try {
      return await apiCall(`${this.BASE_URL}/${checklistId}/vendor/${vendorId}`);
    } catch (error) {
      console.error('Error fetching checklist:', error);
      throw error;
    }
  }

  /**
   * Get questions for a checklist
   */
  static async getChecklistQuestions(
    checklistId: string,
    vendorId: string
  ): Promise<ChecklistQuestion[]> {
    try {
      return await apiCall(`${this.BASE_URL}/${checklistId}/questions/vendor/${vendorId}`);
    } catch (error) {
      console.error('Error fetching checklist questions:', error);
      throw error;
    }
  }

  /**
   * Add a manual question to a checklist
   */
  static async addManualQuestion(
    checklistId: string,
    vendorId: string,
    questionText: string,
    requiresDocument: boolean = false,
    documentDescription?: string
  ): Promise<ChecklistQuestion> {
    try {
      const questionData = {
        questionText,
        requiresDocument,
        documentDescription
      };
      
      return await apiCall(`${this.BASE_URL}/${checklistId}/questions/vendor/${vendorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });
    } catch (error) {
      console.error('Error adding manual question:', error);
      throw error;
    }
  }

  /**
   * Add a standalone manual question to a vendor (creates default checklist if needed)
   */
  static async addStandaloneManualQuestion(
    vendorId: string,
    questionText: string,
    requiresDocument: boolean = false,
    documentDescription?: string
  ): Promise<ChecklistQuestion> {
    try {
      const questionData = {
        questionText,
        requiresDocument,
        documentDescription
      };
      
      return await apiCall(`${this.BASE_URL}/vendor/${vendorId}/standalone-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });
    } catch (error) {
      console.error('Error adding standalone manual question:', error);
      throw error;
    }
  }

  /**
   * Get all questions for a vendor (for AI questionnaire section)
   */
  static async getVendorQuestions(
    vendorId: string,
    status?: string
  ): Promise<ChecklistQuestion[]> {
    try {
      const url = status 
        ? `${this.BASE_URL}/vendor/${vendorId}/questions?status=${status}`
        : `${this.BASE_URL}/vendor/${vendorId}/questions`;
      
      return await apiCall(url);
    } catch (error) {
      console.error('Error fetching vendor questions:', error);
      throw error;
    }
  }

  /**
   * Generate AI answers for pending questions
   */
  static async generateAnswers(request: GenerateAnswersRequest): Promise<GenerateAnswersResponse> {
    try {
      return await apiCall(`${this.BASE_URL}/generate-answers`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error generating AI answers:', error);
      throw error;
    }
  }

  /**
   * Update a question's answer or status
   */
  static async updateQuestion(
    questionId: string,
    vendorId: string,
    updates: {
      status?: string;
      aiAnswer?: string;
      confidenceScore?: number;
    }
  ): Promise<ChecklistQuestion> {
    try {
      return await apiCall(`${this.BASE_URL}/questions/${questionId}/vendor/${vendorId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  /**
   * Upload supporting document for a question
   */
  static async uploadSupportingDocument(
    questionId: string,
    vendorId: string,
    file: File
  ): Promise<SupportingDocument> {
    try {
      // Use the uploadFile helper from api.ts which handles Railway URL routing
      const { uploadFile } = await import('../api');
      return await uploadFile(`${this.BASE_URL}/questions/${questionId}/documents/vendor/${vendorId}`, file);
    } catch (error) {
      console.error('Error uploading supporting document:', error);
      throw error;
    }
  }

  /**
   * Validate document relevance before uploading
   */
  static async validateDocumentRelevance(
    questionId: string,
    file: File
  ): Promise<DocumentValidationResponse> {
    try {
      // Use the uploadFile helper but to documents validation endpoint
      const { uploadFile } = await import('../api');
      return await uploadFile('/api/documents/validate', file, { questionId });
    } catch (error) {
      console.error('Error validating document relevance:', error);
      throw error;
    }
  }

  /**
   * Get all supporting documents for a vendor
   */
  static async getVendorSupportingDocuments(vendorId: string): Promise<SupportingDocument[]> {
    try {
      return await apiCall(`${this.BASE_URL}/vendor/${vendorId}/documents`);
    } catch (error) {
      console.error('Error fetching vendor supporting documents:', error);
      throw error;
    }
  }



  /**
   * Delete a supporting document
   */
  static async deleteSupportingDocument(documentId: string, vendorId: string): Promise<void> {
    try {
      await apiCall(`${this.BASE_URL}/documents/${documentId}/vendor/${vendorId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting supporting document:', error);
      throw error;
    }
  }

  /**
   * Delete a checklist and all its data
   */
  static async deleteChecklist(checklistId: string, vendorId: string): Promise<void> {
    try {
      await apiCall(`${this.BASE_URL}/${checklistId}/vendor/${vendorId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting checklist:', error);
      throw error;
    }
  }

  /**
   * Get questions that need AI answers (pending status)
   */
  static async getPendingQuestions(vendorId: string): Promise<ChecklistQuestion[]> {
    return this.getVendorQuestions(vendorId, 'pending');
  }

  /**
   * Get completed questions with AI answers
   */
  static async getCompletedQuestions(vendorId: string): Promise<ChecklistQuestion[]> {
    return this.getVendorQuestions(vendorId, 'completed');
  }

  /**
   * Get questions that need manual support
   */
  static async getQuestionsNeedingSupport(vendorId: string): Promise<ChecklistQuestion[]> {
    return this.getVendorQuestions(vendorId, 'needs-support');
  }

  /**
   * Batch generate AI answers for all pending questions of a vendor
   */
  static async generateAllPendingAnswers(
    vendorId: string, 
    context?: string, 
    checklistId?: string, 
    selectedEvidenceFiles?: string[]
  ): Promise<GenerateAnswersResponse> {
    try {
      const pendingQuestions = await this.getPendingQuestions(vendorId);
      
      if (pendingQuestions.length === 0) {
        return { answers: [] };
      }

      const request: GenerateAnswersRequest = {
        questions: pendingQuestions.map(q => q.questionText),
        context: context || 'Security compliance questionnaire',
        vendorId,
        checklistId,
        selectedEvidenceFiles
      };

      return await this.generateAnswers(request);
    } catch (error) {
      console.error('Error generating all pending answers:', error);
      throw error;
    }
  }

  /**
   * Sync checklist questions to questionnaire system for chat interface
   */
  static async syncToQuestionnaire(checklistId: string, vendorId: string): Promise<{ message: string; questionCount: number }> {
    try {
      return await apiCall(`${this.BASE_URL}/${checklistId}/vendor/${vendorId}/sync-to-questionnaire`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error syncing checklist to questionnaire:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a vendor's checklist data
   */
  static async getVendorStats(vendorId: string): Promise<{
    totalChecklists: number;
    totalQuestions: number;
    pendingQuestions: number;
    completedQuestions: number;
    questionsNeedingSupport: number;
  }> {
    try {
      const [checklists, allQuestions] = await Promise.all([
        this.getVendorChecklists(vendorId),
        this.getVendorQuestions(vendorId)
      ]);

      const pendingQuestions = allQuestions.filter(q => q.status === 'pending').length;
      const completedQuestions = allQuestions.filter(q => q.status === 'completed').length;
      const questionsNeedingSupport = allQuestions.filter(q => q.status === 'needs-support').length;

      return {
        totalChecklists: checklists.length,
        totalQuestions: allQuestions.length,
        pendingQuestions,
        completedQuestions,
        questionsNeedingSupport
      };
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      throw error;
    }
  }

  /**
   * Get total checklist count for an organization
   */
  static async getOrganizationChecklistCount(organizationId: string): Promise<number> {
    try {
      const response = await apiCall(`${this.BASE_URL}/organizations/${organizationId}/count`);
      return response.count || 0;
    } catch (error) {
      console.error('Error fetching organization checklist count:', error);
      throw error;
    }
  }

  /**
   * Get total supporting documents count for an organization
   */
  static async getOrganizationSupportingDocumentsCount(organizationId: string): Promise<number> {
    try {
      const response = await apiCall(`${this.BASE_URL}/organizations/${organizationId}/supporting-documents/count`);
      return response.count || 0;
    } catch (error) {
      console.error('Error fetching organization supporting documents count:', error);
      throw error;
    }
  }

  /**
   * Check if checklist is ready to send to trust portal
   * (all questions completed, all required documents uploaded)
   */
  static async checkChecklistCompletionStatus(checklistId: string, vendorId: string): Promise<{
    isComplete: boolean;
    totalQuestions: number;
    completedQuestions: number;
    questionsNeedingDocs: number;
    questionsWithDocs: number;
    incompleteQuestions: ChecklistQuestion[];
  }> {
    try {
      const questions = await this.getChecklistQuestions(checklistId, vendorId);
      const completedQuestions = questions.filter(q => q.status === 'completed' && q.aiAnswer?.trim());
      const questionsNeedingDocs = questions.filter(q => q.requiresDocument);
      
      // Check which questions needing docs actually have docs
      const questionsWithDocs: ChecklistQuestion[] = [];
      for (const question of questionsNeedingDocs) {
        const docs = await this.getVendorSupportingDocuments(vendorId);
        // Filter docs for this specific question
        const questionDocs = docs.filter(doc => doc.questionId === question.id);
        if (questionDocs.length > 0) {
          questionsWithDocs.push(question);
        }
      }
      
      const incompleteQuestions = questions.filter(q => {
        const hasAnswer = q.status === 'completed' && q.aiAnswer?.trim();
        const needsDoc = q.requiresDocument;
        const hasDoc = questionsWithDocs.some(qwd => qwd.id === q.id);
        
        return !hasAnswer || (needsDoc && !hasDoc);
      });
      
      return {
        isComplete: incompleteQuestions.length === 0 && questions.length > 0,
        totalQuestions: questions.length,
        completedQuestions: completedQuestions.length,
        questionsNeedingDocs: questionsNeedingDocs.length,
        questionsWithDocs: questionsWithDocs.length,
        incompleteQuestions
      };
    } catch (error) {
      console.error('Error checking checklist completion:', error);
      throw error;
    }
  }

  /**
   * Send completed checklist to Trust Portal
   */
  static async sendChecklistToTrustPortal(
    checklistId: string, 
    vendorId: string, 
    submitData?: { message?: string; title?: string }
  ): Promise<{ trustPortalId: string; itemCount: number }> {
    try {
      const response = await apiCall(`${this.BASE_URL}/${checklistId}/vendor/${vendorId}/send-to-trust-portal`, {
        method: 'POST',
        body: JSON.stringify(submitData || {}),
      });

      return response;
    } catch (error) {
      console.error('Error sending checklist to Trust Portal:', error);
      throw error;
    }
  }
} 