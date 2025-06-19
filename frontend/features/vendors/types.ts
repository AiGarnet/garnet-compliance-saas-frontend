// Re-export all vendor types from the original vendor.types.ts
export * from './vendor.types';

// Additional vendor-specific types can be added here
export interface VendorFilters {
  status?: string;
  riskLevel?: string;
  complianceFramework?: string;
}

export interface VendorSortOptions {
  field: 'name' | 'status' | 'riskLevel' | 'lastUpdated';
  direction: 'asc' | 'desc';
} 
