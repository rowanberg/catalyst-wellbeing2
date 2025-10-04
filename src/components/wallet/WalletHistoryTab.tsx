'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Filter, Search, Download, ArrowUpRight, ArrowDownLeft, RefreshCw, X, Calendar, Gem, Zap } from 'lucide-react';

interface WalletHistoryTabProps {
  transactions: any[];
  wallet: any;
}

export function WalletHistoryTab({ transactions, wallet }: WalletHistoryTabProps) {
  const [filter, setFilter] = useState<'all' | 'sent' | 'received' | 'exchange'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'mind_gems' | 'fluxon'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const filteredTransactions = transactions.filter(tx => {
    // Type filter
    if (filter === 'sent' && tx.fromAddress !== wallet?.walletAddress) return false;
    if (filter === 'received' && tx.fromAddress === wallet?.walletAddress) return false;
    if (filter === 'exchange' && tx.transactionType !== 'exchange') return false;
    
    // Currency filter
    if (currencyFilter !== 'all' && tx.currencyType !== currencyFilter) return false;
    
    // Search filter
    if (searchQuery && !tx.toAddress.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !tx.fromAddress.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(tx.memo && tx.memo.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (tx: any) => {
    if (tx.transactionType === 'exchange') return <RefreshCw className="h-5 w-5 text-blue-400" />;
    if (tx.fromAddress === wallet?.walletAddress) return <ArrowUpRight className="h-5 w-5 text-red-400" />;
    return <ArrowDownLeft className="h-5 w-5 text-green-400" />;
  };

  const getTypeLabel = (tx: any) => {
    if (tx.transactionType === 'exchange') return 'Exchange';
    if (tx.fromAddress === wallet?.walletAddress) return 'Sent';
    return 'Received';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="h-6 w-6 text-purple-400" />
            Transaction History
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Type Filter */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Type</label>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'sent', label: 'Sent' },
                { id: 'received', label: 'Received' },
                { id: 'exchange', label: 'Exchange' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilter(type.id as any)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filter === type.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Currency Filter */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Currency</label>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All', icon: null },
                { id: 'mind_gems', label: 'Gems', icon: Gem },
                { id: 'fluxon', label: 'FLX', icon: Zap }
              ].map(curr => (
                <button
                  key={curr.id}
                  onClick={() => setCurrencyFilter(curr.id as any)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 ${
                    currencyFilter === curr.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {curr.icon && <curr.icon className="h-4 w-4" />}
                  {curr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Address or memo..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTx(tx)}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      tx.transactionType === 'exchange' ? 'bg-blue-500/20' :
                      tx.fromAddress === wallet?.walletAddress ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                      {getTypeIcon(tx)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{getTypeLabel(tx)}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm truncate">
                        {tx.memo || (tx.fromAddress === wallet?.walletAddress ? `To: ${tx.toAddress}` : `From: ${tx.fromAddress}`)}
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-medium flex items-center gap-1 ${
                      tx.fromAddress === wallet?.walletAddress ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {tx.fromAddress === wallet?.walletAddress ? '-' : '+'}
                      {tx.amount}
                      {tx.currencyType === 'mind_gems' ? <Gem className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    </p>
                    <p className="text-white/50 text-xs">
                      {tx.currencyType === 'mind_gems' ? 'Mind Gems' : 'Fluxon'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <History className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No transactions found</p>
              <p className="text-white/30 text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTx(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-6 max-w-md w-full border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Transaction Details</h3>
                <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-white/50 text-sm mb-1">Transaction Hash</p>
                  <p className="text-white text-sm font-mono break-all">{selectedTx.transactionHash}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">Type</p>
                  <p className="text-white">{getTypeLabel(selectedTx)}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">Amount</p>
                  <p className="text-white font-medium">{selectedTx.amount} {selectedTx.currencyType === 'mind_gems' ? 'Mind Gems' : 'Fluxon'}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm border ${getStatusColor(selectedTx.status)}`}>
                    {selectedTx.status}
                  </span>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">From</p>
                  <p className="text-white text-sm font-mono break-all">{selectedTx.fromAddress}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">To</p>
                  <p className="text-white text-sm font-mono break-all">{selectedTx.toAddress}</p>
                </div>
                {selectedTx.memo && (
                  <div>
                    <p className="text-white/50 text-sm mb-1">Memo</p>
                    <p className="text-white">{selectedTx.memo}</p>
                  </div>
                )}
                <div>
                  <p className="text-white/50 text-sm mb-1">Date</p>
                  <p className="text-white">{new Date(selectedTx.createdAt).toLocaleString()}</p>
                </div>
                {selectedTx.blockNumber && (
                  <div>
                    <p className="text-white/50 text-sm mb-1">Block Number</p>
                    <p className="text-white">#{selectedTx.blockNumber}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
