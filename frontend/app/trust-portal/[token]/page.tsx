import { TrustPortalPublicView } from '@/components/trust-portal/TrustPortalPublicView';

// Generate static params (empty for dynamic generation)
export async function generateStaticParams() {
  return [];
}

// Enable dynamic params for all tokens not in static params
export const dynamicParams = true;

// Server component for trust portal
export default function TrustPortalPublicPage({ params }: { params: { token: string } }) {
  return <TrustPortalPublicView token={params.token} />;
} 