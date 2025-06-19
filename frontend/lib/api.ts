// Helper function to get the correct API endpoint
export function getApiEndpoint(path: string): string {
  // Check if we're running on Netlify (static site) - check for multiple domains
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     window.location.hostname.includes('garnetai.net') ||
     window.location.hostname.includes('testinggarnet.netlify.app'));
  
  // For vendor API calls AND auth calls, always use Railway backend (even on Netlify)
  // This ensures JWT token compatibility between auth and vendor endpoints
  if (path.startsWith('/api/vendors') || path.startsWith('/api/auth/')) {
    const RAILWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';
    return `${RAILWAY_URL}${path}`;
  }
  
  // For other APIs on Netlify, use function endpoints
  if (isNetlify) {
    // Note: We removed auth routing to Netlify functions to ensure JWT compatibility
    return path;
  }
  
  // For local development, use the backend server URL
  const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const BACKEND_URL = isDevelopment 
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
    : (process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app');
  
  return `${BACKEND_URL}${path}`;
}

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

// API helper functions
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = getApiEndpoint(endpoint);
  
  // Get auth token and add to headers if available
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Add Authorization header if token exists and this isn't a public auth endpoint
  if (token && !endpoint.includes('/api/auth/')) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('API Call Debug:', {
      endpoint,
      url,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined }
    });
  } else {
    console.log('API Call Debug:', {
      endpoint,
      url,
      hasToken: !!token,
      isAuthEndpoint: endpoint.includes('/api/auth/'),
      headers
    });
  }
  
  const response = await fetch(url, {
    headers,
    ...options,
  });

  if (!response.ok) {
    console.error('API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      url,
      endpoint
    });
    
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    console.error('API Error Details:', error);
    
    // Provide more specific error messages for authentication issues
    if (response.status === 401) {
      const authError = new Error(error.message || error.error || 'Authentication failed. Please log in again.');
      authError.name = 'AuthenticationError';
      throw authError;
    }
    
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// File upload helper for evidence files
export async function uploadFile(endpoint: string, file: File, additionalData: Record<string, any> = {}) {
  const url = getApiEndpoint(endpoint);
  const formData = new FormData();
  
  formData.append('file', file);
  
  // Add additional data to form
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });

  // Get auth token for file uploads
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const auth = {
  signup: (data: any) => apiCall('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data: any) => apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Vendor API functions
export const vendors = {
  // Get all vendors
  getAll: () => apiCall('/api/vendors'),
  
  // Get vendor by ID
  getById: (id: string) => apiCall(`/api/vendors/${id}`),
  
  // Create new vendor
  create: (data: any) => apiCall('/api/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update vendor
  update: (id: string, data: any) => apiCall(`/api/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Delete vendor
  delete: (id: string) => apiCall(`/api/vendors/${id}`, {
    method: 'DELETE',
  }),
  
  // Get vendors by status
  getByStatus: (status: string) => apiCall(`/api/vendors/status/${status}`),
  
  // Get vendor statistics
  getStats: () => apiCall('/api/vendors/stats'),

  // Vendor Work Management
  works: {
    // Get all works for a vendor
    getAll: (vendorId: string) => apiCall(`/api/vendors/${vendorId}/works`),
    
    // Get specific work by ID
    getById: (vendorId: string, workId: string) => apiCall(`/api/vendors/${vendorId}/works/${workId}`),
    
    // Create new work submission
    create: (vendorId: string, data: any) => apiCall(`/api/vendors/${vendorId}/works`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // Update work submission
    update: (vendorId: string, workId: string, data: any) => apiCall(`/api/vendors/${vendorId}/works/${workId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    // Delete work submission
    delete: (vendorId: string, workId: string) => apiCall(`/api/vendors/${vendorId}/works/${workId}`, {
      method: 'DELETE',
    }),
  },

  // Trust Portal Management
  trustPortal: {
    // Generate invite link for a vendor
    generateInviteLink: (vendorId: string) => apiCall(`/api/vendors/${vendorId}/trust-portal/invite`, {
      method: 'POST',
    }),
    
    // Get trust portal data for a vendor (public)
    getData: (vendorId: string) => apiCall(`/api/vendors/${vendorId}/trust-portal`),
    
    // Get trust portal data via invite token (public)
    getByInviteToken: (token: string) => apiCall(`/api/trust-portal/invite/${token}`),
  },

  // Questionnaire Answer Management
  answers: {
    // Get questionnaire answers for a vendor
    getAll: (vendorId: string) => apiCall(`/api/vendors/${vendorId}/answers`),
    
    // Save questionnaire answers for a vendor
    save: (vendorId: string, answers: any[]) => apiCall(`/api/vendors/${vendorId}/answers`, {
      method: 'POST',
      body: JSON.stringify(answers),
    }),
    
    // Update share status for questionnaire answer
    updateShareStatus: (vendorId: string, answerId: string, shareToTrustPortal: boolean) => 
      apiCall(`/api/vendors/${vendorId}/answers/${answerId}/share`, {
        method: 'PATCH',
        body: JSON.stringify({ shareToTrustPortal }),
      }),
  },

  // Update questionnaire answer completion status
  updateQuestionnaireAnswerStatus: (vendorId: string, answerId: string, data: { status: string; shareToTrustPortal?: boolean }) => 
    apiCall(`/api/vendors/${vendorId}/answers/${answerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Update questionnaire answer share status  
  updateQuestionnaireAnswerShareStatus: (vendorId: string, answerId: string, shareToTrustPortal: boolean) => 
    apiCall(`/api/vendors/${vendorId}/answers/${answerId}/share`, {
      method: 'PATCH',
      body: JSON.stringify({ shareToTrustPortal }),
    }),

  // Risk Assessment Management
  risk: {
    // Get risk distribution statistics
    getDistribution: () => apiCall('/api/vendors/risk/distribution'),
    
    // Get vendors by risk level
    getByRiskLevel: (riskLevel: string) => apiCall(`/api/vendors/risk/${riskLevel}`),
    
    // Recalculate risk for all vendors
    recalculateAll: () => apiCall('/api/vendors/risk/recalculate', {
      method: 'POST',
    }),
    
    // Get detailed risk assessment for a vendor
    getAssessment: (vendorId: string) => apiCall(`/api/vendors/${vendorId}/risk/assessment`),
    
    // Calculate and update risk assessment for a vendor
    calculateAndUpdate: (vendorId: string) => apiCall(`/api/vendors/${vendorId}/risk/calculate`, {
      method: 'POST',
    }),
  },
};

// Evidence file API functions
export const evidence = {
  // Upload evidence file for a vendor
  upload: (vendorId: string, file: File, metadata?: any) => 
    uploadFile(`/api/vendors/${vendorId}/evidence`, file, { 
      metadata: metadata ? JSON.stringify(metadata) : undefined 
    }),
  
  // Get evidence files for a vendor
  getByVendor: (vendorId: string) => apiCall(`/api/vendors/${vendorId}/evidence`),
  
  // Get evidence count for a vendor
  getCount: (vendorId: string) => apiCall(`/api/vendors/${vendorId}/evidence/count`),
  
  // Download evidence file
  download: async (vendorId: string, evidenceId: string) => {
    const url = getApiEndpoint(`/api/vendors/${vendorId}/evidence/${evidenceId}/download`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response; // Return response for blob handling
  },
  
  // Delete evidence file
  delete: (vendorId: string, evidenceId: string) => 
    apiCall(`/api/vendors/${vendorId}/evidence/${evidenceId}`, {
      method: 'DELETE',
    }),
  
  // Get evidence files by answer ID
  getByAnswer: (answerId: string) => apiCall(`/api/answers/${answerId}/evidence`),
};

// Questionnaires API
export const questionnaires = {
  // Get all questionnaires
  getAll: () => apiCall('/api/questionnaires'),
  
  // Get questionnaires for a specific vendor
  getByVendor: (vendorId: string) => apiCall(`/api/questionnaires/vendor/${vendorId}`),
  
  // Get a specific questionnaire by ID
  getById: (id: string) => apiCall(`/api/questionnaires/${id}`),
  
  // Create a new questionnaire
  create: (questionnaire: any) => apiCall('/api/questionnaires', {
    method: 'POST',
    body: JSON.stringify(questionnaire),
  }),
  
  // Update a questionnaire
  update: (id: string, questionnaire: any) => apiCall(`/api/questionnaires/${id}`, {
    method: 'PUT',
    body: JSON.stringify(questionnaire),
  }),
  
  // Delete a questionnaire
  delete: (id: string) => apiCall(`/api/questionnaires/${id}`, {
    method: 'DELETE',
  }),
};

// Test functions
export const test = {
  // Test database connection
  testDatabase: () => apiCall('/api/test-db'),
  
  // Test general backend connectivity
  ping: () => apiCall('/ping'),
}; 