import { QUESTIONNAIRE_STATUS, ANSWER_STATUSES } from './constants';

/**
 * Calculate questionnaire completion percentage
 */
export const calculateCompletionPercentage = (
  totalQuestions: number,
  answeredQuestions: number
): number => {
  if (totalQuestions === 0) return 0;
  return Math.round((answeredQuestions / totalQuestions) * 100);
};

/**
 * Get the display color for questionnaire status
 */
export const getQuestionnaireStatusColor = (status: string): string => {
  switch (status) {
    case QUESTIONNAIRE_STATUS.DRAFT:
      return 'text-gray-600 bg-gray-100';
    case QUESTIONNAIRE_STATUS.PUBLISHED:
      return 'text-blue-600 bg-blue-100';
    case QUESTIONNAIRE_STATUS.COMPLETED:
      return 'text-green-600 bg-green-100';
    case QUESTIONNAIRE_STATUS.ARCHIVED:
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Get the display color for answer status
 */
export const getAnswerStatusColor = (status: string): string => {
  switch (status) {
    case ANSWER_STATUSES.NOT_STARTED:
      return 'text-gray-600 bg-gray-100';
    case ANSWER_STATUSES.IN_PROGRESS:
      return 'text-yellow-600 bg-yellow-100';
    case ANSWER_STATUSES.COMPLETED:
      return 'text-green-600 bg-green-100';
    case ANSWER_STATUSES.REVIEWED:
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Format questionnaire title for display
 */
export const formatQuestionnaireTitle = (title: string): string => {
  return title?.trim() || 'Untitled Questionnaire';
};

/**
 * Check if questionnaire is overdue
 */
export const isQuestionnaireOverdue = (dueDate: string | Date): boolean => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

/**
 * Get time remaining until due date
 */
export const getTimeRemaining = (dueDate: string | Date): string => {
  if (!dueDate) return '';
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffInMs = due.getTime() - now.getTime();
  
  if (diffInMs <= 0) return 'Overdue';
  
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 1) return '1 day remaining';
  if (diffInDays <= 7) return `${diffInDays} days remaining`;
  if (diffInDays <= 30) return `${Math.ceil(diffInDays / 7)} weeks remaining`;
  
  return `${Math.ceil(diffInDays / 30)} months remaining`;
};

/**
 * Validate questionnaire data
 */
export const validateQuestionnaire = (questionnaire: any): string[] => {
  const errors: string[] = [];
  
  if (!questionnaire.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!questionnaire.questions || questionnaire.questions.length === 0) {
    errors.push('At least one question is required');
  }
  
  if (!questionnaire.category) {
    errors.push('Category is required');
  }
  
  return errors;
};

/**
 * Sort questionnaires by priority and due date
 */
export const sortQuestionnaires = (questionnaires: any[]): any[] => {
  return questionnaires.sort((a, b) => {
    // First sort by overdue status
    const aOverdue = isQuestionnaireOverdue(a.dueDate);
    const bOverdue = isQuestionnaireOverdue(b.dueDate);
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    // Finally by title
    return a.title.localeCompare(b.title);
  });
}; 
