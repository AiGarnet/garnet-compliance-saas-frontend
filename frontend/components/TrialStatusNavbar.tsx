import React, { useState, useEffect } from 'react';
import { Clock, Crown, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

interface TrialStatus {
  isOnTrial: boolean;
  trialEndDate?: string;
  daysRemaining?: number;
  isExpired: boolean;
}

const TrialStatusNavbar: React.FC = () => {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      fetchTrialStatus();
    }
  }, [user?.id]);

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

  // Don't show anything if loading or no trial data
  if (loading || !trialStatus) {
    return null;
  }

  // Don't show if user is not on trial and trial hasn't expired
  if (!trialStatus.isOnTrial && !trialStatus.isExpired) {
    return null;
  }

  // Trial expired - show urgent indicator
  if (trialStatus.isExpired) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
          <AlertTriangle className="h-4 w-4" />
          <span>Trial Expired</span>
        </div>
        <button
          onClick={handleUpgrade}
          className="bg-red-600 text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
        >
          <Crown className="h-4 w-4" />
          <span>Upgrade Now</span>
        </button>
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
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      button: 'bg-red-600 hover:bg-red-700'
    }
  };

  const styles = colorClasses[color];

  const getTrialText = () => {
    if (trialStatus.daysRemaining === 0) return 'Trial Ends Today!';
    if (trialStatus.daysRemaining === 1) return 'Trial Ends Tomorrow';
    return `${trialStatus.daysRemaining} Days Left`;
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`${styles.bg} ${styles.text} px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1`}>
        <Clock className="h-4 w-4" />
        <span>{getTrialText()}</span>
      </div>
      <button
        onClick={handleUpgrade}
        className={`${styles.button} text-white px-4 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1`}
      >
        <Crown className="h-4 w-4" />
        <span>Upgrade</span>
      </button>
    </div>
  );
};

export default TrialStatusNavbar; 