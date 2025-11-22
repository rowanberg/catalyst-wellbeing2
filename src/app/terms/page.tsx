import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, CheckCircle2, AlertCircle, Scale, ArrowLeft, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | Catalyst Wellbeing Platform',
  description: 'Review the terms and conditions for using Catalyst — ensuring a transparent, safe, and responsible educational experience.',
  keywords: ['catalyst terms of service', 'education platform terms', 'school software legal terms'],
}

export default function TermsPage() {
  const lastUpdated = 'November 22, 2024'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-indigo-100 px-5 py-2.5 rounded-full border border-indigo-200 mb-6">
            <Scale className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">Terms of Service</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            Terms of Service
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-6">
            Welcome to Catalyst. By accessing our platform, you agree to use it responsibly and ethically in compliance with our terms.
          </p>

          <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* 1. Acceptance of Terms */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    By creating an account, accessing, or using Catalyst's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    If you do not agree to these terms, you must not use our platform. For users under 18, parental or guardian consent is required.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Use of Service */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Permitted Use</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Catalyst is designed exclusively for educational purposes. You agree to:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">Use the platform only for lawful educational and school management purposes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">Not attempt to reverse engineer, decompile, or extract source code</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">Not resell, redistribute, or sublicense the platform without written permission</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">Not use the service to transmit harmful, illegal, or inappropriate content</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">Not interfere with or disrupt the platform's security or performance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">Respect the privacy and safety of other users, especially students</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. Account Responsibilities */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Responsibilities</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  Schools, teachers, parents, and students are responsible for managing their accounts securely. You must:
                </p>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Maintain the confidentiality of login credentials and not share accounts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Immediately notify us of any unauthorized access or security breaches</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Ensure all information provided is accurate, current, and complete</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Be responsible for all activities that occur under your account</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Use strong passwords and enable two-factor authentication when available</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 4. Student Data Protection */}
            <div className="bg-blue-50 rounded-2xl p-6 sm:p-8 border border-blue-200">
              <div className="flex items-start gap-4 mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Student Data Protection (FERPA/COPPA Compliance)</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We are committed to protecting student privacy in accordance with FERPA and COPPA:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Student educational records are strictly confidential</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Parental consent is obtained for students under 13</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Student data is NEVER sold or used for advertising</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Parents have the right to access and delete their child's data</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 5. Payment and Subscription */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment and Subscription</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  Catalyst may offer free and paid subscription plans:
                </p>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Pricing is clearly displayed and communicated</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Subscriptions automatically renew unless canceled before the renewal date</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Refund requests are evaluated on a case-by-case basis within 14 days of purchase</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>We reserve the right to modify pricing with 30 days advance notice</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>You can cancel your subscription at any time through your account settings</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 6. AI & Automation Disclaimer */}
            <div className="bg-purple-50 rounded-2xl p-6 sm:p-8 border border-purple-200">
              <div className="flex items-start gap-4 mb-4">
                <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. AI & Automation Disclaimer</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Catalyst provides AI-powered features including homework help, analytics, and insights. However:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">AI is an assistive tool, not a replacement for human judgment and teaching</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">All final decisions regarding student welfare remain with qualified educators</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">AI responses should be verified and used as learning aids, not absolute answers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">We are not liable for decisions made based solely on AI recommendations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">Students should use AI homework help for understanding, not for cheating</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 7. Termination */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to suspend or terminate accounts that violate these terms, including but not limited to:
              </p>
              <ul className="space-y-3 ml-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                  <span className="text-gray-700">Misuse of the platform or violation of usage policies</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                  <span className="text-gray-700">Non-payment or fraudulent payment activity</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                  <span className="text-gray-700">Activities that harm other users, especially students</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                  <span className="text-gray-700">Security breaches or unauthorized access attempts</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                  <span className="text-gray-700">Upon termination, you may request data export within 30 days</span>
                </li>
              </ul>
            </div>

            {/* 8. Limitation of Liability */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                Catalyst is provided "as is" without warranties of any kind. We are not liable for:
              </p>
              <ul className="space-y-3 ml-4 mt-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0 mt-2" />
                  <span className="text-gray-700">Decisions made based on platform data or AI recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0 mt-2" />
                  <span className="text-gray-700">Service interruptions, data loss, or technical errors</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0 mt-2" />
                  <span className="text-gray-700">Unauthorized access resulting from user negligence</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0 mt-2" />
                  <span className="text-gray-700">Third-party services or integrations</span>
                </li>
              </ul>
            </div>

            {/* 9. Governing Law */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service are governed by and construed in accordance with applicable laws. For educational institutions in India, this includes the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Any disputes shall be resolved through good faith negotiations. If unresolved, disputes may be subject to binding arbitration or the jurisdiction of applicable courts.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Questions About These Terms?</h3>
              <p className="text-indigo-100 mb-6">
                Contact our legal team for clarifications or concerns.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:legal@catalystwells.in"
                  className="px-8 py-4 rounded-xl font-semibold bg-white text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Contact Legal Team
                </a>
                <Link
                  href="/privacy"
                  className="px-8 py-4 rounded-xl font-semibold border-2 border-white/30 hover:bg-white/10 transition-colors"
                >
                  View Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
