import { VendorQuestionnaireClient } from './VendorQuestionnaireClient';

export async function generateStaticParams() {
  // For static export, we provide common vendor IDs
  const staticIds = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
  ];
  
  return staticIds.map(id => ({ id }));
}

// Allow dynamic params that aren't in generateStaticParams
export const dynamicParams = true;

export default function VendorQuestionnairePage({ params }: { params: { id: string } }) {
  return <VendorQuestionnaireClient vendorId={params.id} />;
} 