"use client";

import React, { useState, useEffect } from "react";
import { Download, ExternalLink, Lock, Shield, ShieldCheck, User, AlertCircle, ChevronDown, Building2, FileText, Award, CheckCircle2, Clock, AlertTriangle as AlertTriangleIcon } from "lucide-react";
import { ComplianceReportList, ComplianceReport } from "@/components/dashboard/ComplianceReportList";
import Header from "@/components/Header";

const TrustPortalPage = () => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(true);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [evidenceError, setEvidenceError] = useState<string>('');
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
      fetchEvidenceFiles();
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

  const fetchEvidenceFiles = async () => {
    if (!selectedVendorId) return;
    
    setIsLoadingEvidence(true);
    setEvidenceError('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/vendors/${selectedVendorId}/evidence-files`);
      if (!response.ok) {
        if (response.status === 404) {
          // No evidence files found - this is expected for many vendors
          setEvidenceFiles([]);
          return;
        }
        throw new Error('Failed to fetch evidence files');
      }
      
      const data = await response.json();
      setEvidenceFiles(data.evidenceFiles || data || []);
    } catch (err) {
      console.log('Evidence files endpoint not available yet or no files found');
      setEvidenceFiles([]);
      // Don't set error for missing evidence files - it's expected
    } finally {
      setIsLoadingEvidence(false);
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
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        No Compliance Data Available
      </h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        This vendor hasn't completed their compliance questionnaire or uploaded any evidence files yet.
      </p>
      <p className="text-sm text-gray-500 max-w-lg mx-auto">
        Once they begin the compliance process, their reports and documentation will appear here with real-time updates.
      </p>
    </div>
  );

  const VendorSelector = () => (
    <div className="relative mb-8" style={{ zIndex: 1000 }}>
      <label className="block text-sm font-semibold text-gray-800 mb-4">
        <Building2 className="inline h-5 w-5 mr-2 text-primary" />
        Select Vendor to View Compliance Data
      </label>
      
      {isLoadingVendors ? (
        <div className="w-full">
          <div className="flex gap-3">
            <div className="h-12 w-48 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-xl shadow-sm"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-32 bg-gradient-to-r from-gray-50 to-gray-100 animate-pulse rounded-xl"></div>
            ))}
          </div>
        </div>
      ) : vendors.length > 0 ? (
        <div className="w-full">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle Button */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-12 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-3 focus:ring-primary/30 transition-all duration-300 flex items-center gap-3 group transform hover:scale-105"
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">
                  {isDropdownOpen ? 'Hide' : 'Choose'}
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-white transition-all duration-500 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Selected Vendor Card */}
            {selectedVendor && (
              <div className="h-12 px-4 py-2 bg-white border-2 border-primary/20 rounded-xl shadow-md flex items-center gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5"></div>
                <div className="relative w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-sm">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="relative">
                  <div className="font-semibold text-gray-900 text-sm truncate max-w-32">
                    {selectedVendor.name || selectedVendor.companyName}
                  </div>
                </div>
                <div className="relative w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
            
            {/* Animated Vendor Cards - Horizontal */}
            <div className={`flex gap-2 overflow-hidden transition-all duration-500 ease-in-out ${
              isDropdownOpen ? 'max-w-full opacity-100' : 'max-w-0 opacity-0'
            }`}>
              {vendors
                .filter(vendor => vendor.id !== selectedVendorId)
                .map((vendor, index) => (
                <button
                  key={vendor.id}
                  onClick={() => {
                    setSelectedVendorId(vendor.id);
                    setIsDropdownOpen(false);
                  }}
                  className="h-12 px-3 py-2 bg-white border-2 border-gray-200 hover:border-primary/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2 group transform hover:scale-105 flex-shrink-0"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: isDropdownOpen ? 'slideInRight 0.6s ease-out forwards' : 'none'
                  }}
                >
                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-primary/10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <Building2 className="h-4 w-4 text-gray-600 group-hover:text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 text-sm truncate max-w-24">
                      {vendor.name || vendor.companyName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vendor Count Info */}
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} available</span>
            {selectedVendor && (
              <>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Currently viewing: {selectedVendor.name || selectedVendor.companyName}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">No vendors found</div>
              <div className="text-xs text-red-600">Please add vendors to the system first.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Header />
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8 bg-gray-50 min-h-screen">
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
                    className="bg-white text-primary hover:bg-gray-50 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-200 flex items-center hover:scale-105 hover:shadow-lg text-sm md:text-base"
                  >
                    <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    Compliance
                  </a>
                  <a 
                    href="#security" 
                    className="bg-white/20 text-white hover:bg-white/30 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-200 flex items-center hover:scale-105 backdrop-blur-sm text-sm md:text-base"
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
          <VendorSelector />
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {/* Enhanced Compliance Reports Section */}
        <section id="compliance" className="pt-8 animate-fade-in relative" style={{ animationDelay: '500ms', zIndex: 1 }}>
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                  <EmptyState />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
              <div className="text-center py-12 animate-fade-in">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Please select a vendor to view their compliance information.
                </p>
              </div>
            </div>
          )}
        </section>
        
        {/* Evidence Files Section */}
        {selectedVendorId && (
          <section id="evidence" className="pt-8 animate-fade-in relative" style={{ animationDelay: '550ms', zIndex: 1 }}>
            <div className="flex items-center mb-8">
              <div className="p-2 bg-primary/10 rounded-xl mr-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Evidence Files</h2>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200">
              {isLoadingEvidence ? (
                <div className="p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-gray-600">Loading evidence files...</span>
                  </div>
                </div>
              ) : evidenceFiles.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {evidenceFiles.map((file, index) => (
                    <div key={file.id || index} className="p-6 hover:bg-blue-50/30 transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{file.name || file.filename}</h3>
                          <p className="text-gray-600 text-sm mb-3">{file.description || 'Evidence file submitted by vendor'}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(file.uploadedAt || file.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                            {file.fileSize && (
                              <span className="flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                {file.fileSize}
                              </span>
                            )}
                            {file.fileType && (
                              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                {file.fileType}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {file.downloadUrl && (
                            <a
                              href={file.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
                              title="Download file"
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          )}
                          {file.viewUrl && (
                            <a
                              href={file.viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
                              title="View file"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Evidence Files</h3>
                  <p className="text-gray-600">
                    No evidence files submitted by {selectedVendor?.name || selectedVendor?.companyName || 'this vendor'} yet.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
        
        {/* Enhanced Security Practices Section */}
        <section id="security" className="pt-12 pb-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center mb-8">
            <div className="p-2 bg-primary/10 rounded-xl mr-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Security Practices</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="p-6 md:p-8 hover:bg-blue-50/30 transition-colors duration-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Data Encryption</h3>
                <p className="text-gray-600 mb-4 text-sm md:text-base">
                  We implement industry-standard encryption protocols to protect your sensitive data in transit and at rest.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">TLS 1.2+ for all data in transit</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">AES-256 encryption for data at rest</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">Secure key management practices</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-6 md:p-8 hover:bg-blue-50/30 transition-colors duration-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Access Controls</h3>
                <p className="text-gray-600 mb-4 text-sm md:text-base">
                  We employ strict access controls to ensure only authorized personnel can access sensitive systems and data.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">Role-based access control (RBAC)</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">Multi-factor authentication (MFA)</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">Least privilege principle</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-t border-gray-200">
              <div className="p-6 md:p-8 hover:bg-blue-50/30 transition-colors duration-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Infrastructure Security</h3>
                <p className="text-gray-600 mb-4 text-sm md:text-base">
                  Our infrastructure is designed with multiple layers of security to protect against threats.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">DDoS protection</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">Web Application Firewall (WAF)</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">Network segregation</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-6 md:p-8 hover:bg-blue-50/30 transition-colors duration-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Monitoring & Incident Response</h3>
                <p className="text-gray-600 mb-4 text-sm md:text-base">
                  We continuously monitor our systems and have robust procedures for responding to security incidents.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">24/7 security monitoring</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">Incident response team</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm md:text-base">Regular security testing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>{`
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
        
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes slideInRight {
          from { 
            opacity: 0; 
            transform: translateX(-20px) scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
          }
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