'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Gem, Zap, Hash, User, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentAnimation } from './PaymentAnimation';
import { PinEntryScreen } from './PinEntryScreen';

interface WalletSendTabProps {
  wallet: any;
  onSend: (data: any) => void;
  isProcessing: boolean;
}

interface RecipientStudent {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  studentTag: string;
  walletAddress: string;
}

export function WalletSendTab({ wallet, onSend, isProcessing }: WalletSendTabProps) {
  const [recipientTag, setRecipientTag] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [recipient, setRecipient] = useState<RecipientStudent | null>(null);
  const [tagLookupStatus, setTagLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found' | 'error'>('idle');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [currencyBalance, setCurrencyBalance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState<'mind_gems' | 'fluxon'>('mind_gems');
  const [showAnimation, setShowAnimation] = useState(false);

  const lookupStudent = useCallback(async (tag: string) => {
    if (tag.length !== 12) {
      setTagLookupStatus('idle');
      setRecipient(null);
      return;
    }

    setTagLookupStatus('loading');
    try {
      const response = await fetch('/api/student/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentTag: tag }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecipient(data.student);
        setTagLookupStatus('found');
      } else {
        setRecipient(null);
        setTagLookupStatus('not_found');
      }
    } catch (error) {
      setRecipient(null);
      setTagLookupStatus('error');
    }
  }, []);

  // Handle tag input change
  const handleTagChange = (value: string) => {
    setRecipientTag(value);
    lookupStudent(value);
  };

  // Handle send - show PIN entry first
  const handleSend = () => {
    if (!recipient || !amount) {
      toast.error('Please fill all required fields');
      return;
    }

    if (tagLookupStatus !== 'found') {
      toast.error('Please enter a valid student tag');
      return;
    }

    setShowPinEntry(true);
  };

  // Handle PIN entered - proceed to payment animation
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

  // Actual send function for the animation
  const performSend = async () => {
    // Prevent double submissions
    if (isSubmitting) {
      throw new Error('Transaction already in progress');
    }

    setIsSubmitting(true);
    
    try {
      // Generate unique request ID to prevent duplicates
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Call the onSend function which returns the API response
      const response = await fetch('/api/student/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStudentTag: recipientTag,
          amount: parseFloat(amount),
          currencyType: currency,
          memo,
          password: enteredPin,
          requestId
        }),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404 && result.error?.includes('wallet not found')) {
          throw new Error('Please set up your wallet first before sending currency');
        }
        throw new Error(result.error || 'Transaction failed');
      }

      // Success - call parent onSend for any additional handling
      if (onSend) {
        onSend({
          toStudentTag: recipientTag,
          amount: parseFloat(amount),
          currencyType: currency,
          memo,
          password: enteredPin
        });
      }

      return result;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle animation complete
  const handleAnimationComplete = (success: boolean) => {
    setShowAnimation(false);
    
    if (success) {
      // Reset form on success
      setRecipientTag('');
      setAmount('');
      setMemo('');
      setRecipient(null);
      setTagLookupStatus('idle');
      setEnteredPin('');
      toast.success('Payment sent successfully!');
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Send className="h-6 w-6 text-purple-400" />
          Send Currency
        </h2>

        {/* Currency Selection */}
        <div className="mb-6">
          <label className="text-white/70 text-sm mb-2 block">Select Currency</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrency('mind_gems')}
              className={`p-4 rounded-xl border transition-all ${
                currency === 'mind_gems'
                  ? 'bg-purple-500/20 border-purple-400'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <Gem className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <p className="text-white font-medium">Mind Gems</p>
              <p className="text-white/50 text-sm mt-1">
                Balance: {wallet?.mindGemsBalance || 0}
              </p>
            </button>
            <button
              onClick={() => setCurrency('fluxon')}
              className={`p-4 rounded-xl border transition-all ${
                currency === 'fluxon'
                  ? 'bg-yellow-500/20 border-yellow-400'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <Zap className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-medium">Fluxon</p>
              <p className="text-white/50 text-sm mt-1">
                Balance: {wallet?.fluxonBalance?.toFixed(4) || '0.0000'}
              </p>
            </button>
          </div>
        </div>

        {/* Recipient Student Tag */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">
            Recipient Student Tag *
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              value={recipientTag}
              onChange={(e) => handleTagChange(e.target.value)}
              placeholder="Enter 12-digit student tag"
              className={`w-full pl-10 pr-12 py-3 bg-black/20 border rounded-xl text-white placeholder-white/50 focus:outline-none transition-colors ${
                tagLookupStatus === 'found' 
                  ? 'border-green-400 focus:border-green-400' 
                  : tagLookupStatus === 'not_found' 
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-white/20 focus:border-blue-400'
              }`}
              maxLength={12}
            />
            
            {/* Status Icon */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {tagLookupStatus === 'loading' && (
                <Loader className="h-4 w-4 text-blue-400 animate-spin" />
              )}
              {tagLookupStatus === 'found' && (
                <CheckCircle className="h-4 w-4 text-green-400" />
              )}
              {tagLookupStatus === 'not_found' && (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              {tagLookupStatus === 'error' && (
                <AlertCircle className="h-4 w-4 text-orange-400" />
              )}
            </div>
          </div>

          {/* Status Messages */}
          <div className="mt-2 min-h-[1rem]">
            {tagLookupStatus === 'loading' && (
              <p className="text-blue-400 text-xs flex items-center gap-1">
                <Loader className="h-3 w-3 animate-spin" />
                Looking up student...
              </p>
            )}
            {tagLookupStatus === 'not_found' && (
              <p className="text-red-400 text-xs">
                Student not found or doesn't have a wallet
              </p>
            )}
            {tagLookupStatus === 'error' && (
              <p className="text-orange-400 text-xs">
                Error looking up student. Please try again.
              </p>
            )}
            {tagLookupStatus === 'idle' && (
              <p className="text-white/50 text-xs">
                Enter the recipient's 12-digit student tag
              </p>
            )}
          </div>

          {/* Recipient Display */}
          {recipient && tagLookupStatus === 'found' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-green-500/20 border border-green-400/30 rounded-xl p-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">{recipient.name}</p>
                  <p className="text-green-300 text-sm">Tag: {recipient.studentTag}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400 ml-auto" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">
            Amount *
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
              min="0.01"
              step="0.01"
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-white/50">
              Available: {currency === 'mind_gems' ? wallet?.mindGemsBalance : wallet?.fluxonBalance} {currency === 'mind_gems' ? 'gems' : 'FLX'}
            </span>
          </div>
        </div>

        {/* Memo */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">
            Memo (Optional)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a note..."
            className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
            rows={3}
          />
        </div>


        {/* Send Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSend}
          disabled={!recipient || !amount || isProcessing || tagLookupStatus !== 'found'}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-opacity flex items-center justify-center gap-2"
        >
          <Send className="h-5 w-5" />
          {isProcessing ? 'Sending...' : 'Continue to PIN'}
        </motion.button>
      </div>

      {/* PIN Entry Screen */}
      <PinEntryScreen
        isVisible={showPinEntry}
        onPinEntered={handlePinEntered}
        onCancel={handlePinCancel}
        recipientName={recipient?.name || ''}
        amount={parseFloat(amount) || 0}
        currency={currency}
      />

      {/* Payment Animation */}
      <PaymentAnimation
        isVisible={showAnimation}
        paymentData={{
          recipientName: recipient?.name || '',
          recipientTag: recipientTag,
          amount: parseFloat(amount) || 0,
          currency: currency,
          memo: memo
        }}
        onSend={performSend}
        onComplete={handleAnimationComplete}
      />
    </motion.div>
  );
}
