'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Gem, Zap, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface WalletExchangeTabProps {
  wallet: any;
  onExchange: (data: any) => void;
  isProcessing: boolean;
}

export function WalletExchangeTab({ wallet, onExchange, isProcessing }: WalletExchangeTabProps) {
  const [fromCurrency, setFromCurrency] = useState<'mind_gems' | 'fluxon'>('mind_gems');
  const [toCurrency, setToCurrency] = useState<'mind_gems' | 'fluxon'>('fluxon');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');

  const exchangeRate = fromCurrency === 'mind_gems' ? 0.1 : 10;
  const feePercentage = 2.5;

  const getReceiveAmount = () => {
    if (!amount) return '0';
    const result = parseFloat(amount) * exchangeRate * (1 - feePercentage / 100);
    return toCurrency === 'mind_gems' ? Math.floor(result).toString() : result.toFixed(8);
  };

  const getFee = () => {
    if (!amount) return '0';
    const result = parseFloat(amount) * exchangeRate * (feePercentage / 100);
    return toCurrency === 'mind_gems' ? Math.floor(result).toString() : result.toFixed(8);
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleExchange = () => {
    if (!amount || !password) {
      toast.error('Please fill all required fields');
      return;
    }

    onExchange({
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount),
      password
    });
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
          <RefreshCw className="h-6 w-6 text-blue-400" />
          Exchange Currency
        </h2>

        {/* Exchange Rate Info */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Current Exchange Rate</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-white font-medium">
                1 {fromCurrency === 'mind_gems' ? 'Gem' : 'FLX'} = {exchangeRate} {toCurrency === 'mind_gems' ? 'Gems' : 'FLX'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">Exchange Fee</span>
            <span className="text-white">{feePercentage}%</span>
          </div>
        </div>

        {/* From Currency */}
        <div className="mb-6">
          <label className="text-white/70 text-sm mb-2 block">From</label>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {fromCurrency === 'mind_gems' ? (
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Gem className="h-6 w-6 text-purple-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Zap className="h-6 w-6 text-yellow-400" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">
                    {fromCurrency === 'mind_gems' ? 'Mind Gems' : 'Fluxon'}
                  </p>
                  <p className="text-white/50 text-sm">
                    Balance: {fromCurrency === 'mind_gems' 
                      ? wallet?.mindGemsBalance || 0 
                      : wallet?.fluxonBalance?.toFixed(4) || '0.0000'}
                  </p>
                </div>
              </div>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl text-white placeholder-white/30 focus:outline-none"
            />
            <div className="flex gap-2 mt-2">
              {[10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 text-sm transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <motion.button
            onClick={handleSwap}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg"
          >
            <ArrowRightLeft className="h-6 w-6 text-white" />
          </motion.button>
        </div>

        {/* To Currency */}
        <div className="mb-6">
          <label className="text-white/70 text-sm mb-2 block">To</label>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {toCurrency === 'mind_gems' ? (
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Gem className="h-6 w-6 text-purple-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Zap className="h-6 w-6 text-yellow-400" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">
                    {toCurrency === 'mind_gems' ? 'Mind Gems' : 'Fluxon'}
                  </p>
                  <p className="text-white/50 text-sm">
                    Balance: {toCurrency === 'mind_gems' 
                      ? wallet?.mindGemsBalance || 0 
                      : wallet?.fluxonBalance?.toFixed(4) || '0.0000'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-2xl text-white font-medium">
              {getReceiveAmount()}
            </div>
            <p className="text-white/50 text-sm mt-1">You will receive</p>
          </div>
        </div>

        {/* Exchange Summary */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <h4 className="text-white/70 text-sm mb-3">Exchange Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Exchange Amount</span>
              <span className="text-white">{amount || '0'} {fromCurrency === 'mind_gems' ? 'Gems' : 'FLX'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Exchange Rate</span>
              <span className="text-white">1:{exchangeRate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Fee ({feePercentage}%)</span>
              <span className="text-white">{getFee()} {toCurrency === 'mind_gems' ? 'Gems' : 'FLX'}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="text-white/70">You Receive</span>
              <span className="text-white font-medium">
                {getReceiveAmount()} {toCurrency === 'mind_gems' ? 'Gems' : 'FLX'}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Password */}
        <div className="mb-6">
          <label className="text-white/70 text-sm mb-2 block">Transaction Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your transaction password"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Exchange Button */}
        <button
          onClick={handleExchange}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className={`h-5 w-5 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? 'Processing...' : 'Confirm Exchange'}
        </button>
      </div>
    </motion.div>
  );
}
