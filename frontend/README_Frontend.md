# GarnetAI Frontend - Developer Guide

Welcome to the GarnetAI Compliance Platform frontend! This comprehensive guide will help you understand the entire codebase structure, components, and development workflow.

## 🚀 Quick Start

### Prerequisites
- Node.js (version specified in `.node-version` file)
- npm (for package management)

### Installation & Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start development with backend API
npm run dev:with-api

# Build for production
npm run build

# Run tests
npm test

# Start Storybook for component development
npm run storybook
```

## 📁 Project Structure Overview

This is a **Next.js 14** application using the **App Router** pattern with **TypeScript**, **Tailwind CSS**, and **React 18**.

```
frontend/
├── 📂 app/                    # Next.js App Router pages
├── 📂 components/             # Reusable React components
├── 📂 lib/                    # Utilities, services, and configurations
├── 📂 hooks/                  # Custom React hooks
├── 📂 types/                  # TypeScript type definitions
├── 📂 public/                 # Static assets
├── 📂 pages/                  # Legacy Pages Router (minimal usage)
├── 📂 .storybook/            # Storybook configuration
├── 📂 stories/               # Component stories
├── 📂 node_modules/          # Dependencies
├── 📄 package.json           # Project configuration
├── 📄 next.config.js         # Next.js configuration
├── 📄 tailwind.config.js     # Tailwind CSS configuration
└── 📄 tsconfig.json          # TypeScript configuration
```

## 🌐 Application Pages & Routes

### Core Application Pages

#### 1. **Landing Page** (`/`)
- **File**: `app/page.tsx`
- **Component**: `components/GarnetLandingPage.tsx`
- **Purpose**: Main marketing landing page for GarnetAI
- **Features**: Hero section, product features, pricing preview, waitlist signup

#### 2. **Authentication Pages** (`/auth/`)
- **Directory**: `app/auth/`
- **Pages**:
  - `/auth/login/` - User login page
  - `/auth/signup/` - User registration page
  - `/auth/forgot-password/` - Password reset request
  - `/auth/reset-password/` - Password reset form
- **Components**: `components/auth/`
- **Purpose**: Complete authentication flow

#### 3. **Dashboard** (`/dashboard/`)
- **File**: `app/dashboard/page.tsx`
- **Purpose**: Main user dashboard after login
- **Features**: Overview of compliance status, recent activities, quick actions

#### 4. **Vendors Management** (`/vendors/`)
- **File**: `app/vendors/page.tsx`
- **Dynamic Route**: `app/vendors/[id]/`
- **Purpose**: Manage vendor relationships and compliance tracking
- **Features**: Vendor list, individual vendor details, compliance status

#### 5. **Trust Portal** (`/trust-portal/`)
- **File**: `app/trust-portal/page.tsx`
- **Sub-routes**:
  - `/trust-portal/invite/` - Invite users to trust portal
  - `/trust-portal/vendor/` - Vendor-specific trust portal view
- **Purpose**: External-facing compliance documentation portal

#### 6. **Questionnaires** (`/questionnaires/`)
- **File**: `app/questionnaires/page.tsx` (4,880 lines - main questionnaire engine)
- **Sub-routes**:
  - `/questionnaires/[id]/` - Individual questionnaire view
  - `/questionnaires/answers/` - Questionnaire responses
- **Purpose**: Security and compliance questionnaire system
- **Features**: Dynamic questionnaire generation, progress tracking, evidence upload

#### 7. **Compliance Management** (`/compliance/`)
- **File**: `app/compliance/page.tsx`
- **Purpose**: Compliance framework management (SOC 2, ISO 27001, etc.)

#### 8. **Checklists** (`/checklists/`)
- **Directory**: `app/checklists/`
- **Purpose**: Compliance checklists and task management

#### 9. **Billing & Pricing** (`/billing/`, `/pricing/`)
- **Files**: 
  - `app/billing/page.tsx` - Billing management and subscription
  - `app/pricing/page.tsx` - Pricing plans and subscription selection
- **Integration**: Stripe payment processing
- **Features**: Subscription management, payment history, plan upgrades

#### 10. **Admin Panel** (`/admin/`)
- **Directory**: `app/admin/`
- **Purpose**: Administrative functions (user management, system settings)
- **Access**: Restricted to admin users

#### 11. **Team Management** (`/team/`)
- **Directory**: `app/team/`
- **Purpose**: Team member management and permissions

#### 12. **Legal Pages**
- `/terms-of-service/` - Terms of service
- `/privacy-policy/` - Privacy policy
- `/contact/` - Contact information

## 🧩 Component Architecture

### 📂 `components/` Directory Structure

#### **Main Layout Components**
- `Header.tsx` - Main navigation header with authentication state
- `DashboardLayout.tsx` - Layout wrapper for dashboard pages
- `MainLayout.tsx` - General page layout wrapper
- `MinimalFooter.tsx` - Footer component
- `MobileNavigation.tsx` - Mobile-responsive navigation

#### **Landing Page Components**
- `GarnetLandingPage.tsx` (2,522 lines) - Complete landing page implementation
- `TrustedBy.tsx` - Customer logos and testimonials section
- `WaitlistForm.tsx` - Email signup form for waitlist
- `ContactIllustration.tsx` - Custom SVG illustrations

#### **Authentication Components** (`components/auth/`)
- Login/signup forms
- Password reset components
- Authentication state management

#### **Dashboard Components** (`components/dashboard/`)
- Dashboard widgets and cards
- Analytics and metrics displays
- Quick action buttons

#### **UI Components** (`components/ui/`)
- `button.tsx` - Reusable button component with variants
- `Toast.tsx` - Notification system
- `ConfirmationModal.tsx` - Modal dialogs
- `select.tsx` - Custom select dropdown
- `Alert.tsx` - Alert messages
- `Breadcrumbs.tsx` - Navigation breadcrumbs
- `SearchBar.tsx` - Search input component
- `FilterPills.tsx` - Filter tags
- `Tooltip.tsx` - Hover tooltips
- `ThemeToggle.tsx` - Dark/light mode toggle
- `table/` - Table components
- `progress/` - Progress indicators
- `card/` - Card layouts

#### **Specialized Components**
- `SecurityQuestionnaire.tsx` - Questionnaire rendering engine
- `VendorForm.tsx` - Vendor information forms
- `SubscriptionTierDisplay.tsx` - Pricing tier visualization
- `TrialStatusNavbar.tsx` & `TrialNotification.tsx` - Trial status management
- `AddVendorModal.tsx` - Modal for adding new vendors

#### **Trust Portal Components** (`components/trust-portal/`)
- External-facing compliance portal components
- Public documentation displays

#### **Vendor Components** (`components/vendors/`)
- Vendor management interfaces
- Compliance tracking displays

#### **Admin Components** (`components/admin/`)
- Administrative interface components
- User management tools

#### **Questionnaire Components** (`components/questionnaire/`)
- Dynamic question rendering
- Evidence upload interfaces
- Progress tracking

#### **Modal Components** (`components/modals/`)
- Various modal dialogs
- Confirmation screens
- Data input modals

#### **Utility Components**
- `ErrorBoundary.tsx` - Error handling wrapper
- `ThemeInitializer.tsx` - Theme system initialization
- `SearchParamsProvider.tsx` - URL search parameter management
- `DevModeToggle.tsx` - Development mode utilities
- `critical-css.ts` - Critical CSS inlining

## 🔧 Configuration & Utilities

### 📂 `lib/` Directory

#### **API & Services** (`lib/services/`, `lib/repositories/`)
- `api.ts` (560 lines) - Main API client with authentication
- Backend service integration
- Data repository patterns

#### **Authentication** (`lib/auth/`)
- `AuthContext` - React context for authentication state
- JWT token management
- Role-based access control

#### **Utilities** (`lib/utils/`)
- Helper functions
- Data formatting utilities
- Validation functions

#### **Internationalization** (`lib/i18n/`)
- `i18n.ts` (267 lines) - Multi-language support configuration
- Translation management

#### **Design System** 
- `design-tokens.ts` - Design system tokens and variables
- `design-tokens.css` - CSS custom properties
- `critical-css.ts` - Critical CSS management
- `accessibility.css` - Accessibility-focused styles

#### **Type Definitions** (`lib/types/`)
- Shared TypeScript interfaces
- API response types
- Component prop types

### 📂 `types/` Directory
- `trustPortal.ts` - Trust portal related types
- `activity.ts` - Activity tracking types  
- `vendor.ts` - Vendor management types

### 📂 `hooks/` Directory
- `useActivity.ts` (355 lines) - Activity tracking hook
- `useVendor.ts` (227 lines) - Vendor data management hook
- `useEvidenceCount.ts` - Evidence counting utilities

## 🎨 Styling & Design System

### **Tailwind CSS Configuration**
- **File**: `tailwind.config.js`
- **Features**: 
  - Custom design tokens integration
  - CSS variables for theming
  - Responsive design utilities
  - Custom animations and transitions

### **Global Styles**
- `app/globals.css` (368 lines) - Global CSS variables and base styles
- `app/styles.css` (543 lines) - Component-specific styles
- `lib/design-tokens.css` - Design system tokens
- `lib/accessibility.css` - Accessibility enhancements

### **Theme System**
- Light mode as default
- CSS custom properties for colors and spacing
- Consistent typography scale
- Responsive breakpoints

## 🧪 Testing & Quality

### **Testing Setup**
- **Framework**: Jest + React Testing Library
- **Files**: 
  - `jest.config.js` - Jest configuration
  - `jest.setup.js` - Test setup
  - `jest.config.accessibility.js` - Accessibility testing
  - `accessibility-setup.js` - Accessibility test utilities

### **Component Testing**
- Unit tests for UI components
- Integration tests for pages
- Accessibility testing with jest-axe
- Example: `components/Header.test.tsx`

### **Storybook Integration**
- **Directory**: `.storybook/`
- Component documentation and testing
- Visual regression testing with Percy
- Example stories: `components/Header.stories.tsx`

### **Linting & Code Quality**
- ESLint configuration in `.eslintrc.json`
- TypeScript strict mode
- Prettier for code formatting

## 🚀 Deployment & Build

### **Build Configuration**
- **File**: `next.config.js`
- **Features**:
  - Static export for Netlify deployment
  - Image optimization disabled for static export
  - Environment variable configuration
  - Bundle optimization

### **Deployment Targets**
- **Primary**: Netlify (static export)
- **Configuration**: `netlify.toml`
- **Environment**: Production API at Railway

### **Available Scripts**

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server |
| `npm run dev:with-api` | Start development with local backend |
| `npm run build` | Production build |
| `npm run build:netlify` | Netlify-optimized build |
| `npm run build:verify` | Verify build output |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |
| `npm run storybook` | Start Storybook development |
| `npm run build-storybook` | Build Storybook for deployment |
| `npm run css-stats` | Analyze CSS bundle size |

## 🔐 Environment & Configuration

### **Environment Variables**
- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- `NEXT_PUBLIC_STATIC_EXPORT` - Static export flag
- Database connection variables (for API routes)

### **Feature Flags**
- Development mode toggles
- Feature preview controls
- A/B testing capabilities

## 📱 Responsive Design

### **Breakpoints**
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interface design

### **Accessibility Features**
- WCAG 2.1 compliance
- Keyboard navigation support
- Screen reader optimization
- Skip links and focus management
- High contrast mode support

## 🔄 Data Flow & State Management

### **Authentication Flow**
1. User authentication via JWT tokens
2. Context-based state management
3. Protected route handling
4. Role-based access control

### **Data Fetching**
- API integration via custom hooks
- Error handling and loading states
- Caching strategies
- Real-time updates where applicable

## 🐛 Development Guidelines

### **Getting Started for New Developers**

1. **First Time Setup**:
   ```bash
   git clone [repository]
   cd garnet-compliance-saas-frontend/frontend
   npm install
   npm run dev
   ```

2. **Understanding the Codebase**:
   - Start with `app/page.tsx` (landing page) to understand the entry point
   - Review `app/layout.tsx` for global app structure
   - Explore `components/ui/` for reusable components
   - Check `app/dashboard/` for main application functionality

3. **Making Changes**:
   - Follow TypeScript strict mode requirements
   - Use existing component patterns
   - Add tests for new components
   - Update Storybook stories for UI components

4. **Common Tasks**:
   - **Adding a new page**: Create in `app/[page-name]/page.tsx`
   - **Adding a component**: Create in appropriate `components/` subdirectory
   - **Styling**: Use Tailwind classes with design token variables
   - **API integration**: Use existing patterns in `lib/api.ts`

### **File Naming Conventions**
- Pages: `page.tsx` in app directory structure
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts` with interface definitions

### **Code Organization Principles**
- Separation of concerns (UI, logic, data)
- Reusable component patterns
- Consistent naming conventions
- Comprehensive TypeScript typing

## 🤝 Contributing

When working on this project:

1. **Understand the user flow**: Start with the landing page, understand the authentication flow, then explore the dashboard
2. **Component hierarchy**: UI components are in `components/ui/`, page-specific components are in their respective directories
3. **Styling approach**: Use Tailwind with custom design tokens, avoid custom CSS unless necessary
4. **Testing requirements**: Add tests for new components, ensure accessibility compliance
5. **Documentation**: Update this README when adding new pages or significant features

## 📞 Support & Resources

- **Storybook**: Visual component documentation
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling approach
- **Next.js 14**: App Router for modern React development
- **Testing**: Jest + React Testing Library for comprehensive testing

---

This frontend application serves as the complete user interface for the GarnetAI Compliance Platform, providing everything from marketing landing pages to comprehensive compliance management tools. The modular architecture ensures maintainability and scalability as the platform grows.