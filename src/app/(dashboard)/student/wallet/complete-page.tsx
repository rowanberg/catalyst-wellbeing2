'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Send, ArrowDownLeft, RefreshCw, History, 
  Eye, EyeOff, Copy, Check, QrCode, Gem, Zap, Users, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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

export default function CompleteWalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'exchange' | 'history' | 'contacts' | 'analytics'>('overview');
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Password setup states
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
    fetchCurrentStudent();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/student/wallet');
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
        if (!data.hasTransactionPassword) {
          setShowPasswordSetup(true);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/student/wallet/transactions');
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
      const response = await fetch('/api/student/wallet/classmates');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Wallet className="h-12 w-12 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 30, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Digital Wallet</h1>
                  <p className="text-white/70 mt-1">Manage your Mind Gems and Fluxon</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <WalletNotifications />
                
                {wallet && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Gem className="h-5 w-5 text-purple-400" />
                        <span className="text-white/70 text-sm">Mind Gems</span>
                        <button
                          onClick={() => setShowBalance(!showBalance)}
                          className="ml-auto text-white/50 hover:text-white/70 transition-colors"
                        >
                          {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {showBalance ? wallet.mindGemsBalance.toLocaleString() : '••••••'}
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        <span className="text-white/70 text-sm">Fluxon</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {showBalance ? wallet.fluxonBalance.toFixed(4) : '••••••'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Address */}
            {wallet && (
              <div className="mt-4 flex items-center gap-2 bg-white/5 rounded-xl p-3">
                <QrCode className="h-5 w-5 text-white/50" />
                <code className="text-sm text-white/70 flex-1 truncate">
                  {wallet.walletAddress}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/50" />
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: Wallet },
                { id: 'send', label: 'Send', icon: Send },
                { id: 'receive', label: 'Receive', icon: ArrowDownLeft },
                { id: 'exchange', label: 'Exchange', icon: RefreshCw },
                { id: 'history', label: 'History', icon: History },
                { id: 'contacts', label: 'Contacts', icon: Users },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
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

        {/* Password Setup Modal */}
        {showPasswordSetup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-6 max-w-md w-full border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Set Transaction Password</h3>
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
