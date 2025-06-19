export const QUESTIONNAIRE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TEXT: 'text',
  BOOLEAN: 'boolean',
  FILE_UPLOAD: 'file_upload',
  RATING: 'rating',
} as const;

export const QUESTIONNAIRE_CATEGORIES = {
  SECURITY: 'security',
  PRIVACY: 'privacy',
  COMPLIANCE: 'compliance',
  OPERATIONS: 'operations',
  TECHNICAL: 'technical',
} as const;

export const ANSWER_STATUSES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
} as const;

export const QUESTIONNAIRE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const; 
