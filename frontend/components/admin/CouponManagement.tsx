'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '../../lib/api';
import { useAuth } from '../../lib/auth/AuthContext';
import { hasPermission } from '../../lib/auth/roles';

interface CouponPermissions {
  full_access?: boolean;
  features?: string[];
  plan_override?: string;
  unlimited_questionnaires?: boolean;
  unlimited_vendors?: boolean;
  unlimited_users?: boolean;
  unlimited_storage?: boolean;
  unlimited_frameworks?: boolean;
  bypass_subscription?: boolean;
  testing_access?: boolean;
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: CouponPermissions;
  usage_limit?: number;
  usage_count: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CreateCouponForm {
  code: string;
  name: string;
  description: string;
  permissions: CouponPermissions;
  usage_limit?: number;
  valid_until?: string;
}

export default function CouponManagement() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCouponForm>({
    code: '',
    name: '',
    description: '',
    permissions: {},
  });

  // Check if user has coupon management permission
  const canManageCoupons = user && hasPermission(user.role, 'canManageCoupons');

  useEffect(() => {
    if (canManageCoupons) {
      loadCoupons();
    }
  }, [canManageCoupons]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/coupons');
      setCoupons(response.coupons || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/api/coupons', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      
      setShowCreateForm(false);
      setCreateForm({
        code: '',
        name: '',
        description: '',
        permissions: {},
      });
      loadCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      setError('Failed to create coupon');
    }
  };

  const createTestCoupon = async () => {
    try {
      await apiCall('/api/coupons/create-test-coupon', {
        method: 'POST',
      });
      loadCoupons();
    } catch (error) {
      console.error('Error creating test coupon:', error);
      setError('Failed to create test coupon');
    }
  };

  const deactivateCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to deactivate this coupon?')) {
      return;
    }

    try {
      await apiCall(`/api/coupons/${couponId}/deactivate`, {
        method: 'POST',
      });
      loadCoupons();
    } catch (error) {
      console.error('Error deactivating coupon:', error);
      setError('Failed to deactivate coupon');
    }
  };

  if (!canManageCoupons) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">🚫 Access Denied</div>
          <p className="text-gray-600">You don't have permission to manage coupons.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Coupon Management</h3>
            <p className="text-sm text-gray-600">Create and manage promotional coupons</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={createTestCoupon}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
            >
              🧪 Create Test Coupon
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              ➕ Create Coupon
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Create Coupon Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Create New Coupon</h4>
          <form onSubmit={createCoupon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Coupon Code</label>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="PROMO2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Promotional Offer"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={2}
                placeholder="Description of the coupon offer"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Usage Limit (optional)</label>
                <input
                  type="number"
                  value={createForm.usage_limit || ''}
                  onChange={(e) => setCreateForm({ ...createForm, usage_limit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valid Until (optional)</label>
                <input
                  type="date"
                  value={createForm.valid_until || ''}
                  onChange={(e) => setCreateForm({ ...createForm, valid_until: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.permissions.full_access || false}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      permissions: { ...createForm.permissions, full_access: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Full Access</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.permissions.bypass_subscription || false}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      permissions: { ...createForm.permissions, bypass_subscription: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Bypass Subscription</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.permissions.testing_access || false}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      permissions: { ...createForm.permissions, testing_access: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Testing Access</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.permissions.unlimited_questionnaires || false}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      permissions: { ...createForm.permissions, unlimited_questionnaires: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Unlimited Questionnaires</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.permissions.unlimited_vendors || false}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      permissions: { ...createForm.permissions, unlimited_vendors: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Unlimited Vendors</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.permissions.unlimited_users || false}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      permissions: { ...createForm.permissions, unlimited_users: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Unlimited Users</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Active Coupons</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{coupon.name}</div>
                      <div className="text-sm text-gray-500">{coupon.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {coupon.usage_count} / {coupon.usage_limit || '∞'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {coupon.permissions.full_access && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Full Access
                        </span>
                      )}
                      {coupon.permissions.bypass_subscription && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Bypass Sub
                        </span>
                      )}
                      {coupon.permissions.testing_access && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Testing
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(coupon.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {coupon.is_active && (
                      <button
                        onClick={() => deactivateCoupon(coupon.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No coupons found</div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Create your first coupon
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}