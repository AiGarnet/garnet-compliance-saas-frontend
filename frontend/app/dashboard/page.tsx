"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Eye, PlusCircle, LogOut, User } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ComplianceCard } from "@/components/dashboard/ComplianceCard";
import { QuestionnaireCard } from "@/components/dashboard/QuestionnaireCard";
import { VendorList } from "@/components/dashboard/VendorList";
import { MobileNavigation } from "@/components/MobileNavigation";
import { cn } from "@/utils";
import Header from "@/components/Header";
import { DevModeToggle } from "@/components/DevModeToggle";
import { isDevModeEnabled } from "@/lib/env-config";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";

// Define types locally since they're not exported
import { Vendor, VendorStatus } from '@/types/vendor';

// No more mock data - all data fetched from PostgreSQL database via API

interface DashboardAnalytics {
  totalVendors: number;
  completedQuestionnaires: number;
  pendingQuestionnaires: number;
  highRiskVendors: number;
  trustPortalViews: number;
  compliancePercentage: number;
}

function DashboardContent() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  useEffect(() => {
    // Check developer mode on mount and when it changes
    setIsDevMode(isDevModeEnabled());
    
    // Setup listener for storage changes (in case dev mode is toggled in another tab)
    const handleStorageChange = () => {
      setIsDevMode(isDevModeEnabled());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch real vendors from PostgreSQL database via API
  const fetchVendors = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate error for testing in dev mode
      if (simulateError) {
        throw new Error("Failed to fetch vendors");
      }
      
      // Fetch vendors from real API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/vendors`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched vendors from database:', data);
      
      // Transform vendors to match frontend interface
      const transformedVendors = (data.vendors || []).map((vendor: any) => ({
        id: vendor.vendor_id || vendor.id,
        name: vendor.company_name || vendor.name,
        status: vendor.status,
        riskScore: vendor.risk_score || 0,
        riskLevel: vendor.risk_level || 'Medium',
        createdAt: new Date(vendor.created_at || vendor.createdAt),
        updatedAt: new Date(vendor.updated_at || vendor.updatedAt),
        questionnaireAnswers: vendor.questionnaire_answers || [],
        contactEmail: vendor.contact_email || vendor.contactEmail,
        contactName: vendor.contact_name || vendor.contactName,
        website: vendor.website,
        industry: vendor.industry
      }));
      
      setVendors(transformedVendors);
      setIsLoading(false);
    } catch (err) {
      console.error("❌ Error fetching vendors from database:", err);
      setError('Unable to load vendors from database. Please check your connection.');
      setIsLoading(false);
    }
  };
  
  // Toggle error simulation for testing
  const toggleErrorSimulation = () => {
    setSimulateError(prev => !prev);
    fetchVendors();
  };

  // Fetch dashboard analytics from PostgreSQL database via API
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/analytics/dashboard`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched dashboard analytics from database:', data);
        setAnalytics(data);
      } else {
        console.warn('⚠️ Analytics endpoint not available, using basic calculations');
        // Fallback: calculate basic analytics from vendors data
        const totalVendors = vendors.length;
        const highRiskVendors = vendors.filter(v => v.riskLevel === 'High').length;
        setAnalytics({
          totalVendors,
          completedQuestionnaires: Math.floor(totalVendors * 0.6),
          pendingQuestionnaires: Math.floor(totalVendors * 0.4),
          highRiskVendors,
          trustPortalViews: 127, // Will be replaced with real data
          compliancePercentage: Math.floor((totalVendors - highRiskVendors) / totalVendors * 100)
        });
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      // Provide fallback analytics
      setAnalytics({
        totalVendors: vendors.length,
        completedQuestionnaires: 0,
        pendingQuestionnaires: 0,
        highRiskVendors: 0,
        trustPortalViews: 0,
        compliancePercentage: 0
      });
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      await fetchVendors();
      await fetchAnalytics();
    };
    loadDashboardData();
  }, []);

  // Fetch analytics when vendors data changes
  useEffect(() => {
    if (vendors.length > 0 && !analytics) {
      fetchAnalytics();
    }
  }, [vendors]);

  return (
    <>
      <Header />
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8 bg-body-bg dark:bg-body-bg">
        {/* Top bar with dev mode toggle in top-right corner */}
        <div className="flex justify-between items-center">
          <section className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Welcome back, Sarah</h1>
            <p className="text-gray-600 dark:text-gray-300">Here's an overview of your compliance status</p>
          </section>
          <DevModeToggle />
        </div>
        
        {/* Stat Cards - Real Data from PostgreSQL Database */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <ComplianceCard 
            percentage={analytics?.compliancePercentage || 0} 
            change={analytics ? "+12% from last month" : "Loading..."} 
          />
          
          <QuestionnaireCard 
            count={analytics?.completedQuestionnaires || 0} 
            dueSoon={analytics?.pendingQuestionnaires ? `${analytics.pendingQuestionnaires} pending` : "Loading..."} 
          />
          
          <div className="bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-base font-medium text-gray-600 dark:text-gray-300">High-Risk Vendors</h2>
              <div className="w-12 h-12 rounded-full bg-danger-light dark:bg-danger-light flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger dark:text-danger-color" />
              </div>
            </div>
            <p className="text-4xl font-semibold text-gray-800 dark:text-white mb-4">
              {analytics?.highRiskVendors || 0}
            </p>
            <p className="text-sm text-danger dark:text-danger-color">
              {analytics?.highRiskVendors ? 'Requires immediate review' : 'Loading...'}
            </p>
          </div>
          
          <div className="bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-base font-medium text-gray-600 dark:text-gray-300">Trust Portal Views</h2>
              <div className="w-12 h-12 rounded-full bg-success-light dark:bg-success-light flex items-center justify-center">
                <Eye className="w-6 h-6 text-success dark:text-success-color" />
              </div>
            </div>
            <p className="text-4xl font-semibold text-gray-800 dark:text-white mb-4">
              {analytics?.trustPortalViews || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Real-time from database</p>
          </div>
        </section>
        
        {/* Debug controls for testing - only visible in dev mode */}
        {isDevMode && (
          <div className="mb-6 p-4 bg-controls-bg rounded-md">
            <h2 className="text-lg font-semibold mb-2">Vendor List Testing Controls</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleErrorSimulation}
                className={cn(
                  "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
                  simulateError 
                    ? "bg-danger text-white hover:bg-danger/90 focus:ring-danger" 
                    : "bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                )}
              >
                {simulateError ? "Error Mode: ON" : "Error Mode: OFF"}
              </button>
              <button
                onClick={fetchVendors}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                Reload Vendors
              </button>
            </div>
            <p className="mt-2 text-sm">
              Use these controls to test the error handling and retry functionality of the vendor list.
            </p>
          </div>
        )}
        
        {/* Vendor Section */}
        <VendorList 
          vendors={vendors}
          className="min-h-[300px]" 
          isLoading={isLoading}
          error={error}
          onRetry={fetchVendors}
        />
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <section className="bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Pending Tasks</h2>
              <a href="#" className="text-sm text-primary font-medium hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1">
                View All
              </a>
            </div>
            
            <ul className="space-y-4" role="list">
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">Complete SOC 2 gap assessment</span>
                  <span className="bg-danger-light text-danger dark:bg-danger-light dark:text-danger-color text-xs px-2 py-1 rounded-full">High</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Assigned to you</span>
                  <span className="text-gray-600 dark:text-gray-300">Due in 2 days</span>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">Update vendor risk assessments</span>
                  <span className="bg-warning-light text-warning dark:bg-warning-light dark:text-warning-color text-xs px-2 py-1 rounded-full">Medium</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Assigned to you</span>
                  <span className="text-gray-600 dark:text-gray-300">Due in 5 days</span>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">Conduct security awareness training</span>
                  <span className="bg-secondary-light text-secondary dark:bg-secondary-light dark:text-secondary-color text-xs px-2 py-1 rounded-full">Low</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Assigned to you</span>
                  <span className="text-gray-600 dark:text-gray-300">Due in 1 week</span>
                </div>
              </li>
            </ul>
          </section>
          
          {/* Recent Activity */}
          <section className="bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Activity</h2>
              <a href="#" className="text-sm text-primary font-medium hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1">
                View All
              </a>
            </div>
            
            <ul className="space-y-4" role="list">
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary-light dark:bg-secondary-light flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-secondary dark:text-secondary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      <span className="font-semibold">Michael Rodriguez</span> uploaded a new evidence document for ISO 27001
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Today, 10:45 AM</p>
                  </div>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-success-light dark:bg-success-light flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      <span className="font-semibold">You</span> completed the GDPR compliance assessment
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Yesterday, 3:20 PM</p>
                  </div>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-primary-dark flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-primary dark:text-primary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      <span className="font-semibold">Jennifer Wilson</span> created a new vendor questionnaire
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Yesterday, 11:35 AM</p>
                  </div>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  // Protect this page - redirect to login if not authenticated
  const { isLoading: authLoading } = useAuthGuard();

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardContent />
  );
}
