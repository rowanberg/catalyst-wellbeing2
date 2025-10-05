'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, X, Gem, Zap, User } from 'lucide-react';

interface PaymentData {
  recipientName: string;
  recipientTag: string;
  amount: number;
  currency: 'mind_gems' | 'fluxon';
  memo?: string;
}

interface PaymentAnimationProps {
  isVisible: boolean;
  paymentData: PaymentData;
  onComplete: (success: boolean) => void;
  onSend: () => Promise<void>;
  errorMessage?: string;
}

export function PaymentAnimation({ 
  isVisible, 
  paymentData, 
  onComplete, 
  onSend,
  errorMessage 
}: PaymentAnimationProps) {
  const [stage, setStage] = useState<'preparing' | 'sending' | 'success' | 'error'>('preparing');
  const [progress, setProgress] = useState(0);

  // Hide bottom navigation bar when animation is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      // Hide bottom bar on mobile
      const bottomBar = document.querySelector('[data-bottom-nav]');
      if (bottomBar) {
        (bottomBar as HTMLElement).style.display = 'none';
      }
    } else {
      document.body.style.overflow = '';
      // Show bottom bar again
      const bottomBar = document.querySelector('[data-bottom-nav]');
      if (bottomBar) {
        (bottomBar as HTMLElement).style.display = '';
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      const bottomBar = document.querySelector('[data-bottom-nav]');
      if (bottomBar) {
        (bottomBar as HTMLElement).style.display = '';
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setStage('preparing');
      setProgress(0);
      return;
    }

    let isCancelled = false;

    const sequence = async () => {
      if (isCancelled) return;
      
      setStage('preparing');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (isCancelled) return;

      setStage('sending');
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 15;
        });
      }, 150);

      try {
        await onSend();
        
        if (isCancelled) return;
        
        clearInterval(progressInterval);
        setProgress(100);
        
        await new Promise(resolve => setTimeout(resolve, 600));
        
        if (isCancelled) return;
        setStage('success');
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        if (isCancelled) return;
        onComplete(true);
        
      } catch (error) {
        if (isCancelled) return;
        
        console.error('Payment failed:', error);
        clearInterval(progressInterval);
        setStage('error');
        
        // Show error for 4 seconds then close
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        if (isCancelled) return;
        onComplete(false);
      }
    };

    sequence();

    return () => {
      isCancelled = true;
    };
  }, [isVisible]);

  const getCurrencyIcon = () => {
    return paymentData.currency === 'mind_gems' ? (
      <Gem className="h-12 w-12 text-white" />
    ) : (
      <Zap className="h-12 w-12 text-white" />
    );
  };

  const getCurrencyColor = () => {
    return paymentData.currency === 'mind_gems' 
      ? 'from-purple-500 to-pink-500' 
      : 'from-yellow-500 to-orange-500';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"
        >
          {/* Modern Animated Background */}
          <div className="absolute inset-0">
            <motion.div
              animate={{ 
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"
            />
            <motion.div
              animate={{ 
                x: [0, -80, 0],
                y: [0, 60, 0],
                scale: [1, 0.8, 1]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-32 right-16 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"
            />
          </div>

          <div className="relative flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
            
            {/* Stage: Preparing */}
            {stage === 'preparing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center space-y-8"
              >
                {/* Crypto-style Icon with Pulse */}
                <div className="flex justify-center">
                  <motion.div
                    className="relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    {/* Outer glow rings */}
                    <motion.div
                      className={`absolute inset-0 w-24 sm:w-32 h-24 sm:h-32 -m-3 sm:-m-4 bg-gradient-to-r ${getCurrencyColor()} rounded-full opacity-20 blur-xl`}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className={`absolute inset-0 w-20 sm:w-28 h-20 sm:h-28 -m-1.5 sm:-m-2 bg-gradient-to-r ${getCurrencyColor()} rounded-full opacity-30 blur-lg`}
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    />
                    
                    {/* Main icon container */}
                    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br ${getCurrencyColor()} rounded-full flex items-center justify-center shadow-2xl border-2 sm:border-4 border-white/20`}>
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12">
                          {getCurrencyIcon()}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Text content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 px-4">
                    Initializing Transaction
                  </h2>
                  <p className="text-white/70 text-base sm:text-lg px-4">
                    Securing your payment on the blockchain...
                  </p>
                  
                  {/* Loading dots */}
                  <div className="flex justify-center gap-2 mt-6">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-white/60 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Stage: Sending */}
            {stage === 'sending' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center space-y-6 sm:space-y-8 max-w-md mx-auto w-full px-4"
              >
                {/* Crypto Transaction Icon */}
                <div className="flex justify-center">
                  <motion.div className="relative">
                    {/* Animated blockchain network effect */}
                    <svg className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 -m-4 sm:-m-6" viewBox="0 0 160 160">
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="none"
                        stroke="url(#gradient1)"
                        strokeWidth="2"
                        strokeDasharray="8 4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.6, rotate: 360 }}
                        transition={{ pathLength: { duration: 2 }, rotate: { duration: 20, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.5 } }}
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="url(#gradient2)"
                        strokeWidth="1"
                        strokeDasharray="4 8"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.4, rotate: -360 }}
                        transition={{ pathLength: { duration: 2, delay: 0.3 }, rotate: { duration: 25, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.5, delay: 0.3 } }}
                      />
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Center icon */}
                    <motion.div
                      className={`relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br ${getCurrencyColor()} rounded-full flex items-center justify-center shadow-2xl border-2 sm:border-4 border-white/20`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Send className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Transaction Details */}
                <motion.div 
                  className="space-y-4 sm:space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-white px-2">
                    Broadcasting Transaction
                  </h2>
                  
                  {/* Amount Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
                    <p className="text-white/60 text-xs sm:text-sm mb-2">Amount</p>
                    <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                      <div className={`p-1.5 sm:p-2 bg-gradient-to-br ${getCurrencyColor()} rounded-lg flex items-center justify-center`}>
                        {paymentData.currency === 'mind_gems' ? (
                          <Gem className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        ) : (
                          <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        )}
                      </div>
                      <span className="text-3xl sm:text-4xl font-bold text-white">
                        {paymentData.amount.toLocaleString()}
                      </span>
                      <span className="text-white/60 text-lg sm:text-xl">
                        {paymentData.currency === 'mind_gems' ? 'GEMS' : 'FLX'}
                      </span>
                    </div>
                  </div>

                  {/* Recipient Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20">
                    <p className="text-white/60 text-xs sm:text-sm mb-2 sm:mb-3">Sending to</p>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-white text-base sm:text-lg truncate">{paymentData.recipientName}</p>
                        <p className="text-white/60 text-xs sm:text-sm truncate">@{paymentData.recipientTag}</p>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Network Animation */}
                  <div className="relative h-32 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                    {/* Network nodes */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 128">
                      {/* Connecting lines */}
                      {[
                        { x1: 50, y1: 64, x2: 150, y2: 40 },
                        { x1: 50, y1: 64, x2: 150, y2: 88 },
                        { x1: 150, y1: 40, x2: 250, y2: 64 },
                        { x1: 150, y1: 88, x2: 250, y2: 64 },
                        { x1: 250, y1: 64, x2: 350, y2: 40 },
                        { x1: 250, y1: 64, x2: 350, y2: 88 },
                      ].map((line, i) => (
                        <motion.line
                          key={i}
                          x1={line.x1}
                          y1={line.y1}
                          x2={line.x2}
                          y2={line.y2}
                          stroke="url(#lineGradient)"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.6 }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        />
                      ))}
                      
                      {/* Network nodes */}
                      {[
                        { cx: 50, cy: 64, delay: 0 },
                        { cx: 150, cy: 40, delay: 0.2 },
                        { cx: 150, cy: 88, delay: 0.2 },
                        { cx: 250, cy: 64, delay: 0.4 },
                        { cx: 350, cy: 40, delay: 0.6 },
                        { cx: 350, cy: 88, delay: 0.6 },
                      ].map((node, i) => (
                        <g key={i}>
                          {/* Outer pulse ring */}
                          <motion.circle
                            cx={node.cx}
                            cy={node.cy}
                            r="12"
                            fill="none"
                            stroke="url(#nodeGradient)"
                            strokeWidth="2"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0.8, 0, 0.8]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              delay: node.delay,
                              ease: "easeInOut"
                            }}
                            style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                          />
                          {/* Node circle */}
                          <motion.circle
                            cx={node.cx}
                            cy={node.cy}
                            r="6"
                            fill="url(#nodeGradient)"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                              type: "spring",
                              stiffness: 200,
                              delay: node.delay 
                            }}
                            style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                          />
                          {/* Inner glow */}
                          <motion.circle
                            cx={node.cx}
                            cy={node.cy}
                            r="3"
                            fill="white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ 
                              duration: 1.5,
                              repeat: Infinity,
                              delay: node.delay 
                            }}
                          />
                        </g>
                      ))}
                      
                      {/* Data packets moving through network */}
                      {[0, 1, 2].map((i) => (
                        <motion.circle
                          key={`packet-${i}`}
                          r="4"
                          fill="#22D3EE"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: [0, 1, 1, 0],
                            cx: [50, 150, 250, 350],
                            cy: [64, i % 2 === 0 ? 40 : 88, 64, i % 2 === 0 ? 40 : 88]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 1,
                            ease: "linear"
                          }}
                        />
                      ))}
                      
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
                          <stop offset="50%" stopColor="#EC4899" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6" />
                        </linearGradient>
                        <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Status text overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="flex items-center space-x-2">
                          <motion.div
                            className="w-2 h-2 bg-cyan-400 rounded-full"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <span className="text-white text-sm font-semibold">
                            Verifying on network...
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Stage: Success */}
            {stage === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center space-y-6 sm:space-y-8 max-w-md mx-auto w-full px-4"
              >
                {/* Success Icon with Checkmark */}
                <motion.div
                  className="flex justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                >
                  <div className="relative">
                    {/* Success glow */}
                    <motion.div
                      className="absolute inset-0 w-24 sm:w-32 h-24 sm:h-32 -m-1.5 sm:-m-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-30 blur-2xl"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    
                    {/* Checkmark circle */}
                    <motion.div
                      className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl border-2 sm:border-4 border-white/20"
                      initial={{ rotate: -180 }}
                      animate={{ rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <motion.div
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <Check className="h-12 w-12 sm:h-14 sm:w-14 text-white" strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Success Message */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="px-2">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Transaction Confirmed</h2>
                    <p className="text-green-400 text-base sm:text-lg font-semibold">Payment successfully sent</p>
                  </div>
                  
                  {/* Transaction Summary Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 space-y-3 sm:space-y-4">
                    {/* Amount */}
                    <div className="flex items-center justify-between py-2 sm:py-3 border-b border-white/10">
                      <span className="text-white/60 text-sm sm:text-base">Amount</span>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <div className={`p-1 sm:p-1.5 bg-gradient-to-br ${getCurrencyColor()} rounded-lg flex items-center justify-center`}>
                          {paymentData.currency === 'mind_gems' ? (
                            <Gem className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          ) : (
                            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          )}
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          {paymentData.amount.toLocaleString()}
                        </span>
                        <span className="text-white/60 text-sm sm:text-base">
                          {paymentData.currency === 'mind_gems' ? 'GEMS' : 'FLX'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Recipient */}
                    <div className="flex items-center justify-between py-2 sm:py-3">
                      <span className="text-white/60 text-sm sm:text-base">Recipient</span>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <span className="text-white font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{paymentData.recipientName}</span>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center space-x-2 bg-green-500/20 border border-green-400/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs sm:text-sm font-semibold">Confirmed on Wells Chain</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* Stage: Error */}
            {stage === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                    className="w-28 h-28 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl"
                  >
                    <X className="h-14 w-14 text-white" />
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-white">Payment Failed</h2>
                  <p className="text-white/70">The transaction could not be completed.</p>
                  
                  {/* Specific Error Message */}
                  {errorMessage && (
                    <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <X className="h-5 w-5 text-red-400" />
                        <h3 className="text-red-300 font-semibold">Error Details</h3>
                      </div>
                      <p className="text-red-200">{errorMessage}</p>
                      
                      {/* PIN-specific help */}
                      {(errorMessage.toLowerCase().includes('password') || 
                        errorMessage.toLowerCase().includes('pin') || 
                        errorMessage.toLowerCase().includes('incorrect') ||
                        errorMessage.toLowerCase().includes('invalid')) && (
                        <div className="mt-3 p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
                          <p className="text-orange-200 text-sm">
                            💡 <strong>PIN Help:</strong><br/>
                            • Make sure you entered your 6-digit wallet PIN correctly<br/>
                            • Check if Caps Lock is on<br/>
                            • Try typing slowly to avoid mistakes<br/>
                            • If you forgot your PIN, you may need to reset your wallet
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* General troubleshooting when no specific error */}
                  {!errorMessage && (
                    <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mt-4">
                      <p className="text-red-300 text-sm">
                        • Check your internet connection<br/>
                        • Verify you have sufficient balance<br/>
                        • Ensure the recipient tag is correct<br/>
                        • If wallet not found, refresh the page<br/>
                        • Try again in a few moments
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => window.location.reload()}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl transition-colors font-medium"
                    >
                      Refresh Page
                    </button>
                    <button
                      onClick={() => window.location.href = '/student/wallet/create'}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl transition-colors font-medium"
                    >
                      Set Up Wallet
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
