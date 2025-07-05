import { apiClient } from './api';
import { TrustPortalVendor } from '@/types/trustPortal';

/**
 * Trust Portal Service
 * Contains utility functions for working with trust portal data via API
 */
export const TrustPortalService = {
  /**
   * Get all vendors with trust portal items
   */
  async getVendorsWithItems(): Promise<{ success: boolean; data?: TrustPortalVendor[]; error?: any }> {
    try {
      const response = await apiClient.get<{ vendors: TrustPortalVendor[] }>('/api/trust-portal/vendors');
      return {
        success: true,
        data: response.vendors
      };
    } catch (error) {
      console.error('Error fetching trust portal vendors:', error);
      return {
        success: false,
        error
      };
    }
  },

  /**
   * Get trust portal items for a specific vendor
   */
  async getVendorItems(vendorId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/trust-portal/items?vendorId=${vendorId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching trust portal items for vendor ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Generate an invite link for a vendor's trust portal
   */
  async generateInviteLink(vendorId: string): Promise<{ inviteLink: string }> {
    try {
      const response = await apiClient.post<{ inviteLink: string }>(`/api/trust-portal/invite`, { vendorId });
      return response;
    } catch (error) {
      console.error(`Error generating invite link for vendor ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Get trust portal data via invite token
   */
  async getDataByInviteToken(token: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/trust-portal/invite/${token}`);
      return response;
    } catch (error) {
      console.error(`Error fetching trust portal data for token:`, error);
      throw error;
    }
  },

  /**
   * Add an item to the trust portal
   */
  async addItem(vendorId: string, itemData: any): Promise<any> {
    try {
      const response = await apiClient.post('/api/trust-portal/items', {
        vendorId,
        ...itemData
      });
      return response;
    } catch (error) {
      console.error(`Error adding trust portal item for vendor ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Update a trust portal item
   */
  async updateItem(itemId: string, itemData: any): Promise<any> {
    try {
      const response = await apiClient.put(`/api/trust-portal/items/${itemId}`, itemData);
      return response;
    } catch (error) {
      console.error(`Error updating trust portal item ${itemId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a trust portal item
   */
  async deleteItem(itemId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/trust-portal/items/${itemId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting trust portal item ${itemId}:`, error);
      throw error;
    }
  }
}; 