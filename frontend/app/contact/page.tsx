"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Phone,
  Send,
  CheckCircle,
  ArrowLeft,
  Heart
} from 'lucide-react';
import Link from 'next/link';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header with Back Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Hero Section */}
            <div className="text-center mb-16">
              <motion.h1 
                className="text-4xl sm:text-5xl font-bold mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Get support on AI compliance
                </span>
              </motion.h1>
              <motion.p 
                className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                From framework alignment to audit readiness, Garnet helps you stay compliant and ahead. 
                Contact us and we'll follow up within 1 business day.
              </motion.p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Contact Form */}
              <motion.div
                className="bg-white rounded-2xl shadow-xl p-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="flex items-center mb-6">
                  <MessageSquare className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-2xl font-semibold text-gray-900">Send Message</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="Your company name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="How can we help you?"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Tell us more about your requirements..."
                    />
                  </div>
                  
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </div>
                    )}
                  </motion.button>
                </form>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {/* Direct Contact */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-center mb-6">
                    <Mail className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Direct Contact</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Or drop us a message via email directly.
                  </p>
                  <a 
                    href="mailto:rusha@garnetai.net"
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    rusha@garnetai.net
                  </a>
                </div>

                {/* Response Time */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                  <div className="flex items-center mb-4">
                    <Clock className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Response Time</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    We typically respond to all inquiries within 1 business day.
                  </p>
                  <div className="text-sm text-purple-600 font-medium">
                    Priority support available for enterprise customers
                  </div>
                </div>

                {/* About Garnet */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">About Garnet</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Garnet is an AI-powered vendor compliance platform designed to help businesses use the power of AI safely and responsibly. 
                    Our platform ensures compliance and robust AI management without compromising on security.
                  </p>
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <Heart className="h-4 w-4 text-red-500 mr-1" />
                    made with love for compliance teams
                  </div>
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
              className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <CheckCircle className="h-10 w-10 text-green-600" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Message Sent Successfully!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for reaching out to us. We've received your message and will get back to you within 1 business day.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={resetForm}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Send Another Message
              </motion.button>
              <Link
                href="/"
                className="border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all duration-300 text-center"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ContactPage; 