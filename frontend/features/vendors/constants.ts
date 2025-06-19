export const VENDOR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const;

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const COMPLIANCE_FRAMEWORKS = {
  SOC2: 'SOC2',
  ISO27001: 'ISO27001',
  GDPR: 'GDPR',
  HIPAA: 'HIPAA',
  PCI_DSS: 'PCI_DSS',
} as const;

export const VENDOR_FORM_FIELDS = {
  NAME: 'name',
  EMAIL: 'email',
  WEBSITE: 'website',
  DESCRIPTION: 'description',
  INDUSTRY: 'industry',
  SIZE: 'size',
} as const;

export const VENDOR_SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'riskLevel', label: 'Risk Level' },
  { value: 'lastUpdated', label: 'Last Updated' },
] as const; 
