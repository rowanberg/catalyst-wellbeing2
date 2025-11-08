'use client'

import { DarkModeProvider } from '@/contexts/DarkModeContext'

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DarkModeProvider>
      {children}
    </DarkModeProvider>
  )
}
