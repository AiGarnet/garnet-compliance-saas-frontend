export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  description: string;
  metadata?: ActivityMetadata;
  timestamp: Date;
  icon?: ActivityIcon;
  color?: ActivityColor;
}

export enum ActivityType {
  // Client/Vendor Management
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  CLIENT_STATUS_CHANGED = 'client_status_changed',
  
  // Questionnaire Activities
  QUESTIONNAIRE_CREATED = 'questionnaire_created',
  QUESTIONNAIRE_SUBMITTED = 'questionnaire_submitted',
  QUESTIONNAIRE_REVIEWED = 'questionnaire_reviewed',
  QUESTIONNAIRE_APPROVED = 'questionnaire_approved',
  QUESTIONNAIRE_REJECTED = 'questionnaire_rejected',
  
  // Evidence & Documents
  EVIDENCE_UPLOADED = 'evidence_uploaded',
  EVIDENCE_APPROVED = 'evidence_approved',
  EVIDENCE_REJECTED = 'evidence_rejected',
  DOCUMENT_UPLOADED = 'document_uploaded',
  
  // Compliance & Assessment
  COMPLIANCE_ASSESSMENT_STARTED = 'compliance_assessment_started',
  COMPLIANCE_ASSESSMENT_COMPLETED = 'compliance_assessment_completed',
  COMPLIANCE_SCORE_UPDATED = 'compliance_score_updated',
  FRAMEWORK_ADDED = 'framework_added',
  
  // User Activities
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  
  // Trust Portal
  TRUST_PORTAL_VIEWED = 'trust_portal_viewed',
  TRUST_PORTAL_SHARED = 'trust_portal_shared',
  
  // System Activities
  REPORT_GENERATED = 'report_generated',
  DATA_EXPORTED = 'data_exported',
  INTEGRATION_CONNECTED = 'integration_connected'
}

export interface ActivityMetadata {
  // Client related
  clientId?: string;
  clientName?: string;
  previousStatus?: string;
  newStatus?: string;
  
  // Questionnaire related
  questionnaireId?: string;
  questionnaireName?: string;
  frameworkType?: string;
  
  // Evidence related
  evidenceId?: string;
  evidenceType?: string;
  fileName?: string;
  fileSize?: number;
  
  // Compliance related
  complianceScore?: number;
  previousScore?: number;
  frameworkName?: string;
  
  // General
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  duration?: number;
  additionalData?: Record<string, any>;
}

export interface ActivityIcon {
  name: string;
  type: 'lucide' | 'custom' | 'svg';
}

export interface ActivityColor {
  bg: string;
  text: string;
  ring?: string;
}

export const ACTIVITY_COLORS: Record<string, ActivityColor> = {
  success: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    ring: 'ring-green-500'
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    ring: 'ring-yellow-500'
  },
  danger: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    ring: 'ring-red-500'
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    ring: 'ring-blue-500'
  },
  primary: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    ring: 'ring-purple-500'
  },
  secondary: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    ring: 'ring-gray-500'
  }
};

