"use client";

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { AlertTriangle, CreditCard, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  showPricingButton?: boolean;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  fallbackMessage = "A paid subscription is required to access this feature.",
  showPricingButton = true
}) => {
  const { user, hasActiveSubscription, isLoading, subscription } = useAuth();
  const router = useRouter();

  // Show loading while checking subscription
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Show subscription required message if user doesn't have active subscription
  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Subscription Required
            </h2>
            <p className="text-gray-600 mb-6">
              {fallbackMessage}
            </p>
            
            {subscription && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                <p className="text-gray-700">
                  <strong>Current Status:</strong> {subscription.status === 'past_due' ? 'Payment Past Due' : 'No Active Subscription'}
                </p>
                {subscription.status === 'past_due' && (
                  <p className="text-orange-600 mt-1">
                    Please update your payment method to continue accessing features.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {showPricingButton && (
                <button
                  onClick={() => router.push('/pricing')}
                  className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center"
                >
                  View Pricing Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              )}
              
              {subscription && subscription.status === 'past_due' && (
                <button
                  onClick={() => router.push('/billing')}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center"
                >
                  Update Payment Method
                  <CreditCard className="ml-2 h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 