'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/lib/redux/hooks'
import { usePerformanceOptimizer } from '@/hooks/usePerformanceOptimizer'
import { 
  Brain, Send, Lightbulb, Target, CheckCircle2, Clock, Sparkles,
  Paperclip, Plus, MessageCircle, Copy, Check, X, Menu, History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FluidThinking } from './FluidThinking'
import { LuminexAvatar } from './LuminexAvatar'
import { UserAvatar } from './UserAvatar'
import { QuotaIndicator } from './QuotaIndicator'
import { supabase } from '@/lib/supabaseClient'
import AIGraphRenderer from './AIGraphRenderer'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
  subject?: string
  imageData?: string
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// LocalStorage helpers
const SESSIONS_KEY = 'luminex_chat_sessions'
const USER_ID_KEY = 'luminex_user_id'
const RATE_LIMIT_KEY = 'luminex_rate_limit'
const RETENTION_MONTHS = 30
const DAILY_REQUEST_LIMIT = 30

const loadSessions = (currentUserId: string | undefined): ChatSession[] => {
  if (typeof window === 'undefined' || !currentUserId) return []
  try {
    const storedUserId = localStorage.getItem(USER_ID_KEY)
    const stored = localStorage.getItem(SESSIONS_KEY)
    
    // If different user, clear all data
    if (storedUserId && storedUserId !== currentUserId) {
      console.log('Different user detected, clearing previous history')
      localStorage.removeItem(SESSIONS_KEY)
      localStorage.setItem(USER_ID_KEY, currentUserId)
      return []
    }
    
    // Set user ID if not set
    if (!storedUserId) {
      localStorage.setItem(USER_ID_KEY, currentUserId)
    }
    
    if (!stored) return []
    
    const sessions: ChatSession[] = JSON.parse(stored)
    
    // Clean up sessions older than 30 months
    const retentionDate = new Date()
    retentionDate.setMonth(retentionDate.getMonth() - RETENTION_MONTHS)
    
    const validSessions = sessions.filter(session => {
      const sessionDate = new Date(session.createdAt)
      return sessionDate > retentionDate
    })
    
    // If we filtered any out, save the cleaned list
    if (validSessions.length !== sessions.length) {
      console.log(`Cleaned up ${sessions.length - validSessions.length} sessions older than ${RETENTION_MONTHS} months`)
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(validSessions))
    }
    
    return validSessions
  } catch (error) {
    console.error('Failed to load sessions:', error)
    return []
  }
}

const saveSessions = (sessions: ChatSession[], currentUserId: string | undefined) => {
  if (typeof window === 'undefined' || !currentUserId) return
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
    localStorage.setItem(USER_ID_KEY, currentUserId)
  } catch (error) {
    console.error('Failed to save sessions:', error)
  }
}

const generateSessionTitle = (firstMessage: string): string => {
  // Extract first 40 chars or until first punctuation
  const cleaned = firstMessage.trim().split(/[.!?\n]/)[0]
  return cleaned.length > 40 ? cleaned.substring(0, 40) + '...' : cleaned || 'New Conversation'
}

// Rate limit helpers
interface RateLimitData {
  userId: string
  count: number
  resetDate: string // ISO date string
}

const getRateLimit = (userId: string | undefined): { remaining: number; resetDate: Date } => {
  if (typeof window === 'undefined' || !userId) {
    return { remaining: DAILY_REQUEST_LIMIT, resetDate: new Date() }
  }
  
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    if (!stored) {
      return { remaining: DAILY_REQUEST_LIMIT, resetDate: new Date() }
    }
    
    const data: RateLimitData = JSON.parse(stored)
    
    // Check if it's a different user
    if (data.userId !== userId) {
      return { remaining: DAILY_REQUEST_LIMIT, resetDate: new Date() }
    }
    
    const resetDate = new Date(data.resetDate)
    const now = new Date()
    
    // Check if we need to reset (new day)
    if (now >= resetDate) {
      return { remaining: DAILY_REQUEST_LIMIT, resetDate: getNextResetDate() }
    }
    
    const remaining = Math.max(0, DAILY_REQUEST_LIMIT - data.count)
    return { remaining, resetDate }
  } catch (error) {
    console.error('Failed to get rate limit:', error)
    return { remaining: DAILY_REQUEST_LIMIT, resetDate: new Date() }
  }
}

const incrementRateLimit = (userId: string | undefined): boolean => {
  if (typeof window === 'undefined' || !userId) return false
  
  try {
    const { remaining, resetDate } = getRateLimit(userId)
    
    if (remaining <= 0) {
      return false // Limit exceeded
    }
    
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    let data: RateLimitData
    
    if (stored) {
      data = JSON.parse(stored)
      const storedResetDate = new Date(data.resetDate)
      const now = new Date()
      
      // Reset if new day or different user
      if (now >= storedResetDate || data.userId !== userId) {
        data = {
          userId,
          count: 1,
          resetDate: getNextResetDate().toISOString()
        }
      } else {
        data.count += 1
      }
    } else {
      data = {
        userId,
        count: 1,
        resetDate: getNextResetDate().toISOString()
      }
    }
    
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Failed to increment rate limit:', error)
    return false
  }
}

const getNextResetDate = (): Date => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0) // Midnight
  return tomorrow
}

