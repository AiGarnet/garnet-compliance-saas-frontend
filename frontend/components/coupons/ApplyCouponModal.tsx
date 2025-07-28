import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Alert } from '../ui/Alert';

interface ApplyCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CouponResponse {
  success: boolean;
  message: string;
  coupon?: {
    name: string;
    description: string;
  };
  expires_at?: string;
}

export const ApplyCouponModal: React.FC<ApplyCouponModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CouponResponse | null>(null);

  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setResult({
        success: false,
        message: 'Please enter a coupon code',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to apply coupon codes');
      }

      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.success) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        }
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to apply coupon',
        });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to apply coupon',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCouponCode('');
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Apply Coupon Code</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 mb-2">
            Coupon Code
          </label>
          <input
            id="couponCode"
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter your coupon code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {result && (
          <div className="mb-4">
            <Alert variant={result.success ? 'success' : 'destructive'}>
              <div>
                <p className="font-medium">{result.message}</p>
                {result.success && result.coupon && (
                  <div className="mt-2 text-sm">
                    <p><strong>Coupon:</strong> {result.coupon.name}</p>
                    {result.coupon.description && (
                      <p><strong>Description:</strong> {result.coupon.description}</p>
                    )}
                    {result.expires_at && (
                      <p><strong>Valid until:</strong> {new Date(result.expires_at).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
              </div>
            </Alert>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleApplyCoupon}
            disabled={loading || !couponCode.trim()}
            className="flex-1"
          >
            {loading ? 'Applying...' : 'Apply Coupon'}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>💡 <strong>Testing Tip:</strong> Use coupon code <code className="bg-gray-100 px-1 rounded">BACKDOOR-TEST-2024</code> for full access to all features!</p>
        </div>
      </div>
    </div>
  );
}; 