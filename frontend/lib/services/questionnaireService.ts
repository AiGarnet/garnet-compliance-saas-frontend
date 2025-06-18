import { apiClient } from './api';
import { VendorService } from './vendorService';
import { v4 as uuidv4 } from 'uuid';

// Base API URL - adjust based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';

// Check if we're in development/test mode
const isDevelopment = process.env.NODE_ENV !== 'production';

interface GenerateAnswersResponse {
  success: boolean;
  data?: {
    answers: Array<{ question: string; answer: string }>;
    metadata?: any;
  };
  error?: string;
}

/**
 * Questionnaire Service
 * Handles interactions with the question answering API
 */
export const QuestionnaireService = {
  /**
   * Generate answers for a list of questions using AI with batch processing
   * @param questions - Array of question strings
   * @param onProgress - Optional callback for progress updates
   * @returns Promise with generated answers
   */
  async generateAnswers(
    questions: string[], 
    onProgress?: (completed: number, total: number, currentQuestion?: string) => void
  ): Promise<GenerateAnswersResponse> {
    try {
      if (questions.length === 0) {
        return {
          success: false,
          error: 'No questions provided'
        };
      }

      // For single question, use individual processing
      if (questions.length === 1) {
        onProgress?.(0, 1, questions[0]);
        const result = await this.getAnswer(questions[0]);
        onProgress?.(1, 1);
        
        if (result.success) {
          return {
            success: true,
            data: {
              answers: [{ question: questions[0], answer: result.answer || '' }],
              metadata: {
                totalQuestions: 1,
                successfulAnswers: 1,
                failedAnswers: 0,
                processingTimeMs: Date.now(),
                timestamp: new Date().toISOString()
              }
            }
          };
        } else {
          return {
            success: false,
            error: result.error || 'Failed to generate answer'
          };
        }
      }

      // For multiple questions, use batch processing
      onProgress?.(0, questions.length);
      
      const response = await apiClient.post<{
        answers: Array<{ 
          question: string; 
          answer: string; 
          success?: boolean; 
          error?: string; 
        }>;
        metadata?: {
          totalQuestions: number;
          successfulAnswers: number;
          failedAnswers: number;
          processingTimeMs: number;
          timestamp: string;
        };
      }>('/api/generate-answers', {
        questions: questions
      });

      onProgress?.(questions.length, questions.length);

      // Ensure all answers have the fallback message for failed ones
      const processedAnswers = response.answers.map(answer => ({
        question: answer.question,
        answer: answer.success === false ? 
          'We couldn\'t generate an answer—please try again.' : 
          answer.answer
      }));

      return {
        success: true,
        data: {
          answers: processedAnswers,
          metadata: response.metadata
        }
      };
    } catch (error: any) {
      console.error('Error generating answers:', error);
      onProgress?.(questions.length, questions.length); // Complete progress on error
      
      return {
        success: false,
        error: error.message || 'Failed to generate answers'
      };
    }
  },

  /**
   * Get a single answer for a question using AI
   * @param question - The question to answer
   * @returns Promise with the generated answer
   */
  async getAnswer(question: string): Promise<{ success: boolean; answer?: string; error?: string }> {
    try {
      const response = await apiClient.post<{ answer: string }>('/api/answer', {
        question: question
      });

      return {
        success: true,
        answer: response.answer
      };
    } catch (error: any) {
      console.error('Error getting answer:', error);
      return {
        success: false,
        error: error.message || 'Failed to get answer'
      };
    }
  },

  /**
   * Submit a question to the AI chatbot
   * @param question - The question to ask
   * @returns Promise with the AI response
   */
  async askQuestion(question: string): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const response = await apiClient.post<{ response: string }>('/ask', {
        question: question
      });

      return {
        success: true,
        response: response.response
      };
    } catch (error: any) {
      console.error('Error asking question:', error);
      return {
        success: false,
        error: error.message || 'Failed to ask question'
      };
    }
  },

  /**
   * Create a new vendor with questionnaire answers directly in the backend database
   * @param vendorName - Name of the vendor
   * @param questions - Array of questions
   * @param answers - Array of answers (optional, will generate if not provided)
   * @param vendorData - Additional vendor data
   * @returns Promise with the created vendor and questionnaire data
   */
  async createVendorWithQuestionnaire(
    vendorName: string,
    questions: string[],
    answers?: Array<{ question: string; answer: string }>,
    vendorData?: {
      contactName?: string;
      contactEmail?: string;
      website?: string;
      industry?: string;
      description?: string;
    }
  ): Promise<{ success: boolean; vendor?: any; questionnaire?: any; error?: string }> {
    try {
      // Generate answers if not provided
      let finalAnswers = answers;
      if (!finalAnswers || finalAnswers.length === 0) {
        const generateResult = await this.generateAnswers(questions);
        if (!generateResult.success || !generateResult.data) {
          return {
            success: false,
            error: generateResult.error || 'Failed to generate answers'
          };
        }
        finalAnswers = generateResult.data.answers;
      }

      // Add questionId to each answer
      const answersWithIds = finalAnswers.map(answer => ({
        questionId: uuidv4(),
        question: answer.question,
        answer: answer.answer
      }));

      // Create vendor with questionnaire via backend API
      const response = await apiClient.post<{ vendor: any }>('/api/vendors/with-answers', {
        name: vendorName,
        ...vendorData,
        answers: answersWithIds
      });

      // Create a questionnaire object for frontend use
      const questionnaire = {
        id: `q${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`,
        name: `${vendorName} Security Questionnaire`,
        vendorId: response.vendor.id,
        vendorName: vendorName,
        status: 'Completed',
        progress: 100,
        dueDate: new Date().toISOString().split('T')[0],
        answers: finalAnswers,
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        vendor: response.vendor,
        questionnaire: questionnaire
      };
    } catch (error: any) {
      console.error('Error creating vendor with questionnaire:', error);
      return {
        success: false,
        error: error.message || 'Failed to create vendor with questionnaire'
      };
    }
  },

  /**
   * Save questionnaire results to a vendor
   * @param vendorId - ID of the vendor, or null if creating a new vendor
   * @param vendorName - Name of the vendor (required if vendorId is null)
   * @param answers - Array of question/answer pairs
   * @returns Object indicating success and the updated/created vendor
   */
  async saveQuestionnaireToVendor(
    vendorId: string | null,
    vendorName: string | null,
    answers: Array<{ question: string; answer: string }>
  ): Promise<{ success: boolean; vendorId?: string; error?: string }> {
    try {
      // Add questionId to each answer
      const answersWithIds = answers.map(answer => ({
        questionId: uuidv4(),
        question: answer.question,
        answer: answer.answer
      }));

      if (vendorId) {
        // Update existing vendor
        const updatedVendor = await VendorService.saveVendorQuestionnaire(vendorId, answersWithIds);
        
        if (!updatedVendor) {
          return { 
            success: false, 
            error: `Vendor with ID ${vendorId} not found` 
          };
        }
        
        return { 
          success: true, 
          vendorId: updatedVendor.id 
        };
      } else {
        // Create new vendor
        if (!vendorName) {
          return { 
            success: false, 
            error: 'Vendor name is required when creating a new vendor' 
          };
        }
        
        const newVendor = await VendorService.createVendorWithQuestionnaire(vendorName, answersWithIds);
        
        if (!newVendor) {
          return {
            success: false,
            error: 'Failed to create new vendor'
          };
        }
        
        return { 
          success: true, 
          vendorId: newVendor.id 
        };
      }
    } catch (error: any) {
      console.error('Error saving questionnaire to vendor:', error);
      return {
        success: false,
        error: error.message || 'An unknown error occurred',
      };
    }
  },

  /**
   * Save questionnaire directly to backend database (bypassing local API routes)
   * @param title - Questionnaire title
   * @param questions - Array of questions
   * @param generateAnswers - Whether to generate AI answers
   * @param vendorId - Optional vendor ID to save questionnaire to existing vendor
   * @param preGeneratedAnswers - Optional pre-generated answers to avoid duplication
   * @returns Promise with the saved questionnaire data
   */
  async saveQuestionnaireToDatabase(
    title: string,
    questions: string[],
    generateAnswers: boolean = true,
    vendorId?: string,
    preGeneratedAnswers?: Array<{ question: string; answer: string }>
  ): Promise<{ success: boolean; questionnaire?: any; vendor?: any; error?: string }> {
    try {
      // Use pre-generated answers if provided, otherwise generate if requested
      let answers: Array<{ question: string; answer: string }> = [];
      if (preGeneratedAnswers && preGeneratedAnswers.length > 0) {
        // Use the pre-generated answers to avoid duplicate processing
        answers = preGeneratedAnswers;
      } else if (generateAnswers) {
        const generateResult = await this.generateAnswers(questions);
        if (generateResult.success && generateResult.data) {
          answers = generateResult.data.answers;
        }
      } else {
        // Create empty answers
        answers = questions.map(q => ({ question: q, answer: '' }));
      }

      // Step 1: Create the questionnaire record with questions
      const questionnaireData = {
        title: title,
        questions: questions.map((q, index) => ({
          questionText: q,
          questionOrder: index + 1,
          isRequired: true
        })),
        vendorId: vendorId ? parseInt(vendorId) : undefined,
        generateAnswers: generateAnswers
      };

      // Create questionnaire using the simplified backend API
      const questionnaireResponse = await apiClient.post<{ questionnaire: any }>('/api/questionnaires', questionnaireData);

      if (!questionnaireResponse.questionnaire) {
        throw new Error('Failed to create questionnaire record');
      }

      const questionnaireId = questionnaireResponse.questionnaire.id;

      // Step 2: If vendorId is provided and we have answers, save them
      if (vendorId && answers.length > 0) {
        try {
          // Save vendor answers directly to the questionnaire
          const answersWithIds = answers.map(answer => ({
            questionId: uuidv4(),
            question: answer.question,
            answer: answer.answer
          }));

          // Use the simplified endpoint to save vendor answers
          const answersResponse = await apiClient.post<{ 
            answers: any[], 
            message: string 
          }>(`/api/questionnaires/${questionnaireId}/vendor/${vendorId}/answers`, answersWithIds);

          // Create questionnaire object for frontend
          const questionnaire = {
            id: questionnaireId,
            name: title,
            vendorId: vendorId,
            status: 'Completed',
            progress: 100,
            dueDate: new Date().toISOString().split('T')[0],
            answers: answersResponse.answers || answers,
            createdAt: new Date().toISOString()
          };

          return {
            success: true,
            questionnaire: questionnaire,
            vendor: { id: vendorId }
          };
        } catch (error: any) {
          console.error('Error saving vendor answers for questionnaire:', error);
          return {
            success: false,
            error: `Failed to save vendor answers: ${error.message}`
          };
        }
      }

      // Step 3: If no vendorId provided, create new vendor and save answers
      if (!vendorId) {
        try {
          // Create a vendor name based on the questionnaire title
          const vendorName = title.includes('Questionnaire') ? 
            title.replace('Questionnaire', '').trim() || `Vendor for ${title}` :
            `Vendor for ${title}`;

          // Create vendor first
          const vendorData = {
            companyName: vendorName,
            region: 'Unknown',
            status: 'QUESTIONNAIRE_PENDING',
            description: `Vendor created from questionnaire: ${title}`
          };

          const vendorResponse = await apiClient.post<{ vendor: any }>('/api/vendors', vendorData);
          
          if (!vendorResponse.vendor) {
            throw new Error('Failed to create vendor');
          }

          const newVendorId = vendorResponse.vendor.id || vendorResponse.vendor.vendorId;

          // Now save answers if we have them
          if (answers.length > 0) {
            const answersWithIds = answers.map(answer => ({
              questionId: uuidv4(),
              question: answer.question,
              answer: answer.answer
            }));

            try {
              await apiClient.post(`/api/questionnaires/${questionnaireId}/vendor/${newVendorId}/answers`, answersWithIds);
            } catch (linkError) {
              console.warn('Failed to link vendor answers to questionnaire:', linkError);
              // Continue anyway, the vendor and questionnaire are created
            }
          }

          return {
            success: true,
            questionnaire: {
              id: questionnaireId,
              name: title,
              vendorId: newVendorId,
              status: answers.length > 0 ? 'Completed' : 'Not Started',
              progress: answers.length > 0 ? 100 : 0,
              dueDate: new Date().toISOString().split('T')[0],
              answers: answers,
              createdAt: new Date().toISOString()
            },
            vendor: vendorResponse.vendor
          };
        } catch (error: any) {
          console.error('Error creating vendor for questionnaire:', error);
          return {
            success: false,
            error: `Failed to create vendor: ${error.message}`
          };
        }
      }

      // If vendorId provided but no answers, just return the questionnaire
      return {
        success: true,
        questionnaire: {
          id: questionnaireId,
          name: title,
          vendorId: vendorId,
          status: 'Not Started',
          progress: 0,
          dueDate: new Date().toISOString().split('T')[0],
          answers: [],
          createdAt: new Date().toISOString()
        },
        vendor: { id: vendorId }
      };
    } catch (error: any) {
      console.error('Error saving questionnaire to database:', error);
      return {
        success: false,
        error: error.message || 'Failed to save questionnaire to database'
      };
    }
  }
}; 