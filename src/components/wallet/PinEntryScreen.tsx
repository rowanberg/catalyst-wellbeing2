'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Trash2, ArrowLeft } from 'lucide-react';

interface PinEntryScreenProps {
  isVisible: boolean;
  onPinEntered: (pin: string) => void;
  onCancel: () => void;
  recipientName: string;
  amount: number;
  currency: 'mind_gems' | 'fluxon';
}

export function PinEntryScreen({ 
  isVisible, 
  onPinEntered, 
  onCancel, 
  recipientName, 
  amount, 
  currency 
}: PinEntryScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastClickTime = useRef(0);
  const debounceDelay = 200; // 200ms debounce

  useEffect(() => {
    if (isVisible) {
      setPin('');
      setError('');
      // Focus first input when visible
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [isVisible]);

  const handleNumberClick = (number: string) => {
    const now = Date.now();
    
    // Debouncing: Ignore clicks that are too close together
    if (now - lastClickTime.current < debounceDelay || isProcessing) {
      return;
    }
    
    lastClickTime.current = now;
    
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    if (pin.length < 6) {
      const newPin = pin + number;
      setPin(newPin);
      setError('');
      
      // Auto-submit when 6 digits entered
      if (newPin.length === 6) {
        setIsProcessing(true);
        setTimeout(() => {
          onPinEntered(newPin);
          setIsProcessing(false);
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    const now = Date.now();
    if (now - lastClickTime.current < debounceDelay || isProcessing) {
      return;
    }
    lastClickTime.current = now;
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    const now = Date.now();
    if (now - lastClickTime.current < debounceDelay || isProcessing) {
      return;
    }
    lastClickTime.current = now;
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    
    setPin('');
    setError('');
  };

  const shakeOnError = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  useEffect(() => {
    if (error) {
      shakeOnError();
    }
  }, [error]);

  const getCurrencyColor = () => {
    return currency === 'mind_gems' 
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
          className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)`,
              backgroundSize: '50px 50px'
            }} />
          </div>

          {/* Cancel Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onCancel}
            className="absolute top-6 left-6 z-10 p-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>

          <div className="relative flex flex-col justify-center min-h-screen p-4 sm:p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`w-full max-w-sm mx-auto ${isShaking ? 'animate-shake' : ''}`}
            >
              {/* Main Content - No Card */}
              <div className="px-4 sm:px-6">
                
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-6"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-r ${getCurrencyColor()} rounded-full flex items-center justify-center shadow-lg`}>
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Enter Transaction PIN</h2>
                  <p className="text-white/70 text-xs sm:text-sm px-4">
                    Sending <span className="font-semibold">{amount.toLocaleString()}</span> {currency === 'mind_gems' ? 'gems' : 'FLX'} to <span className="font-semibold">{recipientName}</span>
                  </p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center mb-8 sm:mb-12">
                  <div className="flex space-x-2 sm:space-x-3">
                    {[...Array(6)].map((_, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + (index * 0.05) }}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                          pin.length > index
                            ? 'bg-blue-500/20 border-blue-400 shadow-lg'
                            : 'bg-white/5 border-white/20'
                        }`}
                      >
                        {pin.length > index && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full"
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                  >
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                    <motion.button
                      key={number}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + ((number - 1) * 0.03) }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNumberClick(number.toString())}
                      disabled={isProcessing}
                      className="h-14 sm:h-16 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl border border-white/20 text-white text-lg sm:text-xl font-semibold transition-all duration-200 backdrop-blur-sm touch-manipulation select-none disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none'
                      }}
                    >
                      {number}
                    </motion.button>
                  ))}
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClear}
                    disabled={isProcessing}
                    className="h-14 sm:h-16 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl border border-white/20 text-white transition-all duration-200 backdrop-blur-sm flex items-center justify-center touch-manipulation select-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </motion.button>
                  
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.73 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNumberClick('0')}
                    disabled={isProcessing}
                    className="h-14 sm:h-16 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl border border-white/20 text-white text-lg sm:text-xl font-semibold transition-all duration-200 backdrop-blur-sm touch-manipulation select-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    0
                  </motion.button>
                  
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.76 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBackspace}
                    disabled={isProcessing}
                    className="h-14 sm:h-16 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl border border-white/20 text-white transition-all duration-200 backdrop-blur-sm flex items-center justify-center touch-manipulation select-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Hint */}
                <div className="text-center mt-6">
                  <p className="text-white/50 text-xs">
                    Enter your 6-digit transaction PIN
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Custom shake animation */}
          <style jsx global>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
              20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            .animate-shake {
              animation: shake 0.5s ease-in-out;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
