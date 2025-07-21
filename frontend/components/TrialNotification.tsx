import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Crown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TrialStatus {
  isOnTrial: boolean;
  trialEndDate?: string;
  daysRemaining?: number;
  isExpired: boolean;
}

interface TrialNotificationProps {
  userId: string;
}

const TrialNotification: React.FC<TrialNotificationProps> = ({ userId }) => {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTrialStatus();
  }, [userId]);

  const fetchTrialStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/billing/trial-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrialStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading || !trialStatus || dismissed) {
    return null;
  }

  // Show notification if user is on trial or trial has expired
  if (!trialStatus.isOnTrial && !trialStatus.isExpired) {
    return null;
  }

  // Trial expired - show urgent notification
  if (trialStatus.isExpired) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Free Trial Expired
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Your 7-day free trial has expired. Subscribe now to continue using Garnet AI's compliance features.
              </p>
            </div>
            <div className="mt-4">
              <div className="flex space-x-3">
                <button
                  onClick={handleUpgrade}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Choose a Plan
                </button>
              </div>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={handleDismiss}
                className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active trial - show countdown
  const getTrialColor = () => {
    if (!trialStatus.daysRemaining) return 'blue';
    if (trialStatus.daysRemaining <= 1) return 'red';
    if (trialStatus.daysRemaining <= 3) return 'yellow';
    return 'blue';
  };

  const color = getTrialColor();
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      icon: 'text-blue-400',
      title: 'text-blue-800',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      icon: 'text-yellow-400',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      icon: 'text-red-400',
      title: 'text-red-800',
      text: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700'
    }
  };

  const styles = colorClasses[color];

  return (
    <div className={`${styles.bg} border-l-4 ${styles.border} p-4 mb-6 rounded-r-lg`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Clock className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.title}`}>
            Free Trial Active
          </h3>
          <div className={`mt-2 text-sm ${styles.text}`}>
            <p>
              {trialStatus.daysRemaining === 1 
                ? 'Your free trial expires tomorrow!' 
                : trialStatus.daysRemaining === 0
                ? 'Your free trial expires today!'
                : `You have ${trialStatus.daysRemaining} days left in your free trial.`
              }
              {' '}You're currently on the Starter plan with 1 vendor, 2 questionnaires per month, and basic Trust Portal access.
            </p>
          </div>
          <div className="mt-4">
            <div className="flex space-x-3">
              <button
                onClick={handleUpgrade}
                className={`${styles.button} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center`}
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:text-gray-800 transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={handleDismiss}
              className={`inline-flex rounded-md p-1.5 ${styles.icon} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialNotification; 