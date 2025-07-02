// Helper function to get the correct API endpoint
export function getApiEndpoint(path: string): string {
  // Check if we're running on Netlify (static site) - check for multiple domains
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     window.location.hostname.includes('garnetai.net') ||
     window.location.hostname.includes('testinggarnet.netlify.app'));
  
  // For vendor API calls, auth calls, AND checklist calls, always use Railway backend (even on Netlify)
  // This ensures JWT token compatibility and proper API routing
  if (path.startsWith('/api/vendors') || 
      path.startsWith('/api/auth/') || 
      path.startsWith('/api/checklists') || 
      path.startsWith('/api/questionnaires') ||
      path.startsWith('/api/ai') ||
      path.startsWith('/api/analytics') ||
      path.startsWith('/api/activities') ||
      path.startsWith('/api/evidence') ||
      path.startsWith('/api/trust-portal') ||
      path.startsWith('/api/help')) {
    const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app';
    console.log(`🚂 API ROUTING: ${path} → ${RAILWAY_URL}${path}`);
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
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080')
    : (process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app');
  
  return `${BACKEND_URL}${path}`;
}

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

// Helper function to check if user is authenticated
function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // Basic JWT validation - check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch (error) {
    console.error('Invalid JWT token:', error);
    return false;
  }
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
    // Validate token before using it
    if (!isAuthenticated()) {
      console.error('❌ EXPIRED OR INVALID TOKEN - Redirecting to login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Only redirect if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Authentication session expired. Please log in again.');
    }
    
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 API Call with Authentication:', {
      endpoint,
      url,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined }
    });
  } else {
    console.log('📤 API Call without Authentication:', {
      endpoint,
      url,
      hasToken: !!token,
      isAuthEndpoint: endpoint.includes('/api/auth/'),
      headers
    });
  }
  
  try {
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url,
        endpoint
      });
      
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      console.error('❌ API Error Details:', error);
      
      // Handle specific authentication errors
      if (response.status === 401) {
        console.error('🔒 Authentication failed - clearing tokens and redirecting');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        const authError = new Error(error.message || error.error || 'Authentication failed. Please log in again.');
        authError.name = 'AuthenticationError';
        
        // Only redirect if we're in the browser and not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 1000);
        }
        
        throw authError;
      }
      
      // Handle organization access errors
      if (response.status === 403 && error.code === 'MISSING_ORGANIZATION') {
        console.error('🏢 Organization access required');
        const orgError = new Error('Organization access required. Please contact your administrator.');
        orgError.name = 'OrganizationError';
        throw orgError;
      }
      
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    const responseData = await response.json();
    console.log('✅ API Success Response:', {
      endpoint,
      status: response.status,
      dataType: typeof responseData,
      hasData: !!responseData
    });
    
    return responseData;
  } catch (fetchError) {
    if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
      console.error('🌐 Network Error - Server may be unreachable:', fetchError);
      throw new Error('Unable to connect to server. Please check your internet connection and try again.');
    }
    throw fetchError;
  }
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
  
  console.log('🔐 UPLOAD AUTH CHECK:', {
    endpoint,
    url,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN FOUND',
    localStorage_authToken: typeof window !== 'undefined' ? !!localStorage.getItem('authToken') : 'N/A'
  });
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.error('❌ NO AUTH TOKEN FOUND - User needs to log in');
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
    // Get all vendors that have trust portal content
    getVendorsWithItems: () => apiCall('/api/trust-portal/vendors'),
    
    // Generate invite link for a vendor
    generateInviteLink: (vendorId: string) => apiCall(`/api/vendors/${vendorId}/trust-portal/invite`, {
      method: 'POST',
    }),
    
    // Get trust portal data for a vendor (authenticated)
    getData: (vendorId: string) => apiCall(`/api/trust-portal/vendor/${vendorId}`),
    
    // Get trust portal data via invite token (public)
    getByInviteToken: (token: string) => apiCall(`/api/trust-portal/invite/${token}`),

    // Feedback endpoints
    createFeedback: (feedbackData: any) => apiCall('/api/trust-portal/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    }),

    getVendorFeedback: (vendorId: string) => apiCall(`/api/trust-portal/vendor/${vendorId}/feedback`),

    addFeedbackResponse: (feedbackId: string, responseData: any) => 
      apiCall(`/api/trust-portal/feedback/${feedbackId}/response`, {
        method: 'POST',
        body: JSON.stringify(responseData),
      }),

    updateFeedbackStatus: (feedbackId: string, status: string) => 
      apiCall(`/api/trust-portal/feedback/${feedbackId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    // Shared documents endpoints
    createSharedDocument: (documentData: any) => apiCall('/api/trust-portal/documents', {
      method: 'POST',
      body: JSON.stringify(documentData),
    }),

    getVendorDocuments: (vendorId: string) => apiCall(`/api/trust-portal/vendor/${vendorId}/documents`),
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