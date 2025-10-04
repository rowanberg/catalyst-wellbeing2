'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Shield, Key, Sparkles, ArrowRight, 
  CheckCircle2, Lock, Eye, EyeOff, Copy, Check,
  Fingerprint, QrCode, Download, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CreateWalletPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [walletData, setWalletData] = useState({
    walletNickname: '',
    securityPin: '',
    confirmPin: '',
    studentTag: '',
    walletAddress: ''
  });
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);


  const handleCreateWallet = async () => {
    if (walletData.securityPin !== walletData.confirmPin) {
      toast.error('Security PINs do not match');
      return;
    }

    if (walletData.securityPin.length < 6) {
      toast.error('PIN must be at least 6 digits');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/student/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Include cookies for authentication
        body: JSON.stringify({
          walletNickname: walletData.walletNickname || 'My Wallet',
          securityPin: walletData.securityPin
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setWalletData({
          ...walletData,
          studentTag: result.studentTag,
          walletAddress: result.walletAddress
        });
        setStep(3);
      } else {
        toast.error(result.error || 'Failed to create wallet');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error('An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadWalletInfo = () => {
    const content = `
CRYPTO WALLET INFORMATION
========================

Student Tag: ${walletData.studentTag}
Wallet Address: ${walletData.walletAddress}
Created: ${new Date().toLocaleDateString()}

⚠️ IMPORTANT:
- Keep your Student Tag safe - you'll need it for transactions
- Never share your wallet details with strangers
- Your wallet address is public but your PIN is private
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-info-${walletData.studentTag}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Wallet info downloaded!');
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] relative overflow-hidden">
      {/* Crypto Grid Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Animated Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step >= s
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                        : 'bg-white/10 text-white/50'
                    }`}
                    animate={step === s ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, repeat: step === s ? Infinity : 0, repeatDelay: 1 }}
                  >
                    {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                  </motion.div>
                  {s < 3 && (
                    <div className={`h-1 w-16 sm:w-24 mx-2 ${step > s ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-cyan-300/70 max-w-md mx-auto">
              <span>Setup</span>
              <span>Security</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome & Nickname */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gradient-to-br from-[#1a1f3a]/90 via-[#2d1b4e]/90 to-[#1a1f3a]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
              >
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-block p-4 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-3xl mb-4"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Wallet className="h-12 w-12 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    Create Your Crypto Wallet
                  </h2>
                  <p className="text-cyan-300/70">
                    Your gateway to digital assets and secure transactions
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-300 text-sm mb-2 block font-medium">
                      Wallet Nickname (Optional)
                    </label>
                    <input
                      type="text"
                      value={walletData.walletNickname}
                      onChange={(e) => setWalletData({ ...walletData, walletNickname: e.target.value })}
                      placeholder="e.g., My Crypto Vault"
                      className="w-full bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <div className="flex gap-3">
                      <Sparkles className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-cyan-300/90">
                        <p className="font-medium mb-1">What you'll get:</p>
                        <ul className="space-y-1 text-cyan-300/70">
                          <li>• Unique Student Tag (12-digit ID)</li>
                          <li>• Secure Wallet Address</li>
                          <li>• Mind Gems & Fluxon currencies</li>
                          <li>• Transaction history & analytics</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-4 rounded-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Security PIN */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gradient-to-br from-[#1a1f3a]/90 via-[#2d1b4e]/90 to-[#1a1f3a]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
              >
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Shield className="h-12 w-12 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    Secure Your Wallet
                  </h2>
                  <p className="text-cyan-300/70">
                    Create a 6-digit PIN to protect your transactions
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-300 text-sm mb-2 block font-medium">
                      Security PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={walletData.securityPin}
                        onChange={(e) => setWalletData({ ...walletData, securityPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        placeholder="Enter 6-digit PIN"
                        className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-all pr-12"
                        maxLength={6}
                      />
                      <button
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300"
                      >
                        {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm mb-2 block font-medium">
                      Confirm PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPin ? 'text' : 'password'}
                        value={walletData.confirmPin}
                        onChange={(e) => setWalletData({ ...walletData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        placeholder="Re-enter PIN"
                        className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-all pr-12"
                        maxLength={6}
                      />
                      <button
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300"
                      >
                        {showConfirmPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <div className="flex gap-3">
                      <Lock className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-purple-300/90">
                        <p className="font-medium mb-1">Security Tips:</p>
                        <ul className="space-y-1 text-purple-300/70">
                          <li>• Use a unique PIN you'll remember</li>
                          <li>• Don't share your PIN with anyone</li>
                          <li>• You'll need this for all transactions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white/10 text-white font-medium py-4 rounded-xl hover:bg-white/20 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (walletData.securityPin.length === 6 && walletData.securityPin === walletData.confirmPin) {
                        handleCreateWallet();
                      } else {
                        toast.error('Please enter matching 6-digit PINs');
                      }
                    }}
                    disabled={isCreating}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating Wallet...' : 'Create Wallet'}
                    {!isCreating && <ArrowRight className="h-5 w-5" />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success & Wallet Details */}
            {step === 3 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-[#1a1f3a]/90 via-[#2d1b4e]/90 to-[#1a1f3a]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
              >
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-block p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl mb-4"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                    transition={{ duration: 1 }}
                  >
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    Wallet Created Successfully! 🎉
                  </h2>
                  <p className="text-cyan-300/70">
                    Your crypto wallet is ready to use
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-300 text-sm font-medium flex items-center gap-2">
                        <Fingerprint className="h-4 w-4" />
                        Student Tag
                      </span>
                      <button
                        onClick={() => copyToClipboard(walletData.studentTag, 'Student Tag')}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">{walletData.studentTag}</p>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-xl p-4 border border-cyan-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-300 text-sm font-medium flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        Wallet Address
                      </span>
                      <button
                        onClick={() => copyToClipboard(walletData.walletAddress, 'Wallet Address')}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-sm font-mono text-white break-all">{walletData.walletAddress}</p>
                  </div>
                </div>

                <button
                  onClick={downloadWalletInfo}
                  className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 font-medium py-3 rounded-xl hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2 mb-4"
                >
                  <Download className="h-5 w-5" />
                  Download Wallet Info
                </button>

                <button
                  onClick={() => router.push('/student/wallet')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  Go to Wallet
                  <ArrowRight className="h-5 w-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
