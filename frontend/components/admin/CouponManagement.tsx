import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Alert } from '../ui/Alert';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: any;
  usage_limit?: number;
  usage_count: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in as admin');
      }

      const response = await fetch('/api/coupons', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load coupons');
      }

      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      setError(error instanceof Error ? error.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const createTestCoupon = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in as admin');
      }

      const response = await fetch('/api/coupons/create-test-coupon', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create test coupon');
      }

      const newCoupon = await response.json();
      setSuccess(`Test coupon created successfully! Code: ${newCoupon.code}`);
      loadCoupons(); // Reload the list
    } catch (error) {
      console.error('Error creating test coupon:', error);
      setError(error instanceof Error ? error.message : 'Failed to create test coupon');
    } finally {
      setLoading(false);
    }
  };

  const deactivateCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to deactivate this coupon?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in as admin');
      }

      const response = await fetch(`/api/coupons/${couponId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate coupon');
      }

      setSuccess('Coupon deactivated successfully');
      loadCoupons(); // Reload the list
    } catch (error) {
      console.error('Error deactivating coupon:', error);
      setError(error instanceof Error ? error.message : 'Failed to deactivate coupon');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Coupon Management</h2>
        <div className="space-x-3">
          <Button onClick={loadCoupons} variant="outline" disabled={loading}>
            Refresh
          </Button>
          <Button onClick={createTestCoupon} disabled={loading}>
            Create Test Coupon
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      {loading && (
        <div className="text-center py-4">
          <p className="text-gray-600">Loading coupons...</p>
        </div>
      )}

      {!loading && coupons.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No coupons found</p>
          <Button onClick={createTestCoupon} className="mt-4">
            Create Your First Test Coupon
          </Button>
        </div>
      )}

      {!loading && coupons.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {coupon.code}
                    </div>
                    <div className="text-sm text-gray-500">
                      {coupon.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.usage_count} / {coupon.usage_limit || '∞'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.valid_until 
                      ? new Date(coupon.valid_until).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      coupon.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
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
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Testing Instructions:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>1. Click "Create Test Coupon" to generate a new backdoor coupon</p>
          <p>2. Use the coupon code <code className="bg-blue-100 px-1 rounded">BACKDOOR-TEST-2024</code> (already created)</p>
          <p>3. Apply it via the "Apply Coupon Code" button on the dashboard</p>
          <p>4. This grants full access to all premium features for testing</p>
        </div>
      </div>
    </div>
  );
};