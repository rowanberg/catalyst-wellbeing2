'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, Copy, Check, QrCode, Share2, Gem, Zap } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeLib from 'qrcode';

interface WalletReceiveTabProps {
  wallet: any;
  currentStudent: any;
}

export function WalletReceiveTab({ wallet, currentStudent }: WalletReceiveTabProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'mind_gems' | 'fluxon'>('mind_gems');
  const [requestAmount, setRequestAmount] = useState('');
  const [paymentRequestUrl, setPaymentRequestUrl] = useState('');

  useEffect(() => {
    if (wallet?.walletAddress) {
      QRCodeLib.toDataURL(wallet.walletAddress, {
        width: 256,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      }).then(setQrCodeUrl);
    }
  }, [wallet?.walletAddress]);

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet?.walletAddress || '');
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyTag = () => {
    navigator.clipboard.writeText(wallet?.studentTag || '');
    setCopiedTag(true);
    toast.success('Student tag copied!');
    setTimeout(() => setCopiedTag(false), 2000);
  };

  const shareTag = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Student Tag',
        text: `Send me currency using my student tag: ${wallet?.studentTag}`,
      });
    } else {
      copyTag();
    }
  };

  const generatePaymentRequest = () => {
    if (!wallet?.studentTag) {
      toast.error('Student tag not available');
      return;
    }

    const amount = requestAmount ? parseFloat(requestAmount) : null;
    if (requestAmount && (isNaN(amount!) || amount! <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Create payment request data
    const paymentData = {
      studentTag: wallet.studentTag,
      currency: selectedCurrency,
      amount: amount,
      timestamp: Date.now(),
      recipientName: `${currentStudent?.firstName || ''} ${currentStudent?.lastName || ''}`.trim() || 'Student'
    };

    // Encode payment data for URL
    const encodedData = btoa(JSON.stringify(paymentData));
    
    // Generate payment link
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const paymentLink = `${baseUrl}/student/wallet/pay?data=${encodedData}`;

    // Generate user-friendly text
    const requestText = amount 
      ? `💰 Payment Request\n\nSend ${amount} ${selectedCurrency === 'mind_gems' ? 'Mind Gems' : 'Fluxon'} to ${paymentData.recipientName}\n\nStudent Tag: ${wallet.studentTag}\n\nClick to pay: ${paymentLink}`
      : `💰 Payment Request\n\nSend ${selectedCurrency === 'mind_gems' ? 'Mind Gems' : 'Fluxon'} to ${paymentData.recipientName}\n\nStudent Tag: ${wallet.studentTag}\n\nClick to pay: ${paymentLink}`;

    // Share or copy the payment request
    if (navigator.share) {
      navigator.share({
        title: 'Wells Wallet - Payment Request',
        text: requestText,
        url: paymentLink
      });
    } else {
      navigator.clipboard.writeText(requestText);
      toast.success('Payment link copied to clipboard!');
    }

    setPaymentRequestUrl(paymentLink);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
          <span className="hidden sm:inline">Receive Currency</span>
          <span className="sm:hidden">Receive</span>
        </h2>

        {/* Student Tag - Primary Method */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-400 rounded-2xl p-4 sm:p-6 text-center">
            <div className="inline-block p-2 sm:p-3 bg-purple-500/30 rounded-xl mb-2 sm:mb-3">
              <QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-purple-300" />
            </div>
            <h3 className="text-white/70 text-xs sm:text-sm mb-2">Your Student Tag</h3>
            <div className="bg-black/30 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 overflow-hidden">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-mono tracking-wide sm:tracking-wider break-all">
                {wallet?.studentTag || '000000000000'}
              </p>
              {(!wallet?.studentTag || wallet?.studentTag === '000000000000') && (
                <p className="text-red-300 text-xs mt-2">⚠️ No student tag assigned</p>
              )}
            </div>
            <p className="text-white/60 text-xs sm:text-sm mb-3 sm:mb-4 px-2">
              Share this 12-digit tag with classmates to receive payments
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={copyTag}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 sm:py-2 px-3 sm:px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                {copiedTag ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                <span className="hidden sm:inline">{copiedTag ? 'Copied!' : 'Copy Tag'}</span>
                <span className="sm:hidden">{copiedTag ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={shareTag}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white py-2.5 sm:py-2 px-3 sm:px-4 rounded-xl transition-opacity flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <h3 className="text-white/70 text-xs sm:text-sm mb-2 sm:mb-3">Wallet QR Code</h3>
          {qrCodeUrl && (
            <div className="bg-white p-3 sm:p-4 rounded-2xl mb-3 sm:mb-4">
              <img src={qrCodeUrl} alt="Wallet QR Code" className="w-32 h-32 sm:w-48 sm:h-48" />
            </div>
          )}
        </div>

        {/* Wallet Address */}
        <div className="bg-white/5 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-white/70 text-xs sm:text-sm mb-2">Wallet Address</p>
          <div className="flex items-start sm:items-center gap-2">
            <code className="text-white text-xs sm:text-sm flex-1 break-all leading-relaxed">
              {wallet?.walletAddress}
            </code>
            <button
              onClick={copyAddress}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 mt-0.5 sm:mt-0"
            >
              {copied ? (
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-white/50" />
              )}
            </button>
          </div>
        </div>

        {/* Payment Request Generator */}
        <div className="border-t border-white/10 pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">Request Payment</h3>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <button
              onClick={() => setSelectedCurrency('mind_gems')}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                selectedCurrency === 'mind_gems'
                  ? 'bg-purple-500/20 border-purple-400 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <Gem className={`h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 ${
                selectedCurrency === 'mind_gems' ? 'text-purple-300' : 'text-purple-400'
              }`} />
              <p className={`text-xs sm:text-sm text-center ${
                selectedCurrency === 'mind_gems' ? 'text-white font-medium' : 'text-white/70'
              }`}>Mind Gems</p>
            </button>
            <button
              onClick={() => setSelectedCurrency('fluxon')}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                selectedCurrency === 'fluxon'
                  ? 'bg-yellow-500/20 border-yellow-400 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <Zap className={`h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 ${
                selectedCurrency === 'fluxon' ? 'text-yellow-300' : 'text-yellow-400'
              }`} />
              <p className={`text-xs sm:text-sm text-center ${
                selectedCurrency === 'fluxon' ? 'text-white font-medium' : 'text-white/70'
              }`}>Fluxon</p>
            </button>
          </div>

          <div className="mb-3 sm:mb-4">
            <label className="text-white/70 text-xs sm:text-sm mb-2 block">Request Amount (Optional)</label>
            <input
              type="number"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              placeholder="Enter amount to request"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 text-sm sm:text-base"
              min="0"
              step="0.01"
            />
          </div>

          <button 
            onClick={generatePaymentRequest}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium py-2.5 sm:py-3 rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
          >
            Generate Payment Request
          </button>

          {/* Display generated payment request */}
          {paymentRequestUrl && (
            <div className="mt-3 sm:mt-4 p-3 bg-green-500/10 border border-green-400/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-300 text-xs sm:text-sm font-medium">Payment Link Generated:</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentRequestUrl);
                    toast.success('Link copied!');
                  }}
                  className="p-1 hover:bg-green-500/20 rounded text-green-300"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="bg-white/5 rounded-lg p-2 mb-2">
                <p className="text-white/80 text-xs break-all font-mono">{paymentRequestUrl}</p>
              </div>
              <p className="text-green-200/60 text-xs">
                💡 Share this link with classmates. When they click it, they'll be redirected to pay you directly!
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 sm:mt-6 bg-blue-500/10 border border-blue-400/30 rounded-xl p-3 sm:p-4">
          <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
            <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            How to Receive
          </h4>
          <ul className="text-white/60 text-xs sm:text-sm space-y-1">
            <li>• Share your <span className="text-purple-300 font-mono text-xs sm:text-sm">{wallet?.studentTag || '000000000000'}</span> with classmates</li>
            <li>• They can send you currency using your tag</li>
            <li>• Transactions appear instantly in your wallet</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
