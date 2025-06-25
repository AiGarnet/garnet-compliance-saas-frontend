import React from 'react';
import { motion } from 'framer-motion';

interface ContactIllustrationProps {
  variant?: 'mobile' | 'team' | 'form';
  className?: string;
}

export const ContactIllustration: React.FC<ContactIllustrationProps> = ({ 
  variant = 'mobile', 
  className = '' 
}) => {
  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 2, 0, -2, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (variant === 'mobile') {
    return (
      <motion.div 
        className={`relative w-full h-full flex items-center justify-center ${className}`}
        variants={floatingVariants}
        animate="animate"
      >
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full max-w-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Circle */}
          <motion.circle
            cx="400"
            cy="300"
            r="280"
            fill="url(#bgGradient)"
            opacity="0.1"
            variants={pulseVariants}
            animate="animate"
          />
          
          {/* Mobile Phone */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <rect
              x="480"
              y="180"
              width="160"
              height="280"
              rx="20"
              fill="#2D3748"
            />
            <rect
              x="490"
              y="200"
              width="140"
              height="240"
              rx="8"
              fill="#F7FAFC"
            />
            {/* Screen Elements */}
            <rect x="500" y="210" width="120" height="20" rx="4" fill="#8B5CF6" opacity="0.8" />
            <rect x="500" y="240" width="80" height="12" rx="2" fill="#EC4899" opacity="0.6" />
            <rect x="500" y="260" width="100" height="12" rx="2" fill="#3B82F6" opacity="0.6" />
            <rect x="500" y="280" width="60" height="12" rx="2" fill="#8B5CF6" opacity="0.6" />
            
            {/* Home Button */}
            <circle cx="560" cy="450" r="8" fill="#CBD5E0" />
            
            {/* Speaker */}
            <rect x="540" y="195" width="40" height="3" rx="2" fill="#CBD5E0" />
          </motion.g>

          {/* Clock */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <circle cx="320" cy="220" r="60" fill="url(#clockGradient)" />
            <circle cx="320" cy="220" r="50" fill="#FFFFFF" />
            <circle cx="320" cy="220" r="5" fill="#8B5CF6" />
            {/* Clock hands */}
            <line x1="320" y1="220" x2="320" y2="190" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" />
            <line x1="320" y1="220" x2="340" y2="210" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" />
          </motion.g>

          {/* Email Envelope */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <rect x="180" y="350" width="120" height="80" rx="8" fill="url(#emailGradient)" />
            <polygon points="180,350 240,390 300,350" fill="#FFFFFF" opacity="0.9" />
            <rect x="190" y="365" width="100" height="3" rx="1" fill="#FFFFFF" opacity="0.7" />
            <rect x="190" y="375" width="80" height="3" rx="1" fill="#FFFFFF" opacity="0.7" />
            <rect x="190" y="385" width="60" height="3" rx="1" fill="#FFFFFF" opacity="0.7" />
          </motion.g>

          {/* Floating Message Bubbles */}
          <motion.g
            animate={{
              y: [-5, 5, -5],
              x: [0, 3, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ellipse cx="150" cy="280" rx="40" ry="25" fill="#8B5CF6" opacity="0.8" />
            <text x="150" y="285" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Hi!</text>
          </motion.g>

          <motion.g
            animate={{
              y: [5, -5, 5],
              x: [0, -3, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          >
            <ellipse cx="650" cy="350" rx="50" ry="30" fill="#EC4899" opacity="0.8" />
            <text x="650" y="355" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Contact</text>
          </motion.g>

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="emailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    );
  }

  if (variant === 'team') {
    return (
      <motion.div 
        className={`relative w-full h-full flex items-center justify-center ${className}`}
        variants={floatingVariants}
        animate="animate"
      >
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full max-w-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Elements */}
          <motion.circle
            cx="150"
            cy="100"
            r="30"
            fill="#EF4444"
            variants={pulseVariants}
            animate="animate"
          />
          
          {/* Main Contact Board */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <rect x="200" y="200" width="400" height="250" rx="15" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            
            {/* Board Sections */}
            <rect x="220" y="220" width="160" height="80" rx="8" fill="#93C5FD" opacity="0.7" />
            <rect x="400" y="220" width="180" height="40" rx="8" fill="#FDE68A" opacity="0.8" />
            <rect x="400" y="280" width="180" height="40" rx="8" fill="#FDE68A" opacity="0.8" />
            <rect x="220" y="320" width="160" height="50" rx="8" fill="#A7F3D0" opacity="0.7" />
            <rect x="400" y="340" width="80" height="50" rx="8" fill="#FBBF24" opacity="0.8" />
            <rect x="500" y="340" width="80" height="50" rx="8" fill="#FBBF24" opacity="0.8" />
            
            {/* Contact Us Label */}
            <rect x="420" y="380" width="140" height="30" rx="6" fill="#EF4444" />
            <text x="490" y="398" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">CONTACT US</text>
            
            {/* Icons */}
            <circle cx="250" cy="250" r="15" fill="#FFFFFF" />
            <circle cx="440" cy="240" r="8" fill="#FFFFFF" />
            <circle cx="520" cy="240" r="8" fill="#FFFFFF" />
            <circle cx="560" cy="240" r="8" fill="#FFFFFF" />
          </motion.g>

          {/* People */}
          <motion.g
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {/* Person 1 */}
            <circle cx="120" cy="420" r="25" fill="#8B5CF6" />
            <circle cx="120" cy="410" r="12" fill="#F7FAFC" />
            <rect x="105" y="445" width="30" height="40" rx="8" fill="#EF4444" />
            <rect x="110" y="485" width="20" height="30" fill="#2D3748" />
          </motion.g>

          <motion.g
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {/* Person 2 */}
            <circle cx="680" cy="420" r="25" fill="#EC4899" />
            <circle cx="680" cy="410" r="12" fill="#F7FAFC" />
            <rect x="665" y="445" width="30" height="40" rx="8" fill="#EF4444" />
            <rect x="670" y="485" width="20" height="30" fill="#2D3748" />
            
            {/* Megaphone */}
            <motion.g
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: "700px 400px" }}
            >
              <ellipse cx="700" cy="400" rx="20" ry="8" fill="#FBBF24" />
              <rect x="715" y="395" width="15" height="10" fill="#FBBF24" />
              <circle cx="740" cy="400" r="6" fill="#EF4444" />
            </motion.g>
          </motion.g>

          {/* Person 3 (on laptop) */}
          <motion.g
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <circle cx="550" cy="480" r="20" fill="#8B5CF6" />
            <circle cx="550" cy="475" r="10" fill="#F7FAFC" />
            <rect x="540" y="500" width="20" height="30" rx="6" fill="#3B82F6" />
            <rect x="530" y="530" width="40" height="25" rx="3" fill="#2D3748" />
            <rect x="535" y="520" width="30" height="20" rx="2" fill="#F7FAFC" />
          </motion.g>

          {/* Floating Elements */}
          <motion.circle
            cx="650"
            cy="150"
            r="15"
            fill="#34D399"
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Decorative Leaves */}
          <motion.g
            animate={{ rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ transformOrigin: "100px 500px" }}
          >
            <ellipse cx="100" cy="500" rx="25" ry="50" fill="#10B981" opacity="0.6" />
          </motion.g>

          <motion.g
            animate={{ rotate: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{ transformOrigin: "700px 520px" }}
          >
            <ellipse cx="700" cy="520" rx="30" ry="60" fill="#3B82F6" opacity="0.4" />
          </motion.g>
        </svg>
      </motion.div>
    );
  }

  // Form variant (default)
  return (
    <motion.div 
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      variants={floatingVariants}
      animate="animate"
    >
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full max-w-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <motion.circle
          cx="400"
          cy="300"
          r="250"
          fill="url(#formBgGradient)"
          opacity="0.1"
          variants={pulseVariants}
          animate="animate"
        />

        {/* Main Form Interface */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <rect x="200" y="150" width="400" height="300" rx="20" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          
          {/* Form Header */}
          <rect x="220" y="170" width="360" height="60" rx="10" fill="url(#headerGradient)" />
          <circle cx="280" cy="200" r="20" fill="#FFFFFF" opacity="0.9" />
          <rect x="320" y="185" width="100" height="8" rx="4" fill="#FFFFFF" opacity="0.8" />
          <rect x="320" y="205" width="60" height="6" rx="3" fill="#FFFFFF" opacity="0.6" />
          
          {/* Form Fields */}
          <rect x="230" y="260" width="150" height="25" rx="6" fill="#F7FAFC" stroke="#E2E8F0" />
          <rect x="400" y="260" width="150" height="25" rx="6" fill="#F7FAFC" stroke="#E2E8F0" />
          <rect x="230" y="300" width="320" height="25" rx="6" fill="#F7FAFC" stroke="#E2E8F0" />
          <rect x="230" y="340" width="320" height="60" rx="6" fill="#F7FAFC" stroke="#E2E8F0" />
          
          {/* Submit Button */}
          <rect x="230" y="420" width="320" height="20" rx="10" fill="url(#buttonGradient)" />
        </motion.g>

        {/* People Interacting */}
        <motion.g
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {/* Person 1 */}
          <circle cx="120" cy="350" r="30" fill="#3B82F6" />
          <circle cx="120" cy="340" r="15" fill="#F7FAFC" />
          <rect x="100" y="380" width="40" height="50" rx="10" fill="#8B5CF6" />
          <rect x="105" y="430" width="30" height="40" fill="#2D3748" />
        </motion.g>

        <motion.g
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {/* Person 2 */}
          <circle cx="680" cy="350" r="30" fill="#EC4899" />
          <circle cx="680" cy="340" r="15" fill="#F7FAFC" />
          <rect x="660" y="380" width="40" height="50" rx="10" fill="#EF4444" />
          <rect x="665" y="430" width="30" height="40" fill="#2D3748" />
        </motion.g>

        {/* Floating Connection Lines */}
        <motion.g
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <path d="M 150 350 Q 300 250 200 200" stroke="#8B5CF6" strokeWidth="2" fill="none" strokeDasharray="5,5" />
          <path d="M 650 350 Q 500 250 600 200" stroke="#EC4899" strokeWidth="2" fill="none" strokeDasharray="5,5" />
        </motion.g>

        {/* Floating Dots */}
        <motion.circle
          cx="240" cy="120"
          r="8"
          fill="#10B981"
          animate={{ y: [-5, 5, -5], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <motion.circle
          cx="560" cy="120"
          r="6"
          fill="#F59E0B"
          animate={{ y: [5, -5, 5], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="formBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
};

export default ContactIllustration; 