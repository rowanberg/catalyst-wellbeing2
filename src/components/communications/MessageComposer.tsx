'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Smile, 
  AlertTriangle, 
  CheckCircle,
  Heart,
  Lightbulb,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ContentAnalysisEngine } from '@/lib/encryption';
import { useRealtime } from './RealtimeProvider';

interface MessageComposerProps {
  channelId: string;
  placeholder?: string;
  disabled?: boolean;
  onSend?: (message: string) => void;
  maxLength?: number;
  showContentAnalysis?: boolean;
  messageType?: 'text' | 'announcement' | 'emergency';
}

interface ContentAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestions: string[];
  flaggedKeywords: string[];
  confidenceScore: number;
}

export function MessageComposer({
  channelId,
  placeholder = "Type your message...",
  disabled = false,
  onSend,
  maxLength = 1000,
  showContentAnalysis = true,
  messageType = 'text'
}: MessageComposerProps) {
  const { sendMessage } = useRealtime();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (message.trim() && showContentAnalysis) {
      const analysis = ContentAnalysisEngine.analyzeContent(message);
      setContentAnalysis(analysis as any);
      setShowAnalysis(true);
    } else {
      setContentAnalysis(null);
      setShowAnalysis(false);
    }
  }, [message, showContentAnalysis]);

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      if (onSend) {
        onSend(message);
      } else {
        await sendMessage(channelId, message, messageType);
      }
      setMessage('');
      setContentAnalysis(null);
      setShowAnalysis(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAnalysisColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAnalysisIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <Lightbulb className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <Shield className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  const getAnalysisMessage = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'Great message! 👍';
      case 'medium': return 'Consider rephrasing 🤔';
      case 'high': return 'Please be more respectful 💙';
      case 'critical': return 'This message may violate guidelines ⚠️';
      default: return 'Keep being kind! 💝';
    }
  };

  return (
    <div className="space-y-3">
      {/* Content Analysis */}
      {showAnalysis && contentAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg border ${getAnalysisColor(contentAnalysis.riskLevel)}`}
        >
          <div className="flex items-center space-x-2 mb-2">
            {getAnalysisIcon(contentAnalysis.riskLevel)}
            <span className="text-sm font-medium">
              {getAnalysisMessage(contentAnalysis.riskLevel)}
            </span>
            <Badge variant="outline" className="text-xs">
              {Math.round(contentAnalysis.confidenceScore * 100)}% confidence
            </Badge>
          </div>
          
          {contentAnalysis.suggestions.length > 0 && (
            <div className="space-y-1">
              {contentAnalysis.suggestions.slice(0, 2).map((suggestion, index) => (
                <p key={index} className="text-xs opacity-80">
                  💡 {suggestion}
                </p>
              ))}
            </div>
          )}
          
          {contentAnalysis.flaggedKeywords.length > 0 && (
            <div className="mt-2">
              <p className="text-xs opacity-60 mb-1">Flagged terms:</p>
              <div className="flex flex-wrap gap-1">
                {contentAnalysis.flaggedKeywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Message Input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isSending}
          maxLength={maxLength}
          className="min-h-[80px] pr-24 resize-none"
        />
        
        {/* Character Count */}
        <div className="absolute bottom-2 left-3 text-xs text-gray-400">
          {message.length}/{maxLength}
        </div>
        
        {/* Action Buttons */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <Smile className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending || disabled}
            size="sm"
            className="h-8 w-8 p-0"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Message Type Indicator */}
      {messageType !== 'text' && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {messageType === 'announcement' && (
            <>
              <Badge variant="secondary">📢 Announcement</Badge>
              <span>This will be sent to all participants</span>
            </>
          )}
          {messageType === 'emergency' && (
            <>
              <Badge variant="destructive">🚨 Emergency</Badge>
              <span>This will trigger immediate alerts</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
