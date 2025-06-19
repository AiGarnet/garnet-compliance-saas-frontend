import { QuestionnaireRedirectClient } from './QuestionnaireRedirectClient';

// Generate static params for common questionnaire IDs
export async function generateStaticParams() {
  // For static export, provide some common questionnaire IDs
  // These will be generated at build time
  const commonIds = [
    'demo_1',
    'demo_2', 
    'demo_3',
    'q_security_assessment',
    'q_risk_assessment',
    'q_compliance_review',
    'q_data_protection',
    'q_vendor_onboarding',
    'q_2023_audit',
    'q_2024_audit'
  ];

  return commonIds.map((id) => ({
    id: id,
  }));
}

// Enable dynamic params for questionnaire IDs not in static params
export const dynamicParams = true;

export default function QuestionnairePage({ params }: { params: { id: string } }) {
  return <QuestionnaireRedirectClient params={params} />;
} 