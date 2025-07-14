// Role constants
export const ROLES = {
  SALES_PROFESSIONAL: 'sales_professional',
  FOUNDER: 'founder',
  ADMIN: 'admin'
} as const;

// Type definition for roles
export type UserRole = typeof ROLES[keyof typeof ROLES];

// Role display names
export const ROLE_DISPLAY_NAMES = {
  [ROLES.SALES_PROFESSIONAL]: 'Sales Professional',
  [ROLES.FOUNDER]: 'Founder',
  [ROLES.ADMIN]: 'Administrator'
} as const;

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  [ROLES.SALES_PROFESSIONAL]: 'Full access to all platform features with customized dashboard view focused on sales activities',
  [ROLES.FOUNDER]: 'Full access to all platform features with customized dashboard view focused on high-level insights',
  [ROLES.ADMIN]: 'Complete administrative access to manage users, vendors, organizations, and system settings'
} as const;

// Role permissions
export const ROLE_PERMISSIONS = {
  [ROLES.SALES_PROFESSIONAL]: {
    canAccessDashboard: true,
    canAccessQuestionnaires: true,
    canAccessVendors: false,
    canAccessCompliance: true,
    canAccessAnalytics: true,
    canAccessTrustPortal: true,
    canManageVendors: false,
    canCreateQuestionnaires: true,
    canViewReports: true
  },
  [ROLES.FOUNDER]: {
    canAccessDashboard: true,
    canAccessQuestionnaires: true,
    canAccessVendors: false,
    canAccessCompliance: true,
    canAccessAnalytics: true,
    canAccessTrustPortal: true,
    canManageVendors: false,
    canCreateQuestionnaires: true,
    canViewReports: true
  },
  [ROLES.ADMIN]: {
    canAccessDashboard: true,
    canAccessQuestionnaires: true,
    canAccessVendors: true,
    canAccessCompliance: true,
    canAccessAnalytics: true,
    canAccessTrustPortal: true,
    canManageVendors: true,
    canCreateQuestionnaires: true,
    canViewReports: true,
    canManageUsers: true,
    canManageOrganizations: true,
    canAccessAdminPanel: true
  }
} as const;

// Utility functions
export const getRoleDisplayName = (role: UserRole): string => {
  return ROLE_DISPLAY_NAMES[role] || role;
};

export const getRoleDescription = (role: UserRole): string => {
  return ROLE_DESCRIPTIONS[role] || '';
};

export const hasPermission = (role: UserRole, permission: keyof typeof ROLE_PERMISSIONS[UserRole]): boolean => {
  return ROLE_PERMISSIONS[role]?.[permission] || false;
};

export const getDefaultRoute = (role: UserRole): string => {
  if (role === ROLES.FOUNDER) {
    return '/trust-portal';
  }
  return '/dashboard';
};

export const getAllowedRoles = (): UserRole[] => {
  return Object.values(ROLES);
};

export const isValidRole = (role: string): role is UserRole => {
  return getAllowedRoles().includes(role as UserRole);
}; 