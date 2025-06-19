import dynamic from 'next/dynamic';

// Dynamically import ChatClient with no SSR to prevent auth issues during static generation
const ChatClient = dynamic(
  () => import('./ChatClient').then(mod => ({ default: mod.ChatClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading questionnaire chat...</h2>
          <p className="text-gray-600 mt-2">Please wait while we initialize the chat interface.</p>
        </div>
      </div>
    )
  }
);

export async function generateStaticParams() {
  // For static export, we provide common/demo questionnaire IDs
  const staticIds = [
    'demo_1', 'demo_2', 'demo_3',
    'q_security_assessment',
    'q_vendor_onboarding',
    'q_compliance_review',
    'q_risk_assessment',
    'q_data_protection',
    'q_2023_audit',
    'q_2024_audit'
  ];
  
  return staticIds.map(id => ({ id }));
}

// Allow dynamic params that aren't in generateStaticParams
export const dynamicParams = true;

export default function ChatPage({ params }: { params: { id: string } }) {
  // The ChatClient will handle checking if the questionnaire exists
  // and redirect if not found
  return <ChatClient params={params} />;
} 