/**
 * ============================================================================
 * Professional Footer Component - Catalyst Wellbeing Platform
 * ============================================================================
 * Used across all dashboard layouts for brand consistency
 * ============================================================================
 */

'use client'

import { Heart, Mail, Phone, MapPin, Shield, FileText, ExternalLink, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export function ProfessionalFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-t border-slate-700/50 mt-auto">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Catalyst
                </h3>
                <p className="text-xs text-slate-400">Wellbeing Platform</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Empowering schools with comprehensive wellbeing management, AI-powered insights, and holistic student support.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Trusted by 500+ schools worldwide</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="https://explore.catalystwells.in/documentation" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                  <span>Documentation</span>
                  <ExternalLink className="w-3 h-3 opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="https://explore.catalystwells.in/support" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="https://explore.catalystwells.in/api-reference" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="https://explore.catalystwells.in/changelog" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  What's New
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              Legal & Security
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="https://explore.catalystwells.in/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://explore.catalystwells.in/terms" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="https://explore.catalystwells.in/security" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  Security & Compliance
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                  <Shield className="w-3 h-3 text-green-500" />
                  <span>FERPA & SOC 2 Certified</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-300">legal@catalystwells.in</div>
                  <div className="text-xs text-slate-500">24/7 Support Available</div>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-300">+1 (555) 123-4567</div>
                  <div className="text-xs text-slate-500">Mon-Fri, 9am-6pm EST</div>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                <div className="text-slate-300">
                  Silicon Valley, CA
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700/50 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400 text-center md:text-left">
              © {currentYear} <span className="font-semibold text-slate-300">Catalyst Innovations</span>. All rights reserved.
            </div>

            {/* Social Links & Stats */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>System Status: Operational</span>
                </div>
                <div className="hidden sm:block">•</div>
                <div className="hidden sm:block">99.9% Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
