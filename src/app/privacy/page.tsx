'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Mail, MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string>('')

  const sections = [
    { id: 'introduction', title: 'Introduction', number: '1' },
    { id: 'information', title: 'Information We Collect', number: '2' },
    { id: 'usage', title: 'How We Use Your Information', number: '3' },
    { id: 'sharing', title: 'How We Share Your Information', number: '4' },
    { id: 'security', title: 'Data Security', number: '5' },
    { id: 'children', title: "Children's Privacy", number: '6' },
    { id: 'rights', title: 'Your Rights and Choices', number: '7' },
    { id: 'changes', title: 'Changes to This Policy', number: '8' },
    { id: 'contact', title: 'Contact Us', number: '9' }
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
              <Shield className="h-4 w-4" />
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
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Privacy Policy
                  </h1>
                  <p className="text-lg text-gray-600">
                    Catalyst Wells - Protecting Your Privacy
                  </p>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {/* Section 1 */}
              <section id="introduction" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Welcome to Catalyst Wells, a platform by Catalyst Innovations ("we," "us," "our"). We are committed to protecting the privacy of our users, including students, parents, teachers, and school administrators. This Privacy Policy outlines how we collect, use, share, and protect your personal information when you use our application and services (collectively, the "Service").
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Our headquarters are located in Coimbatore, Tamil Nadu, India, and this policy is designed to comply with applicable Indian data protection laws.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="information" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  We collect information necessary to provide and improve our Service. The type of information we collect depends on your role.
                </p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-600 pl-4 py-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">a) Information Provided by Users</h3>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">Students:</span>
                        <span>Account information (name, email, password), academic data entered by you or your school (grades, assignments, goals, XP, streaks), and any content you create within the app.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">Parents:</span>
                        <span>Account information (name, email, password), your child's information for linking accounts (e.g., Student ID), and any communications you send.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">Teachers & Administrators:</span>
                        <span>Account information (name, email, password, school association), and content you create for the Class Community (posts, media, documents).</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-600 pl-4 py-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">b) Information Collected Automatically</h3>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">Usage Data:</span>
                        <span>We collect data on how you interact with our Service, such as features used, time spent on the app, and engagement metrics.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">Device Information:</span>
                        <span>We may collect information about the device you use to access our Service, such as device type, operating system, and browser type.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="usage" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use your information for the following purposes:
                </p>
                <ul className="space-y-3 text-gray-700 ml-6">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3 mt-1">•</span>
                    <div>
                      <span className="font-semibold">To Provide and Maintain the Service:</span>
                      <span className="ml-1">To operate your account, display academic progress, facilitate communication, and enable all app features.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3 mt-1">•</span>
                    <div>
                      <span className="font-semibold">To Personalize Your Experience:</span>
                      <span className="ml-1">To tailor content and features to your role and needs.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3 mt-1">•</span>
                    <div>
                      <span className="font-semibold">For Analytics and Improvement:</span>
                      <span className="ml-1">To understand how our Service is used so we can improve its functionality, user experience, and effectiveness. All data used for analytics is aggregated and anonymized.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3 mt-1">•</span>
                    <div>
                      <span className="font-semibold">To Communicate with You:</span>
                      <span className="ml-1">To send important service-related notifications.</span>
                    </div>
                  </li>
                </ul>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">
                    Important: We do not sell or rent personal student data to third-party advertisers.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section id="sharing" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Your information is shared only in the following limited circumstances:
                </p>
                <ul className="space-y-3 text-gray-700 ml-6">
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-3 mt-1">•</span>
                    <div>
                      <span className="font-semibold">Within Your School's Ecosystem:</span>
                      <span className="ml-1">Student information is shared with their linked parents and their enrolled teachers and school administrators as a core function of the Service.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-3 mt-1">•</span>
                    <div>
                      <span className="font-semibold">With Service Providers:</span>
                      <span className="ml-1">We use trusted third-party companies for services like cloud hosting (e.g., AWS, Google Cloud) and database management (e.g., Supabase). These companies are contractually obligated to protect your data and are not permitted to use it for their own purposes.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-3 mt-1">•</span>
                    <div>
                      <span className="font-semibold">For Legal Reasons:</span>
                      <span className="ml-1">We may disclose your information if required to do so by law or in response to valid requests by public authorities.</span>
                    </div>
                  </li>
                </ul>
              </section>

              {/* Section 5 */}
              <section id="security" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement robust technical and organizational security measures to protect your personal information from unauthorized access, use, or disclosure. These include data encryption, access controls, and regular security audits.
                </p>
              </section>

              {/* Section 6 */}
              <section id="children" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We take the privacy of minors very seriously. Student accounts are typically created and managed under the consent and supervision of their school or parents. We operate in compliance with applicable laws concerning children's data.
                </p>
              </section>

              {/* Section 7 */}
              <section id="rights" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
                <p className="text-gray-700 leading-relaxed">
                  You have rights regarding your personal information, including the right to access, correct, or request the deletion of your data. You can manage most of your information directly within your account settings. For other requests, please contact us.
                </p>
              </section>

              {/* Section 8 */}
              <section id="changes" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and, where appropriate, through other communication channels.
                </p>
              </section>

              {/* Section 9 */}
              <section id="contact" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  If you have any questions about this Privacy Policy, please contact us at:
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
                      <a href="mailto:privacy@catalystwells.com" className="text-blue-600 hover:text-blue-800 transition-colors">
                        privacy@catalystwells.com
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
