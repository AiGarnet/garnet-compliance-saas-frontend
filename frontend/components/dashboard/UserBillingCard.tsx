import React from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Button } from '../ui/button';

interface UserBillingCardProps {
  className?: string;
}

export const UserBillingCard: React.FC<UserBillingCardProps> = ({ className = '' }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing & Subscription</h3>
      
      {/* Early Bird Offer Banner - only show for non-active subscribers */}
      {(!user.subscription || user.subscription.status !== 'active') && (
        <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm mb-1">🎉 Early Bird Special!</h4>
              <p className="text-sm opacity-90">Get 100% off with early bird access offer</p>
              <div className="mt-2 bg-white bg-opacity-20 inline-block px-3 py-1 rounded-full">
                <span className="text-xs font-medium">Code: EARLYBIRDOFF</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-xs">OFF</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Current Plan</p>
          <p className="font-medium text-gray-900">{user.subscription?.plan || 'Starter'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Status</p>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            user.subscription?.status === 'active' 
              ? 'bg-green-100 text-green-800'
              : user.subscription?.status === 'trial'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {user.subscription?.status || 'Trial'}
          </span>
        </div>

        {user.trial_end_date && (
          <div>
            <p className="text-sm text-gray-600">Trial Ends</p>
            <p className="font-medium text-gray-900">
              {new Date(user.trial_end_date).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            Upgrade Plan
          </Button>
        </div>
      </div>
    </div>
  );
}; 