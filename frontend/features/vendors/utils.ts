import { VENDOR_STATUS, RISK_LEVELS } from './constants';

/**
 * Get the display color for a vendor status
 */
export const getVendorStatusColor = (status: string): string => {
  switch (status) {
    case VENDOR_STATUS.ACTIVE:
      return 'text-green-600 bg-green-100';
    case VENDOR_STATUS.INACTIVE:
      return 'text-gray-600 bg-gray-100';
    case VENDOR_STATUS.PENDING:
      return 'text-yellow-600 bg-yellow-100';
    case VENDOR_STATUS.SUSPENDED:
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Get the display color for a risk level
 */
export const getRiskLevelColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case RISK_LEVELS.LOW:
      return 'text-green-600 bg-green-100';
    case RISK_LEVELS.MEDIUM:
      return 'text-yellow-600 bg-yellow-100';
    case RISK_LEVELS.HIGH:
      return 'text-orange-600 bg-orange-100';
    case RISK_LEVELS.CRITICAL:
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Format vendor name for display
 */
export const formatVendorName = (name: string): string => {
  return name?.trim() || 'Unnamed Vendor';
};

/**
 * Calculate vendor risk score based on various factors
 */
export const calculateVendorRiskScore = (vendor: any): number => {
  // This is a simplified risk calculation
  // In a real app, this would be more complex
  let score = 0;
  
  if (vendor.status === VENDOR_STATUS.SUSPENDED) score += 40;
  if (vendor.status === VENDOR_STATUS.INACTIVE) score += 20;
  if (vendor.status === VENDOR_STATUS.PENDING) score += 10;
  
  // Add more risk factors as needed
  return Math.min(score, 100);
};

/**
 * Check if vendor requires immediate attention
 */
export const requiresAttention = (vendor: any): boolean => {
  return (
    vendor.status === VENDOR_STATUS.SUSPENDED ||
    vendor.riskLevel === RISK_LEVELS.CRITICAL ||
    calculateVendorRiskScore(vendor) > 70
  );
};

/**
 * Format vendor last updated date
 */
export const formatLastUpdated = (date: string | Date): string => {
  if (!date) return 'Never';
  
  const updatedDate = new Date(date);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  
  return updatedDate.toLocaleDateString();
}; 
