"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Shield, BarChart3, Users, Star, ArrowRight, ChevronDown, ChevronUp, MessageCircle, Crown, Rocket, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

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
      users: 50,
      storage: '0GB',
      frameworks: ['GDPR'],
      dataRetention: '7 days',
      support: 'Community (knowledge base)',
    },
    stripePriceIds: {
      monthly: 'price_1RkTN7GCn6F00HoYDpK3meuM',
      annual: 'price_1RkTNZGCn6F00HoYk0lq4LvE',
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
      users: 50,
      storage: '5GB',
      frameworks: ['GDPR', 'PDPA', 'SOC 2'],
      dataRetention: '30 days',
      support: 'Email (48h SLA)',
    },
    popular: true,
    stripePriceIds: {
      monthly: 'price_1RkTOCGCn6F00HoYoEtLd3FO',
      annual: 'price_1RkTOhGCn6F00HoYmMXNHSZp',
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
      users: 50,
      storage: '50GB',
      frameworks: ['GDPR', 'PDPA', 'SOC 2', 'AML', 'OFAC', 'FCPA', 'ISO 27001', 'HIPAA', 'PCI DSS', 'Custom'],
      dataRetention: '1 year',
      support: 'Priority email + live chat',
    },
    recommended: true,
    stripePriceIds: {
      monthly: 'price_1RkTP6GCn6F00HoYVgzc2Byh',
      annual: 'price_1RkTPdGCn6F00HoYznfbj9C6',
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
      users: 50,
      storage: 'unlimited',
      frameworks: ['All frameworks + custom'],
      dataRetention: 'unlimited',
      support: '24/7 dedicated support',
    },
    stripePriceIds: {
      monthly: 'price_1RkTQXGCn6F00HoYS2peeQy2',
      annual: 'price_1RkTR8GCn6F00HoYhtKtutCX',
    },
    color: 'from-amber-500 to-amber-600',
    icon: <Crown className="h-6 w-6" />
  },
];

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for upgrade reason from URL
  const upgradeReason = searchParams?.get('upgrade');
  
  // Show upgrade message based on reason
  const getUpgradeMessage = () => {
    switch (upgradeReason) {
      case 'vendor_limit':
        return '🚀 Upgrade to add more vendors to your organization!';
      case 'questionnaire_limit':
        return '📋 Upgrade to create more questionnaires per month!';
      default:
        return null;
    }
  };

  const handleSelectPlan = async (tier: PricingTier) => {
    if (tier.id === 'enterprise') {
      // Enterprise tier - redirect to contact
      router.push('/contact?plan=enterprise');
      return;
    }

    if (!isAuthenticated) {
      // Redirect to signup for unauthenticated users
      router.push(`/auth/signup?plan=${tier.id}&billing=${billingCycle}`);
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

      // First, try with coupon
      await attemptCheckout(tier, priceId, true);
      
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      
      // If coupon failed, offer to try without coupon
      if (err.message?.includes('coupon') || err.message?.includes('Coupon')) {
        const shouldRetryWithoutCoupon = window.confirm(
          'The discount code appears to be invalid or expired. Would you like to proceed with regular pricing?'
        );
        
        if (shouldRetryWithoutCoupon) {
          try {
            const priceId = billingCycle === 'monthly' 
              ? tier.stripePriceIds?.monthly 
              : tier.stripePriceIds?.annual;
            
            if (!priceId) {
              throw new Error('Price ID not found');
            }
            
            await attemptCheckout(tier, priceId, false);
          } catch (retryErr: any) {
            alert(retryErr.message || 'An error occurred. Please try again.');
          }
        }
      } else {
        alert(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const attemptCheckout = async (tier: PricingTier, priceId: string, withCoupon: boolean = true) => {
    // Check if user came from profile page
    const fromProfile = searchParams?.get('from') === 'profile';
    const successUrl = fromProfile 
      ? `${window.location.origin}/profile?success=true&plan=${tier.id}`
      : `${window.location.origin}/dashboard?success=true&plan=${tier.id}`;
    
    const requestBody: any = {
      priceId,
      billingCycle,
      successUrl,
      cancelUrl: `${window.location.origin}/pricing?canceled=true`,
    };
    
    if (withCoupon) {
      requestBody.coupon = 'EARLYBIRDOFF';
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('Checkout response status:', response.status);
    console.log('Checkout response data:', data);

    if (!response.ok) {
      // Provide more specific error messages based on common issues
      let errorMessage = data.message || 'Failed to create checkout session';
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (response.status === 400) {
        if (data.message?.includes('organization')) {
          errorMessage = 'Account setup required. Please complete your organization setup in your dashboard first.';
        } else if (data.message?.includes('subscription')) {
          errorMessage = 'You already have an active subscription. Check your billing settings in the dashboard.';
        } else if (data.message?.includes('coupon') || data.message?.includes('Coupon') || data.message?.includes('promo')) {
          errorMessage = 'The discount code is temporarily unavailable. Please try again or proceed without the discount.';
        } else if (data.message?.includes('price')) {
          errorMessage = 'Invalid pricing plan selected. Please try again.';
        }
      }
      
      throw new Error(errorMessage);
    }

    // Redirect to Stripe checkout
    window.location.href = data.data.url;
  };

  const toggleCardExpansion = (tierId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tierId)) {
        newSet.delete(tierId);
      } else {
        newSet.add(tierId);
      }
      return newSet;
    });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toLocaleString()}`;
  };

  const calculateAnnualSavings = (monthlyPrice: number) => {
    const annualPrice = monthlyPrice * 10; // Based on your pricing structure
    const monthlyTotal = monthlyPrice * 12;
    return monthlyTotal - annualPrice;
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Rocket className="h-6 w-6 text-blue-600" />;
      case 'growth':
        return <Zap className="h-6 w-6 text-purple-600" />;
      case 'scale':
        return <BarChart3 className="h-6 w-6 text-green-600" />;
      case 'enterprise':
        return <Crown className="h-6 w-6 text-amber-600" />;
      default:
        return <Shield className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <motion.div
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                Garnet AI
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                Back to Home
              </button>
              {!isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => router.push('/auth/login')}
                    className="text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => router.push('/auth/signup')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Upgrade Message */}
          {getUpgradeMessage() && (
            <motion.div
              className="mb-8 p-4 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-purple-800 font-medium text-lg">
                {getUpgradeMessage()}
              </p>
            </motion.div>
          )}
          
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and scale as you grow. No hidden fees, no long-term contracts.
            </p>
          </motion.div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
            {PRICING_TIERS.map((tier, index) => (
              <motion.div
                key={tier.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl h-full flex flex-col ${
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

                <div className="p-4 sm:p-6 flex flex-col h-full">
                  {/* Plan Icon & Name */}
                  <div className="flex items-center mb-3">
                    {getPlanIcon(tier.id)}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 ml-3">{tier.name}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tier.description}</p>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {formatPrice(tier.price[billingCycle])}
                      </span>
                      {tier.price[billingCycle] > 0 && (
                        <span className="text-gray-500 ml-2 text-sm">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'annual' && tier.price.monthly > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Save ${calculateAnnualSavings(tier.price.monthly)} per year
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="flex-grow mb-4">
                    <ul className="space-y-2 text-sm">
                      {tier.features.slice(0, 3).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                      
                      {/* Expandable Features */}
                      <AnimatePresence>
                        {expandedCards.has(tier.id) && tier.features.length > 3 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            {tier.features.slice(3).map((feature, featureIndex) => (
                              <li key={featureIndex + 3} className="flex items-start mb-2">
                                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Show More/Less Button */}
                      {tier.features.length > 3 && (
                        <li className="mt-2">
                          <button
                            onClick={() => toggleCardExpansion(tier.id)}
                            className="text-purple-600 hover:text-purple-700 text-xs font-medium flex items-center transition-colors"
                          >
                            {expandedCards.has(tier.id) ? (
                              <>
                                Show less <ChevronDown className="h-3 w-3 ml-1 rotate-180 transition-transform" />
                              </>
                            ) : (
                              <>
                                Show more ({tier.features.length - 3} more) <ChevronDown className="h-3 w-3 ml-1 transition-transform" />
                              </>
                            )}
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(tier)}
                    disabled={isLoading}
                    className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center mt-auto ${
                      tier.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                        : tier.id === 'starter'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                        : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {tier.id === 'starter' && 'Get Started'}
                    {tier.id === 'growth' && 'Start Growth Plan'}
                    {tier.id === 'scale' && 'Start Scale Plan'}
                    {tier.id === 'enterprise' && 'Contact Sales'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Early Bird Offer Banner - Smaller version at the end */}
          <motion.div
            className="mt-16 mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg mx-auto max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="text-center">
              <h3 className="text-lg font-bold mb-2">🎉 Early Bird Special - Limited Time!</h3>
              <p className="text-sm opacity-90 mb-3">Get 100% OFF any plan with our early bird access offer</p>
              <div className="flex items-center justify-center gap-4">
                <div className="bg-white bg-opacity-20 inline-block px-3 py-1.5 rounded-full">
                  <span className="font-semibold text-sm text-black">Use Code: EARLYBIRDOFF</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-xs">OFF</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <div className="text-center mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <p className="text-gray-600 mb-4">
                Need a custom plan or have questions?
              </p>
              <button 
                onClick={() => router.push('/contact')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 inline-flex items-center"
              >
                Contact Sales
                <MessageCircle className="h-4 w-4 ml-2" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage; 