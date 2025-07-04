import { TrustPortalItem } from '@/types/trustPortal';

export class TrustPortalRepository {
  private baseUrl = 'https://garnet-compliance-saas-production.up.railway.app';

  async getVendorsWithTrustPortalItems(): Promise<{ vendorId: number; companyName: string }[]> {
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${this.baseUrl}/api/vendors`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }
    const result = await response.json();
    const vendors = result.data || [];
    
    // Transform to match expected interface
    return vendors.map((vendor: any) => ({
      vendorId: vendor.vendorId || parseInt(vendor.id),
      companyName: vendor.companyName || vendor.name
    }));
  }

  async getVendorTrustPortalItems(vendorId: number): Promise<TrustPortalItem[]> {
    try {
      // Get auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch(`${this.baseUrl}/api/trust-portal/items?vendorId=${vendorId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      if (!response.ok) {
        // If trust portal endpoint doesn't exist yet, return empty array
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch trust portal items');
      }
      return response.json();
    } catch (error) {
      console.log('Trust portal endpoint not available yet');
      return [];
    }
  }

  async addTrustPortalItem(item: Omit<TrustPortalItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrustPortalItem> {
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${this.baseUrl}/api/trust-portal/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error('Failed to add trust portal item');
    }

    return response.json();
  }
} 