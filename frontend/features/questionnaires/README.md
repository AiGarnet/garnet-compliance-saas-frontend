# Questionnaires Feature

This feature handles all questionnaire-related functionality in the Garnet Compliance SaaS application.

## Structure

```
questionnaires/
├── components/          # Questionnaire-specific UI components
├── pages/              # Questionnaire-related page components (App Router)
├── services/           # Questionnaire API services and data fetching
├── hooks/              # Questionnaire-specific custom hooks
├── utils/              # Questionnaire utility functions
├── types.ts            # Questionnaire TypeScript type definitions
├── constants.ts        # Questionnaire-related constants
└── README.md          # This file
```

## Key Components

- **EnhancedAnswerDisplay.tsx** - Component for displaying questionnaire answers
- **QuestionnaireCard.tsx** - Card component for questionnaire previews
- **QuestionnaireList.tsx** - Main questionnaire listing component

## Services

- **questionnaireService.ts** - API calls for questionnaire CRUD operations and AI-powered features

## Types

All questionnaire-related TypeScript interfaces and types are defined in `types.ts`.

## Constants

Questionnaire status, question types, categories, and other constants are defined in `constants.ts`. 