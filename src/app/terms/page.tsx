'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ArrowLeft, Mail, MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string>('')

  const sections = [
    { id: 'agreement', title: 'Agreement to Terms', number: '1' },
    { id: 'description', title: 'Description of the Service', number: '2' },
    { id: 'accounts', title: 'User Accounts', number: '3' },
    { id: 'acceptable-use', title: 'Acceptable Use Policy', number: '4' },
    { id: 'content', title: 'Content and Ownership', number: '5' },
    { id: 'termination', title: 'Termination', number: '6' },
    { id: 'liability', title: 'Disclaimers and Limitation of Liability', number: '7' },
    { id: 'governing-law', title: 'Governing Law and Dispute Resolution', number: '8' },
    { id: 'changes', title: 'Changes to Terms', number: '9' },
    { id: 'contact', title: 'Contact Us', number: '10' }
  ]

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FileText className="h-4 w-4" />
              <span>Last updated: October 18, 2025</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Table of Contents */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Contents</h2>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{section.number}. {section.title}</span>
                        {activeSection === section.id && (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Hero Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Terms of Service
                  </h1>
                  <p className="text-lg text-gray-600">
                    Catalyst Wells - Legal Agreement
                  </p>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {/* Section 1 */}
              <section id="agreement" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    By creating an account or using the Catalyst Wells application and services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms constitute a legally binding agreement between you and Catalyst Innovations ("we," "us").
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    If you are a school or institution, your use of the Service may also be governed by a separate Institutional Agreement, which will take precedence in case of any conflict with these Terms.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="description" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of the Service</h2>
                <p className="text-gray-700 leading-relaxed">
                  Catalyst Wells is a comprehensive educational platform designed to help students organize their academic life, empower parents with insights, and facilitate positive communication within the school community.
                </p>
              </section>

              {/* Section 3 */}
              <section id="accounts" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-600 pl-4 py-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Eligibility</h3>
                    <p className="text-gray-700 leading-relaxed">
                      You must be legally permitted to use the Service. Students under the age of 18 must have consent from a parent, guardian, or their school to use the Service.
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-600 pl-4 py-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Security</h3>
                    <p className="text-gray-700 leading-relaxed">
                      You are responsible for safeguarding your account password and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="acceptable-use" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree not to misuse the Service or help anyone else to do so. You agree not to:
                </p>
                <ul className="space-y-3 text-gray-700 ml-6">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 mt-1">•</span>
                    <span>Post or share any content that is unlawful, harmful, defamatory, or obscene.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 mt-1">•</span>
                    <span>Use the Service to harass, bully, or intimidate others.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 mt-1">•</span>
                    <span>Attempt to gain unauthorized access to any part of the Service or its related systems.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 mt-1">•</span>
                    <span>Use the Service for any purpose related to academic dishonesty.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 mt-1">•</span>
                    <span>Reverse engineer or attempt to extract the source code of our software.</span>
                  </li>
                </ul>
              </section>

              {/* Section 5 */}
              <section id="content" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content and Ownership</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Content</h3>
                    <p className="text-gray-700 leading-relaxed">
                      You (or your school) retain ownership of all intellectual property rights in the content you create and upload to the Service (e.g., grades, posts, assignments).
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Our License to You</h3>
                    <p className="text-gray-700 leading-relaxed">
                      We grant you a limited, non-exclusive, non-transferable license to access and use the Service.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your License to Us</h3>
                    <p className="text-gray-700 leading-relaxed">
                      To provide the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, host, store, reproduce, and display your content solely for the purpose of operating, improving, and providing the Service.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 6 */}
              <section id="termination" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to suspend or terminate your account at any time, with or without notice, for any violation of these Terms. You can choose to stop using the Service and delete your account at any time by contacting us.
                </p>
              </section>

              {/* Section 7 */}
              <section id="liability" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disclaimers and Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  The Service is provided "as is" without any warranties, express or implied. Catalyst Innovations will not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of, or inability to use, the Service.
                </p>
              </section>

              {/* Section 8 */}
              <section id="governing-law" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law and Dispute Resolution</h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms shall be governed by the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Coimbatore, Tamil Nadu.
                </p>
              </section>

              {/* Section 9 */}
              <section id="changes" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may modify these Terms from time to time. We will provide you with notice of any material changes. By continuing to use the Service after the changes become effective, you agree to be bound by the revised Terms.
                </p>
              </section>

              {/* Section 10 */}
              <section id="contact" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <p className="text-gray-900 font-semibold text-lg mb-4">Catalyst Innovations</p>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">Coimbatore, Tamil Nadu, India</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <a href="mailto:legal@catalystwells.com" className="text-blue-600 hover:text-blue-800 transition-colors">
                        legal@catalystwells.com
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                © 2025 Catalyst Innovations. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
