'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Accessibility, ArrowLeft, Mail, MapPin, ChevronRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AccessibilityPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string>('')

  const sections = [
    { id: 'commitment', title: 'Our Commitment', number: '1' },
    { id: 'conformance', title: 'Conformance Status', number: '2' },
    { id: 'measures', title: 'Measures Taken', number: '3' },
    { id: 'feedback', title: 'Feedback and Contact', number: '4' },
    { id: 'compatibility', title: 'Compatibility', number: '5' }
  ]

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(id)
    }
  }

  const measures = [
    {
      title: 'Semantic HTML',
      description: 'We use meaningful HTML to structure our content, which helps assistive technologies understand the layout and purpose of different elements.'
    },
    {
      title: 'Keyboard Navigation',
      description: 'We are working to ensure that all interactive elements of the application can be accessed and operated using a keyboard.'
    },
    {
      title: 'Text Alternatives',
      description: 'We aim to provide text alternatives (alt text) for all meaningful non-text content, like images.'
    },
    {
      title: 'Sufficient Contrast',
      description: 'We are mindful of color contrast between text and its background to ensure readability.'
    }
  ]

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
              <Accessibility className="h-4 w-4" />
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
                          ? 'bg-green-50 text-green-700 font-medium'
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
                <div className="p-3 bg-green-600 rounded-lg">
                  <Accessibility className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Accessibility Statement
                  </h1>
                  <p className="text-lg text-gray-600">
                    Catalyst Wells - Commitment to Digital Inclusion
                  </p>
                </div>
              </div>
            </div>

            {/* Introduction */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8">
              <p className="text-gray-700 leading-relaxed text-lg">
                Catalyst Innovations is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {/* Section 1 */}
              <section id="commitment" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Our Commitment</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our goal is to make the Catalyst Wells application as accessible and usable as possible for all members of the school community, regardless of ability or the technology they use. We believe in providing an inclusive environment that empowers every user to succeed.
                </p>
              </section>

              {/* Section 2 */}
              <section id="conformance" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Conformance Status</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    We are working towards conforming to the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. These guidelines, developed by the World Wide Web Consortium (W3C), explain how to make web content more accessible for people with a wide array of disabilities.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900">
                      <strong>Note:</strong> We recognize that our journey towards full accessibility is ongoing. While we strive to adhere to the accepted guidelines and standards, it is not always possible to do so in all areas of the application at all times.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="measures" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Measures Taken</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  We have taken the following measures to enhance the accessibility of our app:
                </p>
                <div className="space-y-4">
                  {measures.map((measure, index) => (
                    <div key={index} className="border-l-4 border-green-600 pl-4 py-2">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{measure.title}</h3>
                          <p className="text-gray-700 leading-relaxed">{measure.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4 */}
              <section id="feedback" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Feedback and Contact Information</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  We welcome your feedback on the accessibility of Catalyst Wells. If you encounter any accessibility barriers or have suggestions on how we can improve, please let us know. We take your feedback seriously and will consider it as we evaluate ways to accommodate all of our users.
                </p>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <p className="text-gray-900 font-semibold text-lg mb-4">Contact Us:</p>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <a href="mailto:accessibility@catalystwells.com" className="text-blue-600 hover:text-blue-800 transition-colors">
                        accessibility@catalystwells.com
                      </a>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">Coimbatore, Tamil Nadu, India</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <strong>Response Time:</strong> We aim to respond to accessibility feedback within 5 business days.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section id="compatibility" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Compatibility</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  The Catalyst Wells application is designed to be compatible with the latest versions of modern web browsers such as Chrome, Firefox, and Safari. We also aim for compatibility with common assistive technologies, including screen readers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                    <p className="font-semibold text-gray-900 mb-1">Browsers</p>
                    <p className="text-sm text-gray-600">Chrome, Firefox, Safari</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                    <p className="font-semibold text-gray-900 mb-1">Screen Readers</p>
                    <p className="text-sm text-gray-600">JAWS, NVDA, VoiceOver</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                    <p className="font-semibold text-gray-900 mb-1">Standards</p>
                    <p className="text-sm text-gray-600">WCAG 2.1 AA</p>
                  </div>
                </div>
              </section>

              {/* Ongoing Commitment */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Ongoing Commitment</h3>
                <p className="text-sm text-green-800 leading-relaxed">
                  This statement will be reviewed and updated regularly as we continue our efforts to improve the accessibility of our platform. We are committed to making Catalyst Wells accessible to all users.
                </p>
              </div>
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
