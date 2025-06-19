/**
 * English translations
 */
export const en = {
  dashboard: "Dashboard",
  vendors: "Clients",
  questionnaires: "Questionnaires",
  trustPortal: "Trust Portal",
  compliance: "Compliance",
  profile: "Profile",
  logout: "Logout",
  search: "Search",
  searchPlaceholder: "Search...",
  notifications: "Notifications",
  darkMode: "Dark mode",
  lightMode: "Light mode",
  language: "Change language",
  skipToContent: "Skip to main content",
  homePage: "Home page",
  
  // VendorList component strings (now ClientList)
  vendorList: {
    title: "Clients",
    loading: "Loading clients...",
    error: "Unable to load clients. Retry?",
    retry: "Retry",
    emptyState: {
      noVendors: "No clients in onboarding yet.",
      invite: "Invite your first client →",
      noMatches: "No clients match your current filters.",
      clearFilters: "Clear all filters"
    },
    table: {
      name: "Name",
      status: "Status",
      actions: "Actions",
      viewDetails: "View Details"
    },
    search: {
      placeholder: "Search clients by name...",
      label: "Search clients by name"
    },
    filter: {
      label: "Filter clients by status"
    },
    status: {
      all: "All",
      questionnairePending: "Questionnaire Pending",
      inReview: "In Review",
      approved: "Approved"
    }
  },
  
  // StatusBadge component strings
  statusBadge: {
    approved: {
      text: "Approved",
      description: "Client is approved"
    },
    inReview: {
      text: "In Review",
      description: "Client is currently under review"
    },
    questionnairePending: {
      text: "Questionnaire Pending",
      description: "Client has a pending questionnaire"
    }
  }
}; 