"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  User, 
  FileText, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  Award,
  Zap,
  Target,
  TrendingUp,
  Lock,
  Eye,
  Download,
  Star,
  Clock,
  AlertCircle
} from 'lucide-react';

interface VendorOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (vendorData: any) => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface VendorFormData {
  // Company Information
  companyName: string;
  website: string;
  industry: string;
  companySize: string;
  foundedYear: string;
  description: string;
  
  // Contact Information
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactRole: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  
  // Compliance Information
  complianceFrameworks: string[];
  currentCertifications: string[];
  dataTypes: string[];
  securityMeasures: string[];
  
  // Business Information
  businessModel: string;
  clientTypes: string[];
  annualRevenue: string;
  
  // Additional Information
  specialRequirements: string;
  preferredCommunication: string;
  timezone: string;
}

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Financial Services', 'Manufacturing', 
  'Retail', 'Education', 'Government', 'Non-Profit', 'Other'
];

const COMPANY_SIZES = [
  '1-10 employees', '11-50 employees', '51-200 employees', 
  '201-500 employees', '501-1000 employees', '1000+ employees'
];

const COMPLIANCE_FRAMEWORKS = [
  'SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'PCI DSS', 
  'NIST', 'FedRAMP', 'CCPA', 'SOX', 'Other'
];

const DATA_TYPES = [
  'Personal Data', 'Financial Data', 'Health Records', 'Payment Information',
  'Intellectual Property', 'Customer Data', 'Employee Data', 'Other'
];

const SECURITY_MEASURES = [
  'Multi-Factor Authentication', 'Encryption at Rest', 'Encryption in Transit',
  'Regular Security Audits', 'Penetration Testing', 'Employee Training',
  'Incident Response Plan', 'Data Backup & Recovery', 'Access Controls'
];

