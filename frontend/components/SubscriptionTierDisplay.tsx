import React, { useState, useEffect } from 'react';
import { Crown, Star, Zap, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

interface SubscriptionTierDisplayProps {
  showUpgradeButton?: boolean;
  compact?: boolean;
}

const SubscriptionTierDisplay: React.FC<SubscriptionTierDisplayProps> = ({ 
  showUpgradeButton = false, 
  compact = true 
}) => {
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('starter');
  const [isOnTrial, setIsOnTrial] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionInfo();
    }
  }, [user?.id]);

  const fetchSubscriptionInfo = async () => {
    try {
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
          setSubscriptionPlan('free-trial');
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
          setSubscriptionPlan(subData.data.planId);
        } else {
          setSubscriptionPlan('starter');
        }
      } else {
        setSubscriptionPlan('starter');
      }
    } catch (error) {
      console.error('Failed to fetch subscription info:', error);
      setSubscriptionPlan('starter');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const getTierInfo = (plan: string) => {
    switch (plan) {
      case 'free-trial':
        return {
          name: 'Free Trial',
          icon: <Star className="h-3 w-3" />,
          color: 'bg-blue-100 text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'starter':
        return {
          name: 'Starter',
          icon: <Zap className="h-3 w-3" />,
          color: 'bg-gray-100 text-gray-800',
          borderColor: 'border-gray-200'
        };
      case 'growth':
        return {
          name: 'Growth',
          icon: <Rocket className="h-3 w-3" />,
          color: 'bg-purple-100 text-purple-800',
          borderColor: 'border-purple-200'
        };
      case 'scale':
        return {
          name: 'Scale',
          icon: <Crown className="h-3 w-3" />,
          color: 'bg-green-100 text-green-800',
          borderColor: 'border-green-200'
        };
      case 'enterprise':
        return {
          name: 'Enterprise',
          icon: <Crown className="h-3 w-3" />,
          color: 'bg-amber-100 text-amber-800',
          borderColor: 'border-amber-200'
        };
      default:
        return {
          name: 'Free',
          icon: <Star className="h-3 w-3" />,
          color: 'bg-gray-100 text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  if (loading) {
    return null;
  }

  const tierInfo = getTierInfo(subscriptionPlan);

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`${tierInfo.color} ${tierInfo.borderColor} border px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1`}>
          {tierInfo.icon}
          <span>{tierInfo.name}</span>
        </div>
        {showUpgradeButton && subscriptionPlan !== 'enterprise' && (
          <button
            onClick={handleUpgrade}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Upgrade
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`${tierInfo.color} p-2 rounded-lg`}>
            {tierInfo.icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Current Plan</h3>
            <p className="text-lg font-semibold text-gray-700">{tierInfo.name}</p>
            {isOnTrial && (
              <p className="text-xs text-blue-600">7-day free trial</p>
            )}
          </div>
        </div>
        {showUpgradeButton && subscriptionPlan !== 'enterprise' && (
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTierDisplay; 