export const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: string;
  color: keyof typeof ACTIVITY_COLORS;
  defaultDescription: string;
}> = {
  [ActivityType.CLIENT_CREATED]: {
    icon: 'UserPlus',
    color: 'success',
    defaultDescription: 'created a new client'
  },
  [ActivityType.CLIENT_UPDATED]: {
    icon: 'Edit',
    color: 'info',
    defaultDescription: 'updated client information'
  },
  [ActivityType.CLIENT_DELETED]: {
    icon: 'Trash2',
    color: 'danger',
    defaultDescription: 'deleted a client'
  },
  [ActivityType.CLIENT_STATUS_CHANGED]: {
    icon: 'RefreshCw',
    color: 'warning',
    defaultDescription: 'changed client status'
  },
  [ActivityType.QUESTIONNAIRE_CREATED]: {
    icon: 'FileText',
    color: 'primary',
    defaultDescription: 'created a new questionnaire'
  },
  [ActivityType.QUESTIONNAIRE_SUBMITTED]: {
    icon: 'Send',
    color: 'info',
    defaultDescription: 'submitted a questionnaire'
  },
  [ActivityType.QUESTIONNAIRE_REVIEWED]: {
    icon: 'Eye',
    color: 'secondary',
    defaultDescription: 'reviewed a questionnaire'
  },
  [ActivityType.QUESTIONNAIRE_APPROVED]: {
    icon: 'CheckCircle',
    color: 'success',
    defaultDescription: 'approved a questionnaire'
  },
  [ActivityType.QUESTIONNAIRE_REJECTED]: {
    icon: 'XCircle',
    color: 'danger',
    defaultDescription: 'rejected a questionnaire'
  },
  [ActivityType.EVIDENCE_UPLOADED]: {
    icon: 'Upload',
    color: 'info',
    defaultDescription: 'uploaded evidence document'
  },
  [ActivityType.EVIDENCE_APPROVED]: {
    icon: 'CheckCircle',
    color: 'success',
    defaultDescription: 'approved evidence document'
  },
  [ActivityType.EVIDENCE_REJECTED]: {
    icon: 'XCircle',
    color: 'danger',
    defaultDescription: 'rejected evidence document'
  },
  [ActivityType.DOCUMENT_UPLOADED]: {
    icon: 'FileUp',
    color: 'secondary',
    defaultDescription: 'uploaded a document'
  },
  [ActivityType.COMPLIANCE_ASSESSMENT_STARTED]: {
    icon: 'Play',
    color: 'info',
    defaultDescription: 'started compliance assessment'
  },
  [ActivityType.COMPLIANCE_ASSESSMENT_COMPLETED]: {
    icon: 'CheckCircle',
    color: 'success',
    defaultDescription: 'completed compliance assessment'
  },
  [ActivityType.COMPLIANCE_SCORE_UPDATED]: {
    icon: 'TrendingUp',
    color: 'warning',
    defaultDescription: 'updated compliance score'
  },
  [ActivityType.FRAMEWORK_ADDED]: {
    icon: 'Shield',
    color: 'primary',
    defaultDescription: 'added compliance framework'
  },
  [ActivityType.USER_LOGIN]: {
    icon: 'LogIn',
    color: 'success',
    defaultDescription: 'logged in'
  },
  [ActivityType.USER_LOGOUT]: {
    icon: 'LogOut',
    color: 'secondary',
    defaultDescription: 'logged out'
  },
  [ActivityType.USER_PROFILE_UPDATED]: {
    icon: 'User',
    color: 'info',
    defaultDescription: 'updated profile'
  },
  [ActivityType.TRUST_PORTAL_VIEWED]: {
    icon: 'Eye',
    color: 'info',
    defaultDescription: 'viewed trust portal'
  },
  [ActivityType.TRUST_PORTAL_SHARED]: {
    icon: 'Share',
    color: 'primary',
    defaultDescription: 'shared trust portal'
  },
  [ActivityType.REPORT_GENERATED]: {
    icon: 'FileBarChart',
    color: 'warning',
    defaultDescription: 'generated report'
  },
  [ActivityType.DATA_EXPORTED]: {
    icon: 'Download',
    color: 'secondary',
    defaultDescription: 'exported data'
  },
  [ActivityType.INTEGRATION_CONNECTED]: {
    icon: 'Link',
    color: 'success',
    defaultDescription: 'connected integration'
  }
};

export interface ActivityFilters {
  types?: ActivityType[];
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

export interface ActivitySummary {
  totalActivities: number;
  todayActivities: number;
  weekActivities: number;
  monthActivities: number;
  topActivityTypes: Array<{
    type: ActivityType;
    count: number;
  }>;
  mostActiveUsers: Array<{
    userId: string;
    userName: string;
    activityCount: number;
  }>;
} 