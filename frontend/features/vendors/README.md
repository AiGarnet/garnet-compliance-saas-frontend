# Vendors Feature

This feature handles all vendor-related functionality in the Garnet Compliance SaaS application.

## Structure

```
vendors/
├── components/          # Vendor-specific UI components
├── pages/              # Vendor-related page components (App Router)
├── services/           # Vendor API services and data fetching
├── hooks/              # Vendor-specific custom hooks
├── utils/              # Vendor utility functions
├── types.ts            # Vendor TypeScript type definitions
├── constants.ts        # Vendor-related constants
└── README.md          # This file
```

## Key Components

- **VendorList.tsx** - Main vendor listing component
- **VendorDetailView.tsx** - Individual vendor detail view
- **AddVendorModal.tsx** - Modal for adding new vendors
- **EditVendorModal.tsx** - Modal for editing vendor information
- **VendorDashboard.tsx** - Vendor-specific dashboard
- **VendorOnboardingWizard.tsx** - Multi-step vendor onboarding

## Services

- **vendorService.ts** - API calls for vendor CRUD operations

## Hooks

- **useVendor.ts** - Custom hook for vendor data management

## Types

All vendor-related TypeScript interfaces and types are defined in `types.ts`.

## Constants

Vendor status, risk levels, compliance frameworks, and other constants are defined in `constants.ts`. 