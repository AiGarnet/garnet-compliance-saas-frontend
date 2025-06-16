import { VendorWorksView } from '@/components/vendors/VendorWorksView';

// Generate static params (empty for dynamic generation)
export async function generateStaticParams() {
  return [];
}

// Enable dynamic params for all vendor IDs not in static params
export const dynamicParams = true;

// Server component for vendor works
export default function VendorWorksPage({ params }: { params: { id: string } }) {
  return <VendorWorksView vendorId={params.id} />;
} 