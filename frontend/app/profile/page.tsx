"use client";

import React, { useState, useEffect } from 'react';
import { Crown, Star, Zap, Rocket, Settings, User, CreditCard, Bell, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAuthGuard } from '@/lib/auth/useAuthGuard';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface SubscriptionInfo {
  planId: string;
  planName: string;
  status: string;
  billingCycle?: string;
  nextBillingDate?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isOnTrial, setIsOnTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);

  // Protect this page - require authentication
  useAuthGuard();

  // Check for success/cancel parameters
  useEffect(() => {
    if (!searchParams) return;
    
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
    
    if (canceled === 'true') {
      setShowCancelMessage(true);
      setTimeout(() => setShowCancelMessage(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.id) {
      fetchUserSubscriptionInfo();
    }
  }, [user?.id]);

  const fetchUserSubscriptionInfo = async () => {
    try {
      setLoading(true);

      // Check trial status first
      const trialResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/billing/trial-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (trialResponse.ok) {
        const trialData = await trialResponse.json();
        if (trialData.data.isOnTrial) {
          setIsOnTrial(true);
          setTrialDaysRemaining(trialData.data.daysRemaining);
          setSubscriptionInfo({
            planId: 'free-trial',
            planName: 'Free Trial',
            status: 'trial'
          });
          setLoading(false);
          return;
        }
      }

      // Check regular subscription
      const subResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/billing/subscription`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (subResponse.ok) {
        const subData = await subResponse.json();
        if (subData.data && subData.data.planId) {
          setSubscriptionInfo({
            planId: subData.data.planId,
            planName: subData.data.planName || getPlanDisplayName(subData.data.planId),
            status: subData.data.status || 'active',
            billingCycle: subData.data.billingCycle,
            nextBillingDate: subData.data.nextBillingDate
          });
        } else {
          setSubscriptionInfo({
            planId: 'starter',
            planName: 'Free',
            status: 'free'
          });
        }
      } else {
        setSubscriptionInfo({
          planId: 'starter',
          planName: 'Free',
          status: 'free'
        });
      }
    } catch (error) {
      console.error('Failed to fetch subscription info:', error);
      setSubscriptionInfo({
        planId: 'starter',
        planName: 'Free',
        status: 'free'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanDisplayName = (planId: string) => {
    switch (planId) {
      case 'starter': return 'Free';
      case 'growth': return 'Growth';
      case 'scale': return 'Scale';
      case 'enterprise': return 'Enterprise';
      case 'free-trial': return 'Free Trial';
      default: return 'Free';
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free-trial':
        return <Star className="h-6 w-6 text-blue-600" />;
      case 'starter':
        return <Zap className="h-6 w-6 text-gray-600" />;
      case 'growth':
        return <Rocket className="h-6 w-6 text-purple-600" />;
      case 'scale':
        return <Crown className="h-6 w-6 text-green-600" />;
      case 'enterprise':
        return <Crown className="h-6 w-6 text-amber-600" />;
      default:
        return <Zap className="h-6 w-6 text-gray-600" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free-trial':
        return 'bg-blue-50 border-blue-200';
      case 'starter':
        return 'bg-gray-50 border-gray-200';
      case 'growth':
        return 'bg-purple-50 border-purple-200';
      case 'scale':
        return 'bg-green-50 border-green-200';
      case 'enterprise':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const canUpgrade = () => {
    return subscriptionInfo?.planId !== 'enterprise';
  };

  const handleUpgradeClick = () => {
    // Redirect to pricing page with current plan context
    const currentPlan = subscriptionInfo?.planId || 'starter';
    router.push(`/pricing?from=profile&current=${currentPlan}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and subscription</p>
          
          {/* Success/Cancel Messages */}
          {showSuccessMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Upgrade successful!</p>
                <p className="text-green-700 text-sm">Your plan has been updated and will be reflected shortly.</p>
              </div>
            </div>
          )}
          
          {showCancelMessage && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-3">
              <XCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">Upgrade canceled</p>
                <p className="text-yellow-700 text-sm">No changes were made to your account.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user?.full_name || 'User'}</h2>
                  <p className="text-gray-600">{user?.email}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>

              {user?.organization && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600">Organization</p>
                  <p className="font-medium text-gray-900">{user.organization}</p>
                </div>
              )}
            </div>

            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
              
              {subscriptionInfo && (
                <div className={`border-2 rounded-lg p-4 ${getPlanColor(subscriptionInfo.planId)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {getPlanIcon(subscriptionInfo.planId)}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{subscriptionInfo.planName}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscriptionInfo.status)}`}>
                            {subscriptionInfo.status === 'trial' ? 'Free Trial' : subscriptionInfo.status}
                          </span>
                          {isOnTrial && trialDaysRemaining !== null && (
                            <span className="text-sm text-blue-600">
                              {trialDaysRemaining} days remaining
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {canUpgrade() && (
                      <button
                        onClick={handleUpgradeClick}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Crown className="h-4 w-4" />
                        <span>Upgrade</span>
                      </button>
                    )}
                  </div>

                  {subscriptionInfo.nextBillingDate && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Next billing date: {new Date(subscriptionInfo.nextBillingDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">Settings</span>
                </button>
                
                <button 
                  onClick={() => router.push('/billing')}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">Billing</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">Notifications</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
