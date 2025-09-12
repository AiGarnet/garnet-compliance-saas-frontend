"use client";

import React, { useState } from 'react';
import { X, Crown, Rocket, Shield, Check, Star } from 'lucide-react';

interface PlanUpgradeModalProps {
  currentPlan: string;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: {
    monthly: number;
    annual: number;
  };
  description: string;
  features: string[];
  popular?: boolean;
  stripePriceId: {
    monthly: string;
    annual: string;
  };
}

const plans: Plan[] = [
  {
    id: 'growth',
    name: 'Growth',
    icon: <Rocket className="h-6 w-6" />,
    price: {
      monthly: 49,
      annual: 499
    },
    description: 'Perfect for growing teams and organizations',
    features: [
      'Up to 50 vendors',
      'Advanced compliance tracking',
      'Email support',
      'Custom questionnaires',
      'Reporting dashboard'
    ],
    popular: true,
    stripePriceId: {
      monthly: 'price_1RkTN7GCn6F00HoYDpK3meuM',
      annual: 'price_1RkTNZGCn6F00HoYk0lq4LvE'
    }
  },
  {
    id: 'scale',
    name: 'Scale',
    icon: <Shield className="h-6 w-6" />,
    price: {
      monthly: 199,
      annual: 1999
    },
    description: 'For larger organizations with complex needs',
    features: [
      'Unlimited vendors',
      'Advanced automation',
      'Priority support',
      'Custom integrations',
      'Advanced analytics',
      'Team collaboration tools'
    ],
    stripePriceId: {
      monthly: 'price_1RkTOCGCn6F00HoYoEtLd3FO',
      annual: 'price_1RkTOhGCn6F00HoYmMXNHSZp'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <Crown className="h-6 w-6" />,
    price: {
      monthly: 0,
      annual: 0
    },
    description: 'Custom solution for enterprise organizations',
    features: [
      'Everything in Scale',
      'Custom implementation',
      'Dedicated account manager',
      'SLA guarantees',
      'On-premise deployment option',
      'Custom compliance frameworks'
    ],
    stripePriceId: {
      monthly: '',
      annual: ''
    }
  }
];

export function PlanUpgradeModal({ currentPlan, onClose, onUpgradeSuccess }: PlanUpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan: Plan) => {
    if (plan.id === 'enterprise') {
      // For enterprise, redirect to contact or handle differently
      window.open('/contact', '_blank');
      return;
    }

    setLoading(true);
    try {
      const priceId = billingCycle === 'monthly' ? plan.stripePriceId.monthly : plan.stripePriceId.annual;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          priceId,
          billingCycle,
          successUrl: `${window.location.origin}/profile?success=true&plan=${plan.id}`,
          cancelUrl: `${window.location.origin}/profile?canceled=true`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe Checkout
        window.location.href = data.data.url;
      } else {
        console.error('Failed to create checkout session');
        alert('Failed to start upgrade process. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAnnualSavings = (plan: Plan) => {
    const annualMonthly = plan.price.annual / 12;
    const savings = ((plan.price.monthly - annualMonthly) / plan.price.monthly) * 100;
    return Math.round(savings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
            <p className="text-gray-600 mt-1">Choose the plan that's right for your organization</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual;
              const isEnterprise = plan.id === 'enterprise';
              
              return (
                <div
                  key={plan.id}
                  className={`relative border-2 rounded-lg p-6 ${
                    plan.popular
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  } ${isCurrentPlan ? 'opacity-60' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>Most Popular</span>
                      </span>
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`inline-flex p-3 rounded-lg mb-4 ${
                      plan.popular ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    {isEnterprise ? (
                      <div>
                        <span className="text-3xl font-bold text-gray-900">Custom</span>
                        <p className="text-sm text-gray-600 mt-1">Contact us for pricing</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-gray-900">
                          ${billingCycle === 'annual' ? Math.round(price / 12) : price}
                        </span>
                        <span className="text-gray-600">
                          /{billingCycle === 'annual' ? 'month' : 'month'}
                        </span>
                        {billingCycle === 'annual' && (
                          <p className="text-sm text-green-600 mt-1">
                            Save {getAnnualSavings(plan)}% annually
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading || isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {loading ? (
                      'Processing...'
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : isEnterprise ? (
                      'Contact Sales'
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>All plans include a 30-day money-back guarantee</p>
            <p className="mt-1">Questions? <a href="/contact" className="text-blue-600 hover:text-blue-700">Contact our team</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
