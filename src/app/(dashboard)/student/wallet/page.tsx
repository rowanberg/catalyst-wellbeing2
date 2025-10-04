'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Send, ArrowDownLeft, RefreshCw, History, 
  Eye, EyeOff, Copy, Check, QrCode, Gem, Zap, Users, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { WalletOverviewTab } from '@/components/wallet/WalletOverviewTab';
import { WalletSendTab } from '@/components/wallet/WalletSendTab';
import { WalletReceiveTab } from '@/components/wallet/WalletReceiveTab';
import { WalletExchangeTab } from '@/components/wallet/WalletExchangeTab';
import { WalletHistoryTab } from '@/components/wallet/WalletHistoryTab';
import { WalletContactsTab } from '@/components/wallet/WalletContactsTab';
import { WalletNotifications } from '@/components/wallet/WalletNotifications';
import { WalletAnalytics } from '@/components/wallet/WalletAnalytics';

interface WalletData {
  id: string;
  studentTag?: string;
  walletAddress: string;
  mindGemsBalance: number;
  fluxonBalance: number;
  walletNickname?: string;
  walletLevel: number;
  walletXp: number;
  trustScore: number;
  dailyLimitGems: number;
  dailyLimitFluxon: number;
  dailySpentGems: number;
  dailySpentFluxon: number;
  totalTransactionsSent: number;
  totalTransactionsReceived: number;
  isLocked: boolean;
  hasTransactionPassword: boolean;
  achievements: any[];
  lastTransactionAt?: string;
}

interface Transaction {
  id: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  currencyType: 'mind_gems' | 'fluxon';
  amount: number;
  status: string;
  transactionType: string;
  description?: string;
  memo?: string;
  createdAt: string;
  completedAt?: string;
  blockNumber?: number;
}

