'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Sparkles, Trophy, Star, Zap, Heart, Target } from 'lucide-react'

export default function EmailConfirmedPage() {
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const message = searchParams.get('message')

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Celebratory Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900">
        {/* Animated Confetti Pattern */}
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: `radial-gradient(circle at 20% 20%, #ffd700 3px, transparent 3px),
                           radial-gradient(circle at 80% 80%, #ff69b4 2px, transparent 2px),
                           radial-gradient(circle at 40% 60%, #00ffff 2px, transparent 2px)`,
          backgroundSize: '100px 100px, 150px 150px, 80px 80px',
          animation: 'confetti 15s ease-in-out infinite'
        }}></div>

        {/* Floating Success Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 rounded-full mix-blend-multiply filter blur-xl animate-bounce"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full mix-blend-multiply filter blur-xl animate-ping"></div>
        
        {/* Floating Achievement Icons */}
        <div className="absolute top-32 left-1/4 text-yellow-400/30 animate-float">
          <Trophy className="w-16 h-16" />
        </div>
        <div className="absolute bottom-40 right-1/4 text-pink-400/30 animate-float-delayed">
          <Star className="w-12 h-12" />
        </div>
        <div className="absolute top-1/2 right-20 text-cyan-400/30 animate-bounce">
          <Zap className="w-10 h-10" />
        </div>
        <div className="absolute bottom-1/3 left-20 text-green-400/30 animate-pulse">
          <Target className="w-14 h-14" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full mx-4">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <CheckCircle className="w-20 h-20 text-white" />
            </div>
            {/* Success particles */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-5 h-5 text-yellow-800" />
            </div>
            <div className="absolute -top-2 -right-6 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center animate-ping">
              <Star className="w-3 h-3 text-pink-800" />
            </div>
            <div className="absolute -bottom-4 -right-2 w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center animate-bounce delay-300">
              <Zap className="w-4 h-4 text-blue-800" />
            </div>
          </div>
        </div>

        {/* Enhanced Success Card */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-4xl font-bold text-white mb-4">
              🎉 Email Confirmed Successfully!
            </CardTitle>
            <CardDescription className="text-white/80 text-xl">
              Welcome to the Catalyst community! Your journey begins now.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Success Message */}
            {message && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-6 text-center">
                <p className="text-white/90 text-lg">{message}</p>
              </div>
            )}

            {/* Achievement Unlocked */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-2xl p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <h3 className="text-2xl font-bold text-white">Achievement Unlocked!</h3>
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-6 py-3 border border-white/20">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-white font-semibold text-lg">Email Verified</span>
                  <span className="text-yellow-400 font-bold">+50 XP</span>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-white mb-4 text-center">
                🚀 Ready to Start Your Wellbeing Journey?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6 text-pink-400" />
                  </div>
                  <p className="text-white/80 text-sm">Track daily habits</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                  <p className="text-white/80 text-sm">Earn XP & rewards</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-white/80 text-sm">Complete quests</p>
                </div>
              </div>
            </div>

            {/* Auto-redirect Notice */}
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 rounded-2xl p-4 text-center">
              <p className="text-white/70 text-sm mb-2">
                Automatically redirecting to login in <span className="font-bold text-white">{countdown}</span> seconds
              </p>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105">
                  <ArrowRight className="w-6 h-6 mr-2" />
                  Sign In Now & Start Your Journey
                </Button>
              </Link>

              <div className="text-center">
                <Link 
                  href="/register"
                  className="text-white/60 hover:text-white/80 text-sm transition-colors underline"
                >
                  Need to register a different account?
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Success Pills */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-green-400/30">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white">Verified Account</span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-400/30">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white">Ready to Earn XP</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-400/30">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white">Journey Awaits</span>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes confetti {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(90deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          75% { transform: translateY(-10px) rotate(270deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(5deg); }
          66% { transform: translateY(-10px) rotate(-5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(-3deg); }
          66% { transform: translateY(-25px) rotate(3deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
