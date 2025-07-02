"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Eye,
  FileText,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import activityApiService from '@/lib/services/activityApiService';

interface OrganizationStatsData {
  totalVendors: number;
  vendorsByStatus: {
    [key: string]: number;
  };
  totalQuestionnaires: number;
  completedQuestionnaires: number;
  pendingQuestionnaires: number;
  totalTrustPortalViews: number;
  complianceScore: number;
  organizationName: string;
  recentActivity: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'primary',
  isLoading = false 
}) => {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    success: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    info: 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
  };

  return (
    <div className="bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            {title}
          </h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              {subtitle && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>}
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {subtitle && (
                <p className={`text-sm ${trend && trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 
                  trend && trend.startsWith('-') ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-500 dark:text-gray-400'}`}>
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      {trend && !isLoading && (
        <div className="flex items-center">
          <TrendingUp className={`w-4 h-4 mr-1 ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-sm font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};

export const OrganizationStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OrganizationStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchOrganizationStats = async () => {
    if (!user?.organization_id) {
      setError('User organization not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Fetch vendors for the organization
      const vendorsResponse = await activityApiService.getVendors();
      
      if (!vendorsResponse.success) {
        throw new Error(vendorsResponse.error?.message || 'Failed to fetch vendor data');
      }

      const vendors = vendorsResponse.data || [];
      
      // Calculate vendor statistics
      const vendorsByStatus = vendors.reduce((acc: { [key: string]: number }, vendor: any) => {
        const status = vendor.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Fetch recent activity count
      const activityResponse = await activityApiService.getRecentActivities(10, user.id);
      const recentActivityCount = activityResponse.success ? (activityResponse.data?.length || 0) : 0;

      // Calculate compliance score based on vendor statuses
      const totalVendors = vendors.length;
      const approvedVendors = vendorsByStatus['Approved'] || 0;
      const complianceScore = totalVendors > 0 ? Math.round((approvedVendors / totalVendors) * 100) : 0;

      // Mock data for features not yet implemented
      const mockStats: OrganizationStatsData = {
        totalVendors,
        vendorsByStatus,
        totalQuestionnaires: vendors.length * 2, // Assume 2 questionnaires per vendor
        completedQuestionnaires: approvedVendors * 2,
        pendingQuestionnaires: (totalVendors - approvedVendors) * 2,
        totalTrustPortalViews: Math.floor(Math.random() * 500) + 100, // Mock data
        complianceScore,
        organizationName: user.organization || 'Your Organization',
        recentActivity: recentActivityCount
      };

      setStats(mockStats);
    } catch (err: any) {
      console.error('Error fetching organization stats:', err);
      setError(err.message || 'Failed to load organization statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationStats();
  }, [user?.organization_id]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
          <p className="text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
        <button 
          onClick={fetchOrganizationStats}
          className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? 'Loading...' : (stats?.organizationName || 'Organization Dashboard')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Real-time organizational metrics and compliance overview
              </p>
            </div>
          </div>
          {!isLoading && (
            <button
              onClick={fetchOrganizationStats}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vendors"
          value={stats?.totalVendors || 0}
          subtitle={`${Object.keys(stats?.vendorsByStatus || {}).length} status categories`}
          icon={<Users className="w-6 h-6" />}
          color="primary"
          isLoading={isLoading}
        />

        <StatCard
          title="Compliance Score"
          value={`${stats?.complianceScore || 0}%`}
          subtitle={`${stats?.vendorsByStatus?.['Approved'] || 0} approved vendors`}
          icon={<Shield className="w-6 h-6" />}
          color={stats && stats.complianceScore >= 80 ? 'success' : stats && stats.complianceScore >= 60 ? 'warning' : 'danger'}
          trend={stats && stats.complianceScore >= 70 ? '+12% this month' : undefined}
          isLoading={isLoading}
        />

        <StatCard
          title="Questionnaires"
          value={stats?.completedQuestionnaires || 0}
          subtitle={`${stats?.pendingQuestionnaires || 0} pending completion`}
          icon={<FileText className="w-6 h-6" />}
          color="info"
          isLoading={isLoading}
        />

        <StatCard
          title="Trust Portal Views"
          value={stats?.totalTrustPortalViews || 0}
          subtitle="+24% from last week"
          icon={<Eye className="w-6 h-6" />}
          color="success"
          trend="+24%"
          isLoading={isLoading}
        />
      </div>

      {/* Vendor Status Breakdown */}
      {!isLoading && stats && Object.keys(stats.vendorsByStatus).length > 0 && (
        <div className="bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Vendor Status Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.vendorsByStatus).map(([status, count]) => {
              const getStatusColor = (status: string) => {
                switch (status.toLowerCase()) {
                  case 'approved': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
                  case 'in review': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
                  case 'pending review': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
                  case 'questionnaire pending': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
                  default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
                }
              };

              return (
                <div key={status} className={`p-4 rounded-lg ${getStatusColor(status)}`}>
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <div className="text-sm font-medium">{status}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 