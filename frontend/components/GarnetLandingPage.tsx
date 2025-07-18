"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';

import IndustryRequestForm from './IndustryRequestForm';
import { 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  CheckCircle, 
  Check,
  ArrowRight, 
  Star,
  Clock,
  TrendingUp,
  FileCheck,
  Globe,
  Lock,
  ChevronRight,
  Quote,
  ChevronDown,
  Plus,
  Minus,
  Building2,
  Heart,
  Code,
  ShoppingCart,
  Settings,
  Briefcase,
  MousePointer2,
  Play,
  Database,
  Cpu,
  CloudCog,
  Activity,
  Eye,
  Server,
  Layers,
  Command,
  Download,
  Upload,
  Sliders,
  Network,
  Gauge,
  Home,
  FileText
} from 'lucide-react';

// Pricing interface
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

// Pricing data
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
    stripePriceIds: {
      monthly: 'price_1RkTN7GCn6F00HoYDpK3meuM',
      annual: 'price_1RkTNZGCn6F00HoYk0lq4LvE',
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
      'Unlimited AI-generated questionnaires (up to 100 questions each)',
      'Support for up to 3 compliance frameworks',
      'Enhanced Trust Portal customization (logo + two documents)',
      'Email support with 48-hour SLA',
      'Exportable audit logs',
      'Basic analytics dashboard',
    ],
    popular: true,
    stripePriceIds: {
      monthly: 'price_1RkTOCGCn6F00HoYoEtLd3FO',
      annual: 'price_1RkTOhGCn6F00HoYmMXNHSZp',
    },
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
    ],
    stripePriceIds: {
      monthly: 'price_1RkTP6GCn6F00HoYVgzc2Byh',
      annual: 'price_1RkTPdGCn6F00HoYznfbj9C6',
    },
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
    ],
    stripePriceIds: {
      monthly: 'price_1RkTQXGCn6F00HoYS2peeQy2',
      annual: 'price_1RkTR8GCn6F00HoYhtKtutCX',
    },
  },
];

// Counter component for animated statistics
const AnimatedCounter = ({ end, duration = 2, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Loading Animation Component
const LoadingAnimation = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="text-center">
        {/* Logo with pulse animation */}
        <motion.div
          className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span className="text-white font-bold text-xl">G</span>
        </motion.div>
        
        {/* Loading dots */}
        <div className="flex space-x-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        <motion.p
          className="mt-4 text-gray-600 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Loading Garnet...
        </motion.p>
      </div>
    </motion.div>
  );
};

// Hook to track if user has scrolled past hero section with smooth debouncing
const useScrollPastHero = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Show button after scrolling past roughly the hero section
          const scrollPosition = window.scrollY;
          const heroHeight = window.innerHeight * 0.75; // 75% of viewport height for earlier trigger
          
          setShowButton(scrollPosition > heroHeight);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return showButton;
};

// Security Trust Section
const SecurityTrustSection = () => {
  const securityFeatures = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "GDPR Compliant",
      description: "Generate ready-to-submit audit documents for EU & global frameworks",
      badge: "Certified"
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "End-to-End Encryption",
      description: "AES-256 encrypted data flow with zero tolerance for leaks or compromise",
      badge: "Military Grade"
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Zero Data Retention",
      description: "Your data is processed in-memory and never stored permanently",
      badge: "Privacy First"
    }
  ];

  return (
    <section id="security" className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Enterprise-Grade Privacy, Security, 
            <span className="block sm:inline bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> and Encryption</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="relative group h-full"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <span className="px-3 py-1 bg-purple-500/30 text-purple-200 text-xs font-medium rounded-full whitespace-nowrap">
                    {feature.badge}
                  </span>
                </div>
                <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-purple-100 leading-relaxed text-base flex-1">{feature.description}</p>
                </div>
              </div>
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </motion.div>
          ))}
        </div>

        {/* Security documentation button removed as requested */}
      </div>
    </section>
  );
};

