"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Download,
  ArrowRight,
  ExternalLink,
  Zap,
  Shield,
  BarChart3,
  Users
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  planId: string;
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BillingDashboard = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/billing');
      return;
    }

    fetchSubscription();
  }, [isAuthenticated, router]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSubscription(data.data);
      } else {
        setError(data.message || 'Failed to fetch subscription');
      }
    } catch (err) {
      setError('Failed to fetch subscription');
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!subscription) return;

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = data.data.url;
      } else {
        setError(data.message || 'Failed to create billing portal session');
      }
    } catch (err) {
      setError('Failed to open billing portal');
      console.error('Error opening billing portal:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert('Subscription canceled successfully');
        fetchSubscription(); // Refresh subscription data
      } else {
        setError(data.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error('Error canceling subscription:', err);
    }
  };

  const getPlanDetails = (planId: string) => {
    switch (planId) {
      case 'starter':
        return {
          name: 'Starter',
          icon: <Zap className="h-6 w-6 text-blue-600" />,
          color: 'blue',
          price: 'Free'
        };
      case 'growth':
        return {
          name: 'Growth',
          icon: <Shield className="h-6 w-6 text-purple-600" />,
          color: 'purple',
          price: subscription?.billingCycle === 'annual' ? '$499/year' : '$49/month'
        };
      case 'scale':
        return {
          name: 'Scale',
          icon: <BarChart3 className="h-6 w-6 text-pink-600" />,
          color: 'pink',
          price: subscription?.billingCycle === 'annual' ? '$1,999/year' : '$199/month'
        };
      case 'enterprise':
        return {
          name: 'Enterprise',
          icon: <Users className="h-6 w-6 text-indigo-600" />,
          color: 'indigo',
          price: 'Custom'
        };
      default:
        return {
          name: 'Unknown',
          icon: <Zap className="h-6 w-6 text-gray-600" />,
          color: 'gray',
          price: 'N/A'
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      case 'unpaid':
        return 'text-red-600 bg-red-100';
      case 'incomplete':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const planDetails = subscription ? getPlanDetails(subscription.planId) : getPlanDetails('starter');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
            {subscription && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {planDetails.icon}
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{planDetails.name}</h3>
                <p className="text-gray-600">{planDetails.price}</p>
                {subscription && (
                  <p className="text-sm text-gray-500 mt-1">
                    Billing cycle: {subscription.billingCycle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/pricing')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Change Plan
              </button>
              {subscription && subscription.status === 'active' && (
                <button
                  onClick={handleManageBilling}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Billing
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Subscription Details */}
        {subscription && (
          <motion.div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Current Period</span>
                </div>
                <p className="text-gray-900">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Started</span>
                </div>
                <p className="text-gray-900">{formatDate(subscription.createdAt)}</p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Billing Cycle</span>
                </div>
                <p className="text-gray-900 capitalize">{subscription.billingCycle}</p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Status</span>
                </div>
                <p className="text-gray-900 capitalize">{subscription.status}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions</h2>
          
          <div className="space-y-4">
            {subscription && subscription.status === 'active' && (
              <>
                <button
                  onClick={handleManageBilling}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open Billing Portal
                </button>
                
                <button
                  onClick={handleCancelSubscription}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel Subscription
                </button>
              </>
            )}
            
            {(!subscription || subscription.status !== 'active') && (
              <button
                onClick={() => router.push('/pricing')}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                Upgrade Plan
              </button>
            )}
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-gray-600 mb-4">Need help with your billing?</p>
          <button
            onClick={() => router.push('/contact')}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Contact Support
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default BillingDashboard; 