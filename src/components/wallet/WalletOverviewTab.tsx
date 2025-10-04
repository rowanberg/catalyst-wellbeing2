'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Shield, ArrowUpRight, ArrowDownLeft, Target, Award, Star, Zap, Gift, Activity, Clock, Lock } from 'lucide-react';

interface WalletOverviewTabProps {
  wallet: any;
  transactions: any[];
}

export function WalletOverviewTab({ wallet, transactions }: WalletOverviewTabProps) {
  const formatCurrency = (amount: number, type: 'mind_gems' | 'fluxon') => {
    if (type === 'mind_gems') return amount.toLocaleString();
    return amount.toFixed(8);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'processing': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Left Column - Stats */}
      <div className="lg:col-span-2 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-white/70 text-sm">Level</span>
            </div>
            <p className="text-2xl font-bold text-white">{wallet?.walletLevel || 1}</p>
            <div className="mt-2 bg-white/10 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-green-400 to-emerald-400 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(wallet?.walletXp || 0) % 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="text-white/70 text-sm">Trust</span>
            </div>
            <p className="text-2xl font-bold text-white">{wallet?.trustScore || 50}%</p>
            <div className="mt-2 bg-white/10 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${wallet?.trustScore || 50}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-5 w-5 text-purple-400" />
              <span className="text-white/70 text-sm">Sent</span>
            </div>
            <p className="text-2xl font-bold text-white">{wallet?.totalTransactionsSent || 0}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="h-5 w-5 text-yellow-400" />
              <span className="text-white/70 text-sm">Received</span>
            </div>
            <p className="text-2xl font-bold text-white">{wallet?.totalTransactionsReceived || 0}</p>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Recent Activity
          </h3>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      tx.fromAddress === wallet?.walletAddress
                        ? 'bg-red-500/20'
                        : 'bg-green-500/20'
                    }`}>
                      {tx.fromAddress === wallet?.walletAddress ? (
                        <ArrowUpRight className="h-4 w-4 text-red-400" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {tx.fromAddress === wallet?.walletAddress ? 'Sent' : 'Received'}
                        {tx.memo && (
                          <span className="ml-2 text-white/50 text-sm">"{tx.memo}"</span>
                        )}
                      </p>
                      <p className="text-white/50 text-sm truncate max-w-[200px]">
                        {tx.fromAddress === wallet?.walletAddress ? tx.toAddress : tx.fromAddress}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium flex items-center gap-1">
                      {tx.fromAddress === wallet?.walletAddress ? '-' : '+'}
                      {tx.amount}
                      {tx.currencyType === 'mind_gems' ? '💎' : '⚡'}
                    </p>
                    <p className={`text-sm ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No transactions yet</p>
              <p className="text-white/30 text-sm mt-1">Start by sending or receiving currency</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Daily Limits */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-400" />
            Daily Limits
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/70">Mind Gems</span>
                <span className="text-white">
                  {wallet?.dailySpentGems || 0} / {wallet?.dailyLimitGems || 500}
                </span>
              </div>
              <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((wallet?.dailySpentGems || 0) / (wallet?.dailyLimitGems || 500)) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/70">Fluxon</span>
                <span className="text-white">
                  {wallet?.dailySpentFluxon?.toFixed(2) || '0.00'} / {wallet?.dailyLimitFluxon || 100}
                </span>
              </div>
              <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((wallet?.dailySpentFluxon || 0) / (wallet?.dailyLimitFluxon || 100)) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            Achievements
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Star, color: 'text-yellow-400', label: 'First Steps', unlocked: wallet?.totalTransactionsSent > 0 },
              { icon: Zap, color: 'text-purple-400', label: 'Power User', unlocked: wallet?.totalTransactionsSent >= 10 },
              { icon: Gift, color: 'text-pink-400', label: 'Generous', unlocked: wallet?.totalTransactionsSent >= 25 },
            ].map((achievement, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: achievement.unlocked ? 1.1 : 1 }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/20' 
                    : 'bg-white/5 opacity-50'
                }`}
              >
                <achievement.icon className={`h-8 w-8 ${achievement.unlocked ? achievement.color : 'text-white/30'}`} />
                <span className="text-white/70 text-xs text-center">{achievement.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Security Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Password Protection</span>
              <span className={`text-sm ${wallet?.hasTransactionPassword ? 'text-green-400' : 'text-yellow-400'}`}>
                {wallet?.hasTransactionPassword ? 'Active' : 'Setup Required'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Wallet Status</span>
              <span className={`text-sm ${!wallet?.isLocked ? 'text-green-400' : 'text-red-400'}`}>
                {!wallet?.isLocked ? 'Active' : 'Locked'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Last Transaction</span>
              <span className="text-white/50 text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {wallet?.lastTransactionAt ? new Date(wallet.lastTransactionAt).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
