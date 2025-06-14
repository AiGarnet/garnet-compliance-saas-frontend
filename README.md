# Garnet AI Frontend

A modern, responsive frontend for the Garnet AI vendor compliance and onboarding platform. Built with Next.js, TypeScript, and Tailwind CSS.

## Project Overview

This is the frontend application for Garnet AI's vendor compliance platform. It provides a comprehensive user interface for managing vendor onboarding, compliance questionnaires, risk assessments, and trust portal functionality.

## Features

### Dashboard
- Overview of compliance status with key metrics
- Quick access to high-risk vendors 
- Pending tasks and recent activity tracking
- Compliance scoring and progress visualization

### Questionnaires
- Manage and track compliance questionnaires
- Filter by type, status, and due dates
- Progress tracking with visual indicators
- Detailed status overview for each assessment

### Vendors
- Vendor catalog with risk assessment indicators
- Compliance scoring for each vendor
- Filtering by category, risk level, and status
- Quick-access vendor details and assessment tools

### Trust Portal
- Public-facing trust and compliance information hub
- Downloadable compliance certifications and reports
- Security practices and infrastructure information
- Designed to build customer confidence in security measures

### Compliance
- Framework-specific compliance tracking (SOC 2, ISO 27001, GDPR, HIPAA)
- Evidence management for compliance documentation
- Progress tracking across all compliance frameworks
- Detailed controls implementation status

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Main dashboard interface
│   ├── questionnaires/    # Questionnaire management
│   ├── vendors/           # Vendor management system
│   ├── trust-portal/      # Customer-facing trust center
│   └── compliance/        # Compliance framework tracking
├── components/            # Reusable UI components
├── lib/                   # Utility functions and shared code
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## Design System

The application uses a consistent design system with:
- Responsive layouts that work on mobile and desktop
- Accessible UI components following WCAG guidelines
- Color-coding for status indicators (success, warning, danger)
- Consistent spacing, typography, and component designs
- Interactive elements with proper hover and focus states

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
```

### Other Available Scripts

- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```bash
NEXT_PUBLIC_API_URL=your_backend_api_url
NEXT_PUBLIC_APP_ENV=development
```

## Deployment

This frontend is configured for deployment on Netlify. The `netlify.toml` file contains the deployment configuration.

### Netlify Deployment

1. Connect your repository to Netlify
2. Set the build command to: `cd frontend && npm run build`
3. Set the publish directory to: `frontend/out`
4. Configure environment variables in Netlify dashboard

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass and code follows the linting rules
4. Submit a pull request

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility

This application is built with accessibility in mind:
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

## Performance

- Optimized bundle sizes with Next.js
- Image optimization
- Code splitting
- Lazy loading of components
- Efficient re-rendering with React best practices