import dynamic from 'next/dynamic';

// Dynamically import VendorDetailView with no SSR to prevent auth issues during static generation
const VendorDetailView = dynamic(
  () => import('@/components/vendors/VendorDetailView').then(mod => ({ default: mod.VendorDetailView })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading vendor details...</h2>
          <p className="text-gray-600 mt-2">Please wait while we fetch the vendor information.</p>
        </div>
      </div>
    )
  }
);

// Generate static params for known vendors at build time
export async function generateStaticParams() {
  try {
    // Try to fetch real vendor IDs from the API for static generation
    const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/api/vendors');
    const data = await response.json();
    
    if (data.vendors && data.vendors.length > 0) {
      const vendorIds = data.vendors.map((vendor: any) => ({
        id: vendor.uuid || vendor.id || vendor.vendorId?.toString()
      })).filter((item: any) => item.id); // Filter out any undefined IDs
      
      console.log(`Generating static params for ${vendorIds.length} vendor IDs from API`);
      return vendorIds;
    }
  } catch (error) {
    console.error('Failed to fetch vendors for static generation:', error);
  }
  
  // Fallback to known vendor IDs if API fails
  const staticIds = [
    '9321c032-0146-4751-be7b-1683d8b5a1b9', // Acme Payments
    'ce268669-b2e5-424e-8f1e-ea898dc057ab', // Oscorp Industries  
    'ceb432fd-74c8-4b5f-b09e-da45ac14830c', // Global Data Services
    '1', '2', '3' // Basic fallback IDs
  ];

  console.log(`Generating static params for ${staticIds.length} fallback vendor IDs`);
  return staticIds.map(id => ({ id: String(id) }));
}

// Enable dynamic params for ALL vendor IDs not in static params
export const dynamicParams = true;

// Client component for vendor detail
export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailView vendorId={params.id} />;
} 