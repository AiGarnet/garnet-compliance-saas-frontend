"use client";

import React, { useState, useEffect } from "react";
import { Download, ExternalLink, Lock, Shield, ShieldCheck, User, AlertCircle, ChevronDown, Building2, FileText, Award, CheckCircle2, Clock, AlertTriangle as AlertTriangleIcon } from "lucide-react";
import { ComplianceReportList, ComplianceReport } from "@/components/dashboard/ComplianceReportList";
import Header from "@/components/Header";

const TrustPortalPage = () => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [vendors, setVendors] = useState<{ id: string; name: string; companyName?: string }[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Railway backend URL
  const BACKEND_URL = 'https://garnet-compliance-saas-production.up.railway.app';

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchReports();
    }
  }, [selectedVendorId]);

  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    setError('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/vendors`);
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      
      // Transform the data to match our interface
      const vendorsArray = data.vendors || data;
      const transformedVendors = vendorsArray.map((vendor: any) => ({
        id: vendor.id || vendor.vendorId?.toString() || vendor.uuid,
        name: vendor.name || vendor.companyName || vendor.company_name,
        companyName: vendor.companyName || vendor.company_name || vendor.name
      }));
      
      setVendors(transformedVendors);
      if (transformedVendors.length > 0) {
        setSelectedVendorId(transformedVendors[0].id);
      }
    } catch (err) {
      setError('Failed to load vendors from backend');
      console.error('Error fetching vendors:', err);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const fetchReports = async () => {
    if (!selectedVendorId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // First try to get trust portal items (if implemented)
      let trustPortalItems = [];
      try {
        const trustPortalResponse = await fetch(`${BACKEND_URL}/api/trust-portal/items?vendorId=${selectedVendorId}`);
        if (trustPortalResponse.ok) {
          trustPortalItems = await trustPortalResponse.json();
        }
      } catch (trustPortalError) {
        console.log('Trust portal endpoint not available yet, will show questionnaire data');
      }

      // Get vendor details including questionnaire answers
      const vendorResponse = await fetch(`${BACKEND_URL}/api/vendors/${selectedVendorId}`);
      if (!vendorResponse.ok) throw new Error('Failed to fetch vendor details');
      const vendorData = await vendorResponse.json();
      
      // Handle both direct response and nested vendor object
      const vendor = vendorData.vendor || vendorData;

      // Transform questionnaire answers to compliance reports format
      const questionnaireReports = (vendor.questionnaireAnswers || []).map((qa: any, index: number) => ({
        id: `qa-${index}`,
        name: qa.question,
        date: new Date(qa.createdAt || Date.now()).toLocaleDateString(),
        description: qa.answer,
        fileSize: "N/A",
        fileType: "Questionnaire Answer",
        category: "Questionnaire" as const
      }));

      // Transform trust portal items to compliance reports format
      const trustPortalReports = trustPortalItems.map((item: any) => ({
        id: item.id.toString(),
        name: item.title,
        date: new Date(item.createdAt).toLocaleDateString(),
        description: item.description || '',
        fileSize: item.fileSize || "N/A",
        fileType: item.fileType || "Document",
        category: item.category as any
      }));

      const allReports = [...questionnaireReports, ...trustPortalReports];
      setReports(allReports);
    } catch (err) {
      setError('Failed to load vendor data');
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  const EmptyState = () => (
    <div className="text-center py-12 lg:py-16 animate-fade-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-10 w-10 text-gray-400" />
        </div>
        <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 animate-pulse"></div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
        No Compliance Data Available
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
        This vendor hasn't completed their compliance questionnaire or uploaded any evidence files yet.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 max-w-lg mx-auto">
        Once they begin the compliance process, their reports and documentation will appear here with real-time updates.
      </p>
    </div>
  );

  const CustomDropdown = () => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        <Building2 className="inline h-4 w-4 mr-2" />
        Select Vendor
      </label>
      
      {isLoadingVendors ? (
        <div className="w-full max-w-sm h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse rounded-xl"></div>
      ) : vendors.length > 0 ? (
        <div className="relative w-full max-w-sm">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-12 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:focus:border-primary transition-all duration-200 flex items-center justify-between group"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            role="combobox"
          >
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-gray-900 dark:text-white font-medium truncate">
                {selectedVendor ? (selectedVendor.name || selectedVendor.companyName) : 'Select a vendor'}
              </span>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
                aria-hidden="true"
              ></div>
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto animate-slide-down"
                role="listbox"
                aria-label="Vendor selection"
              >
                {vendors.map((vendor, index) => (
                  <button
                    key={vendor.id}
                    onClick={() => {
                      setSelectedVendorId(vendor.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center group ${
                      selectedVendorId === vendor.id ? 'bg-primary/5 dark:bg-primary/10 border-r-2 border-primary' : ''
                    } ${index === 0 ? 'rounded-t-xl' : ''} ${index === vendors.length - 1 ? 'rounded-b-xl' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    role="option"
                    aria-selected={selectedVendorId === vendor.id}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-200 flex-shrink-0 ${
                      selectedVendorId === vendor.id 
                        ? 'bg-gradient-to-r from-primary to-secondary text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-primary/20'
                    }`}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {vendor.name || vendor.companyName}
                      </div>
                      {vendor.companyName && vendor.name !== vendor.companyName && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {vendor.companyName}
                        </div>
                      )}
                    </div>
                    {selectedVendorId === vendor.id && (
                      <div className="ml-auto flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="w-full max-w-sm p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">No vendors found. Please add vendors to the system first.</span>
          </div>
        </div>
      )}
    </div>
  );

  const ComplianceStats = () => {
    const stats = [
      { label: 'Total Reports', value: reports.length, icon: FileText, color: 'blue' },
      { label: 'Certifications', value: reports.filter(r => r.category === 'Certification').length, icon: Award, color: 'green' },
      { label: 'Policies', value: reports.filter(r => r.category === 'Policy').length, icon: Shield, color: 'purple' },
      { label: 'Last Updated', value: reports.length > 0 ? 'Today' : 'N/A', icon: Clock, color: 'orange' }
    ];

    if (reports.length === 0) return null;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={stat.label}
            className="bg-white dark:bg-card-bg rounded-xl p-4 border border-gray-200 dark:border-card-border hover:shadow-md transition-shadow duration-200 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header />
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8 bg-body-bg dark:bg-body-bg min-h-screen">
        {/* Enhanced Hero Section */}
        <section className="bg-gradient-to-r from-primary/90 to-secondary/90 text-white rounded-2xl p-6 md:p-12 relative overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse"></div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-4xl font-bold mb-4 flex items-center animate-slide-up">
                  <div className="mr-4 p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Shield className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  Trust Center
                </h1>
                <p className="text-base md:text-xl opacity-90 mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  Your transparency hub for security, compliance, and data privacy information.
                </p>
                <p className="opacity-80 mb-6 max-w-2xl text-sm md:text-base animate-slide-up" style={{ animationDelay: '200ms' }}>
                  We're committed to being transparent about our security and compliance practices. 
                  Here you'll find our latest compliance reports, security documentation, and policies.
                </p>
                
                <div className="flex flex-wrap gap-3 mt-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
                  <a 
                    href="#compliance" 
                    className="bg-white dark:bg-gray-800 text-primary hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-200 flex items-center hover:scale-105 hover:shadow-lg text-sm md:text-base"
                  >
                    <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    Compliance
                  </a>
                  <a 
                    href="#security" 
                    className="bg-white/20 text-white hover:bg-white/30 dark:hover:bg-gray-700/40 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-200 flex items-center hover:scale-105 backdrop-blur-sm text-sm md:text-base"
                  >
                    <Lock className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    Security
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Vendor Selection */}
        <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CustomDropdown />
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-shake">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Compliance Stats */}
        {selectedVendorId && <ComplianceStats />}
        
        {/* Enhanced Compliance Reports Section */}
        <section id="compliance" className="pt-8 animate-fade-in" style={{ animationDelay: '500ms' }}>
          {selectedVendorId ? (
            <div className="transition-all duration-300 ease-in-out">
              {reports.length > 0 || isLoading ? (
                <div className="animate-slide-up">
                  <ComplianceReportList
                    reports={reports}
                    isLoading={isLoading}
                    error={error}
                    onRetry={fetchReports}
                  />
                </div>
              ) : (
                <div className="bg-white dark:bg-card-bg rounded-2xl shadow-sm border border-gray-200 dark:border-card-border p-6 md:p-8 hover:shadow-md transition-shadow duration-200">
                  <EmptyState />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-card-bg rounded-2xl shadow-sm border border-gray-200 dark:border-card-border p-6 md:p-8 hover:shadow-md transition-shadow duration-200">
              <div className="text-center py-12 animate-fade-in">
                <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Please select a vendor to view their compliance information.
                </p>
              </div>
            </div>
          )}
        </section>
        
        {/* Enhanced Security Practices Section */}
        <section id="security" className="pt-12 pb-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center mb-8">
            <div className="p-2 bg-primary/10 rounded-xl mr-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Security Practices</h2>
          </div>
          
          <div className="bg-white dark:bg-card-bg rounded-2xl shadow-sm border border-gray-200 dark:border-card-border overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
              <div className="p-6 md:p-8 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-4">Data Encryption</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm md:text-base">
                  We implement industry-standard encryption protocols to protect your sensitive data in transit and at rest.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">TLS 1.2+ for all data in transit</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">AES-256 encryption for data at rest</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Secure key management practices</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-6 md:p-8 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-4">Access Controls</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm md:text-base">
                  We employ strict access controls to ensure only authorized personnel can access sensitive systems and data.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Role-based access control (RBAC)</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Multi-factor authentication (MFA)</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Least privilege principle</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
              <div className="p-6 md:p-8 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-4">Infrastructure Security</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm md:text-base">
                  Our infrastructure is designed with multiple layers of security to protect against threats.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">DDoS protection</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Web Application Firewall (WAF)</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Network segregation</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-6 md:p-8 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-4">Monitoring & Incident Response</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm md:text-base">
                  We continuously monitor our systems and have robust procedures for responding to security incidents.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">24/7 security monitoring</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Incident response team</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-success/10 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Regular security testing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slide-down {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default TrustPortalPage; 