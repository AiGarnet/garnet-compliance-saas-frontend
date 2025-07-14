"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, BarChart3, Users, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  limits: {
    questionnaires: number | 'unlimited';
    vendors: number | 'unlimited';
    users: number | 'unlimited';
    storage: string;
    frameworks: string[];
    dataRetention: string;
    support: string;
  };
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
      'In-memory processing only',
    ],
    limits: {
      questionnaires: 2,
      vendors: 1,
      users: 1,
      storage: '0GB',
      frameworks: ['GDPR'],
      dataRetention: '7 days',
      support: 'Community (knowledge base)',
    },
    stripePriceIds: {
      monthly: 'prod_Sfp1VRqDGvVRx7',
      annual: 'prod_Sfp1ZWsl26QR25',
    },
  },
  {
    id: 'growth',
    name: 'Growth (Startup)',
    description: 'For early-stage startups needing regular compliance automation',
    price: {
      monthly: 49,
      annual: 490,
    },
    features: [
      'Everything in Starter',
      'Unlimited AI-generated questionnaires (up to 100 questions each)',
      'Support for up to 3 compliance frameworks',
      'Enhanced Trust Portal customization (logo + two documents)',
      'Email support with 48-hour SLA',
      'Exportable audit logs',
      'Basic analytics dashboard',
    ],
    limits: {
      questionnaires: 'unlimited',
      vendors: 'unlimited',
      users: 3,
      storage: '5GB',
      frameworks: ['GDPR', 'PDPA', 'SOC 2'],
      dataRetention: '30 days',
      support: 'Email (48h SLA)',
    },
    popular: true,
    stripePriceIds: {
      monthly: 'prod_Sfp2fcOpPyqK0Z',
      annual: 'prod_Sfp2zDuOd8J0nV',
    },
  },
  {
    id: 'scale',
    name: 'Scale (SMB)',
    description: 'For small to mid-sized businesses with ongoing compliance demands',
    price: {
      monthly: 199,
      annual: 1990,
    },
    features: [
      'Everything in Growth',
      'Advanced context-aware AI suggestions',
      'Up to 10 compliance frameworks (AML, OFAC, FCPA, ISO 27001)',
      'Full Trust Portal: unlimited documents + custom subdomain',
      'Priority email support and live chat',
      'Advanced audit reports (PDF/CSV)',
      'Role-based access control (up to 5 sales professionals)',
      'Scheduled compliance reminders and expiry alerts',
    ],
    limits: {
      questionnaires: 'unlimited',
      vendors: 'unlimited',
      users: 6,
      storage: '50GB',
      frameworks: ['GDPR', 'PDPA', 'SOC 2', 'AML', 'OFAC', 'FCPA', 'ISO 27001', 'HIPAA', 'PCI DSS', 'Custom'],
      dataRetention: '1 year',
      support: 'Priority email + live chat',
    },
    stripePriceIds: {
      monthly: 'prod_Sfp3u5vmjT85eF',
      annual: 'prod_Sfp3XUakNwtOnM',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise (Mid-Size)',
    description: 'For established companies with complex, multi-jurisdictional compliance needs',
    price: {
      monthly: 499,
      annual: 4990,
    },
    features: [
      'Everything in Scale',
      'Unlimited frameworks and user seats',
      'SLA-backed 24×7 support and dedicated account manager',
      'API access for integrations (SSO, ERP, HRIS)',
      'Advanced webhooks',
      'Quarterly compliance reviews and feature workshops',
      'Optional add-ons: automated sanctions/PEP screening',
      'AI fine-tuning',
      'Custom integrations',
    ],
    limits: {
      questionnaires: 'unlimited',
      vendors: 'unlimited',
      users: 'unlimited',
      storage: 'Unlimited',
      frameworks: ['All frameworks', 'Custom frameworks'],
      dataRetention: 'Unlimited',
      support: '24×7 dedicated support + account manager',
    },
    stripePriceIds: {
      monthly: 'prod_Sfp4M6qs4B0onm',
      annual: 'prod_Sfp5HIpH9J8esc',
    },
  },
];

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSelectPlan = async (tier: PricingTier) => {
    if (tier.id === 'starter') {
      // Free tier - redirect to signup or dashboard
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/auth/signup');
      }
      return;
    }

    if (tier.id === 'enterprise') {
      // Enterprise tier - redirect to contact
      router.push('/contact');
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login with redirect back to pricing
      router.push(`/auth/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    setIsLoading(true);

    try {
      // Get the price ID based on billing cycle
      const priceId = billingCycle === 'monthly' 
        ? tier.stripePriceIds?.monthly 
        : tier.stripePriceIds?.annual;

      if (!priceId) {
        throw new Error('Price ID not found');
      }

      // Create checkout session
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          priceId,
          billingCycle,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.data.url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnnualSavings = (monthlyPrice: number): number => {
    const annualPrice = monthlyPrice * 12;
    const discountedAnnualPrice = annualPrice * 0.83; // 17% discount
    return Math.round(annualPrice - discountedAnnualPrice);
  };

  const formatPrice = (price: number): string => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Zap className="h-8 w-8 text-blue-600" />;
      case 'growth':
        return <Shield className="h-8 w-8 text-purple-600" />;
      case 'scale':
        return <BarChart3 className="h-8 w-8 text-pink-600" />;
      case 'enterprise':
        return <Users className="h-8 w-8 text-indigo-600" />;
      default:
        return <Zap className="h-8 w-8 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Choose Your <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Plan</span>
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Scale your compliance operations with AI-powered automation. Start free and upgrade as you grow.
          </motion.p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <motion.div 
            className="bg-white rounded-full p-1 shadow-lg border border-gray-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 relative ${
                  billingCycle === 'annual'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRICING_TIERS.map((tier, index) => (
            <motion.div
              key={tier.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                tier.popular 
                  ? 'border-purple-500 ring-4 ring-purple-500/20 scale-105' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Icon & Name */}
                <div className="flex items-center mb-4">
                  {getPlanIcon(tier.id)}
                  <h3 className="text-2xl font-bold text-gray-900 ml-3">{tier.name}</h3>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(tier.price[billingCycle])}
                    </span>
                    {tier.price[billingCycle] > 0 && (
                      <span className="text-gray-500 ml-2">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                  {billingCycle === 'annual' && tier.price.monthly > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Save ${calculateAnnualSavings(tier.price.monthly)} per year
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Plan Limits</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Questionnaires: {tier.limits.questionnaires}</div>
                    <div>Vendors: {tier.limits.vendors}</div>
                    <div>Users: {tier.limits.users}</div>
                    <div>Storage: {tier.limits.storage}</div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(tier)}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                    tier.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                      : tier.id === 'starter'
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                      : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <>
                      {tier.id === 'starter' && 'Get Started Free'}
                      {tier.id === 'growth' && 'Start Growth Plan'}
                      {tier.id === 'scale' && 'Start Scale Plan'}
                      {tier.id === 'enterprise' && 'Contact Sales'}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan later?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards through Stripe's secure payment processing.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">Yes! Our Starter plan is completely free and includes basic features to get you started.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 