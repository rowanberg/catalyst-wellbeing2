'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Gem, Zap, Hash, User, CheckCircle, Loader, AlertCircle, QrCode, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentAnimation } from './PaymentAnimation';
import { PinEntryScreen } from './PinEntryScreen';
import { QRScanner } from './QRScanner';

interface WalletSendTabProps {
  wallet: any;
  onSend?: (data: any) => void; // Made optional since we handle API call internally
  isProcessing: boolean;
  onSuccess?: () => void; // Callback to refresh wallet data after successful payment
}

interface RecipientStudent {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  studentTag: string;
  walletAddress: string;
}

export function WalletSendTab({ wallet, onSend, isProcessing, onSuccess }: WalletSendTabProps) {
  const [sendMethod, setSendMethod] = useState<'tag' | 'address'>('tag');
  const [recipientTag, setRecipientTag] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
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
  const [paymentError, setPaymentError] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);

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

      // Success - transaction completed
      // Note: We don't call onSend() here to avoid duplicate API calls
      // The API call above already handles the transaction
      
      return result;
    } catch (error) {
      console.error('Payment error:', error);
      // Capture the error message for display in animation
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      setPaymentError(errorMessage);
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
      setWalletAddress('');
      setAmount('');
      setMemo('');
      setRecipient(null);
      setTagLookupStatus('idle');
      setEnteredPin('');
      setPaymentError('');
      toast.success('Payment sent successfully!');
      
      // Call onSuccess callback to refresh wallet data in parent
      if (onSuccess) {
        onSuccess();
      }
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleQRScan = (scannedData: string) => {
    setWalletAddress(scannedData);
    setShowQRScanner(false);
    toast.success('Wallet address scanned successfully!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-4xl mx-auto"
    >
      <motion.div 
        className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
        whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <motion.div
              className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Send className="h-6 w-6 text-white" />
            </motion.div>
            Send Currency
          </h2>
          <p className="text-white/60 text-sm mt-2 ml-1">Transfer Mind Gems or Fluxon to classmates</p>
        </motion.div>

        {/* Currency Selection */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <label className="text-white/90 text-sm font-semibold mb-3 block flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
            Select Currency
          </label>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              onClick={() => setCurrency('mind_gems')}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${
                currency === 'mind_gems'
                  ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/20 border-purple-400 shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {/* Animated background glow */}
              {currency === 'mind_gems' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <div className="relative z-10">
                <motion.div
                  animate={currency === 'mind_gems' ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Gem className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                </motion.div>
                <p className="text-white font-bold text-lg">Mind Gems</p>
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-white/50 text-xs">Balance</p>
                  <p className="text-white font-semibold text-xl">
                    {wallet?.mindGemsBalance?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              {currency === 'mind_gems' && (
                <motion.div
                  className="absolute top-2 right-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </motion.div>
              )}
            </motion.button>
            <motion.button
              onClick={() => setCurrency('fluxon')}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${
                currency === 'fluxon'
                  ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/20 border-yellow-400 shadow-lg shadow-yellow-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {/* Animated background glow */}
              {currency === 'fluxon' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <div className="relative z-10">
                <motion.div
                  animate={currency === 'fluxon' ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                </motion.div>
                <p className="text-white font-bold text-lg">Fluxon</p>
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-white/50 text-xs">Balance</p>
                  <p className="text-white font-semibold text-xl">
                    {wallet?.fluxonBalance?.toFixed(4) || '0.0000'}
                  </p>
                </div>
              </div>
              {currency === 'fluxon' && (
                <motion.div
                  className="absolute top-2 right-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </motion.div>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Send Method Selector */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <label className="text-white/90 text-sm font-semibold mb-3 block flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></div>
            Send To
          </label>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              onClick={() => setSendMethod('tag')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                sendMethod === 'tag'
                  ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <Hash className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-white font-semibold text-sm">Student Tag</p>
              <p className="text-white/50 text-xs mt-1">12-digit tag</p>
            </motion.button>
            <motion.button
              onClick={() => setSendMethod('address')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                sendMethod === 'address'
                  ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <Wallet className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-white font-semibold text-sm">Wallet Address</p>
              <p className="text-white/50 text-xs mt-1">Direct transfer</p>
            </motion.button>
          </div>
        </motion.div>

        {/* Recipient Student Tag */}
        {sendMethod === 'tag' && (
          <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <label className="text-white/90 text-sm font-semibold mb-3 block flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
            Recipient Student Tag *
          </label>
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
            <input
              type="text"
              value={recipientTag}
              onChange={(e) => handleTagChange(e.target.value)}
              placeholder="Enter 12-digit student tag"
              className={`w-full pl-12 pr-14 py-4 bg-black/30 border-2 rounded-2xl text-white text-lg placeholder-white/40 focus:outline-none transition-all duration-300 ${
                tagLookupStatus === 'found' 
                  ? 'border-green-400 focus:border-green-400 shadow-lg shadow-green-500/20' 
                  : tagLookupStatus === 'not_found' 
                  ? 'border-red-400 focus:border-red-400 shadow-lg shadow-red-500/20'
                  : 'border-white/20 focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/20'
              }`}
              maxLength={12}
            />
            
            {/* Status Icon with Animation */}
            <motion.div 
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              {tagLookupStatus === 'loading' && (
                <Loader className="h-5 w-5 text-blue-400 animate-spin" />
              )}
              {tagLookupStatus === 'found' && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </motion.div>
              )}
              {tagLookupStatus === 'not_found' && (
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </motion.div>
              )}
              {tagLookupStatus === 'error' && (
                <AlertCircle className="h-5 w-5 text-orange-400" />
              )}
            </motion.div>
          </motion.div>

          {/* Status Messages with Animation */}
          <AnimatePresence mode="wait">
            {tagLookupStatus === 'loading' && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-blue-400 text-sm flex items-center gap-2 mt-3"
              >
                <Loader className="h-4 w-4 animate-spin" />
                Looking up student...
              </motion.p>
            )}
            {tagLookupStatus === 'not_found' && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-400 text-sm flex items-center gap-2 mt-3"
              >
                <AlertCircle className="h-4 w-4" />
                Student not found or doesn't have a wallet
              </motion.p>
            )}
            {tagLookupStatus === 'error' && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-orange-400 text-sm flex items-center gap-2 mt-3"
              >
                <AlertCircle className="h-4 w-4" />
                Error looking up student. Please try again.
              </motion.p>
            )}
            {tagLookupStatus === 'idle' && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-white/50 text-sm mt-3"
              >
                Enter the recipient's 12-digit student tag
              </motion.p>
            )}
          </AnimatePresence>

          {/* Recipient Display with Enhanced Animation */}
          <AnimatePresence>
            {recipient && tagLookupStatus === 'found' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="mt-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-2 border-green-400/40 rounded-2xl p-5 shadow-lg shadow-green-500/10"
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
          </AnimatePresence>
        </motion.div>
        )}

        {/* Wallet Address Input with QR Code */}
        {sendMethod === 'address' && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <label className="text-white/90 text-sm font-semibold mb-3 block flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
              Wallet Address *
            </label>
            <div className="flex gap-3">
              <motion.div 
                className="flex-1 relative"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                  <Wallet className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter wallet address (0x...)"
                  className="w-full pl-12 pr-4 py-4 bg-black/30 border-2 border-white/20 rounded-2xl text-white text-base placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:shadow-lg focus:shadow-cyan-500/20 transition-all duration-300"
                />
              </motion.div>
              
              {/* QR Code Scanner Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-2xl text-white font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-300 flex items-center gap-2"
                onClick={() => setShowQRScanner(true)}
              >
                <QrCode className="h-5 w-5" />
                <span className="hidden sm:inline">Scan QR</span>
              </motion.button>
            </div>
            <p className="text-white/50 text-sm mt-3 px-1">
              Enter the recipient's wallet address or scan their QR code
            </p>
          </motion.div>
        )}

        {/* Amount with Enhanced Design */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <label className="text-white/90 text-sm font-semibold mb-3 block flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full"></div>
            Amount *
          </label>
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 text-lg font-semibold">
              {currency === 'mind_gems' ? '💎' : '⚡'}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-4 bg-black/30 border-2 border-white/20 rounded-2xl text-white text-lg placeholder-white/40 focus:border-purple-400 focus:outline-none focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300"
              min="0.01"
              step="0.01"
            />
          </motion.div>
          <motion.div 
            className="flex justify-between items-center text-sm mt-3 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-white/60">
              Available Balance
            </span>
            <span className="text-white font-semibold">
              {currency === 'mind_gems' ? wallet?.mindGemsBalance?.toLocaleString() : wallet?.fluxonBalance?.toFixed(4)} {currency === 'mind_gems' ? 'gems' : 'FLX'}
            </span>
          </motion.div>
        </motion.div>

        {/* Memo with Enhanced Design */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <label className="text-white/90 text-sm font-semibold mb-3 block flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></div>
            Memo (Optional)
          </label>
          <motion.textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a note for this transaction..."
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="w-full px-4 py-4 bg-black/30 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:shadow-lg focus:shadow-cyan-500/20 resize-none transition-all duration-300"
            rows={3}
          />
        </motion.div>

        {/* Enhanced Send Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSend}
          disabled={!recipient || !amount || isProcessing || tagLookupStatus !== 'found'}
          className="relative w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-purple-500/30 overflow-hidden group"
        >
          {/* Animated background shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            animate={isProcessing ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isProcessing ? Infinity : 0, ease: "linear" }}
          >
            <Send className="h-6 w-6 relative z-10" />
          </motion.div>
          <span className="relative z-10">
            {isProcessing ? 'Processing...' : 'Continue to PIN'}
          </span>
        </motion.button>
      </motion.div>

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
        errorMessage={paymentError}
      />

      {/* QR Code Scanner */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </motion.div>
  );
}
