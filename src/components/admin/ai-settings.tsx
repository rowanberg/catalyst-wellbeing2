'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Save,
  TestTube,
  Shield,
  Clock,
  Zap,
  Brain,
  Globe,
  Database,
  Lock,
  Sliders
} from 'lucide-react'
import { toast } from 'sonner'

interface AISettings {
  huggingFaceApiKey: string
  model: string
  isConfigured: boolean
  temperature: number
  maxTokens: number
  responseTimeout: number
  enableLogging: boolean
  enableCache: boolean
  rateLimitPerMinute: number
  enableContentFilter: boolean
  autoRetry: boolean
  fallbackModel: string
}

export default function AISettingsComponent() {
  const [settings, setSettings] = useState<AISettings>({
    huggingFaceApiKey: '',
    model: 'google/flan-t5-large',
    isConfigured: false,
    temperature: 0.7,
    maxTokens: 512,
    responseTimeout: 30000,
    enableLogging: true,
    enableCache: true,
    rateLimitPerMinute: 60,
    enableContentFilter: true,
    autoRetry: true,
    fallbackModel: 'microsoft/DialoGPT-medium'
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('catalyst-ai-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsed,
          // Ensure all required fields have default values
          huggingFaceApiKey: parsed.huggingFaceApiKey || '',
          model: parsed.model || 'google/flan-t5-large',
          isConfigured: parsed.isConfigured || false,
          temperature: parsed.temperature ?? 0.7,
          maxTokens: parsed.maxTokens || 512,
          responseTimeout: parsed.responseTimeout || 30000,
          enableLogging: parsed.enableLogging ?? true,
          enableCache: parsed.enableCache ?? true,
          rateLimitPerMinute: parsed.rateLimitPerMinute || 60,
          enableContentFilter: parsed.enableContentFilter ?? true,
          autoRetry: parsed.autoRetry ?? true,
          fallbackModel: parsed.fallbackModel || 'microsoft/DialoGPT-medium'
        }))
      }
    } catch (error) {
      console.error('Error loading AI settings:', error)
    }
  }

  const saveSettings = async () => {
    if (!settings.huggingFaceApiKey.trim()) {
      toast.error('Please enter a valid Hugging Face API key')
      return
    }

    setSaving(true)
    try {
      const updatedSettings = {
        ...settings,
        huggingFaceApiKey: settings.huggingFaceApiKey.trim(),
        isConfigured: !!settings.huggingFaceApiKey.trim()
      }
      
      localStorage.setItem('catalyst-ai-settings', JSON.stringify(updatedSettings))
      setSettings(updatedSettings)
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('ai-settings-updated', { 
        detail: updatedSettings 
      }))
      
      toast.success('AI settings saved successfully!')
      
      // Show temporary success indicator
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    if (!settings.huggingFaceApiKey) {
      toast.error('Please enter your Hugging Face API key first')
      return
    }

    setTesting(true)
    try {
      // Test the API key by checking user info endpoint (simpler and more reliable)
      const response = await fetch('https://huggingface.co/api/whoami-v2', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.huggingFaceApiKey}`,
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result && result.name) {
          toast.success(`API connection successful! Connected as: ${result.name}`)
          setSettings(prev => ({ ...prev, isConfigured: true }))
        } else {
          toast.success('API connection successful!')
          setSettings(prev => ({ ...prev, isConfigured: true }))
        }
      } else if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Hugging Face API key.')
      } else if (response.status === 403) {
        throw new Error('API key does not have sufficient permissions.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else {
        // If whoami fails, try a simple model inference as fallback
        const inferenceResponse = await fetch('https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.huggingFaceApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: 'This is a test'
          })
        })

        if (inferenceResponse.ok || inferenceResponse.status === 503) {
          toast.success('API connection successful!')
          setSettings(prev => ({ ...prev, isConfigured: true }))
        } else if (inferenceResponse.status === 401) {
          throw new Error('Invalid API key. Please check your Hugging Face API key.')
        } else {
          const errorText = await response.text()
          throw new Error(`API test failed: ${response.status} - ${errorText}`)
        }
      }
    } catch (error) {
      console.error('API test error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('API connection failed. Please check your API key and internet connection.')
      }
      setSettings(prev => ({ ...prev, isConfigured: false }))
    } finally {
      setTesting(false)
    }
  }

  const maskApiKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return '*'.repeat(key.length)
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  return (
    <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <motion.div 
            className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Settings className="w-5 h-5" />
          </motion.div>
          AI Configuration
        </CardTitle>
        <CardDescription>
          Configure your Hugging Face API settings for AI-powered insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* API Key Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="apiKey" className="text-sm font-medium">
              Hugging Face API Key
            </Label>
            <Badge 
              variant={settings.isConfigured ? "default" : "secondary"}
              className={settings.isConfigured ? "bg-green-100 text-green-800" : ""}
            >
              {settings.isConfigured ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configured
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Configured
                </>
              )}
            </Badge>
          </div>
          
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={settings.huggingFaceApiKey}
              onChange={(e) => setSettings(prev => ({ ...prev, huggingFaceApiKey: e.target.value }))}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {settings.huggingFaceApiKey && !showApiKey && (
            <p className="text-xs text-gray-600">
              Current key: {maskApiKey(settings.huggingFaceApiKey)}
            </p>
          )}
        </div>

        {/* Advanced Configuration Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <Label htmlFor="model" className="text-sm font-medium">AI Model Selection</Label>
            </div>
            <select
              id="model"
              value={settings.model}
              onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <optgroup label="🎯 Instruction-Following Models (Recommended)">
                <option value="google/flan-t5-large">FLAN-T5 Large (Best Quality)</option>
                <option value="google/flan-t5-xl">FLAN-T5 XL (Highest Quality)</option>
                <option value="google/flan-t5-base">FLAN-T5 Base (Balanced)</option>
                <option value="google/flan-t5-small">FLAN-T5 Small (Fast)</option>
              </optgroup>
              <optgroup label="🚀 Advanced Language Models">
                <option value="microsoft/DialoGPT-large">DialoGPT Large (Conversational)</option>
                <option value="microsoft/DialoGPT-medium">DialoGPT Medium (Conversational)</option>
                <option value="EleutherAI/gpt-neo-2.7B">GPT-Neo 2.7B (Creative)</option>
                <option value="EleutherAI/gpt-j-6B">GPT-J 6B (Advanced)</option>
              </optgroup>
              <optgroup label="⚡ Fast & Efficient Models">
                <option value="gpt2">GPT-2 (Classic, Fast)</option>
                <option value="gpt2-medium">GPT-2 Medium (Balanced)</option>
                <option value="gpt2-large">GPT-2 Large (Quality)</option>
                <option value="distilgpt2">DistilGPT-2 (Ultra Fast)</option>
              </optgroup>
              <optgroup label="🎓 Educational & Analysis Models">
                <option value="facebook/bart-large">BART Large (Summarization)</option>
                <option value="t5-large">T5 Large (Text-to-Text)</option>
                <option value="t5-base">T5 Base (Text-to-Text)</option>
                <option value="google/pegasus-large">Pegasus Large (Summarization)</option>
              </optgroup>
              <optgroup label="🌟 Specialized Models">
                <option value="microsoft/CodeBERT-base">CodeBERT (Code Understanding)</option>
                <option value="allenai/longformer-base-4096">Longformer (Long Documents)</option>
                <option value="facebook/blenderbot-400M-distill">BlenderBot (Conversational)</option>
                <option value="microsoft/ProphetNet-large-uncased">ProphetNet (Future Prediction)</option>
              </optgroup>
          </select>
          <p className="text-xs text-gray-600 mt-1">
            💡 FLAN-T5 models work best for educational insights. GPT models are great for creative responses.
          </p>

            {/* Fallback Model */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-600" />
                <Label htmlFor="fallbackModel" className="text-sm font-medium">Fallback Model</Label>
              </div>
              <select
                id="fallbackModel"
                value={settings.fallbackModel}
                onChange={(e) => setSettings(prev => ({ ...prev, fallbackModel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="microsoft/DialoGPT-medium">DialoGPT Medium (Reliable)</option>
                <option value="google/flan-t5-base">FLAN-T5 Base (Safe)</option>
                <option value="gpt2">GPT-2 (Fast Fallback)</option>
                <option value="distilgpt2">DistilGPT-2 (Ultra Fast)</option>
              </select>
              <p className="text-xs text-gray-600">Used when primary model fails</p>
            </div>
          </div>
        </div>

        {/* Performance & Security Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <Label className="text-sm font-medium">Performance Settings</Label>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="temperature" className="text-sm">Temperature: {settings.temperature}</Label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature || 0.7}
                  onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-600">Lower = more focused, Higher = more creative</p>
              </div>

              <div>
                <Label htmlFor="maxTokens" className="text-sm">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="50"
                  max="2048"
                  value={settings.maxTokens || 512}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 512 }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600">Maximum response length</p>
              </div>

              <div>
                <Label htmlFor="timeout" className="text-sm">Response Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="5000"
                  max="60000"
                  step="1000"
                  value={settings.responseTimeout || 30000}
                  onChange={(e) => setSettings(prev => ({ ...prev, responseTimeout: parseInt(e.target.value) || 30000 }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="rateLimit" className="text-sm">Rate Limit (requests/minute)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  min="10"
                  max="200"
                  value={settings.rateLimitPerMinute || 60}
                  onChange={(e) => setSettings(prev => ({ ...prev, rateLimitPerMinute: parseInt(e.target.value) || 60 }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-red-600" />
              <Label className="text-sm font-medium">Security & Features</Label>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Enable Logging</Label>
                  <p className="text-xs text-gray-600">Track AI interactions</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableLogging}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableLogging: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Enable Cache</Label>
                  <p className="text-xs text-gray-600">Cache responses for speed</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableCache}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableCache: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Content Filter</Label>
                  <p className="text-xs text-gray-600">Filter inappropriate content</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableContentFilter}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableContentFilter: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto Retry</Label>
                  <p className="text-xs text-gray-600">Retry failed requests</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoRetry}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoRetry: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* API Key Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Key className="w-4 h-4" />
            How to get your Hugging Face API Key:
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Visit <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer" className="underline">huggingface.co</a> and create an account</li>
            <li>Go to your profile settings → Access Tokens</li>
            <li>Create a new token with "Read" permissions</li>
            <li>Copy the token and paste it above</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={testConnection}
            disabled={!settings.huggingFaceApiKey || testing}
            variant="outline"
            className="flex items-center gap-2"
          >
            {testing ? (
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          
          <Button
            onClick={saveSettings}
            disabled={saving}
            className={`flex items-center gap-2 transition-all duration-300 ${
              justSaved 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
            }`}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : justSaved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : justSaved ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>

        {/* Current Status */}
        {settings.isConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">AI Assistant Ready</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Your AI assistant is configured and ready to provide insights about your school data.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
