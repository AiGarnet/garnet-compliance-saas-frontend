// Re-export all questionnaire types from the original questionnaire.types.ts
export * from './questionnaire.types';

// Additional questionnaire-specific types can be added here
export interface QuestionnaireFilters {
  status?: string;
  category?: string;
  vendor?: string;
}

export interface QuestionnaireProgress {
  totalQuestions: number;
  answeredQuestions: number;
  percentage: number;
} 
