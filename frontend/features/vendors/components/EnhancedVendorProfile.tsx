"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  User,
  Calendar, 
  Award, 
  Shield, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Star, 
  Edit, 
  ExternalLink, 
  Download, 
  Upload, 
  MessageSquare, 
  Video, 
  BarChart3,
  Target,
  Zap,
  Lock,
  Eye,
  Activity,
  Briefcase,
  DollarSign,
  Network,
  Database,
  Server,
  CloudCog
} from 'lucide-react';

interface EnhancedVendorProfileProps {
  vendor: any;
  onEdit?: () => void;
  onMessage?: () => void;
  onScheduleCall?: () => void;
}

interface ComplianceScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'critical';
  details: string[];
}

interface SecurityMetric {
  name: string;
  value: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  lastUpdated: string;
  icon: React.ReactNode;
}

interface BusinessMetric {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

export function EnhancedVendorProfile({ vendor, onEdit, onMessage, onScheduleCall }: EnhancedVendorProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [complianceScores, setComplianceScores] = useState<ComplianceScore[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetric[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([]);

  // Fetch real vendor analytics and compliance data from PostgreSQL database
  useEffect(() => {
    const fetchVendorAnalytics = async () => {
      if (!vendor?.id) return;
      
      try {
        // Fetch vendor-specific analytics from database
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/analytics/vendors/${vendor.id}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Fetched vendor analytics from database:', data);
          
          // Transform API data to component format
          if (data.complianceScores) {
            setComplianceScores(data.complianceScores);
          }
          if (data.securityMetrics) {
            setSecurityMetrics(data.securityMetrics.map((metric: any) => ({
              ...metric,
              icon: getSecurityIcon(metric.name)
            })));
          }
          if (data.businessMetrics) {
            setBusinessMetrics(data.businessMetrics.map((metric: any) => ({
              ...metric,
              icon: getBusinessIcon(metric.label)
            })));
          }
        } else {
          console.warn('⚠️ Vendor analytics not available, using basic data from vendor profile');
          // Fallback: generate basic metrics from vendor data
          generateBasicMetrics();
        }
      } catch (error) {
        console.error('❌ Error fetching vendor analytics:', error);
        generateBasicMetrics();
      }
    };

    const generateBasicMetrics = () => {
      // Generate basic compliance scores based on vendor data
      const basicComplianceScores: ComplianceScore[] = [
        {
          category: 'Data Security',
          score: vendor?.riskScore ? 100 - vendor.riskScore : 75,
          maxScore: 100,
          status: vendor?.riskLevel === 'Low' ? 'excellent' : vendor?.riskLevel === 'Medium' ? 'good' : 'needs-improvement',
          details: ['Assessment based on questionnaire responses']
        }
      ];

      const basicSecurityMetrics: SecurityMetric[] = [
        {
          name: 'Risk Assessment',
          value: vendor?.riskLevel || 'Unknown',
          status: vendor?.riskLevel === 'Low' ? 'compliant' : vendor?.riskLevel === 'Medium' ? 'partial' : 'non-compliant',
          lastUpdated: vendor?.updatedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          icon: <Shield className="h-4 w-4" />
        }
      ];

      const basicBusinessMetrics: BusinessMetric[] = [
        {
          label: 'Onboarding Status',
          value: vendor?.status || 'Unknown',
          icon: <Calendar className="h-4 w-4" />
        },
        {
          label: 'Industry',
          value: vendor?.industry || 'Not specified',
          icon: <Building2 className="h-4 w-4" />
        }
      ];

      setComplianceScores(basicComplianceScores);
      setSecurityMetrics(basicSecurityMetrics);
      setBusinessMetrics(basicBusinessMetrics);
    };

    const getSecurityIcon = (name: string) => {
      if (name.toLowerCase().includes('auth')) return <Lock className="h-4 w-4" />;
      if (name.toLowerCase().includes('encrypt')) return <Shield className="h-4 w-4" />;
      if (name.toLowerCase().includes('scan')) return <Eye className="h-4 w-4" />;
      if (name.toLowerCase().includes('backup')) return <Database className="h-4 w-4" />;
      return <Shield className="h-4 w-4" />;
    };

    const getBusinessIcon = (label: string) => {
      if (label.toLowerCase().includes('size') || label.toLowerCase().includes('employee')) return <Users className="h-4 w-4" />;
      if (label.toLowerCase().includes('revenue') || label.toLowerCase().includes('financial')) return <DollarSign className="h-4 w-4" />;
      if (label.toLowerCase().includes('year') || label.toLowerCase().includes('age')) return <Calendar className="h-4 w-4" />;
      if (label.toLowerCase().includes('client') || label.toLowerCase().includes('customer')) return <TrendingUp className="h-4 w-4" />;
      return <Building2 className="h-4 w-4" />;
    };

    fetchVendorAnalytics();
  }, [vendor]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'non-compliant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOverallScore = () => {
    const totalScore = complianceScores.reduce((sum, score) => sum + score.score, 0);
    const maxTotalScore = complianceScores.reduce((sum, score) => sum + score.maxScore, 0);
    return Math.round((totalScore / maxTotalScore) * 100);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">{vendor?.name || 'Company Name'}</h1>
              <div className="flex items-center space-x-4 text-white/90">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  <span className="text-sm">{vendor?.website || 'website.com'}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{vendor?.location || 'Location'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{getOverallScore()}%</div>
            <div className="text-sm text-white/80">Compliance Score</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {businessMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                {metric.icon}
              </div>
              {metric.trend && (
                <div className={`flex items-center text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                  {metric.change}
                </div>
              )}
            </div>
            <div className="text-lg font-semibold text-gray-900">{metric.value}</div>
            <div className="text-sm text-gray-500">{metric.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Company Description */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Company</h3>
        <div className="text-gray-600">
          <p className={`${!showFullDescription ? 'line-clamp-3' : ''}`}>
            {vendor?.description || 'This company provides innovative technology solutions with a focus on security and compliance. They serve enterprise clients across various industries and maintain high standards for data protection and privacy. Their commitment to excellence has made them a trusted partner for organizations requiring robust security measures and regulatory compliance.'}
          </p>
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-primary hover:text-primary/80 text-sm font-medium mt-2"
          >
            {showFullDescription ? 'Show less' : 'Read more'}
          </button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Primary Contact</div>
              <div className="font-medium">{vendor?.contactEmail || 'contact@company.com'}</div>
            </div>
          </div>
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium">{vendor?.contactPhone || '+1 (555) 123-4567'}</div>
            </div>
          </div>
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Contact Person</div>
              <div className="font-medium">{vendor?.contactName || 'John Doe'}</div>
            </div>
          </div>
          <div className="flex items-center">
            <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Industry</div>
              <div className="font-medium">{vendor?.industry || 'Technology'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onMessage}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-blue-600 mr-3" />
            <span className="font-medium">Send Message</span>
          </button>
          <button
            onClick={onScheduleCall}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Video className="h-5 w-5 text-green-600 mr-3" />
            <span className="font-medium">Schedule Call</span>
          </button>
          <button
            onClick={onEdit}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-5 w-5 text-purple-600 mr-3" />
            <span className="font-medium">Edit Profile</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Overview</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{getOverallScore()}%</div>
            <div className="text-sm text-gray-500">Overall Score</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complianceScores.map((score, index) => (
            <motion.div
              key={score.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{score.category}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(score.status)}`}>
                  {score.status.replace('-', ' ')}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Score</span>
                  <span className="font-medium">{score.score}/{score.maxScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      score.status === 'excellent' ? 'bg-green-500' :
                      score.status === 'good' ? 'bg-blue-500' :
                      score.status === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(score.score / score.maxScore) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                {score.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                    {detail}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Metrics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Controls</h3>
        <div className="space-y-4">
          {securityMetrics.map((metric, index) => (
            <div key={metric.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg mr-4">
                  {metric.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{metric.name}</div>
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date(metric.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{metric.value}</div>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                  {metric.status.replace('-', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      {/* Document Status */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'SOC 2 Report', status: 'uploaded', date: '2024-01-15', size: '2.3 MB' },
            { name: 'Privacy Policy', status: 'uploaded', date: '2024-01-10', size: '1.2 MB' },
            { name: 'Data Processing Agreement', status: 'pending', date: null, size: null },
            { name: 'Security Architecture', status: 'uploaded', date: '2024-01-12', size: '3.1 MB' },
            { name: 'Incident Response Plan', status: 'review', date: '2024-01-18', size: '1.8 MB' },
            { name: 'Business Continuity Plan', status: 'pending', date: null, size: null }
          ].map((doc, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-sm">{doc.name}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doc.status === 'uploaded' ? 'text-green-600 bg-green-100' :
                  doc.status === 'review' ? 'text-blue-600 bg-blue-100' :
                  'text-yellow-600 bg-yellow-100'
                }`}>
                  {doc.status}
                </span>
              </div>
              {doc.date && (
                <div className="text-xs text-gray-500 mb-2">
                  Uploaded: {new Date(doc.date).toLocaleDateString()}
                </div>
              )}
              {doc.size && (
                <div className="text-xs text-gray-500 mb-2">Size: {doc.size}</div>
              )}
              <div className="flex items-center space-x-2">
                {doc.status === 'uploaded' && (
                  <>
                    <button className="text-xs text-blue-600 hover:text-blue-800">View</button>
                    <button className="text-xs text-green-600 hover:text-green-800">Download</button>
                  </>
                )}
                {doc.status === 'pending' && (
                  <button className="text-xs text-primary hover:text-primary/80">Upload</button>
                )}
                {doc.status === 'review' && (
                  <span className="text-xs text-blue-600">Under Review</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-6">
      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            {
              type: 'document',
              title: 'SOC 2 Report uploaded',
              description: 'New SOC 2 Type II report has been uploaded for review',
              timestamp: '2 hours ago',
              icon: <Upload className="h-4 w-4" />
            },
            {
              type: 'message',
              title: 'Message from compliance team',
              description: 'Question about data retention policies',
              timestamp: '1 day ago',
              icon: <MessageSquare className="h-4 w-4" />
            },
            {
              type: 'review',
              title: 'Privacy policy approved',
              description: 'Privacy policy has been reviewed and approved',
              timestamp: '2 days ago',
              icon: <CheckCircle className="h-4 w-4" />
            },
            {
              type: 'update',
              title: 'Profile information updated',
              description: 'Company contact information has been updated',
              timestamp: '3 days ago',
              icon: <Edit className="h-4 w-4" />
            }
          ].map((activity, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className={`p-2 rounded-lg ${
                activity.type === 'document' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'message' ? 'bg-purple-100 text-purple-600' :
                activity.type === 'review' ? 'bg-green-100 text-green-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {activity.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{activity.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <span className="text-xs text-gray-500 mt-2 block">{activity.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Building2 className="h-4 w-4" /> },
    { id: 'compliance', label: 'Compliance', icon: <Shield className="h-4 w-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
    { id: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 mb-6">
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

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'compliance' && renderComplianceTab()}
          {activeTab === 'documents' && renderDocumentsTab()}
          {activeTab === 'activity' && renderActivityTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 