// Data table component for rendering JSON arrays
function DataTable({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0) return null
  
  // Get all unique keys from all objects
  const allKeys = Array.from(new Set(data.flatMap(obj => Object.keys(obj))))
  
  return (
    <div className="my-4 overflow-x-auto rounded-xl shadow-md" style={{ borderColor: '#ffc8dd60' }}>
      <table className="w-full">
        <thead>
          <tr style={{ background: 'linear-gradient(to right, #cdb4db, #ffc8dd, #ffafcc)' }}>
            {allKeys.map((key, idx) => (
              <th 
                key={idx} 
                className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r last:border-r-0"
                style={{ borderRightColor: '#ffc8dd80' }}
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="hover:bg-slate-50 transition-colors"
            >
              {allKeys.map((key) => (
                <td 
                  key={key} 
                  className="px-4 py-3 text-sm text-slate-700 border-r border-slate-100 last:border-r-0"
                >
                  {row[key] !== undefined ? String(row[key]) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Code block component with syntax highlighting
function CodeBlock({ code, onCopy, enableHighlighting = true }: { code: string; onCopy?: (code: string) => void; enableHighlighting?: boolean }) {
  const [copied, setCopied] = React.useState(false)
  
  // Extract language from code block (e.g., "python\ncode here")
  const lines = code.split('\n')
  const firstLine = lines[0]?.trim().toLowerCase()
  let language = 'text'
  let actualCode = code
  
  // Check if first line is a language identifier
  const languageKeywords = ['python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'html', 'css', 'sql', 'bash', 'json', 'xml', 'yaml', 'markdown', 'tsx', 'jsx']
  if (languageKeywords.some(lang => firstLine === lang || firstLine.includes(lang))) {
    language = firstLine.split(' ')[0]
    actualCode = lines.slice(1).join('\n')
  }
  
  // Try to detect and render JSON arrays as tables
  if (language === 'json' || actualCode.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(actualCode.trim())
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        return <DataTable data={parsed} />
      }
    } catch (e) {
      // Not valid JSON or not a table structure, render as code
    }
  }
  
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(actualCode)
      setCopied(true)
      onCopy?.(actualCode)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  // Language badge color mapping
  const languageColors: Record<string, { bg: string; text: string; label: string }> = {
    python: { bg: 'bg-blue-500', text: 'text-white', label: 'Python' },
    javascript: { bg: 'bg-yellow-500', text: 'text-slate-900', label: 'JavaScript' },
    typescript: { bg: 'bg-blue-600', text: 'text-white', label: 'TypeScript' },
    tsx: { bg: 'bg-blue-600', text: 'text-white', label: 'TSX' },
    jsx: { bg: 'bg-cyan-500', text: 'text-white', label: 'JSX' },
    java: { bg: 'bg-orange-600', text: 'text-white', label: 'Java' },
    cpp: { bg: 'bg-pink-600', text: 'text-white', label: 'C++' },
    c: { bg: 'bg-purple-600', text: 'text-white', label: 'C' },
    html: { bg: 'bg-orange-500', text: 'text-white', label: 'HTML' },
    css: { bg: 'bg-blue-400', text: 'text-white', label: 'CSS' },
    sql: { bg: 'bg-teal-600', text: 'text-white', label: 'SQL' },
    bash: { bg: 'bg-slate-700', text: 'text-white', label: 'Bash' },
    json: { bg: 'bg-green-600', text: 'text-white', label: 'JSON' },
  }
  
  const langStyle = languageColors[language] || { bg: 'bg-slate-600', text: 'text-white', label: 'Code' }
  
  return (
    <div className="relative my-4 group rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
      {/* Header with language badge and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <span className={`px-3 py-1 rounded-md text-xs font-semibold ${langStyle.bg} ${langStyle.text}`}>
          {langStyle.label}
        </span>
        <button 
          onClick={handleCopy} 
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-xs font-medium"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code content with syntax highlighting colors */}
      <pre className="bg-slate-900 p-4 overflow-x-auto">
        <code className="text-sm font-mono leading-relaxed block">
          {enableHighlighting ? (
            <SyntaxHighlight code={actualCode} language={language} />
          ) : (
            <span className="text-slate-100">{actualCode}</span>
          )}
        </code>
      </pre>
    </div>
  )
}

// Simple syntax highlighter component using only React JSX
function SyntaxHighlight({ code, language }: { code: string; language: string }) {
  const lines = code.split('\n')
  
  const keywords = {
    python: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'with', 'lambda', 'yield', 'async', 'await', 'pass', 'break', 'continue', 'in', 'not', 'and', 'or', 'is'],
    javascript: ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'import', 'export', 'from', 'default', 'class', 'extends', 'super', 'this', 'new', 'typeof', 'instanceof'],
    typescript: ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'import', 'export', 'from', 'default', 'class', 'extends', 'super', 'this', 'new', 'typeof', 'instanceof', 'interface', 'type', 'enum'],
  }
  
  const langKeywords = keywords[language as keyof typeof keywords] || keywords.python
  
  const getTokenColor = (token: string, nextToken?: string): string => {
    const trimmed = token.trim()
    
    // Comments
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) return 'text-slate-500'
    
    // Strings
    if (trimmed.startsWith('"') || trimmed.startsWith("'") || trimmed.startsWith('`')) return 'text-green-400'
    
    // Keywords
    if (langKeywords.includes(trimmed)) return 'text-purple-400'
    
    // Constants
    if (['True', 'False', 'None', 'true', 'false', 'null', 'undefined', 'self'].includes(trimmed)) return 'text-blue-400'
    
    // Numbers
    if (/^\d+(\.\d+)?$/.test(trimmed)) return 'text-orange-400'
    
    // Function names (before parenthesis)
    if (nextToken === '(') return 'text-yellow-400'
    
    return 'text-slate-100'
  }
  
  return (
    <>
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx}>&nbsp;</div>
        }
        
        // Split by word boundaries but keep the delimiters
        const tokens = line.split(/(\s+|[(){}\[\].,;:"'`])/)
        
        return (
          <div key={lineIdx} className="leading-relaxed">
            {tokens.map((token, tokenIdx) => {
              if (!token) return null
              const color = getTokenColor(token, tokens[tokenIdx + 1])
              return (
                <span key={tokenIdx} className={color}>
                  {token}
                </span>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

// Preprocess mathematical notation to HTML
function preprocessMathNotation(text: string): string {
  // Convert common exponent patterns: x2, x3, etc. to x<sup>2</sup>
  text = text.replace(/([a-zA-Z])([0-9]+)(?![a-zA-Z0-9]|<\/sup>)/g, (match, letter, number) => {
    // Don't convert if it's part of a larger number or already has sup tag
    if (number.length === 1 && parseInt(number) <= 9) {
      return `${letter}<sup>${number}</sup>`
    }
    return match
  })
  
  // Convert subscript patterns: C2, H2O style to subscripts
  text = text.replace(/([A-Z])([0-9]+)(?=[A-Z]|\s|,|\)|\])/g, (match, letter, number) => {
    if (number.length <= 2 && parseInt(number) <= 20) {
      return `${letter}<sub>${number}</sub>`
    }
    return match
  })
  
  // Convert common superscript patterns at word boundaries
  text = text.replace(/\^([0-9]+)/g, '<sup>$1</sup>')
  text = text.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
  
  return text
}

// Parse inline markdown (bold, italic) and HTML tags (sup, sub, etc.)
function parseInlineMarkdown(text: string): React.ReactNode[] {
  // First preprocess mathematical notation
  const processedText = preprocessMathNotation(text)
  
  const parts: React.ReactNode[] = []
  let key = 0
  
  // Combined regex for markdown and HTML tags
  // Matches: **bold**, *italic*, <sup>text</sup>, <sub>text</sub>, <b>text</b>, <i>text</i>
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|<sup>(.+?)<\/sup>|<sub>(.+?)<\/sub>|<b>(.+?)<\/b>|<i>(.+?)<\/i>|<strong>(.+?)<\/strong>|<em>(.+?)<\/em>/g
  let lastIndex = 0
  let match
  
  while ((match = regex.exec(processedText)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>{processedText.slice(lastIndex, match.index)}</span>
      )
    }
    
    // Add the formatted text based on what matched
    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold text-white">{match[1]}</strong>
      )
    } else if (match[2]) {
      // *italic*
      parts.push(
        <em key={`italic-${key++}`} className="italic text-slate-100">{match[2]}</em>
      )
    } else if (match[3]) {
      // <sup>superscript</sup>
      parts.push(
        <sup key={`sup-${key++}`} className="text-xs align-super">{match[3]}</sup>
      )
    } else if (match[4]) {
      // <sub>subscript</sub>
      parts.push(
        <sub key={`sub-${key++}`} className="text-xs align-sub">{match[4]}</sub>
      )
    } else if (match[5] || match[7]) {
      // <b> or <strong>
      const content = match[5] || match[7]
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold text-white">{content}</strong>
      )
    } else if (match[6] || match[8]) {
      // <i> or <em>
      const content = match[6] || match[8]
      parts.push(
        <em key={`italic-${key++}`} className="italic text-slate-100">{content}</em>
      )
    }
    
    lastIndex = regex.lastIndex
  }
  
  // Add remaining text
  if (lastIndex < processedText.length) {
    parts.push(
      <span key={`text-${key++}`}>{processedText.slice(lastIndex)}</span>
    )
  }
  
  return parts.length > 0 ? parts : [<span key="0">{processedText}</span>]
}

// Component to render formatted message content
function MessageContent({ content, onCopy, showCopyButton }: { content: string; onCopy?: (code: string) => void; showCopyButton?: boolean }) {
  const [copied, setCopied] = React.useState(false)
  
  const handleCopyAll = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const formatContent = (text: string) => {
    // Check for explicit graph markers: <<<GRAPH:type>>> ... <<<END_GRAPH>>>
    const graphPattern = /<<<GRAPH:(line|bar|area|scatter)>>>\s*({[\s\S]*?})\s*<<<END_GRAPH>>>/g
    const graphMatches = Array.from(text.matchAll(graphPattern))
    
    if (graphMatches.length > 0) {
      const elements: React.ReactNode[] = []
      let lastIndex = 0
      
      graphMatches.forEach((match, idx) => {
        // Add text before graph
        if (match.index! > lastIndex) {
          const textBefore = text.substring(lastIndex, match.index)
          if (textBefore.trim()) {
            elements.push(
              <div key={`text-${idx}`} className="mb-4">
                {formatTextContent(textBefore)}
              </div>
            )
          }
        }
        
        // Parse and render graph
        try {
          const graphType = match[1] as 'line' | 'bar' | 'area' | 'scatter'
          const graphJson = JSON.parse(match[2])
          const graphData = {
            type: graphType,
            title: graphJson.title,
            data: graphJson.data,
            xKey: graphJson.xKey || 'x',
            yKeys: graphJson.yKeys || ['y']
          }
          elements.push(<AIGraphRenderer key={`graph-${idx}`} graphData={graphData} />)
        } catch (e) {
          console.error('Failed to parse graph data:', e)
          // If parsing fails, show as code block
          elements.push(
            <div key={`error-${idx}`} className="text-red-400 text-sm">
              ⚠️ Graph data parsing error
            </div>
          )
        }
        
        lastIndex = match.index! + match[0].length
      })
      
      // Add remaining text after last graph
      if (lastIndex < text.length) {
        const textAfter = text.substring(lastIndex)
        if (textAfter.trim()) {
          elements.push(
            <div key="text-final">
              {formatTextContent(textAfter)}
            </div>
          )
        }
      }
      
      return <>{elements}</>
    }
    
    // No graphs found, process normally
    return formatTextContent(text)
  }
  
  const formatTextContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, partIndex) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim()
        // Performance optimization will be passed from parent component
        return <CodeBlock key={partIndex} code={code} onCopy={onCopy} />
      }
      
      const lines = part.split('\n')
      const elements: JSX.Element[] = []
      
      let i = 0
      while (i < lines.length) {
        const line = lines[i]
        const key = `${partIndex}-${i}`
        
        if (!line.trim()) {
          elements.push(<div key={key} className="h-3" />)
          i++
          continue
        }
        
        // Markdown tables (| Header | Header |)
        if (line.includes('|') && line.trim().startsWith('|')) {
          // Collect all consecutive lines that look like table rows
          const tableLines: string[] = []
          let j = i
          while (j < lines.length && lines[j].includes('|') && lines[j].trim()) {
            tableLines.push(lines[j])
            j++
          }
          
          // Check if we have at least 2 lines (header + separator or header + data)
          if (tableLines.length >= 2) {
            // Parse table - better handling of pipe-separated values
            const parseTableRow = (row: string) => {
              // Remove leading/trailing pipes and split
              return row.trim().split('|')
                .map(cell => cell.trim())
                .filter((cell, idx, arr) => {
                  // Keep non-empty cells or middle empty cells (preserve structure)
                  return cell !== '' || (idx > 0 && idx < arr.length - 1)
                })
            }
            
            const headers = parseTableRow(tableLines[0])
            
            // Check if second line is a separator (contains dashes)
            const isSeparator = tableLines[1].includes('-') && tableLines[1].includes('|')
            const startDataRow = isSeparator ? 2 : 1
            
            if (headers.length > 0 && tableLines.length > startDataRow) {
              const rows = tableLines.slice(startDataRow)
                .map(row => parseTableRow(row))
                .filter(row => row.length > 0 && !row.every(cell => cell === ''))
              
              if (rows.length > 0) {
                // Calculate column widths based on content
                const colCount = headers.length
                const colWidths = headers.map((_, idx) => {
                  const maxLength = Math.max(
                    headers[idx]?.length || 0,
                    ...rows.map(row => row[idx]?.length || 0)
                  )
                  return `${Math.max(15, Math.min(35, maxLength * 1.2))}%`
                })
                
                elements.push(
                  <div key={key} className="my-4 overflow-x-auto rounded-xl shadow-lg border border-purple-500/30">
                    <table className="w-full table-fixed" style={{ minWidth: `${colCount * 200}px` }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(to right, #a855f7, #ec4899, #f472b6)' }}>
                          {headers.map((header, idx) => (
                            <th 
                              key={idx}
                              style={{ width: colWidths[idx] }}
                              className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-purple-400/30 last:border-r-0"
                            >
                              <div className="break-words">{parseInlineMarkdown(header)}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-slate-800/50 divide-y divide-slate-700/50">
                        {rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-slate-700/50 transition-colors">
                            {headers.map((_, cellIdx) => (
                              <td 
                                key={cellIdx}
                                style={{ width: colWidths[cellIdx] }}
                                className="px-4 py-3 text-sm text-slate-200 border-r border-slate-700/30 last:border-r-0"
                              >
                                <div className="break-words leading-relaxed">
                                  {row[cellIdx] ? parseInlineMarkdown(row[cellIdx]) : '—'}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
                i = j - 1
                continue
              }
            }
          }
        }
        
        // Headers (##, ###, ####)
        if (line.match(/^#{1,4}\s/)) {
          const level = line.match(/^#+/)?.[0].length || 1
          const heading = line.replace(/^#+\s/, '').trim()
          
          if (level === 1 || level === 2) {
            elements.push(
              <h2 key={key} className="text-xl font-bold mt-6 mb-4 text-white border-b border-slate-700/50 pb-2">
                {parseInlineMarkdown(heading)}
              </h2>
            )
          } else if (level === 3) {
            elements.push(
              <h3 key={key} className="text-lg font-semibold mt-5 mb-3 text-slate-100">
                {parseInlineMarkdown(heading)}
              </h3>
            )
          } else {
            elements.push(
              <h4 key={key} className="text-base font-semibold mt-4 mb-2 text-slate-200">
                {parseInlineMarkdown(heading)}
              </h4>
            )
          }
          i++
          continue
        }
        
        // Numbered lists with potential nested bullets
        if (line.match(/^\d+\.\s/)) {
          const number = line.match(/^\d+/)?.[0]
          const content = line.replace(/^\d+\.\s*/, '')
          
          // Check for nested bullets in following lines
          const nestedItems: JSX.Element[] = []
          let j = i + 1
          while (j < lines.length && lines[j].match(/^\s*[*-]\s/)) {
            const nestedContent = lines[j].replace(/^\s*[*-]\s/, '')
            nestedItems.push(
              <div key={`${key}-nested-${j}`} className="flex gap-2.5 my-1">
                <span className="text-slate-400 min-w-[0.75rem] text-xs mt-1">•</span>
                <span className="flex-1 text-slate-300 leading-relaxed text-sm">{parseInlineMarkdown(nestedContent)}</span>
              </div>
            )
            j++
          }
          
          elements.push(
            <div key={key} className="flex gap-3 my-2">
              <span className="font-bold min-w-[2rem] text-sm mt-0.5 flex-shrink-0" style={{ color: '#c084fc' }}>{number}.</span>
              <div className="flex-1">
                <div className="text-slate-100 leading-relaxed font-medium mb-1">
                  {parseInlineMarkdown(content)}
                </div>
                {nestedItems.length > 0 && (
                  <div className="ml-1 mt-1.5 space-y-0.5">
                    {nestedItems}
                  </div>
                )}
              </div>
            </div>
          )
          
          i = j
          continue
        }
        
        // Standalone bullets (no parent number)
        if (line.match(/^[*-]\s/)) {
          const content = line.replace(/^[*-]\s/, '')
          elements.push(
            <div key={key} className="flex gap-3 my-1.5">
              <span className="text-slate-400 font-bold min-w-[1rem] text-sm mt-0.5">•</span>
              <span className="flex-1 text-slate-200 leading-relaxed">{parseInlineMarkdown(content)}</span>
            </div>
          )
          i++
          continue
        }
        
        // Links [text](url)
        if (line.includes('[') && line.includes('](')) {
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
          const parts: React.ReactNode[] = []
          let lastIndex = 0
          let match
          
          while ((match = linkRegex.exec(line)) !== null) {
            // Add text before link
            if (match.index > lastIndex) {
              parts.push(parseInlineMarkdown(line.substring(lastIndex, match.index)))
            }
            // Add link
            parts.push(
              <a 
                key={match.index}
                href={match[2]} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline decoration-purple-400/50 hover:decoration-purple-300 transition-colors"
              >
                {match[1]}
              </a>
            )
            lastIndex = match.index + match[0].length
          }
          
          // Add remaining text
          if (lastIndex < line.length) {
            parts.push(parseInlineMarkdown(line.substring(lastIndex)))
          }
          
          elements.push(
            <p key={key} className="my-2 leading-relaxed text-slate-200">
              {parts}
            </p>
          )
          i++
          continue
        }
        
        // Regular paragraphs
        const parsedLine = parseInlineMarkdown(line)
        elements.push(
          <p key={key} className="my-2 leading-relaxed text-slate-200">
            {parsedLine}
          </p>
        )
        i++
      }
      
      return <React.Fragment key={partIndex}>{elements}</React.Fragment>
    })
  }
  
  return (
    <div className="space-y-2 text-[15px] leading-relaxed">
      {formatContent(content)}
      {showCopyButton && content && (
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy response</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export function AIHomeworkHelper({ onBack }: { onBack?: () => void }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [helpCount, setHelpCount] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([])
  const [messageLoadCount, setMessageLoadCount] = useState(20)
  const [inputPosition, setInputPosition] = useState<'center' | 'bottom'>('center')
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [remainingRequests, setRemainingRequests] = useState(DAILY_REQUEST_LIMIT)
  const [resetDate, setResetDate] = useState<Date>(new Date())
  const profile = useAppSelector((state) => state.auth.profile)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Performance optimization for mobile
  const { capabilities, settings, isOptimized } = usePerformanceOptimizer()
  
  // Apply message limit based on device capabilities
  const maxVisibleMessages = useMemo(() => {
    return settings.maxMessagesInView
  }, [settings.maxMessagesInView])
  
  // Debug profile data
  useEffect(() => {
    console.log('[AI Helper] Profile data:', profile)
    console.log('[AI Helper] Full name:', profile?.full_name)
    if (isOptimized) {
      console.log('[Performance] Optimizations active:', capabilities)
    }
  }, [profile, isOptimized, capabilities])

// ...
  // Load sessions from localStorage on mount (wait for profile to be loaded)
  useEffect(() => {
    const userId = profile?.id
    if (!userId) return // Wait for profile to load
    
    const loadedSessions = loadSessions(userId)
    setSessions(loadedSessions)
    
    // If no sessions, create a new one
    if (loadedSessions.length === 0) {
      const newSession: ChatSession = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: 'New Conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setSessions([newSession])
      setCurrentSessionId(newSession.id)
    } else {
      // Load the most recent session
      const mostRecent = loadedSessions[0]
      setCurrentSessionId(mostRecent.id)
      setMessages(mostRecent.messages)
    }
  }, [profile?.id])

  // Load and update rate limit
  useEffect(() => {
    const userId = profile?.id
    if (!userId) return
    
    const { remaining, resetDate: reset } = getRateLimit(userId)
    setRemainingRequests(remaining)
    setResetDate(reset)
    
    // Set up interval to check if it's a new day
    const interval = setInterval(() => {
      const { remaining: newRemaining, resetDate: newReset } = getRateLimit(userId)
      setRemainingRequests(newRemaining)
      setResetDate(newReset)
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [profile?.id])

  // Save sessions whenever they change
  useEffect(() => {
    const userId = profile?.id
    if (sessions.length > 0 && userId) {
      saveSessions(sessions, userId)
    }
  }, [sessions, profile?.id])

  // Update current session when messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: messages,
            updatedAt: new Date().toISOString(),
            // Update title based on first user message if still "New Conversation"
            title: session.title === 'New Conversation' && messages[0]?.type === 'user'
              ? generateSessionTitle(messages[0].content)
              : session.title
          }
        }
        return session
      }))
    }
  }, [messages, currentSessionId])

  useEffect(() => {
    // Use optimized message count for mobile devices
    const effectiveLoadCount = Math.min(messageLoadCount, maxVisibleMessages)
    const start = Math.max(0, messages.length - effectiveLoadCount)
    setDisplayedMessages(messages.slice(start))
  }, [messages, messageLoadCount, maxVisibleMessages])

  // Scroll handler
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current
      if (scrollTop === 0 && displayedMessages.length < messages.length) {
        setMessageLoadCount(prev => prev + 20)
      }
    }
  }, [displayedMessages.length, messages.length])

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const removeImage = useCallback(() => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputMessage(value)
    const words = value.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() && !selectedImage) return
    
    const userId = profile?.id
    if (!userId) return

    // If only image is sent without text, provide a default message
    const messageContent = inputMessage.trim() || (selectedImage ? 'Analyze this image for me.' : '')
    
    const userMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      imageData: selectedImage || undefined
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = messageContent
    const currentImage = selectedImage
    setInputMessage('')
    setSelectedImage(null)
    setIsTyping(true)
    setHelpCount(prev => prev + 1)

    try {
      // Get auth token for extended API from existing session
      // UnifiedAuthGuard ensures user is authenticated, so we can get the session safely
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError)
        throw new Error('Authentication expired. Please refresh the page.')
      }

      // Call the extended Gemini API endpoint (handles 30 normal + 500 extra quota)
      const response = await fetch('/api/chat/gemini-extended', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: currentInput,
          imageData: currentImage,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          schoolContext: {
            studentName: profile?.full_name || 'Student',
            schoolName: profile?.school_name || 'School',
            imageAttached: !!currentImage
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get response')
      }

      // Handle streaming response with ultra-smooth requestAnimationFrame updates
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      const aiMessageId = (Date.now() + 1).toString()
      let isFirstChunk = true
      let pendingUpdate = false
      let animationFrameId: number | null = null

      // Check if user is near bottom of scroll (within 150px)
      const isNearBottom = () => {
        const container = messagesEndRef.current?.parentElement?.parentElement
        if (!container) return true
        const threshold = 150
        const position = container.scrollTop + container.clientHeight
        const height = container.scrollHeight
        return height - position < threshold
      }

      // Ultra-smooth update function using RAF with smart scroll
      const smoothUpdate = () => {
        pendingUpdate = false
        const shouldAutoScroll = isNearBottom()
        
        setMessages(prev => {
          const existing = prev.find(m => m.id === aiMessageId)
          if (existing) {
            return prev.map(m => 
              m.id === aiMessageId 
                ? { ...m, content: accumulatedText }
                : m
            )
          } else {
            return [...prev, {
              id: aiMessageId,
              type: 'ai' as const,
              content: accumulatedText,
              timestamp: new Date().toISOString()
            }]
          }
        })
        
        // Only auto-scroll if user is near bottom (smart scroll)
        if (shouldAutoScroll) {
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
          })
        }
      }

      // Request update on next frame
      const requestUpdate = () => {
        if (!pendingUpdate) {
          pendingUpdate = true
          animationFrameId = requestAnimationFrame(smoothUpdate)
        }
      }

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                break
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  accumulatedText += parsed.text
                  
                  // Hide typing indicator and start streaming on first chunk
                  if (isFirstChunk) {
                    setIsTyping(false)
                    setIsStreaming(true)
                    isFirstChunk = false
                  }
                  
                  // Request smooth update on next animation frame
                  requestUpdate()
                }
              } catch (e) {
                // Ignore JSON parse errors for partial chunks
              }
            }
          }
        }
        
        // Final update with all accumulated text
        setMessages(prev => {
          const existing = prev.find(m => m.id === aiMessageId)
          if (existing) {
            return prev.map(m => 
              m.id === aiMessageId 
                ? { ...m, content: accumulatedText }
                : m
            )
          }
          return prev
        })
      }

      // Ensure typing indicator is hidden and streaming is stopped
      setIsTyping(false)
      setIsStreaming(false)
      
      // Trigger quota indicator refresh
      window.dispatchEvent(new Event('refresh-quota'))
      
      // Final smooth scroll to ensure full message is visible
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 100)
    } catch (error: any) {
      console.error('Error calling Gemini API:', error)
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: `I'm sorry, I encountered an error: ${error.message || 'Failed to get response'}. Please try again.`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [inputMessage, selectedImage, messages, profile])

  // Move input to bottom when messages appear
  useEffect(() => {
    if (messages.length > 0 && inputPosition === 'center') {
      setInputPosition('bottom')
    }
  }, [messages.length, inputPosition])

  // Reset textarea height
  useEffect(() => {
    if (inputMessage === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [inputMessage])

  // Scroll to bottom when new messages arrive (not when typing starts)
  useEffect(() => {
    if (messages.length > 0 && !isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, isTyping])
  
  // Scroll to bottom to hide previous messages and show only thinking animation
  useEffect(() => {
    if (isTyping && messagesContainerRef.current) {
      // Scroll to bottom so previous messages are hidden above
      const container = messagesContainerRef.current
      
      // Add small delay to let thinking animation render first
      setTimeout(() => {
        container.scrollTo({ 
          top: container.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 50)
    }
  }, [isTyping])

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Create new chat session
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setMessages([])
    setMessageLoadCount(20)
    setInputPosition('center')
    setSessionTime(0)
  }, [])

  // Switch to a different session
  const switchSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
      setInputPosition(session.messages.length === 0 ? 'center' : 'bottom')
    }
  }, [sessions])

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId)
      // If deleting current session, switch to another or create new
      if (sessionId === currentSessionId) {
        if (updated.length > 0) {
          setCurrentSessionId(updated[0].id)
          setMessages(updated[0].messages)
        } else {
          createNewSession()
        }
      }
      return updated
    })
  }, [currentSessionId, createNewSession])

  // Render centered input
  function renderCenteredInput() {
    return (
      <div className="w-full sm:max-w-3xl lg:max-w-4xl sm:mx-auto px-2 sm:px-4">
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-4 relative inline-block"
          >
            <div className="relative h-32 rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
              <Image 
                src={selectedImage} 
                alt="Preview" 
                width={150} 
                height={128} 
                className="h-full w-auto object-cover" 
                style={{ width: 'auto', height: '100%' }} 
              />
            </div>
            <Button 
              onClick={removeImage} 
              size="sm" 
              className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full bg-red-500 hover:bg-red-600 border-2 border-white shadow-md transition-all hover:scale-110"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </Button>
          </motion.div>
        )}
        
        <div className="flex items-end gap-3">
          <div className="flex-1 relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border-2 shadow-2xl hover:shadow-purple-500/20 transition-all duration-200"
          style={{
            borderColor: 'rgba(168, 85, 247, 0.3)'
          }}
          onFocus={(e) => {
            if (e.currentTarget.contains(e.target)) {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(168, 85, 247, 0.2), 0 10px 10px -5px rgba(168, 85, 247, 0.1)'
            }
          }}
          onBlur={(e) => {
            if (e.currentTarget.contains(e.target)) {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)'
            }
          }}>
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ask me anything about your homework..."
              rows={1}
              className="w-full bg-transparent text-white placeholder:text-slate-500 px-5 sm:px-6 py-4 sm:py-5 pr-16 text-base sm:text-lg focus:outline-none resize-none overflow-y-auto min-h-[72px] sm:min-h-[80px] max-h-[180px] sm:max-h-[200px]"
              style={{ scrollbarWidth: 'none' }}
              autoFocus
            />
            
            <div className="absolute right-3 sm:right-4 bottom-3 sm:bottom-4">
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                size="sm" 
                variant="ghost" 
                type="button" 
                title="Attach image" 
                className="h-10 w-10 sm:h-11 sm:w-11 p-0 text-slate-400 rounded-lg transition-all"
                style={{
                  '--hover-bg': 'rgba(168, 85, 247, 0.15)',
                  '--hover-color': '#c084fc'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)'
                  e.currentTarget.style.color = '#c084fc'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" aria-label="Upload image" />
          </div>
          
          <motion.button
            onClick={sendMessage}
            disabled={!inputMessage.trim() && !selectedImage}
            title="Send message"
            className={cn(
              "relative h-[72px] w-[72px] sm:h-[80px] sm:w-[80px] rounded-2xl transition-all duration-300 flex items-center justify-center overflow-hidden group",
              (!inputMessage.trim() && !selectedImage)
                ? "bg-slate-800 cursor-not-allowed"
                : "cursor-pointer"
            )}
            whileHover={(!inputMessage.trim() && !selectedImage) ? {} : { scale: 1.08 }}
            whileTap={(!inputMessage.trim() && !selectedImage) ? {} : { scale: 0.92 }}
            animate={(!inputMessage.trim() && !selectedImage) ? {} : {
              boxShadow: [
                '0 0 20px rgba(168, 85, 247, 0.4)',
                '0 0 30px rgba(236, 72, 153, 0.5)',
                '0 0 20px rgba(168, 85, 247, 0.4)',
              ]
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 0.15 }
            }}
          >
            {/* Animated gradient border */}
            {(!inputMessage.trim() && !selectedImage) ? null : (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(45deg, #a855f7, #ec4899, #8b5cf6, #d946ef)',
                  backgroundSize: '400% 400%'
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}
            
            {/* Inner content */}
            <div className={cn(
              "relative z-10 w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-[14px] flex items-center justify-center",
              (!inputMessage.trim() && !selectedImage)
                ? "bg-slate-800"
                : "bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700"
            )}>
              {/* Shine effect */}
              {(!inputMessage.trim() && !selectedImage) ? null : (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                    repeatDelay: 1
                  }}
                />
              )}
              
              {/* Icon with pulse */}
              <motion.div
                animate={(!inputMessage.trim() && !selectedImage) ? {} : {
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Send className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7",
                  (!inputMessage.trim() && !selectedImage) ? "text-slate-600" : "text-white drop-shadow-lg"
                )} />
              </motion.div>
              
              {/* Sparkle particles */}
              {(!inputMessage.trim() && !selectedImage) ? null : (
                <>
                  <motion.div
                    className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full"
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0
                    }}
                  />
                  <motion.div
                    className="absolute bottom-3 left-3 w-1 h-1 bg-white rounded-full"
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.5
                    }}
                  />
                  <motion.div
                    className="absolute top-1/2 left-2 w-1 h-1 bg-white rounded-full"
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 1
                    }}
                  />
                </>
              )}
            </div>
          </motion.button>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Enter</kbd>
            to send
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Shift + Enter</kbd>
            for new line
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="hidden lg:flex flex-col w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
        {/* History View - Full Screen */}
        {showHistory ? (
          <>
            {/* History Header with Back Button */}
            <div className="p-5 bg-slate-900/50 border-b border-slate-700/50 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 backdrop-blur-sm">
                    <History className="h-5 w-5 text-purple-400" />
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight">Chat History</h2>
                </div>
                <Button
                  onClick={() => setShowHistory(false)}
                  className="h-8 w-8 p-0 rounded-lg flex items-center justify-center transition-all duration-200 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                  title="Back to main view"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-slate-400">{sessions.length} conversation{sessions.length !== 1 ? 's' : ''} saved</div>
            </div>

            {/* Full History List */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageCircle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <div className="text-sm text-slate-400 font-medium">No conversations yet</div>
                    <div className="text-xs text-slate-500 mt-2">Start a new chat to begin</div>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <motion.button
                      key={session.id}
                      onClick={() => {
                        switchSession(session.id)
                        setShowHistory(false)
                      }}
                      className={cn(
                        "w-full text-left px-3 py-3 rounded-xl text-xs transition-all duration-200 group relative overflow-hidden",
                        currentSessionId === session.id
                          ? "bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-purple-900/40 border-2 shadow-lg"
                          : "bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600 hover:shadow-md backdrop-blur-sm"
                      )}
                      style={{
                        borderColor: currentSessionId === session.id ? '#ffc8dd' : undefined
                      }}
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {currentSessionId === session.id && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50"></div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate mb-1.5 text-sm">
                            {session.title}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-0.5 rounded-full">
                              <MessageCircle className="h-2.5 w-2.5" />
                              <span className="font-medium">{session.messages.length}</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <span className="font-medium">{new Date(session.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                        {currentSessionId !== session.id && (
                          <motion.div
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-lg cursor-pointer"
                            title="Delete session"
                            role="button"
                            tabIndex={0}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation()
                                deleteSession(session.id)
                              }
                            }}
                          >
                            <X className="h-3.5 w-3.5 text-red-400" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Normal Sidebar View */}
            {/* Header Section */}
            <div className="p-5 bg-slate-900/50 border-b border-slate-700/50 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <LuminexAvatar size={40} animated={true} />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-white tracking-tight">Luminex AI</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Your Homework Assistant</p>
                </div>
              </div>
              <Button 
                onClick={createNewSession} 
                className="w-full text-white text-sm font-semibold h-10 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 border border-purple-500/30"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f472b6 100%)'
                }}
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="px-4 py-3 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-b border-slate-700/50">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2.5 border border-purple-500/20 shadow-sm">
                  <div className="flex flex-col items-center">
                    <MessageCircle className="h-4 w-4 text-purple-400 mb-1" />
                    <div className="text-lg font-bold text-white">{sessions.reduce((acc, s) => acc + s.messages.length, 0)}</div>
                    <div className="text-[8px] text-slate-400 font-medium text-center">Total Msgs</div>
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2.5 border border-pink-500/20 shadow-sm">
                  <div className="flex flex-col items-center">
                    <Sparkles className="h-4 w-4 text-pink-400 mb-1" />
                    <div className="text-lg font-bold text-white">{sessions.length}</div>
                    <div className="text-[8px] text-slate-400 font-medium text-center">Chats</div>
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2.5 border border-blue-500/20 shadow-sm">
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 text-blue-400 mb-1" />
                    <div className="text-lg font-bold text-white">{messages.length}</div>
                    <div className="text-[8px] text-slate-400 font-medium text-center">Active</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Quota Section */}
            <div className="px-4 py-3 bg-transparent border-b border-slate-700/50">
              <QuotaIndicator />
            </div>

            {/* History Toggle Button */}
            <div className="px-4 py-3 border-b border-slate-700/50">
              <Button
                onClick={() => setShowHistory(true)}
                className="w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 bg-slate-800 border-2 border-slate-700 hover:border-purple-500 hover:bg-slate-700 text-slate-300 hover:text-purple-300"
              >
                <History className="h-4 w-4" />
                <span className="text-sm font-semibold">Show History</span>
              </Button>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>
          </>
        )}

        {/* Footer Section */}
        <div className="bg-slate-900/50 border-t border-slate-700/50 shadow-2xl px-4 py-3 backdrop-blur-xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <span className="font-semibold">Online & Ready</span>
              </div>
              <span className="text-slate-500 font-medium">Saved locally</span>
            </div>
            
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-2 border border-blue-500/20">
              <div className="text-[9px] text-slate-400 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                  <span className="font-semibold">Images • Press Enter • 30-month retention</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Mobile Sidebar Drawer - Enhanced */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isMobileSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl z-50 lg:hidden flex flex-col"
      >
        {/* Mobile History View - Full Screen */}
        {showHistory ? (
          <>
            {/* History Header with Back Button */}
            <div className="p-4 bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20">
                    <History className="h-5 w-5 text-purple-400" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Chat History</h2>
                </div>
                <Button
                  onClick={() => setShowHistory(false)}
                  className="h-7 w-7 p-0 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-slate-400">{sessions.length} conversation{sessions.length !== 1 ? 's' : ''} saved</div>
            </div>

            {/* Full History List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <div className="text-sm text-slate-400 font-medium">No conversations yet</div>
                    <div className="text-xs text-slate-500 mt-1">Start a new chat to begin</div>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <motion.button
                      key={session.id}
                      onClick={() => {
                        switchSession(session.id)
                        setShowHistory(false)
                        setIsMobileSidebarOpen(false)
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-150 group relative",
                        currentSessionId === session.id
                          ? "bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-purple-900/40 border-2 shadow-lg"
                          : "bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 hover:shadow-md backdrop-blur-sm"
                      )}
                      style={{
                        borderColor: currentSessionId === session.id ? '#ffc8dd' : undefined
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate mb-1">
                            {session.title}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <MessageCircle className="h-3 w-3" />
                            <span>{session.messages.length} msgs</span>
                            <span>•</span>
                            <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {currentSessionId !== session.id && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded cursor-pointer"
                            title="Delete session"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation()
                                deleteSession(session.id)
                              }
                            }}
                          >
                            <X className="h-3 w-3 text-red-400" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Normal Mobile Sidebar View */}
            {/* Mobile Sidebar Header */}
            <div className="p-4 bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <LuminexAvatar size={36} animated={true} />
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold text-white">Luminex AI</h2>
                    <p className="text-[10px] text-slate-400">Powered by Catalyst Innovations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-300" />
                </button>
              </div>
              <Button 
                onClick={() => {
                  createNewSession()
                  setIsMobileSidebarOpen(false)
                }} 
                className="w-full text-white text-xs h-9 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-xl border border-purple-500/30"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f472b6 100%)'
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                New Chat
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="px-4 py-3 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-b border-slate-700/50">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-purple-500/20">
                  <div className="flex flex-col items-center">
                    <MessageCircle className="h-3.5 w-3.5 text-purple-400 mb-1" />
                    <div className="text-sm font-bold text-white">{sessions.reduce((acc, s) => acc + s.messages.length, 0)}</div>
                    <div className="text-[8px] text-slate-400 font-medium">Total</div>
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-pink-500/20">
                  <div className="flex flex-col items-center">
                    <Sparkles className="h-3.5 w-3.5 text-pink-400 mb-1" />
                    <div className="text-sm font-bold text-white">{sessions.length}</div>
                    <div className="text-[8px] text-slate-500 font-medium">Chats</div>
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-blue-500/20">
                  <div className="flex flex-col items-center">
                    <Clock className="h-3.5 w-3.5 text-blue-400 mb-1" />
                    <div className="text-sm font-bold text-white">{messages.length}</div>
                    <div className="text-[8px] text-slate-400 font-medium">Active</div>
                  </div>
                </div>
              </div>
            </div>

            {/* History Toggle Button */}
            <div className="px-4 py-3 border-b border-slate-700/50">
              <Button
                onClick={() => setShowHistory(true)}
                className="w-full h-8 rounded-xl flex items-center justify-center gap-2 bg-slate-800 border-2 border-slate-700 hover:border-purple-500 hover:bg-slate-700 text-slate-300 hover:text-purple-300"
              >
                <History className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Show History</span>
              </Button>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Footer */}
            <div className="p-4 bg-slate-900/50 border-t border-slate-700/50 backdrop-blur-xl">
              <div className="flex flex-col gap-3">
                {/* AI Quota Indicator */}
                <QuotaIndicator />
                
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-slate-500" />
                    {sessions.length} {sessions.length === 1 ? 'conversation' : 'conversations'}
                  </span>
                  <span className="text-slate-500">Saved locally</span>
                </div>
                <div className="text-[9px] text-slate-500">
                  Tip: Images supported • Press Enter to send
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {messages.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }} 
            className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl shadow-lg"
          >
            <div className="flex items-center justify-between w-full sm:max-w-4xl sm:mx-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 border border-slate-700/50 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <Menu className="h-5 w-5 text-slate-300" />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="hidden sm:block">
                    <LuminexAvatar size={32} animated={false} />
                  </div>
                  <div>
                    <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Luminex AI</h1>
                    <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Homework Assistant</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <span className="font-semibold">Online</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesContainerRef} onScroll={handleScroll} className={cn("flex-1 overflow-y-auto transition-all duration-500", inputPosition === 'center' ? 'flex items-center justify-center' : '')} style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <div className={cn("w-full transition-all duration-500", inputPosition === 'center' ? 'px-4 sm:max-w-2xl sm:mx-auto sm:px-6' : 'px-2 sm:px-4 lg:max-w-5xl lg:mx-auto py-3 sm:py-6 lg:py-8 space-y-3 sm:space-y-6')}>
            {inputPosition === 'center' && displayedMessages.length === 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="w-full">
                {/* Mobile Menu Button - Fixed Position */}
                <motion.button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden fixed top-4 left-4 z-30 p-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 rounded-xl transition-all duration-200 shadow-2xl border border-slate-700/50 hover:border-purple-500/30 hover:shadow-purple-500/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu className="h-5 w-5 text-slate-300" />
                </motion.button>
                
                <div className="text-center mb-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
                    <div className="mx-auto mb-6 flex justify-center">
                      <LuminexAvatar size={64} animated={true} />
                    </div>
                    <h2 className="text-3xl font-semibold mb-3">
                      {profile?.first_name ? (
                        <>
                          <span className="bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">Hi </span>
                          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{profile.first_name}</span>
                          <span className="bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">, how can I help you today?</span>
                        </>
                      ) : (
                        <span className="bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">How can I help you today?</span>
                      )}
                    </h2>
                    <p className="text-slate-400 max-w-md mx-auto">Ask me anything about your homework, and I'll guide you through it step by step.</p>
                  </motion.div>
                </div>
                {renderCenteredInput()}
              </motion.div>
            )}
            
            {displayedMessages.map((message, index) => (
              <motion.div 
                key={message.id} 
                className="flex gap-2 sm:gap-4 group relative" 
                initial={{ opacity: 0, y: 15, scale: 0.97 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                transition={{ 
                  delay: index * 0.02, 
                  duration: message.type === 'ai' ? 0.5 : 0.3,
                  ease: [0.16, 1, 0.3, 1] // Custom easing for ultra-smooth animation
                }} 
                onMouseEnter={() => setHoveredMessage(message.id)} 
                onMouseLeave={() => setHoveredMessage(null)}
              >
                <div className="flex-shrink-0 pt-1">
                  {message.type === 'ai' ? (
                    <LuminexAvatar size={28} animated={false} />
                  ) : (
                    <UserAvatar size={28} name={profile?.first_name || profile?.last_name} />
                  )}
                </div>
                
                <div className="flex-1 space-y-3 min-w-0">
                  {/* Header with name and actions */}
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: message.type === 'ai' ? '#c084fc' : '#60a5fa' }}
                    >
                      {message.type === 'user' ? (profile?.first_name || 'You') : 'Luminex AI'}
                    </span>
                    {hoveredMessage === message.id && (
                      <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1">
                        <button 
                          onClick={() => { if (typeof navigator !== 'undefined' && navigator.clipboard) { navigator.clipboard.writeText(message.content); setCopiedCode(message.id); setTimeout(() => setCopiedCode(null), 2000) } }} 
                          className="px-2 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center gap-1" 
                          title="Copy message"
                        >
                          {copiedCode === message.id ? (
                            <><Check className="h-3 w-3" /> Copied</>
                          ) : (
                            <><Copy className="h-3 w-3" /> Copy</>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Message card */}
                  <div className={cn(
                    "rounded-2xl p-3 sm:p-4 shadow-lg transition-all duration-200",
                    message.type === 'ai' 
                      ? 'border hover:shadow-xl backdrop-blur-xl' 
                      : 'border hover:shadow-xl backdrop-blur-xl'
                  )}
                  style={{
                    background: message.type === 'ai'
                      ? 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.05))'
                      : 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.1))',
                    borderColor: message.type === 'ai' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.3)'
                  }}>
                    {message.imageData && (
                      <div className="relative max-w-full sm:max-w-md mb-4">
                        <Image 
                          src={message.imageData} 
                          alt="Uploaded" 
                          width={400} 
                          height={300} 
                          className="rounded-xl border border-slate-200 shadow-sm" 
                          style={{ width: '100%', height: 'auto' }} 
                        />
                      </div>
                    )}
                    
                    <div className="relative">
                      <MessageContent 
                        content={message.content} 
                        onCopy={(code) => { setCopiedCode(`${message.id}-code`); setTimeout(() => setCopiedCode(null), 2000) }}
                        showCopyButton={message.type === 'ai' && !isStreaming}
                      />
                      {/* Show typing cursor while streaming */}
                      {message.type === 'ai' && isStreaming && messages[messages.length - 1]?.id === message.id && (
                        <span className="inline-block w-0.5 h-5 bg-indigo-500 ml-1 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex gap-2 sm:gap-4"
              >
                <div className="flex-shrink-0 pt-1">
                  <LuminexAvatar size={28} animated={true} />
                </div>
                <div className="flex-1 space-y-2">
                  <span className="text-xs font-semibold" style={{ color: '#c084fc' }}>Luminex AI</span>
                  <div className="flex items-center gap-3">
                    <FluidThinking size={28} />
                    <span className="text-sm text-slate-300 italic">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {inputPosition === 'bottom' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }} 
            className="px-2 sm:px-4 py-3 sm:py-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-xl"
          >
            <div className="w-full sm:max-w-4xl lg:max-w-5xl sm:mx-auto">
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="mb-3 relative inline-block"
                >
                  <div className="relative h-24 sm:h-32 rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
                    <Image 
                      src={selectedImage} 
                      alt="Preview" 
                      width={150} 
                      height={128} 
                      className="h-full w-auto object-cover" 
                      style={{ width: 'auto', height: '100%' }} 
                    />
                  </div>
                  <Button 
                    onClick={removeImage} 
                    size="sm" 
                    className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full bg-red-500 hover:bg-red-600 border-2 border-white shadow-md transition-all hover:scale-110"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </Button>
                </motion.div>
              )}
              
              <div className="flex items-end gap-3">
                <div className="flex-1 relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border-2 shadow-2xl hover:shadow-purple-500/20 transition-all duration-200"
                style={{
                  borderColor: 'rgba(168, 85, 247, 0.3)'
                }}
                onFocus={(e) => {
                  if (e.currentTarget.contains(e.target)) {
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)'
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(168, 85, 247, 0.2), 0 4px 6px -2px rgba(168, 85, 247, 0.1)'
                  }
                }}
                onBlur={(e) => {
                  if (e.currentTarget.contains(e.target)) {
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)'
                  }
                }}>
                  <textarea 
                    ref={textareaRef} 
                    value={inputMessage} 
                    onChange={handleInputChange} 
                    onKeyPress={(e) => { 
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        sendMessage() 
                      } 
                    }} 
                    placeholder="Ask me anything about your homework..." 
                    rows={1} 
                    className="w-full bg-transparent text-white placeholder:text-slate-500 px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 text-sm sm:text-base focus:outline-none resize-none overflow-y-auto min-h-[60px] sm:min-h-[68px] max-h-[160px] sm:max-h-[180px]" 
                    style={{ scrollbarWidth: 'none' }} 
                  />
                  
                  <div className="absolute right-3 sm:right-4 bottom-3 sm:bottom-4">
                    <Button 
                      onClick={() => fileInputRef.current?.click()} 
                      size="sm" 
                      variant="ghost" 
                      type="button" 
                      title="Attach image" 
                      className="h-9 w-9 sm:h-10 sm:w-10 p-0 text-slate-400 rounded-lg transition-all"
                      style={{
                        '--hover-bg': 'rgba(168, 85, 247, 0.15)',
                        '--hover-color': '#c084fc'
                      } as React.CSSProperties}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)'
                        e.currentTarget.style.color = '#c084fc'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#94a3b8'
                      }}
                    >
                      <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() && !selectedImage} 
                  title="Send message" 
                  className={cn(
                    "h-[60px] w-[60px] sm:h-[68px] sm:w-[68px] p-0 rounded-xl shadow-2xl transition-all duration-200 flex items-center justify-center border",
                    (!inputMessage.trim() && !selectedImage)
                      ? "bg-slate-800 cursor-not-allowed border-slate-700"
                      : "bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-purple-500/30 hover:shadow-purple-500/50 hover:shadow-2xl hover:scale-105 active:scale-95"
                  )}
                >
                  <Send className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </Button>
              </div>
              
              {/* Helper text */}
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">Enter</kbd> to send</span>
                <span>Shift + Enter for new line</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