// Interactive Demo Section Component
const InteractiveDemo = () => {
  /* Commented out to hide this section
  const [activeStep, setActiveStep] = useState(0);
  
  const demoSteps = [
    {
      title: "Upload Your Security Documentation",
      description: "Simply drag and drop your existing security documents, policies, and certifications into Garnet.",
      action: "Upload",
      icon: <Upload className="h-6 w-6" />,
      visual: (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-blue-700 font-medium">Drop files here or click to upload</p>
            <p className="text-blue-500 text-sm mt-2">Supports PDF, DOCX, and more</p>
          </div>
        </div>
      )
    },
    {
      title: "AI Analyzes Your Security Posture", 
      description: "Our advanced AI scans through your documentation and automatically maps your existing controls.",
      action: "Analyze",
      icon: <Cpu className="h-6 w-6" />,
      visual: (
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <div className="flex-1 h-2 bg-purple-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
              </div>
              <span className="text-purple-700 text-sm font-medium">75%</span>
            </div>
            <p className="text-purple-700 text-sm">Analyzing security controls...</p>
            <p className="text-purple-600 text-xs">Identified 47 controls across 12 domains</p>
          </div>
        </div>
      )
    },
    {
      title: "Generate Questionnaire Responses",
      description: "Receive accurate, contextual responses to compliance questionnaires in minutes, not weeks.",
      action: "Generate", 
      icon: <FileCheck className="h-6 w-6" />,
      visual: (
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">SOC 2 Response</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600">95% accuracy achieved</p>
              <div className="mt-2 flex space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Access Controls</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Encryption</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See Garnet in
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Action</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience how our AI transforms your compliance workflow in three simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {demoSteps.map((step, index) => (
              <motion.div
                key={index}
                className={`cursor-pointer transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-white p-6 rounded-2xl shadow-lg border-l-4 border-purple-500'
                    : 'p-6 hover:bg-white hover:rounded-2xl hover:shadow-md'
                }`}
                onClick={() => setActiveStep(index)}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeStep === index
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    {activeStep === index && (
                      <motion.button
                        className="mt-4 inline-flex items-center text-purple-600 font-medium hover:text-purple-700 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {step.action}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="relative">
            <motion.div 
              className="bg-white p-1 rounded-2xl shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {demoSteps.map((step, index) => (
                <div key={index} className={activeStep === index ? 'block' : 'hidden'}>
                  {step.visual}
                </div>
              ))}
            </motion.div>
            
            {/* Decorative elements */}
//             <motion.div 
//               className="absolute -top-6 -right-6 w-12 h-12 bg-purple-200 rounded-full opacity-70"
//               animate={{ 
//                 y: [0, -8, 0],
//                 scale: [1, 1.1, 1]
//               }}
//               transition={{ duration: 5, repeat: Infinity }}
//             />
//             <motion.div 
//               className="absolute -bottom-8 -left-8 w-16 h-16 bg-pink-200 rounded-full opacity-70"
//               animate={{ 
//                 y: [0, 8, 0],
//                 scale: [1, 1.15, 1]
//               }}
//               transition={{ duration: 6, repeat: Infinity }}
//             />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
//   */
  
//   // Return an empty fragment instead
//   return <></>;
// };

