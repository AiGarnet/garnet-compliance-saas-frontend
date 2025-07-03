import { apiClient } from './api';

export interface GenerateDocumentRequest {
  documentTitle: string;
  instructions?: string;
  category?: string;
  vendorId?: number;
  questionId?: string;
}

export interface GenerateDocumentResponse {
  success: boolean;
  document?: any;
  error?: string;
  downloadUrl?: string;
  documentId?: string;
}

/**
 * AI Service for document generation and other AI-related operations
 */
export class AIService {
  /**
   * Generate and save a supporting document using AI
   */
  static async generateAndSaveDocument(request: GenerateDocumentRequest): Promise<GenerateDocumentResponse> {
    try {
      const response = await apiClient.post<GenerateDocumentResponse>('/api/ai/generate-and-save-document', request);
      return response;
    } catch (error: any) {
      console.error('Error generating document:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate document'
      };
    }
  }

  /**
   * Generate a document preview (without saving)
   */
  static async generateDocumentPreview(request: GenerateDocumentRequest): Promise<{ success: boolean; title: string; content: string; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; title: string; content: string; error?: string }>('/api/ai/generate-document', request);
      return response;
    } catch (error: any) {
      console.error('Error generating document preview:', error);
      return {
        success: false,
        title: '',
        content: '',
        error: error.message || 'Failed to generate document preview'
      };
    }
  }
} 