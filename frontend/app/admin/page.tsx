'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiCall } from '../../lib/api';

interface DashboardData {
  overview: {
    totalUsers: number;
    totalVendors: number;
    totalOrganizations: number;
    waitlistSubscribers: number;
    recentActivities: number;
  };
  recentActivities: any[];
  userRoleDistribution: any[];
  vendorStatusDistribution: any[];
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_name: string;
  is_active: boolean;
  created_at: string;
}

interface Vendor {
  vendor_id: number;
  uuid: string;
  company_name: string;
  status: string;
  organization_name: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState('');

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/admin/dashboard');
      setDashboardData(response);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiCall('/api/admin/users');
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    }
  };

  const loadVendors = async () => {
    try {
      const response = await apiCall('/api/admin/vendors');
      setVendors(response.vendors || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setError('Failed to load vendors');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const endpoint = currentStatus ? `/api/admin/users/${userId}` : `/api/admin/users/${userId}/activate`;
      const method = currentStatus ? 'DELETE' : 'POST';
      
      await apiCall(endpoint, { method });
      loadUsers(); // Reload users
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status');
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      await apiCall(`/api/admin/vendors/${vendorId}`, { method: 'DELETE' });
      loadVendors(); // Reload vendors
    } catch (error) {
      console.error('Error deleting vendor:', error);
      setError('Failed to delete vendor');
    }
  };

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'vendors') {
      loadVendors();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user?.full_name}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'vendors', name: 'Vendors', icon: '🏢' },
              { id: 'analytics', name: 'Analytics', icon: '📈' },
              { id: 'system', name: 'System', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">👥</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Users</h3>
                    <p className="text-3xl font-bold text-blue-600">{dashboardData.overview.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🏢</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Vendors</h3>
                    <p className="text-3xl font-bold text-green-600">{dashboardData.overview.totalVendors}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🏛️</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Organizations</h3>
                    <p className="text-3xl font-bold text-purple-600">{dashboardData.overview.totalOrganizations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📬</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Waitlist</h3>
                    <p className="text-3xl font-bold text-orange-600">{dashboardData.overview.waitlistSubscribers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">⚡</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                    <p className="text-3xl font-bold text-red-600">{dashboardData.overview.recentActivities}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Role Distribution */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Role Distribution</h3>
                <div className="space-y-3">
                  {dashboardData.userRoleDistribution.map((role, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 capitalize">{role.role}</span>
                      <span className="text-sm text-gray-500">{role.count} users</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendor Status Distribution */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Status Distribution</h3>
                <div className="space-y-3">
                  {dashboardData.vendorStatusDistribution.map((status, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{status.status}</span>
                      <span className="text-sm text-gray-500">{status.count} vendors</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {dashboardData.recentActivities.slice(0, 10).map((activity, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">
                          {activity.user_name || 'System'} • {activity.type}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'founder' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.organization_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className={`mr-2 ${
                            user.is_active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Vendor Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.vendor_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vendor.company_name}</div>
                        <div className="text-sm text-gray-500">ID: {vendor.vendor_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          vendor.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          vendor.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.organization_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteVendor(vendor.vendor_id.toString())}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics Dashboard</h3>
              <p className="text-gray-600">Advanced analytics coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Management</h3>
              <p className="text-gray-600">System tools and maintenance options coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 