// Countdown Timer Component
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const launchDate = new Date('2025-07-02T00:00:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold mb-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 bg-clip-text text-transparent">
              The Future Arrives in
            </span>
          </motion.h2>
          <motion.p 
            className="text-base sm:text-lg text-purple-200"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Join us on our journey to revolutionize enterprise sales operations
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center items-center gap-3 sm:gap-6"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {Object.entries(timeLeft).map(([unit, value], index) => (
            <motion.div
              key={unit}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 sm:p-5 min-w-[70px] sm:min-w-[85px] border border-white/10">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 bg-clip-text text-transparent">
                    {value.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs sm:text-sm text-purple-200 mt-1 font-medium tracking-wider uppercase">
                    {unit}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const GarnetLandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [isIndustryFormOpen, setIsIndustryFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Track if user has scrolled past hero section
  const showNavButton = useScrollPastHero();

  // Loading animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Show loading for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);


  
  const openIndustryForm = () => {
    setIsIndustryFormOpen(true);
  };
  
  const closeIndustryForm = () => {
    setIsIndustryFormOpen(false);
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Helper functions for pricing
  const formatPrice = (price: number): string => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const calculateAnnualSavings = (monthlyPrice: number): number => {
    const annualPrice = monthlyPrice * 12;
    const discountedAnnualPrice = annualPrice * 0.83; // 17% discount
    return Math.round(annualPrice - discountedAnnualPrice);
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

  const handleSelectPlan = async (tier: PricingTier) => {
    if (tier.id === 'enterprise') {
      // Enterprise tier - redirect to contact
      window.location.href = '/contact';
      return;
    }

    // For all other plans (including starter), redirect to signup with plan info
    const searchParams = new URLSearchParams();
    searchParams.set('plan', tier.id);
    searchParams.set('billing', billingCycle);
    window.location.href = `/auth/signup?${searchParams.toString()}`;
  };

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "AI-Powered Automation",
      description: "Auto-complete vendor security forms with 95% accuracy using large language models trained on global compliance standards.",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Multi-Framework Support", 
      description: "Comply with GDPR, ISO 27001, SOC 2, HIPAA, AML, FCPA, FATF, and 50+ global frameworks and data laws.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-Time Analytics",
      description: "Visualize gaps, monitor control implementation, and generate audit-ready reports in real-time.",
      color: "from-pink-500 to-red-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Trust Portal Sharing",
      description: "Host a live compliance page branded to your company, with up-to-date documents, policies, and certifications.",
      color: "from-teal-500 to-blue-600"
    }
  ];

  const testimonials = [
    {
      quote: "Garnet reduced our questionnaire response time from weeks to hours. The AI accuracy is incredible.",
      author: "Sarah Chen",
      title: "CISO, TechCorp Inc.",
      avatar: "SC",
      rating: 5
    },
    {
      quote: "We closed 3 enterprise deals faster thanks to our professional trust portal. Game changer for sales.",
      author: "Michael Rodriguez", 
      title: "VP Sales, DataFlow Solutions",
      avatar: "MR",
      rating: 5
    },
    {
      quote: "The multi-framework support means we manage all our compliance requirements in one place.",
      author: "Emily Watson",
      title: "Compliance Manager, FinSecure",
      avatar: "EW", 
      rating: 5
    }
  ];

  const stats = [
    { value: 95, suffix: '%', label: 'Accuracy Rate' },
    { value: 80, suffix: '%', label: 'Time Reduction' },
    { value: 500, suffix: '+', label: 'Companies Trust Us' },
    { value: 25, suffix: '+', label: 'Frameworks Supported' }
  ];

  const faqs = [
    {
      question: "How can Garnet help streamline my compliance process?",
      answer: "Garnet automation reduces questionnaire response time by up to 80%, automatically analyzing your security posture and suggesting accurate responses. Our AI learns from your previous submissions and adapts to different compliance frameworks, transforming weeks of manual work into hours of intelligent automation."
    },
    {
      question: "What compliance frameworks does Garnet support?",
      answer: "Garnet supports 25+ major compliance frameworks including ISO 27001, SOC 2, GDPR, HIPAA, CCPA, PCI DSS, and many more. Our platform continuously updates to include new frameworks, ensuring you stay compliant as regulations evolve."
    },
    {
      question: "Do I need technical knowledge to use Garnet?",
      answer: "No technical expertise required! Garnet is designed for compliance professionals, not developers. Our intuitive interface guides you through the process, while our AI handles the complex analysis. We also provide comprehensive training and dedicated support to ensure your success."
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <>
      {/* Loading Animation */}
      <AnimatePresence>
        {isLoading && <LoadingAnimation />}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }
          
          /* Custom focus styles for accessibility */
          button:focus-visible,
          a:focus-visible {
            outline: 2px solid #7c3aed;
            outline-offset: 2px;
            border-radius: 6px;
          }
          
          /* Remove default focus outline */
          button:focus,
          a:focus {
            outline: none;
          }
        `}</style>
        {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg"
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <img 
                  src="/IconOnly_Transparent_NoBuffer.png" 
                  alt="Garnet Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Fallback to gradient logo if image fails to load
                    const img = e.currentTarget;
                    const fallback = img.nextElementSibling as HTMLElement;
                    if (fallback) {
                      img.style.display = 'none';
                      fallback.style.display = 'flex';
                    }
                  }}
                />
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg items-center justify-center hidden">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
              <span className="text-xl sm:text-2xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Garnet</span>
              </span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <button 
                  onClick={scrollToPricing}
                  className="text-black font-semibold text-sm lg:text-base px-3 py-2 hover:text-purple-600 transition-colors cursor-pointer"
                >
                  Pricing
                </button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <Link 
                  href="/contact" 
                  className="text-black font-semibold text-sm lg:text-base px-3 py-2 hover:text-purple-600 transition-colors"
                >
                  Contact Us
                </Link>
              </motion.div>
              
              {/* Dynamic Get Started Button */}
              <AnimatePresence>
                {showNavButton && (
                  <motion.button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-full hover:shadow-lg transition-all text-sm lg:text-base font-medium focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
                      background: "linear-gradient(to right, #8b5cf6, #ec4899)",
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/auth/signup'}
                    initial={{ opacity: 0, x: 30, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      scale: 1,
                      transition: { 
                        duration: 0.7,
                        ease: [0.25, 0.46, 0.45, 0.94], // Ultra smooth cubic-bezier
                        opacity: { 
                          duration: 0.5, 
                          ease: [0.25, 0.46, 0.45, 0.94] 
                        },
                        x: { 
                          type: "spring", 
                          stiffness: 180, 
                          damping: 22,
                          mass: 0.8
                        },
                        scale: { 
                          type: "spring", 
                          stiffness: 200, 
                          damping: 20, 
                          delay: 0.15,
                          mass: 0.6
                        }
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      x: 30, 
                      scale: 0.95,
                      transition: { 
                        duration: 0.5,
                        ease: [0.55, 0.06, 0.68, 0.19], // Smooth exit curve
                        opacity: { 
                          duration: 0.4, 
                          ease: [0.4, 0.0, 0.2, 1]
                        },
                        x: { 
                          duration: 0.5, 
                          ease: [0.4, 0.0, 0.2, 1]
                        },
                        scale: { 
                          duration: 0.4, 
                          ease: [0.4, 0.0, 0.2, 1]
                        }
                      }
                    }}
                  >
                    Get Started
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-3">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Link 
                  href="/contact" 
                  className="text-black font-semibold text-sm px-3 py-2"
                >
                  Contact
                </Link>
              </motion.div>
              
              {/* Dynamic Get Started Button - Mobile */}
              <AnimatePresence>
                {showNavButton && (
                  <motion.button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full hover:shadow-lg transition-all text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
                      background: "linear-gradient(to right, #8b5cf6, #ec4899)",
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/auth/signup'}
                    initial={{ opacity: 0, x: 30, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      scale: 1,
                      transition: { 
                        duration: 0.7,
                        ease: [0.25, 0.46, 0.45, 0.94], // Ultra smooth cubic-bezier
                        opacity: { 
                          duration: 0.5, 
                          ease: [0.25, 0.46, 0.45, 0.94] 
                        },
                        x: { 
                          type: "spring", 
                          stiffness: 180, 
                          damping: 22,
                          mass: 0.8
                        },
                        scale: { 
                          type: "spring", 
                          stiffness: 200, 
                          damping: 20, 
                          delay: 0.15,
                          mass: 0.6
                        }
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      x: 30, 
                      scale: 0.95,
                      transition: { 
                        duration: 0.5,
                        ease: [0.55, 0.06, 0.68, 0.19], // Smooth exit curve
                        opacity: { 
                          duration: 0.4, 
                          ease: [0.4, 0.0, 0.2, 1]
                        },
                        x: { 
                          duration: 0.5, 
                          ease: [0.4, 0.0, 0.2, 1]
                        },
                        scale: { 
                          duration: 0.4, 
                          ease: [0.4, 0.0, 0.2, 1]
                        }
                      }
                    }}
                  >
                    Get Started
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-blue-300/15 to-purple-300/15 rounded-full blur-3xl"
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-pink-300/20 to-purple-300/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, 60, 0],
              y: [0, -40, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{ 
                lineHeight: '1.1', 
                letterSpacing: '-0.025em',
                fontFeatureSettings: '"kern" 1, "liga" 1',
                textRendering: 'optimizeLegibility',
                paddingBottom: '0.1em'
              }}
            >
              <span 
                className="block mb-2"
                style={{
                  background: 'linear-gradient(to right, rgb(147 51 234), rgb(219 39 119), rgb(239 68 68))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  paddingBottom: '0.05em',
                  display: 'inline-block'
                }}
              >
                Transform Weeks of Vendor
              </span>
              <motion.span 
                className="block"
                style={{
                  background: 'linear-gradient(to right, rgb(51 65 85), rgb(15 23 42))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                Compliance into Hours
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-base sm:text-lg text-gray-600 max-w-2xl sm:max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Complete enterprise vendor onboarding with AI-powered accuracy. <br />
              Automate questionnaires, manage evidence, and publish trust portals.
            </motion.p>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:shadow-xl transition-all flex items-center justify-center group shadow-lg focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                background: "linear-gradient(to right, #8b5cf6, #ec4899)"
              }}
              whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/auth/signup'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.4,
                  type: "spring",
                  stiffness: 100
                }}
            >
                Get Started
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </motion.div>
            </motion.button>
          </motion.div>

          {/* Hero Visual - Live Dashboard Stats */}
          <motion.div 
              className="relative max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg border-0">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">Vendor Onboarding Dashboard Live</h3>
                    <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">Live</span>
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <motion.div 
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <div className="flex items-center justify-between">
                        <div>
                          <Users className="h-5 sm:h-6 lg:h-8 w-5 sm:w-6 lg:w-8 text-blue-600" />
                        </div>
                        <motion.span 
                          className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 1, type: "spring" }}
                        >
                          150+
                        </motion.span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">Compliance Frameworks</p>
                    <p className="text-xs text-blue-600 mt-1">→ Global compliance coverage</p>
                  </motion.div>
                  <motion.div 
                    className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <div className="flex items-center justify-between">
                        <div>
                          <Gauge className="h-5 sm:h-6 lg:h-8 w-5 sm:w-6 lg:w-8 text-purple-600" />
                        </div>
                        <motion.span 
                          className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 1.1, type: "spring" }}
                        >
                          95%
                        </motion.span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">Response Accuracy</p>
                    <p className="text-xs text-purple-600 mt-1">→ Stay audit-ready, reduce back-and-forth</p>
                  </motion.div>
                    <motion.div 
                      className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 sm:p-4 rounded-lg sm:col-span-2 lg:col-span-1"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                    >
                    <div className="flex items-center justify-between">
                        <div>
                          <Clock className="h-5 sm:h-6 lg:h-8 w-5 sm:w-6 lg:w-8 text-pink-600" />
                        </div>
                        <motion.span 
                          className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 1.2, type: "spring" }}
                        >
                          2.5h
                        </motion.span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">Avg. Response Time</p>
                    <p className="text-xs text-pink-600 mt-1">→ Close deals 50% faster</p>
                  </motion.div>
                </div>
              </div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Watch Garnet
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Demo</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See our AI-powered platform in action as it transforms vendor compliance from a weeks-long process into hours.
            </p>
          </motion.div>

          <motion.div 
            className="relative max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Video Container with Modern Styling */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
              {/* Gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl" 
                   style={{ padding: '2px' }}>
                <div className="bg-gray-900 rounded-2xl h-full w-full">
                                     <video 
                     className="w-full h-auto rounded-2xl"
                     controls
                     preload="metadata"
                   >
                    <source src="/garnet-demo-video.mp4" type="video/mp4" />
                    <p className="text-white p-8 text-center">
                      Your browser doesn't support HTML5 video. 
                      <a href="/garnet-demo-video.mp4" className="text-purple-400 underline ml-1">
                        Download the video instead.
                      </a>
                    </p>
                  </video>
                </div>
              </div>

                             {/* Decorative elements for visual appeal */}
               <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-70 animate-pulse"></div>
               <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full opacity-60 animate-bounce"></div>
            </div>

            {/* Video Stats/Features below */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Save 90% Time</h3>
                <p className="text-gray-600">Transform weeks of manual work into automated hours</p>
              </div>
              
              <div className="text-center">
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">95% Accuracy</h3>
                <p className="text-gray-600">AI-powered responses that pass enterprise audits</p>
              </div>
              
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">50% Faster Deals</h3>
                <p className="text-gray-600">Accelerate sales cycles with instant compliance responses</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* <CountdownTimer /> */}

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything Sales Teams Need for 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Vendor Compliance</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Streamline security reviews, build trust with buyers, and accelerate deal closure using Garnet.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-500 border border-gray-100"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/30 opacity-0 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative p-6 h-full flex flex-col">
                  {/* Icon with animated background */}
                  <div className="relative mb-6">
                    <motion.div 
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg`}
                    >
                  {feature.icon}
                    </motion.div>
                    {/* Animated ring */}
                    <motion.div 
                      className={`absolute inset-0 w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} opacity-20`}
                      initial={{ scale: 1 }}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.1, 0.2]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    />
                </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-base text-gray-600 leading-relaxed mb-6 flex-grow">
                    {feature.description}
                  </p>
                </div>
                
                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-500 pointer-events-none`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Vendor Onboarding Workflows, 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Built for Speed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Accelerate vendor assessments with pre-built workflows, designed specifically for sales, success, and customer-facing teams.
            </p>
          </motion.div>

          {/* Enhanced Workflow Cards */}
          <div className="space-y-12">
            {[
              {
                step: "1",
                title: "Upload Questionnaire",
                description: "Simply upload your vendor security questionnaire in any format - PDF, Word, Excel, or even images. Our AI handles them all.",
                icon: <Upload className="h-6 w-6" />,
                gifUrl: "/gifs/upload-questionnaire.gif",
                color: "from-blue-500 to-purple-600",
                bgColor: "from-blue-50 to-purple-50",
                features: ["Drag & Drop Interface", "Multiple File Formats", "Instant Processing"]
              },
              {
                step: "2", 
                title: "AI Analysis & Response",
                description: "Our advanced AI analyzes each question, understands context, and generates accurate, compliant responses in seconds.",
                icon: <Cpu className="h-6 w-6" />,
                gifUrl: "/gifs/ai-analysis.gif",
                color: "from-purple-500 to-pink-600",
                bgColor: "from-purple-50 to-pink-50",
                features: ["Smart Context Analysis", "Compliance Mapping", "Instant Generation"]
              },
              {
                step: "3",
                title: "Review & Submit",
                description: "Review AI-generated responses, make any customizations, and submit with complete confidence and audit trails.",
                icon: <CheckCircle className="h-6 w-6" />,
                gifUrl: "/gifs/review-submit.gif",
                color: "from-pink-500 to-red-600",
                bgColor: "from-pink-50 to-red-50",
                features: ["Smart Review Interface", "Custom Edits", "Audit Trail"]
              }
            ].map((workflow, index) => (
              <motion.div
                key={index}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${workflow.bgColor} p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_70%)]"></div>
                </div>

                <div className={`grid grid-cols-1 ${index % 2 === 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-2'} gap-8 items-center`}>
                  {/* Content Side */}
                  <div className={`${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'} space-y-6`}>
                    {/* Step Badge */}
                    <motion.div 
                      className={`inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${workflow.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {workflow.step}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Step {workflow.step}</span>
                    </motion.div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                        {workflow.title}
                      </h3>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        {workflow.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2">
                      {workflow.features.map((feature, fIndex) => (
                        <motion.div
                          key={fIndex}
                          className="flex items-center space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.2 + fIndex * 0.1 }}
                        >
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${workflow.color}`}></div>
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* GIF/Visual Side */}
                  <div className={`${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'} relative`}>
                    <motion.div 
                      className="relative rounded-2xl overflow-hidden shadow-2xl bg-white/50 backdrop-blur-sm border border-white/60"
                      whileHover={{ rotateY: 5, rotateX: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      {/* Interactive Prototype Container */}
                      <div className="aspect-video relative bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Step 1: Upload Questionnaire */}
                        {workflow.step === "1" && (
                          <div className="w-full h-full p-4 bg-gradient-to-br from-gray-50 to-white">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-700">Upload Questionnaire</h4>
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              </div>
                            </div>
                            
                            {/* Upload Zone */}
                            <motion.div 
                              className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center bg-purple-50/50 h-32 flex flex-col items-center justify-center"
                              animate={{ 
                                borderColor: ["#a855f7", "#ec4899", "#a855f7"],
                                scale: [1, 1.02, 1]
                              }}
                              transition={{ 
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <Upload className="h-8 w-8 text-purple-500 mb-2" />
                              <p className="text-sm text-gray-600">Drag & drop your questionnaire here</p>
                              <p className="text-xs text-gray-400">PDF, Word, Excel supported</p>
                            </motion.div>
                            
                            {/* File List */}
                            <div className="mt-3 space-y-2">
                              <motion.div 
                                className="flex items-center space-x-2 p-2 bg-green-50 rounded-md"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1, duration: 0.5 }}
                              >
                                <FileText className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-green-700 flex-1">security-questionnaire.pdf</span>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </motion.div>
                            </div>
                          </div>
                        )}

                        {/* Step 2: AI Analysis */}
                        {workflow.step === "2" && (
                          <div className="w-full h-full p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-700">AI Analysis in Progress</h4>
                              <div className="flex items-center space-x-2">
                                <motion.div 
                                  className="w-2 h-2 bg-purple-500 rounded-full"
                                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                />
                                <motion.div 
                                  className="w-2 h-2 bg-purple-500 rounded-full"
                                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div 
                                  className="w-2 h-2 bg-purple-500 rounded-full"
                                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                />
                              </div>
                            </div>
                            
                            {/* Analysis Content */}
                            <div className="space-y-3">
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-start space-x-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 mb-1">Question 1 of 25</p>
                                    <p className="text-sm text-gray-800">Do you have SOC 2 Type II certification?</p>
                                    <motion.div 
                                      className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden"
                                      initial={{ width: 0 }}
                                      animate={{ width: "100%" }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    >
                                      <motion.div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "85%" }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                      />
                                    </motion.div>
                                  </div>
                                  <Cpu className="h-4 w-4 text-purple-500 animate-pulse" />
                                </div>
                              </div>
                              
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center space-x-2 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-xs">Response generated</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">Yes, we maintain SOC 2 Type II certification...</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Review & Submit */}
                        {workflow.step === "3" && (
                          <div className="w-full h-full p-4 bg-gradient-to-br from-green-50 to-blue-50">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-700">Review Responses</h4>
                              <div className="text-xs text-green-600 flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>25/25 Complete</span>
                              </div>
                            </div>
                            
                            {/* Response Cards */}
                            <div className="space-y-2">
                              <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-green-500">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Security Controls</p>
                                    <p className="text-sm text-gray-800">Do you encrypt data at rest?</p>
                                    <p className="text-xs text-green-700 mt-1">✓ Yes, using AES-256 encryption...</p>
                                  </div>
                                  <button className="text-xs text-purple-600 hover:text-purple-800">Edit</button>
                                </div>
                              </div>
                              
                              <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-green-500">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Compliance</p>
                                    <p className="text-sm text-gray-800">GDPR compliance status?</p>
                                    <p className="text-xs text-green-700 mt-1">✓ Fully compliant with GDPR...</p>
                                  </div>
                                  <button className="text-xs text-purple-600 hover:text-purple-800">Edit</button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Submit Button */}
                            <motion.button 
                              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg text-sm font-medium"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              animate={{ 
                                boxShadow: [
                                  "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                  "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                  "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                                ]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              Submit Questionnaire
                            </motion.button>
                          </div>
                        )}
                      </div>

                      {/* Floating elements */}
                      <motion.div
                        className={`absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-r ${workflow.color} shadow-lg`}
                        animate={{ 
                          y: [0, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.div
                        className={`absolute -bottom-4 -left-4 w-6 h-6 rounded-full bg-gradient-to-r ${workflow.color} shadow-lg opacity-70`}
                        animate={{ 
                          y: [0, 10, 0],
                          scale: [1, 0.9, 1]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1
                        }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Connecting Line (except for last item) */}
                {index < 2 && (
                  <motion.div
                    className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-px h-12 bg-gradient-to-b from-purple-300 to-transparent"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 0.8 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Trust Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-32 right-20 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl"
            animate={{ 
              x: [0, 60, 0],
              y: [0, -40, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-block px-4 py-2 bg-white/80 backdrop-blur-sm text-purple-700 rounded-full text-sm font-semibold mb-6 shadow-lg">
                🌍 Global Trust Platform
              </span>
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted Worldwide by 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent"> Modern Vendors</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Built for scale, Garnet supports 150+ countries with up-to-date regulatory guidance and localization for every region.
            </p>
          </motion.div>

          {/* Global Statistics */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {[
              { number: "150+", label: "Countries Supported", icon: <Globe className="h-8 w-8" /> },
              { number: "99%", label: "Global Coverage", icon: <BarChart3 className="h-8 w-8" /> },
              { number: "6", label: "Continents", icon: <Users className="h-8 w-8" /> },
              { number: "50+", label: "Compliance Frameworks Supported", icon: <Shield className="h-8 w-8" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  <AnimatedCounter end={parseInt(stat.number.replace(/[^0-9]/g, ''))} suffix={stat.number.replace(/[0-9]/g, '')} />
                </div>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>



          {/* Global Trust Indicators - REMOVED */}
        </div>
      </section>

      {/* Use Case Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Every Industry 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> & Jurisdiction</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Whether you are handling fintech, legal, consulting, or e-commerce vendor assessments, Garnet adapts to your specific needs.
            </p>
          </motion.div>

          {/* Global Examples */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Global Coverage Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { country: "🇧🇷 Brazil", frameworks: ["LGPD", "ISO 27001"] },
                { country: "🇲🇽 Mexico", frameworks: ["LFPDPPP", "ISO 27001"] },
                { country: "🇮🇳 India", frameworks: ["DPDP", "ISO 27001"] },
                { country: "🇯🇵 Japan", frameworks: ["APPI", "ISO 27001"] },
                { country: "🇿🇦 South Africa", frameworks: ["POPIA", "ISO 27001"] },
                { country: "🇫🇷 France", frameworks: ["GDPR", "ISO 27001"] },
                { country: "🇮🇪 Ireland", frameworks: ["GDPR", "DPA"] },
                { country: "🇳🇬 Nigeria", frameworks: ["DPA", "ISO 27001"] }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg hover:from-purple-50 hover:to-pink-50 transition-all cursor-pointer border border-gray-200"
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="text-sm font-semibold text-gray-800 mb-2">{item.country}</div>
                  <div className="flex flex-wrap gap-1">
                    {item.frameworks.map((fw, fIdx) => (
                      <span key={fIdx} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {fw}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Industries Grid */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Industries We Serve</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "SaaS & Tech",
                  icon: <Code className="h-8 w-8" />,
                  description: "Technology companies and software platforms",
                  frameworks: ["ISO 27001", "GDPR"]
                },
                {
                  name: "E-Commerce",
                  icon: <ShoppingCart className="h-8 w-8" />,
                  description: "Online retail and payment processing",
                  frameworks: ["PCI DSS", "GDPR", "CCPA"]
                },
                {
                  name: "Fintech",
                  icon: <Building2 className="h-8 w-8" />,
                  description: "Banking, payments, and financial services",
                  frameworks: ["SOX", "PCI DSS", "AML"]
                },
                {
                  name: "Manufacturing",
                  icon: <Settings className="h-8 w-8" />,
                  description: "Industrial and manufacturing operations",
                  frameworks: ["NIST", "SOC 2"]
                },
                {
                  name: "Consulting",
                  icon: <Briefcase className="h-8 w-8" />,
                  description: "Professional services and client data",
                  frameworks: ["GDPR", "ISO 27001"]
                },
                {
                  name: "Legal",
                  icon: <Briefcase className="h-8 w-8" />,
                  description: "Law firms and legal services",
                  frameworks: ["ISO 27701", "ABA Rules"]
                },
                {
                  name: "Real Estate",
                  icon: <Home className="h-8 w-8" />,
                  description: "Property management and real estate",
                  frameworks: ["AML", "CCPA"]
                },
                {
                  name: "Insurance",
                  icon: <Shield className="h-8 w-8" />,
                  description: "Insurance providers and brokers",
                  frameworks: ["GLBA", "SOC 2"]
                },
                {
                  name: "Energy",
                  icon: <Zap className="h-8 w-8" />,
                  description: "Energy and utility companies",
                  frameworks: ["NERC CIP", "NIST"]
                }
              ].map((industry, index) => (
                  <motion.div
                    key={index}
                    className="group relative"
                    whileHover={{ 
                      y: -5,
                      scale: 1.02,
                      transition: { type: "spring", stiffness: 300, damping: 15 }
                    }}
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center relative overflow-hidden border border-gray-100 h-full">
                      {/* Background gradient blob */}
                      <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                      
                      {/* Icon container */}
                      <motion.div 
                        className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white relative z-10"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {industry.icon}
                      </motion.div>
                      
                      {/* Industry name */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">
                        {industry.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed relative z-10">
                        {industry.description}
                      </p>
                      
                      {/* Frameworks */}
                      <div className="flex flex-wrap justify-center gap-1 relative z-10">
                        {industry.frameworks.map((framework, fIndex) => (
                          <span 
                            key={fIndex}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                          >
                            {framework}
                          </span>
                        ))}
                      </div>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
        </div>
      </section>

      {/* Security Trust Section */}
      <SecurityTrustSection />

      {/* Testimonials Section - Commented Out */}
      {/* 
      <section id="testimonials" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Industry 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Leaders</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from compliance professionals who've transformed their workflows with Garnet.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-purple-300 mb-4" />
                <p className="text-gray-700 mb-6 leading-relaxed italic text-sm sm:text-base">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{testimonial.author}</div>
                    <div className="text-gray-600 text-sm truncate">{testimonial.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Pricing</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and scale as you grow. No hidden fees, no long-term contracts.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <motion.div 
              className="bg-white rounded-full p-1 shadow-lg border border-gray-200"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
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
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
                    className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center mt-auto ${
                      tier.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                        : tier.id === 'starter'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                        : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    {tier.id === 'starter' && 'Get Started Free'}
                    {tier.id === 'growth' && 'Start Growth Plan'}
                    {tier.id === 'scale' && 'Start Scale Plan'}
                    {tier.id === 'enterprise' && 'Contact Sales'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <p className="text-gray-600 mb-4">Save 17% with annual billing</p>
              <button 
                onClick={scrollToPricing}
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
              >
                Scroll to top of pricing <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              We Have Got the Answers
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <motion.button
                  className="w-full px-4 sm:px-6 py-4 sm:py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleFaq(index)}
                  whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                >
                  <span className="text-base sm:text-lg font-semibold text-gray-900 pr-4 sm:pr-8">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: activeFaq === index ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-shrink-0"
                  >
                    {activeFaq === index ? (
                      <Minus className="h-6 w-6 text-purple-600" />
                    ) : (
                      <Plus className="h-6 w-6 text-gray-400" />
                    )}
                  </motion.div>
                </motion.button>
                
                <motion.div
                  initial={false}
                  animate={{
                    height: activeFaq === index ? "auto" : 0,
                    opacity: activeFaq === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="w-full h-px bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 mb-4"></div>
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>


        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Compliance Process?
            </h2>
            <p className="text-lg text-purple-200 max-w-3xl mx-auto mb-10 leading-relaxed">
              Founders, sales teams, and legal leads across industries are gearing up to launch with Garnet. Join them and get early access to the platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                className="bg-white text-purple-600 px-6 sm:px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all flex items-center justify-center group focus:ring-4 focus:ring-white focus:ring-opacity-50"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 25px 50px -12px rgba(255, 255, 255, 0.8)",
                  background: "#f8fafc"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/auth/signup'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Get Started
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </motion.button>
              {/* <motion.button 
                className="border-2 border-white text-white px-6 sm:px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Schedule Demo
              </motion.button> */}
            </div>
          </motion.div>
        </div>
      </section>



      {/* Industry Request Form Modal */}
      <IndustryRequestForm isOpen={isIndustryFormOpen} onClose={closeIndustryForm} />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-4 space-x-3">
                <img 
                  src="/IconOnly_Transparent_NoBuffer.png" 
                  alt="Garnet Logo" 
                  className="w-8 h-8 object-contain filter brightness-0 invert"
                />
                <span className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Garnet</span>
                </span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                AI-powered vendor onboarding platform that helps sales teams close deals 50% faster with automated compliance responses.
              </p>
            </div>

            {/* Support */}
            <div className="md:justify-self-end md:text-right">
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li className="md:text-right"><a href="/privacy-policy" className="text-gray-300 hover:text-purple-400 transition-colors">Privacy Policy</a></li>
                <li className="md:text-right"><a href="/terms-of-service" className="text-gray-300 hover:text-purple-400 transition-colors">Terms and Conditions</a></li>
                <li>
                  <a 
                    href="https://www.linkedin.com/company/garnet-ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-purple-400 transition-colors flex items-center md:justify-end"
                  >
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Crookshanks Pvt. Limited. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
      );
  };

export default GarnetLandingPage; 