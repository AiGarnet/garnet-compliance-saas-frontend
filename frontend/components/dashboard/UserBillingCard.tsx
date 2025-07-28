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