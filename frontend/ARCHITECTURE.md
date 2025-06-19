# Frontend Architecture Documentation

This document describes the feature-based modular architecture of the Garnet Compliance SaaS frontend application.

## 🏗️ Architecture Overview

The application follows a **feature-based modular design** that organizes code by business domain rather than by technical concerns. This approach makes the codebase more scalable, maintainable, and team-friendly.

## 📁 Directory Structure

```
frontend/
├── app/                     # Next.js App Router (routing)
├── components/              # Reusable UI components (Buttons, Modals, etc.)
├── features/                # Feature-based modules
│   ├── auth/               # Authentication & authorization
│   ├── vendors/            # Vendor management
│   ├── dashboard/          # Dashboard functionality
│   ├── questionnaires/     # Questionnaire system
│   ├── trust-portal/       # Trust portal features
│   └── waitlist/           # Waitlist management
├── layouts/                # Shared page layouts
├── hooks/                  # Global reusable hooks
├── services/               # Global API handlers
├── utils/                  # General utilities
├── types/                  # Global TypeScript interfaces
├── styles/                 # Global styles
├── config/                 # Environment & configuration
└── public/                 # Static assets
```

## 🎯 Feature Structure

Each feature follows a consistent internal structure:

```
features/<feature-name>/
├── components/             # Feature-specific UI components
├── pages/                  # App Router route handlers (if needed)
├── services/               # API requests & data fetching
├── hooks/                  # Custom hooks for this feature
├── utils/                  # Feature-specific utilities
├── types.ts                # TypeScript type definitions
├── constants.ts            # Feature constants & enums
└── README.md              # Feature documentation
```

## 🔧 Path Aliases

The following TypeScript path aliases are configured:

```typescript
"@/components/*": ["components/*"]      // Reusable UI components
"@/features/*": ["features/*"]          // Feature modules
"@/services/*": ["services/*"]          // Global services
"@/hooks/*": ["hooks/*"]                // Global hooks
"@/types/*": ["types/*"]                // Global types
"@/utils/*": ["utils/*"]                // Global utilities
"@/layouts/*": ["layouts/*"]            // Shared layouts
"@/config/*": ["config/*"]              // Configuration
"@/styles/*": ["styles/*"]              // Global styles
```

## 📦 Features Overview

### 🔐 Auth Feature
- **Purpose**: Authentication, authorization, user management
- **Key Components**: ProtectedRoute, AuthContext
- **Services**: Keycloak integration, JWT handling

### 🏢 Vendors Feature
- **Purpose**: Vendor management, profiles, onboarding
- **Key Components**: VendorList, VendorDashboard, VendorOnboardingWizard
- **Services**: Vendor CRUD operations, risk assessment

### 📊 Dashboard Feature
- **Purpose**: Main dashboard, analytics, overview
- **Key Components**: ComplianceCard, VendorList, QuestionnaireList
- **Services**: Dashboard data aggregation

### 📝 Questionnaires Feature
- **Purpose**: Questionnaire creation, management, AI features
- **Key Components**: EnhancedAnswerDisplay, QuestionnaireCard
- **Services**: Questionnaire CRUD, AI-powered features

### 🛡️ Trust Portal Feature
- **Purpose**: Public trust portal, vendor transparency
- **Key Components**: TrustPortalPublicView, TrustPortalVendorView
- **Services**: Trust portal data management

### 📋 Waitlist Feature
- **Purpose**: User waitlist management
- **Key Components**: WaitlistForm
- **Services**: Waitlist signup and management

## 🎨 Component Guidelines

### Reusable Components (`/components`)
- **Purpose**: Presentational components used across multiple features
- **Examples**: Button, Modal, Card, Table, Form elements
- **Rule**: Should NOT contain business logic or feature-specific code

### Feature Components (`/features/*/components`)
- **Purpose**: Components specific to a particular business domain
- **Examples**: VendorDashboard, QuestionnaireCard, AuthForm
- **Rule**: Can contain business logic specific to that feature

## 🔄 Import Patterns

### ✅ Recommended Import Patterns

```typescript
// Global components
import { Button } from '@/components/ui/button';

// Feature-specific components
import { VendorList } from '@/features/vendors/components/VendorList';

// Feature services
import { vendorService } from '@/features/vendors/services/vendorService';

// Feature types
import type { Vendor } from '@/features/vendors/types';

// Feature constants
import { VENDOR_STATUS } from '@/features/vendors/constants';
```

### ❌ Avoid These Patterns

```typescript
// Don't import from deep nested paths without aliases
import { VendorList } from '../../../features/vendors/components/VendorList';

// Don't mix feature concerns
import { vendorService } from '@/features/auth/services/authService'; // Wrong feature
```

## 🚀 Benefits of This Architecture

1. **Scalability**: Easy to add new features without affecting existing ones
2. **Maintainability**: Clear separation of concerns and responsibilities
3. **Team Collaboration**: Multiple developers can work on different features simultaneously
4. **Code Reusability**: Clear distinction between reusable and feature-specific code
5. **Testing**: Easier to test features in isolation
6. **Onboarding**: New developers can quickly understand feature boundaries

## 📋 Migration Checklist

- [x] Create feature directories and subdirectories
- [x] Update TypeScript path aliases in `tsconfig.json`
- [x] Move feature-specific components to appropriate directories
- [x] Move services and hooks to feature directories
- [x] Create feature-specific types, constants, and utils
- [x] Update import statements to use new aliases
- [x] Create README files for each feature
- [x] Move global utilities and services to root directories
- [x] Move layouts to dedicated layouts directory
- [x] Update build configuration if needed

## 🔄 Next Steps

1. **Update all import statements** throughout the codebase to use new paths
2. **Test the application** to ensure all imports resolve correctly
3. **Update documentation** and onboarding materials
4. **Set up linting rules** to enforce architectural patterns
5. **Create feature templates** for consistent new feature creation

## 🛠️ Development Workflow

When adding a new feature:

1. Create the feature directory structure
2. Add types, constants, and utilities first
3. Implement services and hooks
4. Build components using the established patterns
5. Add comprehensive tests
6. Document the feature in its README

This architecture ensures consistent, scalable, and maintainable code that supports team collaboration and long-term project success. 