export default function WalletPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'exchange' | 'history' | 'contacts' | 'analytics'>('overview');
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Temporary function to fix student tags
  const fixStudentTags = async () => {
    try {
      const response = await fetch('/api/student/fix-student-tags', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        // Refresh wallet data
        fetchWalletData();
      } else {
        const error = await response.json();
        toast.error(error.error);
      }
    } catch (error) {
      toast.error('Failed to fix student tags');
    }
  };

  // Password setup states
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Wait for authentication to complete before fetching data
    if (!authLoading && user && profile) {
      fetchWalletData();
      fetchTransactions();
      fetchCurrentStudent();
    }
  }, [authLoading, user, profile]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/student/wallet', {
        credentials: 'include'  // Include cookies for authentication
      });
      
      // If wallet doesn't exist (404) or unauthorized (401), redirect to creation
      if (response.status === 404 || response.status === 401) {
        console.log('Wallet not found or unauthorized, redirecting to creation flow');
        router.push('/student/wallet/create');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
        if (!data.hasTransactionPassword) {
          setShowPasswordSetup(true);
        }
      } else {
        // For other errors, also try creation flow as fallback
        console.log(`API error (${response.status}), redirecting to creation flow`);
        router.push('/student/wallet/create');
        return;
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      // On network error, redirect to creation flow
      console.log('Network error, redirecting to creation flow');
      router.push('/student/wallet/create');
      return;
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/student/wallet/transactions', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchCurrentStudent = async () => {
    try {
      const response = await fetch('/api/student/wallet/classmates', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentStudent(data.currentStudent);
      }
    } catch (error) {
      console.error('Error fetching current student:', error);
    }
  };

  const copyAddress = () => {
    if (wallet?.walletAddress) {
      navigator.clipboard.writeText(wallet.walletAddress);
      setCopied(true);
      toast.success('Wallet address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const setupTransactionPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/student/wallet/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        toast.success('Transaction password set successfully!');
        setShowPasswordSetup(false);
        setNewPassword('');
        setConfirmPassword('');
        fetchWalletData();
      } else {
        toast.error('Failed to set password');
      }
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async (data: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/student/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Transaction sent successfully!');
        fetchWalletData();
        fetchTransactions();
        setActiveTab('history');
      } else {
        toast.error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExchange = async (data: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/student/wallet/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Exchange completed successfully!');
        fetchWalletData();
        fetchTransactions();
        setActiveTab('overview');
      } else {
        toast.error(result.error || 'Exchange failed');
      }
    } catch (error) {
      console.error('Error exchanging currency:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickSend = (contact: any) => {
    setActiveTab('send');
    // The send tab will handle the contact selection
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="inline-block p-4 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-3xl mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Wallet className="h-12 w-12 text-white" />
          </motion.div>
          <p className="text-cyan-300 text-xl">Loading wallet...</p>
        </div>
      </div>
    );
  }

  // Show error if wallet failed to load
  if (!wallet && !loading && !authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">💼</div>
          <h1 className="text-2xl font-bold text-white">Wallet Not Found</h1>
          <p className="text-white/70">It looks like you don't have a wallet set up yet.</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/student/wallet/create')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Create Wallet
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white/10 text-white py-3 px-6 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Animated Crypto Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -100, 0], 
            y: [0, 50, 0],
            scale: [1.2, 1, 1.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 px-3 py-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto pb-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <div className="bg-gradient-to-r from-[#1a1f3a]/90 via-[#2d1b4e]/90 to-[#1a1f3a]/90 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="p-3 sm:p-4 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                    animate={{ 
                      boxShadow: [
                        '0 0 30px rgba(6,182,212,0.5)',
                        '0 0 50px rgba(139,92,246,0.6)',
                        '0 0 30px rgba(6,182,212,0.5)'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Crypto Wallet
                    </h1>
                    <p className="text-cyan-300/70 text-xs sm:text-sm mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      Secure Assets
                    </p>
                  </div>
                </div>
              </div>

              {wallet && (
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <motion.div 
                      className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <Gem className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                        <span className="text-purple-200 text-xs sm:text-sm font-medium">Mind Gems</span>
                        <button
                          onClick={() => setShowBalance(!showBalance)}
                          className="ml-auto text-purple-300/50 hover:text-purple-300 transition-colors"
                        >
                          {showBalance ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </button>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                        {showBalance ? wallet.mindGemsBalance : '••••••'}
                      </p>
                      <p className="text-purple-400/60 text-[10px] sm:text-xs mt-0.5 sm:mt-1">MGM</p>
                      {/* Temporary fix button for missing tags */}
                      {(!wallet?.studentTag || wallet?.studentTag === '000000000000') && (
                        <button
                          onClick={fixStudentTags}
                          className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded"
                        >
                          Fix Missing Tags
                        </button>
                      )}
                    </motion.div>

                    <motion.div 
                      className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(234,179,8,0.4)' }}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                        <span className="text-yellow-200 text-xs sm:text-sm font-medium">Fluxon</span>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                        {showBalance ? wallet.fluxonBalance.toFixed(4) : '••••••'}
                      </p>
                      <p className="text-yellow-400/60 text-[10px] sm:text-xs mt-0.5 sm:mt-1">FLX</p>
                    </motion.div>
                  </div>
                )
              }
            </div>

            {/* Wallet Address */}
            {wallet && (
              <div className="mt-3 sm:mt-4 flex items-center gap-2 bg-gradient-to-r from-slate-900/80 to-slate-800/80 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-cyan-500/20">
                <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                <code className="text-xs sm:text-sm text-cyan-300/90 flex-1 truncate font-mono">
                  {wallet.walletAddress}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1.5 sm:p-2 hover:bg-cyan-500/20 rounded-lg transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tab Content */}
        <div className="mb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <WalletOverviewTab key="overview" wallet={wallet} transactions={transactions} />
            )}
            {activeTab === 'send' && (
              <WalletSendTab key="send" wallet={wallet} onSend={handleSend} isProcessing={isProcessing} />
            )}
            {activeTab === 'receive' && (
              <WalletReceiveTab key="receive" wallet={wallet} currentStudent={currentStudent} />
            )}
            {activeTab === 'exchange' && (
              <WalletExchangeTab key="exchange" wallet={wallet} onExchange={handleExchange} isProcessing={isProcessing} />
            )}
            {activeTab === 'history' && (
              <WalletHistoryTab key="history" transactions={transactions} wallet={wallet} />
            )}
            {activeTab === 'contacts' && (
              <WalletContactsTab key="contacts" onQuickSend={handleQuickSend} />
            )}
            {activeTab === 'analytics' && (
              <WalletAnalytics key="analytics" wallet={wallet} transactions={transactions} />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Tabs - Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-50 flex justify-center px-3 sm:px-4"
        >
          <div className="bg-gradient-to-r from-[#1a1f3a]/95 via-[#2d1b4e]/95 to-[#1a1f3a]/95 backdrop-blur-2xl rounded-full p-1.5 sm:p-2 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] w-full max-w-md">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {/* Left Side - 2 Tabs */}
              <div className="flex gap-1 flex-1 justify-start">
                {[
                  { id: 'overview', label: 'Home', icon: Wallet },
                  { id: 'receive', label: 'Receive', icon: ArrowDownLeft },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex flex-col items-center gap-0.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-cyan-300'
                        : 'text-cyan-300/50 hover:text-cyan-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-[9px] sm:text-[10px] whitespace-nowrap">{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Center - Send Button (Prominent) */}
              <motion.button
                onClick={() => setActiveTab('send')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-center gap-0.5 sm:gap-1 px-5 sm:px-6 py-2 sm:py-3 rounded-full font-bold transition-all flex-shrink-0 ${
                  activeTab === 'send'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                    : 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                }`}
              >
                <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-[10px] sm:text-xs">Send</span>
              </motion.button>

              {/* Right Side - 2 Tabs */}
              <div className="flex gap-1 flex-1 justify-end">
                {[
                  { id: 'exchange', label: 'Swap', icon: RefreshCw },
                  { id: 'history', label: 'History', icon: History },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex flex-col items-center gap-0.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-cyan-300'
                        : 'text-cyan-300/50 hover:text-cyan-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-[9px] sm:text-[10px] whitespace-nowrap">{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Password Setup Modal */}
        {showPasswordSetup && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-[#1a1f3a] via-[#2d1b4e] to-[#1a1f3a] rounded-2xl p-6 max-w-md w-full border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)]"
            >
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
                🔐 Set Transaction Password
              </h3>
              <p className="text-white/70 mb-6">
                Create a secure password to protect your transactions. You'll need this password every time you send currency.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password (min 6 characters)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
                
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <button
                onClick={setupTransactionPassword}
                disabled={isProcessing}
                className="w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isProcessing ? 'Setting up...' : 'Set Password'}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