export function VendorOnboardingWizard({ isOpen, onClose, onComplete }: VendorOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<VendorFormData>({
    companyName: '',
    website: '',
    industry: '',
    companySize: '',
    foundedYear: '',
    description: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactRole: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    complianceFrameworks: [],
    currentCertifications: [],
    dataTypes: [],
    securityMeasures: [],
    businessModel: '',
    clientTypes: [],
    annualRevenue: '',
    specialRequirements: '',
    preferredCommunication: 'email',
    timezone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Let\'s get started with your vendor onboarding',
      icon: <Star className="h-6 w-6" />,
      completed: false
    },
    {
      id: 'company',
      title: 'Company Information',
      description: 'Tell us about your organization',
      icon: <Building2 className="h-6 w-6" />,
      completed: false
    },
    {
      id: 'contact',
      title: 'Contact Details',
      description: 'Primary contact information',
      icon: <User className="h-6 w-6" />,
      completed: false
    },
    {
      id: 'compliance',
      title: 'Compliance & Security',
      description: 'Your security posture and certifications',
      icon: <Shield className="h-6 w-6" />,
      completed: false
    },
    {
      id: 'business',
      title: 'Business Details',
      description: 'Business model and operational information',
      icon: <TrendingUp className="h-6 w-6" />,
      completed: false
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your information and complete onboarding',
      icon: <CheckCircle className="h-6 w-6" />,
      completed: false
    }
  ];

  // Calculate completion percentage
  useEffect(() => {
    const totalFields = Object.keys(formData).length;
    const completedFields = Object.values(formData).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== '';
    }).length;
    setCompletionPercentage(Math.round((completedFields / totalFields) * 100));
  }, [formData]);

  const updateFormData = (field: keyof VendorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: keyof VendorFormData, value: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFormData(field, newArray);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting vendor data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Building2 className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to GarnetAI</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We're excited to partner with you! This onboarding process will help us understand your 
              organization better and ensure a smooth compliance journey together.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-blue-50 p-6 rounded-xl">
                <Clock className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">5-10 Minutes</h3>
                <p className="text-sm text-gray-600">Quick and easy setup process</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <Shield className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
                <p className="text-sm text-gray-600">Your data is encrypted and protected</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <Zap className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Instant Access</h3>
                <p className="text-sm text-gray-600">Get started immediately after completion</p>
              </div>
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => updateFormData('industry', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => updateFormData('companySize', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select company size</option>
                  {COMPANY_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Founded Year
                </label>
                <input
                  type="number"
                  value={formData.foundedYear}
                  onChange={(e) => updateFormData('foundedYear', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Brief description of your company and services..."
              />
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.primaryContactName}
                  onChange={(e) => updateFormData('primaryContactName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e) => updateFormData('primaryContactEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.primaryContactPhone}
                  onChange={(e) => updateFormData('primaryContactPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role/Title
                </label>
                <input
                  type="text"
                  value={formData.primaryContactRole}
                  onChange={(e) => updateFormData('primaryContactRole', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Chief Technology Officer"
                />
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="California"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateFormData('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="United States"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData('zipCode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="94105"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Frameworks</h3>
              <p className="text-sm text-gray-600 mb-4">Select all compliance frameworks that apply to your organization:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COMPLIANCE_FRAMEWORKS.map(framework => (
                  <label key={framework} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.complianceFrameworks.includes(framework)}
                      onChange={() => handleArrayToggle('complianceFrameworks', framework)}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">{framework}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data Types Handled</h3>
              <p className="text-sm text-gray-600 mb-4">What types of data does your organization handle?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DATA_TYPES.map(dataType => (
                  <label key={dataType} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dataTypes.includes(dataType)}
                      onChange={() => handleArrayToggle('dataTypes', dataType)}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">{dataType}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Measures</h3>
              <p className="text-sm text-gray-600 mb-4">Which security measures do you currently have in place?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SECURITY_MEASURES.map(measure => (
                  <label key={measure} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.securityMeasures.includes(measure)}
                      onChange={() => handleArrayToggle('securityMeasures', measure)}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">{measure}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Model
                </label>
                <select
                  value={formData.businessModel}
                  onChange={(e) => updateFormData('businessModel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select business model</option>
                  <option value="B2B">B2B (Business to Business)</option>
                  <option value="B2C">B2C (Business to Consumer)</option>
                  <option value="B2B2C">B2B2C (Business to Business to Consumer)</option>
                  <option value="SaaS">SaaS (Software as a Service)</option>
                  <option value="Marketplace">Marketplace</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Revenue Range
                </label>
                <select
                  value={formData.annualRevenue}
                  onChange={(e) => updateFormData('annualRevenue', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select revenue range</option>
                  <option value="Under $1M">Under $1M</option>
                  <option value="$1M - $10M">$1M - $10M</option>
                  <option value="$10M - $50M">$10M - $50M</option>
                  <option value="$50M - $100M">$50M - $100M</option>
                  <option value="Over $100M">Over $100M</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Communication Method
                </label>
                <select
                  value={formData.preferredCommunication}
                  onChange={(e) => updateFormData('preferredCommunication', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="slack">Slack</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => updateFormData('timezone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="UTC-8 (PST)"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements or Notes
              </label>
              <textarea
                value={formData.specialRequirements}
                onChange={(e) => updateFormData('specialRequirements', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Any special requirements, compliance needs, or additional information..."
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Information</h2>
              <p className="text-gray-600 mb-6">Please review your information before submitting</p>
              
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">Profile Completion</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{completionPercentage}% Complete</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Company Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {formData.companyName || 'Not provided'}</div>
                  <div><span className="font-medium">Industry:</span> {formData.industry || 'Not provided'}</div>
                  <div><span className="font-medium">Size:</span> {formData.companySize || 'Not provided'}</div>
                  <div><span className="font-medium">Website:</span> {formData.website || 'Not provided'}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {formData.primaryContactName || 'Not provided'}</div>
                  <div><span className="font-medium">Email:</span> {formData.primaryContactEmail || 'Not provided'}</div>
                  <div><span className="font-medium">Phone:</span> {formData.primaryContactPhone || 'Not provided'}</div>
                  <div><span className="font-medium">Role:</span> {formData.primaryContactRole || 'Not provided'}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Compliance & Security
                </h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Frameworks:</span> {formData.complianceFrameworks.length > 0 ? formData.complianceFrameworks.join(', ') : 'None selected'}</div>
                  <div><span className="font-medium">Data Types:</span> {formData.dataTypes.length > 0 ? formData.dataTypes.length + ' selected' : 'None selected'}</div>
                  <div><span className="font-medium">Security Measures:</span> {formData.securityMeasures.length > 0 ? formData.securityMeasures.length + ' selected' : 'None selected'}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Business Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Business Model:</span> {formData.businessModel || 'Not provided'}</div>
                  <div><span className="font-medium">Revenue Range:</span> {formData.annualRevenue || 'Not provided'}</div>
                  <div><span className="font-medium">Communication:</span> {formData.preferredCommunication || 'Email'}</div>
                  <div><span className="font-medium">Timezone:</span> {formData.timezone || 'Not provided'}</div>
                </div>
              </div>
            </div>

            {formData.specialRequirements && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Special Requirements</h3>
                <p className="text-sm text-gray-700">{formData.specialRequirements}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Vendor Onboarding</h1>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-2 mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep ? 'bg-white text-primary' : 'bg-white/20 text-white/60'
                  }`}>
                    {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-1 mx-2 ${
                      index < currentStep ? 'bg-white' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            <div>
              <h2 className="text-lg font-medium">{steps[currentStep].title}</h2>
              <p className="text-white/80 text-sm">{steps[currentStep].description}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Onboarding
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 
