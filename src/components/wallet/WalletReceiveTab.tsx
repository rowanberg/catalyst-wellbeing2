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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <ArrowDownLeft className="h-6 w-6 text-green-400" />
          Receive Currency
        </h2>

        {/* Student Tag - Primary Method */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-400 rounded-2xl p-6 text-center">
            <div className="inline-block p-3 bg-purple-500/30 rounded-xl mb-3">
              <QrCode className="h-8 w-8 text-purple-300" />
            </div>
            <h3 className="text-white/70 text-sm mb-2">Your Student Tag</h3>
            <div className="bg-black/30 rounded-xl p-4 mb-4">
              <p className="text-4xl font-bold text-white font-mono tracking-wider">
                {wallet?.studentTag || '000000000000'}
              </p>
              {(!wallet?.studentTag || wallet?.studentTag === '000000000000') && (
                <p className="text-red-300 text-xs mt-2">⚠️ No student tag assigned</p>
              )}
            </div>
            <p className="text-white/60 text-sm mb-4">
              Share this 12-digit tag with classmates to receive payments
            </p>
            <div className="flex gap-3">
              <button
                onClick={copyTag}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {copiedTag ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedTag ? 'Copied!' : 'Copy Tag'}
              </button>
              <button
                onClick={shareTag}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white py-2 px-4 rounded-xl transition-opacity flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-6">
          <h3 className="text-white/70 text-sm mb-3">Wallet QR Code</h3>
          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-2xl mb-4">
              <img src={qrCodeUrl} alt="Wallet QR Code" className="w-48 h-48" />
            </div>
          )}
        </div>

        {/* Wallet Address */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <p className="text-white/70 text-sm mb-2">Wallet Address</p>
          <div className="flex items-center gap-2">
            <code className="text-white text-sm flex-1 break-all">
              {wallet?.walletAddress}
            </code>
            <button
              onClick={copyAddress}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <Copy className="h-5 w-5 text-white/50" />
              )}
            </button>
          </div>
        </div>

        {/* Payment Request Generator */}
        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-medium text-white mb-4">Request Payment</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <Gem className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <p className="text-white text-sm text-center">Mind Gems</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-white text-sm text-center">Fluxon</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-white/70 text-sm mb-2 block">Request Amount (Optional)</label>
            <input
              type="number"
              placeholder="Enter amount to request"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
            />
          </div>

          <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium py-3 rounded-xl hover:opacity-90 transition-opacity">
            Generate Payment Request
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
          <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            How to Receive
          </h4>
          <ul className="text-white/60 text-sm space-y-1">
            <li>• Share your <span className="text-purple-300 font-mono">{currentStudent?.studentTag}</span> with classmates</li>
            <li>• They can send you currency using your tag</li>
            <li>• Transactions appear instantly in your wallet</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
