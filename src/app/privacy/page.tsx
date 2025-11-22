import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, Eye, FileCheck, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Catalyst Wellbeing Platform',
  description: 'Learn how Catalyst protects your school, teacher, parent, and student data with strict security and global compliance standards.',
  keywords: ['catalyst privacy policy', 'student data protection', 'school data security', 'education platform privacy'],
}

export default function PrivacyPage() {
  const lastUpdated = 'November 22, 2024'

  const sections = [
    {
      icon: FileCheck,
      title: '1. Information We Collect',
      content: [
        'User account details (name, email, school information, role)',
        'Student performance data and academic records (grades, assessments, attendance)',
        'Wellbeing tracking information (mood logs, mindfulness activities)',
        'Communication data between parents, teachers, and students',
        'Device and usage analytics (for platform improvement)',
        'AI homework help queries and responses (anonymized for quality improvement)'
      ]
    },
    {
      icon: Eye,
      title: '2. How We Use Your Information',
      content: [
        'To provide comprehensive school management and education features',
        'To deliver AI-powered homework help and personalized learning insights',
        'To communicate important updates, support information, and notifications',
        'To improve platform performance, security, and user experience',
        'To generate analytics and insights for educational improvement',
        'To comply with legal obligations and ensure student safety',
        'To enable communication between students, teachers, and parents'
      ]
    },
    {
      icon: Lock,
      title: '3. Data Security & Encryption',
      content: [
        'Military-grade AES-256 encryption for all data at rest and in transit',
        'HTTPS enforced on all connections and communications',
        'Regular third-party security audits and penetration testing',
        'Role-based access control through Supabase infrastructure',
        'Automated backup systems with geographic redundancy',
        '24/7 security monitoring and threat detection',
        'Compliance with FERPA, COPPA, and GDPR standards for student data'
      ]
    },
    {
      icon: Shield,
      title: '4. Data Sharing & Third Parties',
      content: [
        'We NEVER sell your data to advertisers or third parties',
        'Data is shared only with trusted infrastructure providers (Supabase, Vercel) under strict NDAs',
        'AI providers (OpenAI, Google) receive only anonymized queries for processing',
        'Integration partners receive only necessary data with explicit consent',
        'Law enforcement requests are evaluated and disclosed as required by law',
        'All third-party processors are GDPR and SOC 2 compliant',
        'Parent notification for any data sharing involving minors'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
          <div className="inline-flex items-center space-x-2 bg-blue-100 px-5 py-2.5 rounded-full border border-blue-200 mb-6">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Your Privacy Matters</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            Privacy Policy
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-6">
            Your privacy is our top priority. Catalyst ensures that every piece of data you share — from school analytics to student progress — is encrypted, protected, and never misused.
          </p>

          <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {sections.map((section, idx) => {
              const Icon = section.icon
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0 border border-blue-200">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                      <ul className="space-y-3">
                        {section.content.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Your Rights */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Your Rights</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  You have complete control over your data. At any time, you can:
                </p>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-gray-900">Access your data:</strong> Request a complete copy of all information we hold about you</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-gray-900">Modify your data:</strong> Update or correct any inaccurate information</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-gray-900">Delete your data:</strong> Request permanent deletion of your account and all associated data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-gray-900">Export your data:</strong> Download your data in a portable format</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-gray-900">Withdraw consent:</strong> Opt-out of optional data collection at any time</span>
                  </li>
                </ul>
                <p className="leading-relaxed mt-6">
                  To exercise any of these rights, contact us at{' '}
                  <a href="mailto:legal@catalystwells.in" className="text-blue-600 hover:underline">
                    legal@catalystwells.in
                  </a>
                </p>
              </div>
            </div>

            {/* Children's Privacy */}
            <div className="bg-blue-50 rounded-2xl p-6 sm:p-8 border border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Children's Privacy (COPPA/FERPA Compliance)</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  We take children's privacy seriously and comply with COPPA (Children's Online Privacy Protection Act) and FERPA (Family Educational Rights and Privacy Act):
                </p>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Parental consent is required for students under 13</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Parents can review, modify, or delete their child's data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Student data is NEVER used for advertising or marketing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Educational records are protected under FERPA guidelines</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
              <Mail className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Questions About Privacy?</h2>
              <p className="text-blue-100 mb-6">
                Our privacy team is here to help. Reach out with any concerns or questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:legal@catalystwells.in"
                  className="px-8 py-4 rounded-xl font-semibold bg-white text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Contact Privacy Team
                </a>
                <Link
                  href="/terms"
                  className="px-8 py-4 rounded-xl font-semibold border-2 border-white/30 hover:bg-white/10 transition-colors"
                >
                  View Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
