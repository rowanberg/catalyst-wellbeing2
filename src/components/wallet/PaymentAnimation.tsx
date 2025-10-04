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
}

export function PaymentAnimation({ 
  isVisible, 
  paymentData, 
  onComplete, 
  onSend 
}: PaymentAnimationProps) {
  const [stage, setStage] = useState<'preparing' | 'sending' | 'success' | 'error'>('preparing');
  const [progress, setProgress] = useState(0);

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
          className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"
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

          <div className="relative flex flex-col items-center justify-center min-h-screen p-6">
            
            {/* Stage: Preparing */}
            {stage === 'preparing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="flex justify-center">
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className={`w-24 h-24 bg-gradient-to-r ${getCurrencyColor()} rounded-full flex items-center justify-center shadow-2xl`}
                  >
                    {getCurrencyIcon()}
                  </motion.div>
                </div>
                <div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-white mb-3"
                  >
                    Preparing Payment
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/70"
                  >
                    Securing your transaction...
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* Stage: Sending */}
            {stage === 'sending' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                {/* Main Icon */}
                <div className="flex justify-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.15, 1],
                      rotate: [0, 10, -10, 0] 
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-28 h-28 bg-gradient-to-r ${getCurrencyColor()} rounded-full flex items-center justify-center shadow-2xl`}
                  >
                    <Send className="h-14 w-14 text-white" />
                  </motion.div>
                </div>

                {/* Transaction Details */}
                <div className="space-y-6">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-white"
                  >
                    Sending Payment
                  </motion.h2>
                  
                  {/* Amount */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-center space-x-3 text-4xl font-bold text-white">
                      {getCurrencyIcon()}
                      <span>{paymentData.amount.toLocaleString()}</span>
                    </div>
                    <p className="text-white/60 text-lg">
                      {paymentData.currency === 'mind_gems' ? 'Mind Gems' : 'Fluxon'}
                    </p>
                  </motion.div>

                  {/* Recipient */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center space-x-3 bg-white/10 rounded-2xl py-4 px-6 backdrop-blur-sm"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white text-lg">{paymentData.recipientName}</p>
                      <p className="text-white/60 text-sm">Tag: {paymentData.recipientTag}</p>
                    </div>
                  </motion.div>

                  {/* Progress Bar */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-3 bg-gradient-to-r ${getCurrencyColor()} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-white/60 text-sm">{Math.round(progress)}% complete</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Stage: Success */}
            {stage === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex justify-center"
                >
                  <div className="w-28 h-28 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
                    <Check className="h-14 w-14 text-white" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <h2 className="text-4xl font-bold text-white">Payment Sent!</h2>
                  <p className="text-white/70 text-lg">Your transaction was successful</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-3 text-2xl font-semibold text-white">
                      {getCurrencyIcon()}
                      <span>{paymentData.amount.toLocaleString()}</span>
                    </div>
                    <p className="text-white/60">sent to {paymentData.recipientName}</p>
                  </div>
                </motion.div>

                {/* Confetti Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(25)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        y: 100, 
                        x: Math.random() * 400, 
                        opacity: 1,
                        scale: Math.random() * 0.8 + 0.5
                      }}
                      animate={{ 
                        y: -200, 
                        x: Math.random() * 400,
                        opacity: 0,
                        rotate: 720
                      }}
                      transition={{ 
                        duration: 2.5,
                        delay: Math.random() * 1,
                        ease: "easeOut"
                      }}
                      className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full"
                    />
                  ))}
                </div>
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
                  <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mt-4">
                    <p className="text-red-300 text-sm">
                      • Check your internet connection<br/>
                      • Verify you have sufficient balance<br/>
                      • Ensure the recipient tag is correct<br/>
                      • If wallet not found, refresh the page<br/>
                      • Try again in a few moments
                    </p>
                  </div>
                  
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
