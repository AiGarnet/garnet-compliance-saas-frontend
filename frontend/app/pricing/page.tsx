"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Shield, BarChart3, Users, Star, ArrowRight, ChevronDown, ChevronUp, MessageCircle, Crown, Rocket, Building2 } from 'lucide-react';
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
  recommended?: boolean;
  stripePriceIds?: {
    monthly?: string;
    annual?: string;
  };
  color: string;
  icon: React.ReactNode;
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
      'Basic dashboard analytics',
      'Email notifications'
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
    color: 'from-blue-500 to-blue-600',
    icon: <Rocket className="h-6 w-6" />
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
      'Unlimited AI-generated questionnaires (up to 100 questions each)',
      'Support for up to 3 compliance frameworks',
      'Enhanced Trust Portal customization (logo + two documents)',
      'Email support with 48-hour SLA',
      'Exportable audit logs',
      'Basic analytics dashboard',
      'Custom branding options',
      'Advanced reporting tools',
      'Priority processing'
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
    color: 'from-purple-500 to-purple-600',
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: 'scale',
    name: 'Scale',
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
      'API integrations',
      'Advanced analytics and insights',
      'Bulk operations support',
      'Custom workflows'
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
    recommended: true,
    stripePriceIds: {
      monthly: 'prod_Sfp3u5vmjT85eF',
      annual: 'prod_Sfp3XUakNwtOnM',
    },
    color: 'from-green-500 to-green-600',
    icon: <BarChart3 className="h-6 w-6" />
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
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
      'White-label solutions',
      'Advanced security features',
      'Dedicated infrastructure',
      'Custom SLA agreements',
      'On-premise deployment options'
    ],
    limits: {
      questionnaires: 'unlimited',
      vendors: 'unlimited',
      users: 'unlimited',
      storage: 'unlimited',
      frameworks: ['All frameworks + custom'],
      dataRetention: 'unlimited',
      support: '24/7 dedicated support',
    },
    stripePriceIds: {
      monthly: 'prod_Sfp4gH7tLmN9aP',
      annual: 'prod_Sfp4VWxYnOaQ8R',
    },
    color: 'from-amber-500 to-amber-600',
    icon: <Crown className="h-6 w-6" />
  },
];

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSelectPlan = async (tier: PricingTier) => {
    if (tier.id === 'enterprise') {
      // Enterprise tier - redirect to contact
      router.push('/contact?plan=enterprise');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          priceId,
          billingCycle,
          successUrl: `${window.location.origin}/dashboard?success=true&plan=${tier.id}`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.data.url;
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      alert(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toLocaleString()}`;
  };

  const calculateAnnualSavings = (monthlyPrice: number) => {
    const annualEquivalent = monthlyPrice * 12;
    const actualAnnual = PRICING_TIERS.find(t => t.price.monthly === monthlyPrice)?.price.annual || 0;
    return annualEquivalent - actualAnnual;
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const isCardExpanded = (cardId: string) => expandedCards.includes(cardId);

  const getVisibleFeatures = (features: string[], isExpanded: boolean) => {
    return isExpanded ? features : features.slice(0, 4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-20">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Choose Your <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Plan</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Scale your compliance automation with plans designed for every stage of your business journey
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white rounded-full p-1 shadow-lg border">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PRICING_TIERS.map((tier, index) => (
            <motion.div
              key={tier.id}
              className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                tier.popular || tier.recommended
                  ? 'border-purple-500 ring-4 ring-purple-500/20' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              {/* Popular/Recommended Badge */}
              {(tier.popular || tier.recommended) && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className={`bg-gradient-to-r ${tier.color} text-white px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg`}>
                    <Star className="h-4 w-4 mr-1" />
                    {tier.popular ? 'Most Popular' : 'Recommended'}
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${tier.color} flex items-center justify-center text-white shadow-lg`}>
                    {tier.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(tier.price[billingCycle])}
                    </span>
                    {tier.price[billingCycle] > 0 && (
                      <span className="text-gray-500 ml-2">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                  {billingCycle === 'annual' && tier.price.monthly > 0 && (
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      Save ${calculateAnnualSavings(tier.price.monthly)} per year
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    <AnimatePresence>
                      {getVisibleFeatures(tier.features, isCardExpanded(tier.id)).map((feature, featureIndex) => (
                        <motion.li 
                          key={featureIndex} 
                          className="flex items-start"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ delay: featureIndex * 0.05 }}
                        >
                          <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                  
                  {/* Show More/Less Button */}
                  {tier.features.length > 4 && (
                    <button
                      onClick={() => toggleCardExpansion(tier.id)}
                      className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center transition-colors"
                    >
                      {isCardExpanded(tier.id) ? (
                        <>
                          Show less <ChevronUp className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Show {tier.features.length - 4} more features <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Plan Limits - Compact */}
                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div><span className="font-medium">Users:</span> {tier.limits.users}</div>
                    <div><span className="font-medium">Storage:</span> {tier.limits.storage}</div>
                    <div><span className="font-medium">Support:</span> {tier.limits.support.split('(')[0]}</div>
                    <div><span className="font-medium">Retention:</span> {tier.limits.dataRetention}</div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(tier)}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center group ${
                    tier.popular || tier.recommended
                      ? `bg-gradient-to-r ${tier.color} text-white hover:shadow-lg hover:scale-105 shadow-md`
                      : tier.id === 'starter'
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                      : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <>
                      {tier.id === 'starter' && 'Get Started'}
                      {tier.id === 'growth' && 'Start Growth Plan'}
                      {tier.id === 'scale' && 'Start Scale Plan'}
                      {tier.id === 'enterprise' && 'Contact Sales'}
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Section for Questions */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Have Questions?</h2>
            <p className="text-gray-600 mb-6">
              Our team is here to help you choose the right plan for your business needs.
            </p>
            <button
              onClick={() => router.push('/contact')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center mx-auto"
            >
              Contact Us
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage; 