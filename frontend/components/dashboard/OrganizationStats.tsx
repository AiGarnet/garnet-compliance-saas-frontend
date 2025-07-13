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
  Activity,
  Upload,
  List
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import activityApiService from '@/lib/services/activityApiService';
import { ChecklistService } from '@/lib/services/checklistService';
import { evidence } from '@/lib/api';

interface OrganizationStatsData {
  totalVendors: number;
  vendorsByStatus: {
    [key: string]: number;
  };
  totalQuestionnaires: number;
  completedQuestionnaires: number;
  pendingQuestionnaires: number;
  supportingDocumentsCount: number;
  checklistsUploadedCount: number;
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

  // Initialize default stats to prevent undefined errors
  const defaultStats: OrganizationStatsData = {
    totalVendors: 0,
    vendorsByStatus: {},
    totalQuestionnaires: 0,
    completedQuestionnaires: 0,
    pendingQuestionnaires: 0,
    supportingDocumentsCount: 0,
    checklistsUploadedCount: 0,
    organizationName: user?.organization || 'Your Organization',
    recentActivity: 0
  };

  const fetchOrganizationStats = async () => {
    if (!user?.organization_id) {
      setError('User organization not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Fetch data in parallel for better performance
      const [
        vendorsResponse,
        activityResponse,
        supportingDocsCountResponse,
        checklistsCountResponse
      ] = await Promise.all([
        activityApiService.getVendors().catch((err) => {
          console.error('Error fetching vendors:', err);
          return { success: false, data: [], error: err };
        }),
        activityApiService.getRecentActivities(10, user.id).catch((err) => {
          console.error('Error fetching activities:', err);
          return { success: false, data: [], error: err };
        }),
        ChecklistService.getOrganizationSupportingDocumentsCount(user.organization_id).catch((err) => {
          console.error('Error fetching supporting docs count:', err);
          return 0;
        }),
        ChecklistService.getOrganizationChecklistCount(user.organization_id).catch((err) => {
          console.error('Error fetching checklist count:', err);
          return 0;
        })
      ]);
      
      // Handle vendors response with fallback
      let vendors = [];
      if (vendorsResponse.success && vendorsResponse.data) {
        vendors = vendorsResponse.data;
      } else {
        console.warn('Failed to fetch vendors, using empty array:', vendorsResponse.error);
        vendors = [];
      }
      
      // Calculate vendor statistics
      const vendorsByStatus = vendors.reduce((acc: { [key: string]: number }, vendor: any) => {
        const status = vendor.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const recentActivityCount = activityResponse.success ? (activityResponse.data?.length || 0) : 0;

      // Calculate total vendors
      const totalVendors = vendors.length;

      const organizationStats: OrganizationStatsData = {
        totalVendors,
        vendorsByStatus,
        totalQuestionnaires: vendors.length * 2, // Assume 2 questionnaires per vendor
        completedQuestionnaires: (vendorsByStatus['Approved'] || 0) * 2,
        pendingQuestionnaires: (totalVendors - (vendorsByStatus['Approved'] || 0)) * 2,
        supportingDocumentsCount: supportingDocsCountResponse,
        checklistsUploadedCount: checklistsCountResponse,
        organizationName: user.organization || 'Your Organization',
        recentActivity: recentActivityCount
      };

      setStats(organizationStats);
    } catch (err: any) {
      console.error('Error fetching organization stats:', err);
      setError(err.message || 'Failed to load organization statistics');
      // Set default stats to prevent undefined errors
      setStats(defaultStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationStats();
  }, [user?.organization_id]);

  // Set up auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.organization_id) {
        fetchOrganizationStats();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
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
                Comprehensive compliance overview across all vendors
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
          title="Supporting Documents Uploaded"
          value={stats?.supportingDocumentsCount || 0}
          subtitle="Across all vendors"
          icon={<Upload className="w-6 h-6" />}
          color="success"
          isLoading={isLoading}
        />

        <StatCard
          title="Checklists Uploaded"
          value={stats?.checklistsUploadedCount || 0}
          subtitle="Organization-wide total"
          icon={<List className="w-6 h-6" />}
          color="info"
          isLoading={isLoading}
        />

        <StatCard
          title="Questionnaires"
          value={stats?.completedQuestionnaires || 0}
          subtitle={`${stats?.pendingQuestionnaires || 0} pending completion`}
          icon={<FileText className="w-6 h-6" />}
          color="warning"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}; 