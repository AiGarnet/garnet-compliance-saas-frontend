"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, User, Lock, Mail, Building, Users, Info, CreditCard, Check } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { auth } from "../../../lib/api";
import { ROLES, ROLE_DISPLAY_NAMES, isValidRole } from "@/lib/auth/roles";
interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  popular?: boolean;
  stripePriceIds?: {
    monthly?: string;
    annual?: string;
  };
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals and solopreneurs getting started',
    price: {
      monthly: 1,
      annual: 10,
    },
    features: [
      'AI-assisted questionnaire answering',
      'Up to 2 questionnaires per month',
      'Single compliance framework checklist (GDPR)',
      'Basic Trust Portal with one document upload',
      'Community support via knowledge base',
    ],
    stripePriceIds: {
      monthly: 'prod_Sfp1VRqDGvVRx7',
      annual: 'prod_Sfp1ZWsl26QR25',
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For early-stage startups needing regular compliance automation',
    price: {
      monthly: 49,
      annual: 490,
    },
    features: [
      'Everything in Starter',
      'Unlimited AI-generated questionnaires',
      'Support for up to 3 compliance frameworks',
      'Enhanced Trust Portal customization',
      'Email support with 48-hour SLA',
      'Exportable audit logs',
    ],
    popular: true,
    stripePriceIds: {
      monthly: 'prod_Sfp2fcOpPyqK0Z',
      annual: 'prod_Sfp2zDuOd8J0nV',
    },
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'For growing companies with advanced compliance needs',
    price: {
      monthly: 149,
      annual: 1490,
    },
    features: [
      'Everything in Growth',
      'Advanced AI capabilities with custom training',
      'Support for all compliance frameworks',
      'Custom integrations and API access',
      'Priority support with 24-hour SLA',
      'Advanced analytics and reporting',
    ],
    stripePriceIds: {
      monthly: 'prod_Sfp3abc123',
      annual: 'prod_Sfp3def456',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: {
      monthly: 0,
      annual: 0,
    },
    features: [
      'Everything in Scale',
      'Custom deployment options',
      'Dedicated account manager',
      'On-premise or private cloud',
      'Custom SLA and support terms',
      'Advanced security and compliance features',
    ],
  },
];

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    role: "",
    organization: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = searchParams?.get('redirect') || null;
  const selectedPlanId = searchParams?.get('plan') || null;
  const selectedBilling = (searchParams?.get('billing') as 'monthly' | 'annual') || 'monthly';
  const paymentCanceled = searchParams?.get('canceled') === 'true';
  
  // Find the selected plan
  const selectedPlan = selectedPlanId ? PRICING_TIERS.find(tier => tier.id === selectedPlanId) : null;

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.full_name || !formData.role) {
      setError("Please fill in all required fields");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Ensure only valid roles are allowed
    if (!isValidRole(formData.role)) {
      setError("Please select a valid role");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // First, create the user account
      const data = await auth.signup({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        organization: formData.organization || null,
      });

      // Login to get the auth token for payment processing
      await login(formData.email, formData.password);

      // If any plan is selected (except enterprise), proceed to payment
      if (selectedPlan && selectedPlan.id !== 'enterprise') {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          throw new Error('Authentication failed');
        }

        // Get the price ID based on billing cycle
        const priceId = selectedBilling === 'monthly' 
          ? selectedPlan.stripePriceIds?.monthly 
          : selectedPlan.stripePriceIds?.annual;

        if (!priceId) {
          throw new Error('Price ID not found for selected plan');
        }

        // Create checkout session
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/billing/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            priceId,
            billingCycle: selectedBilling,
            successUrl: `${window.location.origin}/dashboard?success=true&plan=${selectedPlan.id}`,
            cancelUrl: `${window.location.origin}/auth/signup?plan=${selectedPlan.id}&billing=${selectedBilling}&canceled=true`,
          }),
        });

        const checkoutData = await response.json();

        if (!response.ok) {
          throw new Error(checkoutData.message || 'Failed to create checkout session');
        }

        // Redirect to Stripe checkout
        window.location.href = checkoutData.data.url;
      } else if (selectedPlan && selectedPlan.id === 'enterprise') {
        // For enterprise plans, redirect to contact page
        router.push('/contact?plan=enterprise');
      } else {
        // If no plan is selected, redirect to pricing page to select a plan
        router.push('/pricing?signup=true&message=Please select a subscription plan to continue');
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading if auth is still initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href={`/auth/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Selected Plan Display */}
        {selectedPlan && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start">
              <CreditCard className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-purple-800">
                  Selected Plan: {selectedPlan.name}
                  {selectedPlan.popular && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Most Popular
                    </span>
                  )}
                </h3>
                <p className="text-sm text-purple-700 mt-1">
                  {selectedPlan.description}
                </p>
                <div className="mt-2">
                  <span className="text-lg font-bold text-purple-900">
                    {selectedPlan.price[selectedBilling] === 0 
                      ? 'Custom Pricing' 
                      : `$${selectedPlan.price[selectedBilling]}${selectedBilling === 'monthly' ? '/month' : '/year'}`
                    }
                  </span>
                  {selectedBilling === 'annual' && selectedPlan.price.monthly > 0 && (
                    <span className="ml-2 text-sm text-green-600 font-medium">
                      Save ${Math.round((selectedPlan.price.monthly * 12 - selectedPlan.price.annual))}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-xs text-purple-600 font-medium mb-1">Included features:</p>
                  <ul className="text-xs text-purple-700 space-y-1">
                    {selectedPlan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-1" />
                        {feature}
                      </li>
                    ))}
                    {selectedPlan.features.length > 3 && (
                      <li className="text-purple-600">
                        ...and {selectedPlan.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Redirect Message */}
        {redirectTo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Account required
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Create an account to access{" "}
                  <span className="font-medium">{decodeURIComponent(redirectTo)}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white shadow-xl rounded-lg p-8 space-y-6">
            {/* Payment Canceled Message */}
            {paymentCanceled && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <p className="text-sm text-orange-600">
                  Payment was canceled. You can create your account and set up payment later, or try again.
                </p>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Full Name Field */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                >
                  <option value="">Select your role</option>
                  <option value={ROLES.SALES_PROFESSIONAL}>{ROLE_DISPLAY_NAMES[ROLES.SALES_PROFESSIONAL]}</option>
                  <option value={ROLES.FOUNDER}>{ROLE_DISPLAY_NAMES[ROLES.FOUNDER]}</option>
                </select>
              </div>
            </div>

            {/* Organization Field */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                Organization
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  placeholder="Enter your organization name"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Team members with the same organization name will be automatically linked together
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {selectedPlan && selectedPlan.id !== 'starter' && selectedPlan.id !== 'enterprise' 
                    ? 'Creating account & setting up payment...' 
                    : 'Creating account...'
                  }
                </div>
              ) : (
                <>
                  {selectedPlan && selectedPlan.id !== 'starter' && selectedPlan.id !== 'enterprise' 
                    ? `Create account & pay $${selectedPlan.price[selectedBilling]}` 
                    : 'Create account'
                  }
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:text-primary/80">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:text-primary/80">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 