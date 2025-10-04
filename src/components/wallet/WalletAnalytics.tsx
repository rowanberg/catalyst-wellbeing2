'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, PieChart, BarChart3, Calendar, Award } from 'lucide-react';

interface WalletAnalyticsProps {
  wallet: any;
  transactions: any[];
}

export function WalletAnalytics({ wallet, transactions }: WalletAnalyticsProps) {
  const last7Days = transactions.filter(tx => {
    const txDate = new Date(tx.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return txDate >= weekAgo;
  });

  const sent = transactions.filter(tx => tx.fromAddress === wallet?.walletAddress);
  const received = transactions.filter(tx => tx.toAddress === wallet?.walletAddress);

  const totalSent = sent.reduce((sum, tx) => sum + tx.amount, 0);
  const totalReceived = received.reduce((sum, tx) => sum + tx.amount, 0);

  const gemsTransactions = transactions.filter(tx => tx.currencyType === 'mind_gems');
  const fluxonTransactions = transactions.filter(tx => tx.currencyType === 'fluxon');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Overview */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Spending Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white/70 text-sm">Total Sent</p>
                <p className="text-2xl font-bold text-red-400">{totalSent}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white/70 text-sm">Total Received</p>
                <p className="text-2xl font-bold text-green-400">{totalReceived}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white/70 text-sm">Net Balance Change</p>
                <p className={`text-2xl font-bold ${totalReceived - totalSent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalReceived - totalSent >= 0 ? '+' : ''}{totalReceived - totalSent}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Currency Distribution */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-400" />
            Currency Distribution
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/70">Mind Gems Transactions</span>
                <span className="text-white">{gemsTransactions.length}</span>
              </div>
              <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(gemsTransactions.length / transactions.length) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/70">Fluxon Transactions</span>
                <span className="text-white">{fluxonTransactions.length}</span>
              </div>
              <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(fluxonTransactions.length / transactions.length) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-xl">
              <p className="text-white/70 text-sm mb-2">Current Holdings</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white text-lg font-bold">{wallet?.mindGemsBalance || 0}</p>
                  <p className="text-white/50 text-xs">Mind Gems</p>
                </div>
                <div>
                  <p className="text-white text-lg font-bold">{wallet?.fluxonBalance?.toFixed(4) || '0.0000'}</p>
                  <p className="text-white/50 text-xs">Fluxon</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            Last 7 Days
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <span className="text-white/70 text-sm">Total Transactions</span>
              <span className="text-white font-medium">{last7Days.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <span className="text-white/70 text-sm">Sent</span>
              <span className="text-white font-medium">
                {last7Days.filter(tx => tx.fromAddress === wallet?.walletAddress).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <span className="text-white/70 text-sm">Received</span>
              <span className="text-white font-medium">
                {last7Days.filter(tx => tx.toAddress === wallet?.walletAddress).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <span className="text-white/70 text-sm">Exchanges</span>
              <span className="text-white font-medium">
                {last7Days.filter(tx => tx.transactionType === 'exchange').length}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Stats */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            Wallet Performance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl text-center">
              <p className="text-3xl font-bold text-purple-400">{wallet?.walletLevel || 1}</p>
              <p className="text-white/70 text-sm mt-1">Wallet Level</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl text-center">
              <p className="text-3xl font-bold text-blue-400">{wallet?.trustScore || 50}%</p>
              <p className="text-white/70 text-sm mt-1">Trust Score</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl text-center">
              <p className="text-3xl font-bold text-green-400">{wallet?.totalTransactionsSent || 0}</p>
              <p className="text-white/70 text-sm mt-1">Total Sent</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl text-center">
              <p className="text-3xl font-bold text-yellow-400">{wallet?.totalTransactionsReceived || 0}</p>
              <p className="text-white/70 text-sm mt-1">Total Received</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-xl">
            <p className="text-white/70 text-sm mb-2">XP Progress</p>
            <div className="bg-white/10 rounded-full h-3 overflow-hidden mb-2">
              <motion.div
                className="bg-gradient-to-r from-purple-400 to-blue-400 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(wallet?.walletXp || 0) % 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-white text-sm text-center">
              {wallet?.walletXp || 0} / {((wallet?.walletLevel || 1) * 100)} XP
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
