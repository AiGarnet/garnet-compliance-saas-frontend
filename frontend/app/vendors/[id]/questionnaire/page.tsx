import dynamic from 'next/dynamic';

// Dynamically import VendorQuestionnaireClient with no SSR to prevent auth issues during static generation
const VendorQuestionnaireClient = dynamic(
  () => import('./VendorQuestionnaireClient').then(mod => ({ default: mod.VendorQuestionnaireClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading vendor questionnaire...</h2>
          <p className="text-gray-600 mt-2">Please wait while we initialize the questionnaire interface.</p>
        </div>
      </div>
    )
  }
);

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