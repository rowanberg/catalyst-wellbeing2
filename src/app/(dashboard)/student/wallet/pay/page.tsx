'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Gem, Zap, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { PinEntryScreen } from '@/components/wallet/PinEntryScreen';
import { PaymentAnimation } from '@/components/wallet/PaymentAnimation';

interface PaymentData {
  studentTag: string;
  currency: 'mind_gems' | 'fluxon';
  amount: number | null;
  timestamp: number;
  recipientName: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Parse payment data from URL
    const data = searchParams.get('data');
    if (data) {
      try {
        const decodedData = JSON.parse(atob(data));
        setPaymentData(decodedData);
      } catch (error) {
        setError('Invalid payment link');
        console.error('Error parsing payment data:', error);
      }
    } else {
      setError('No payment data found');
    }

    // Fetch user's wallet
    fetchWallet();
  }, [searchParams]);

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/student/wallet', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const getPaymentAmount = () => {
    if (paymentData?.amount) {
      return paymentData.amount;
    }
    return customAmount ? parseFloat(customAmount) : 0;
  };

  const canAffordPayment = () => {
    const amount = getPaymentAmount();
    if (!wallet || !amount) return false;
    
    if (paymentData?.currency === 'mind_gems') {
      return wallet.mindGemsBalance >= amount;
    } else {
      return wallet.fluxonBalance >= amount;
    }
  };

  const handlePayment = () => {
    const amount = getPaymentAmount();
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!canAffordPayment()) {
      toast.error('Insufficient balance');
      return;
    }

    setShowPinEntry(true);
  };

  // Handle PIN entered - proceed to payment animation (like existing flow)
  const handlePinEntered = (pin: string) => {
    setEnteredPin(pin);
    setShowPinEntry(false);
    setShowAnimation(true);
  };

  // Handle PIN entry cancel
  const handlePinCancel = () => {
    setShowPinEntry(false);
    setEnteredPin('');
  };

  // Actual payment function for the animation (like existing flow)
  const performPayment = async () => {
    if (isProcessing) {
      throw new Error('Transaction already in progress');
    }

    setIsProcessing(true);
    
    try {
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/student/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientTag: paymentData?.studentTag,
          amount: getPaymentAmount(),
          currencyType: paymentData?.currency,
          memo: `Payment via link to ${paymentData?.recipientName}`,
          transactionPassword: enteredPin,
          requestId
        }),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404 && result.error?.includes('wallet not found')) {
          throw new Error('Please set up your wallet first before sending currency');
        }
        throw new Error(result.error || 'Transaction failed');
      }

      return result;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle animation complete (like existing flow)
  const handleAnimationComplete = (success: boolean) => {
    setShowAnimation(false);
    
    if (success) {
      // Reset states
      setEnteredPin('');
      toast.success('Payment sent successfully!');
      // Redirect to wallet history
      router.push('/student/wallet?tab=history');
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Invalid Payment Link</h1>
          <p className="text-white/70">{error}</p>
          <button
            onClick={() => router.push('/student/wallet')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Go to Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="inline-block p-4 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-3xl mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Send className="h-12 w-12 text-white" />
          </motion.div>
          <p className="text-cyan-300 text-xl">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Payment Request</h1>
                <p className="text-white/70 text-sm">Review and confirm payment</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20">
            {/* Recipient Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{paymentData.recipientName}</p>
                <p className="text-white/60 text-sm font-mono">Tag: {paymentData.studentTag}</p>
              </div>
            </div>

            {/* Currency & Amount */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {paymentData.currency === 'mind_gems' ? (
                    <Gem className="h-5 w-5 text-purple-400" />
                  ) : (
                    <Zap className="h-5 w-5 text-yellow-400" />
                  )}
                  <span className="text-white font-medium">
                    {paymentData.currency === 'mind_gems' ? 'Mind Gems' : 'Fluxon'}
                  </span>
                </div>
                <div className="text-right">
                  {paymentData.amount ? (
                    <p className="text-2xl font-bold text-white">{paymentData.amount}</p>
                  ) : (
                    <div>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-right text-xl font-bold w-32"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Balance Check */}
            {wallet && (
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Your Balance:</span>
                  <span className="text-white font-medium">
                    {paymentData.currency === 'mind_gems' 
                      ? wallet.mindGemsBalance 
                      : wallet.fluxonBalance.toFixed(4)
                    }
                  </span>
                </div>
                {!canAffordPayment() && getPaymentAmount() > 0 && (
                  <div className="flex items-center gap-2 mt-2 text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Insufficient balance</span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={!canAffordPayment() || getPaymentAmount() <= 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getPaymentAmount() <= 0 ? 'Enter Amount' : 
               !canAffordPayment() ? 'Insufficient Balance' : 
               'Continue to Payment'}
            </button>
          </div>
        </motion.div>

        {/* PIN Entry Screen */}
        <PinEntryScreen
          isVisible={showPinEntry}
          onPinEntered={handlePinEntered}
          onCancel={handlePinCancel}
          recipientName={paymentData?.recipientName || 'Student'}
          amount={getPaymentAmount()}
          currency={paymentData?.currency || 'mind_gems'}
        />

        {/* Payment Animation */}
        <PaymentAnimation
          isVisible={showAnimation}
          onSend={performPayment}
          onComplete={handleAnimationComplete}
          paymentData={{
            recipientName: paymentData?.recipientName || 'Student',
            recipientTag: paymentData?.studentTag || '',
            amount: getPaymentAmount(),
            currency: paymentData?.currency || 'mind_gems',
            memo: `Payment via link to ${paymentData?.recipientName}`
          }}
        />
      </div>
    </div>
  );
}
