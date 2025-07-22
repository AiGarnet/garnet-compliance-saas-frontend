"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  Send,
  CheckCircle,
  ArrowLeft,
  Heart,
  Sparkles,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/components/ui/Toast';
import ContactIllustration from '@/components/ContactIllustration';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Using global showToast function instead of hook

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters long';
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit to Formspree
      const response = await fetch('https://formspree.io/f/xpwrorwk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          subject: formData.subject,
          message: formData.message,
          _replyto: formData.email
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        showToast('Thank you for contacting us. We\'ll get back to you within 1 business day.', 'success', 5000);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      showToast('Failed to send message. Please try again or contact us directly at rusha@garnetai.net', 'error', 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      subject: '',
      message: ''
    });
    setIsSubmitted(false);
  };

  // Animation variants for different elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Main Animated Background Gradient */}
        <motion.div 
          className="absolute inset-0 opacity-90"
          animate={{
            background: [
              "linear-gradient(135deg, #f3e8ff 0%, #fef7cd 25%, #fce7f3 50%, #e0f2fe 75%, #f3e8ff 100%)",
              "linear-gradient(135deg, #fce7f3 0%, #e0f2fe 25%, #f3e8ff 50%, #fef7cd 75%, #fce7f3 100%)",
              "linear-gradient(135deg, #e0f2fe 0%, #f3e8ff 25%, #fef7cd 50%, #fce7f3 75%, #e0f2fe 100%)",
              "linear-gradient(135deg, #f3e8ff 0%, #fef7cd 25%, #fce7f3 50%, #e0f2fe 75%, #f3e8ff 100%)"
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Secondary Gradient Layer */}
        <motion.div 
          className="absolute inset-0 opacity-40"
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)"
            ]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full opacity-25"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.25, 0.4, 0.25],
              x: [0, -25, 0],
              y: [0, 15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Additional floating shapes */}
          <motion.div
            className="absolute top-1/2 left-20 w-16 h-16 bg-gradient-to-r from-pink-300 to-blue-300 rounded-full opacity-20"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className="absolute top-1/3 right-20 w-20 h-20 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-15"
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.15, 0.25, 0.15],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Mesh gradient overlay */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 30%),
                radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 30%),
                radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 30%),
                radial-gradient(circle at 30% 70%, rgba(168, 85, 247, 0.1) 0%, transparent 30%)
              `
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Header with Back Navigation */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-white/30 sticky top-0 z-20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl font-bold">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Garnet</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {!isSubmitted ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Hero Section */}
              <motion.div 
                className="text-center mb-16"
                variants={itemVariants}
              >
                <motion.h1 
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
                  variants={itemVariants}
                >
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                    Let's Talk Security & Trust
                  </span>
                </motion.h1>
                <motion.p 
                  className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
                  variants={itemVariants}
                >
                  From framework alignment to audit readiness, Garnet helps you stay compliant and ahead. 
                  Ready to get started? Let's discuss your compliance needs.
                </motion.p>
              </motion.div>

                            {/* Main Content Grid */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Side - Custom SVG Illustration */}
                <motion.div
                  className="order-2 lg:order-1"
                  variants={itemVariants}
                >
                  {/* Custom Contact Illustration */}
                  <div className="relative bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 overflow-hidden min-h-[500px] lg:min-h-[600px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-blue-50/80 rounded-3xl"></div>
                    <div className="relative z-10 h-full flex items-center justify-center">
                      <ContactIllustration variant="team" className="w-full h-full max-w-lg" />
                    </div>
                    


                    <motion.div
                      className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md border border-white/40 rounded-xl p-4 shadow-lg"
                      animate={{
                        x: [0, -10, 0],
                        y: [0, 5, 0],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5 text-pink-600" />
                        <span className="text-sm font-semibold text-gray-700">AI-Powered</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Right Side - Enhanced Contact Form */}
                <motion.div
                  className="order-1 lg:order-2 bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 min-h-[500px] lg:min-h-[600px] flex flex-col"
                  variants={itemVariants}
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <div className="flex items-center mb-8">
                    <motion.div
                      className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl mr-4"
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(168, 85, 247, 0.4)",
                          "0 0 40px rgba(168, 85, 247, 0.6)",
                          "0 0 20px rgba(168, 85, 247, 0.4)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <MessageSquare className="h-7 w-7 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">Send Message</h2>
                      <p className="text-base text-gray-600 mt-1">Let's discuss your compliance requirements</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                    <div className="space-y-6 flex-grow">
                      <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm ${
                            validationErrors.name ? 'border-red-300 bg-red-50/80' : 'border-white/50 focus:border-purple-500 hover:border-purple-300'
                          }`}
                          placeholder="Your full name"
                        />
                        {validationErrors.name && (
                          <motion.p 
                            className="mt-1 text-sm text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {validationErrors.name}
                          </motion.p>
                        )}
                      </motion.div>
                      
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm ${
                            validationErrors.email ? 'border-red-300 bg-red-50/80' : 'border-white/50 focus:border-purple-500 hover:border-purple-300'
                          }`}
                          placeholder="your@email.com"
                        />
                        {validationErrors.email && (
                          <motion.p 
                            className="mt-1 text-sm text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {validationErrors.email}
                          </motion.p>
                        )}
                      </motion.div>
                    </div>
                    
                    <motion.div
                      whileFocus={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-white/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-purple-300"
                        placeholder="Your company name"
                      />
                    </motion.div>
                    
                    <motion.div
                      whileFocus={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-white/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-purple-300"
                        placeholder="How can we help you?"
                      />
                    </motion.div>
                    
                    <motion.div
                      whileFocus={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                        Message/Query *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none bg-white/80 backdrop-blur-sm ${
                          validationErrors.message ? 'border-red-300 bg-red-50/80' : 'border-white/50 focus:border-purple-500 hover:border-purple-300'
                        }`}
                        placeholder="Tell us more about your security and compliance requirements..."
                      />
                      {validationErrors.message && (
                        <motion.p 
                          className="mt-1 text-sm text-red-600"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {validationErrors.message}
                        </motion.p>
                      )}
                    </motion.div>
                    
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      animate={{
                        boxShadow: [
                          "0 4px 20px rgba(168, 85, 247, 0.3)",
                          "0 8px 40px rgba(168, 85, 247, 0.5)",
                          "0 4px 20px rgba(168, 85, 247, 0.3)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <motion.div 
                            className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Sending your message...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Send className="h-5 w-5 mr-3" />
                          Send Message
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: ['-100%', '100%'],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        </div>
                      )}
                    </motion.button>
                    </div>
                  </form>

                  {/* Contact Information Cards */}
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div
                      className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.02, boxShadow: '0 15px 20px -5px rgba(139, 92, 246, 0.1)' }}
                    >
                      <div className="flex items-center mb-2">
                        <Mail className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="text-sm font-semibold text-gray-900">Direct Email</span>
                      </div>
                      <a 
                        href="mailto:rusha@garnetai.net"
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                      >
                        rusha@garnetai.net
                      </a>
                    </motion.div>

                    <motion.div
                      className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.02, boxShadow: '0 15px 20px -5px rgba(59, 130, 246, 0.1)' }}
                    >
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-semibold text-gray-900">Response Time</span>
                      </div>
                      <span className="text-sm text-blue-600 font-medium">
                        Within 1 business day
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              </div>


            </motion.div>
          ) : (
            /* Success Message */
            <motion.div
              className="text-center max-w-2xl mx-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="bg-gradient-to-r from-green-400 to-blue-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <CheckCircle className="h-12 w-12 text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-4xl font-bold text-gray-900 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Message Sent Successfully!
              </motion.h1>
              <motion.p 
                className="text-lg text-gray-600 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Thank you for reaching out to us. We've received your message and will get back to you soon.
              </motion.p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={resetForm}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  Send Another Message
                </motion.button>
                <Link
                  href="/"
                  className="border-2 border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-all duration-300 text-center"
                >
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                  >
                    Back to Home
                  </motion.span>
                </Link>
              </div>
            </motion.div>
          )}
        </main>
      </div>
  );
};

export default ContactPage;