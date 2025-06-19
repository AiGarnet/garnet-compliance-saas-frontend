"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Star, 
  TrendingUp, 
  Shield, 
  Award, 
  Calendar, 
  MessageSquare, 
  Bell,
  Target,
  BarChart3,
  Users,
  Globe,
  Zap,
  Lock,
  Activity,
  ArrowRight,
  Plus,
  RefreshCw
} from 'lucide-react';

interface VendorDashboardProps {
  vendor: any;
  onUpdateVendor?: (vendorData: any) => void;
}

interface ComplianceMetric {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  type: 'questionnaire' | 'document' | 'review' | 'meeting';
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedDate?: string;
  estimatedDate: string;
}

export function VendorDashboard({ vendor, onUpdateVendor }: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Real compliance metrics fetched from PostgreSQL database
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetric[]>([]);

  // Fetch real vendor dashboard data
  useEffect(() => {
    const fetchVendorDashboardData = async () => {
      if (!vendor?.id) return;
      
      try {
        // Fetch vendor-specific dashboard data from database
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/analytics/vendors/${vendor.id}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Fetched vendor dashboard data from database:', data);
          
          // Transform API data to compliance metrics format
          const metrics: ComplianceMetric[] = [
            {
              label: 'Questionnaire Completion',
              value: data.questionnaireCompletion?.completed || 0,
              total: data.questionnaireCompletion?.total || 1,
              color: 'blue',
              icon: <FileText className="h-5 w-5" />
            },
            {
              label: 'Documents Uploaded',
              value: data.documentsUploaded || 0,
              total: data.documentsRequired || 1,
              color: 'green',
              icon: <Upload className="h-5 w-5" />
            },
            {
              label: 'Security Controls',
              value: data.securityControls?.implemented || 0,
              total: data.securityControls?.total || 1,
              color: 'purple',
              icon: <Shield className="h-5 w-5" />
            },
            {
              label: 'Risk Assessment',
              value: vendor.riskScore || 0,
              total: 100,
              color: 'orange',
              icon: <Target className="h-5 w-5" />
            }
          ];
          
          setComplianceMetrics(metrics);
        } else {
          console.warn('⚠️ Vendor dashboard data not available, using basic calculations');
          // Fallback: generate basic metrics from vendor data
          generateBasicMetrics();
        }
      } catch (error) {
        console.error('❌ Error fetching vendor dashboard data:', error);
        generateBasicMetrics();
      }
    };

    const generateBasicMetrics = () => {
      const basicMetrics: ComplianceMetric[] = [
        {
          label: 'Questionnaire Completion',
          value: vendor?.questionnaireAnswers?.length || 0,
          total: Math.max(vendor?.questionnaireAnswers?.length || 1, 10),
          color: 'blue',
          icon: <FileText className="h-5 w-5" />
        },
        {
          label: 'Risk Score',
          value: vendor?.riskScore || 0,
          total: 100,
          color: vendor?.riskLevel === 'Low' ? 'green' : vendor?.riskLevel === 'Medium' ? 'orange' : 'red',
          icon: <Target className="h-5 w-5" />
        }
      ];
      
      setComplianceMetrics(basicMetrics);
    };

    fetchVendorDashboardData();
  }, [vendor]);

  const tasks: TaskItem[] = [
    {
      id: '1',
      title: 'Complete Data Processing Questionnaire',
      description: 'Provide details about your data processing activities and retention policies',
      priority: 'high',
      dueDate: '2024-01-20',
      status: 'pending',
      type: 'questionnaire'
    },
    {
      id: '2',
      title: 'Upload SOC 2 Report',
      description: 'Upload your latest SOC 2 Type II report for review',
      priority: 'high',
      dueDate: '2024-01-22',
      status: 'pending',
      type: 'document'
    },
    {
      id: '3',
      title: 'Security Architecture Review',
      description: 'Schedule a call to review your security architecture',
      priority: 'medium',
      dueDate: '2024-01-25',
      status: 'in-progress',
      type: 'meeting'
    },
    {
      id: '4',
      title: 'Privacy Policy Review',
      description: 'Review and approve the updated privacy policy',
      priority: 'low',
      dueDate: '2024-01-30',
      status: 'pending',
      type: 'review'
    }
  ];

  const milestones: Milestone[] = [
    {
      id: '1',
      title: 'Initial Registration',
      description: 'Complete vendor registration and basic information',
      completed: true,
      completedDate: '2024-01-10',
      estimatedDate: '2024-01-10'
    },
    {
      id: '2',
      title: 'Security Questionnaire',
      description: 'Complete comprehensive security questionnaire',
      completed: true,
      completedDate: '2024-01-15',
      estimatedDate: '2024-01-15'
    },
    {
      id: '3',
      title: 'Document Submission',
      description: 'Submit all required compliance documents',
      completed: false,
      estimatedDate: '2024-01-25'
    },
    {
      id: '4',
      title: 'Security Review',
      description: 'Complete security architecture review',
      completed: false,
      estimatedDate: '2024-02-01'
    },
    {
      id: '5',
      title: 'Final Approval',
      description: 'Receive final approval and onboarding completion',
      completed: false,
      estimatedDate: '2024-02-10'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'In Review': return 'text-blue-600 bg-blue-100';
      case 'Pending Review': return 'text-yellow-600 bg-yellow-100';
      case 'Questionnaire Pending': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'questionnaire': return <FileText className="h-4 w-4" />;
      case 'document': return <Upload className="h-4 w-4" />;
      case 'review': return <Eye className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const calculateOverallProgress = () => {
    const completedMilestones = milestones.filter(m => m.completed).length;
    return Math.round((completedMilestones / milestones.length) * 100);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, {vendor?.name || 'Vendor'}!</h2>
            <p className="text-white/90">Here's your compliance journey progress</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{calculateOverallProgress()}%</div>
            <div className="text-sm text-white/80">Complete</div>
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${calculateOverallProgress()}%` }}
          />
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vendor?.status || 'Pending')}`}>
            {vendor?.status || 'Pending'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Company</div>
              <div className="font-medium">{vendor?.name || 'Not specified'}</div>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Started</div>
              <div className="font-medium">{vendor?.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'Recently'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {complianceMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${metric.color}-100 text-${metric.color}-600`}>
                {metric.icon}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-sm text-gray-500">of {metric.total}</div>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{metric.label}</span>
                <span className="text-gray-900 font-medium">{Math.round((metric.value / metric.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${metric.color}-500 h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${(metric.value / metric.total) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="h-5 w-5 text-blue-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Upload Documents</div>
              <div className="text-sm text-gray-500">Add compliance documents</div>
            </div>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-5 w-5 text-green-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Complete Questionnaire</div>
              <div className="text-sm text-gray-500">Answer security questions</div>
            </div>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="h-5 w-5 text-purple-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Contact Support</div>
              <div className="text-sm text-gray-500">Get help from our team</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTasksTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Your Tasks</h2>
        <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-orange-500 mr-2" />
            Pending ({tasks.filter(t => t.status === 'pending').length})
          </h3>
          <div className="space-y-3">
            {tasks.filter(t => t.status === 'pending').map(task => (
              <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {getTaskIcon(task.type)}
                    <span className="ml-2 font-medium text-sm">{task.title}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  <button className="text-xs text-primary hover:text-primary/80">Start</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 text-blue-500 mr-2" />
            In Progress ({tasks.filter(t => t.status === 'in-progress').length})
          </h3>
          <div className="space-y-3">
            {tasks.filter(t => t.status === 'in-progress').map(task => (
              <div key={task.id} className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {getTaskIcon(task.type)}
                    <span className="ml-2 font-medium text-sm">{task.title}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  <button className="text-xs text-blue-600 hover:text-blue-800">Continue</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Completed ({tasks.filter(t => t.status === 'completed').length})
          </h3>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No completed tasks yet</p>
            <p className="text-xs">Complete your first task to see it here</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgressTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Compliance Journey</h2>
        <div className="text-sm text-gray-500">
          {milestones.filter(m => m.completed).length} of {milestones.length} milestones completed
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex items-start mb-8 last:mb-0">
              <div className="flex flex-col items-center mr-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  milestone.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {milestone.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < milestones.length - 1 && (
                  <div className={`w-0.5 h-16 mt-2 ${
                    milestone.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-semibold ${
                    milestone.completed ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    {milestone.title}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {milestone.completed 
                      ? `Completed ${new Date(milestone.completedDate!).toLocaleDateString()}`
                      : `Est. ${new Date(milestone.estimatedDate).toLocaleDateString()}`
                    }
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{milestone.description}</p>
                {!milestone.completed && index === milestones.findIndex(m => !m.completed) && (
                  <div className="mt-3">
                    <button className="flex items-center text-sm text-primary hover:text-primary/80 font-medium">
                      Start this milestone
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Documents & Evidence</h2>
        <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Required Documents */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            Required Documents
          </h3>
          <div className="space-y-3">
            {[
              { name: 'SOC 2 Report', status: 'missing', required: true },
              { name: 'Privacy Policy', status: 'uploaded', required: true },
              { name: 'Data Processing Agreement', status: 'missing', required: true },
              { name: 'Security Architecture Diagram', status: 'uploaded', required: true }
            ].map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="font-medium text-sm">{doc.name}</span>
                </div>
                <div className="flex items-center">
                  {doc.status === 'uploaded' ? (
                    <span className="text-green-600 text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Uploaded
                    </span>
                  ) : (
                    <button className="text-primary text-sm hover:text-primary/80">
                      Upload
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Uploaded Documents
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Privacy Policy v2.1.pdf', uploadDate: '2024-01-15', size: '2.3 MB' },
              { name: 'Security Architecture.png', uploadDate: '2024-01-12', size: '1.8 MB' }
            ].map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-green-500 mr-3" />
                  <div>
                    <div className="font-medium text-sm">{doc.name}</div>
                    <div className="text-xs text-gray-500">
                      Uploaded {new Date(doc.uploadDate).toLocaleDateString()} • {doc.size}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <FileText className="h-4 w-4" /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'documents', label: 'Documents', icon: <Upload className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vendor Portal</h1>
                <p className="text-sm text-gray-500">{vendor?.name || 'Your Company'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {vendor?.name?.charAt(0) || 'V'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'tasks' && renderTasksTab()}
            {activeTab === 'progress' && renderProgressTab()}
            {activeTab === 'documents' && renderDocumentsTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 
