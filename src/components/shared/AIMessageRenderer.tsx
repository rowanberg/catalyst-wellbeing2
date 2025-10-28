'use client'

import React from 'react'
import { Copy, Check } from 'lucide-react'
import AIGraphRenderer from '@/components/student/tools/AIGraphRenderer'

// Preprocess mathematical notation to HTML
function preprocessMathNotation(text: string): string {
  // Convert common exponent patterns: x2, x3, etc. to x<sup>2</sup>
  text = text.replace(/([a-zA-Z])([0-9]+)(?![a-zA-Z0-9]|<\/sup>)/g, (match, letter, number) => {
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
  const processedText = preprocessMathNotation(text)
  const parts: React.ReactNode[] = []
  let key = 0
  
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|<sup>(.+?)<\/sup>|<sub>(.+?)<\/sub>|<b>(.+?)<\/b>|<i>(.+?)<\/i>|<strong>(.+?)<\/strong>|<em>(.+?)<\/em>/g
  let lastIndex = 0
  let match
  
  while ((match = regex.exec(processedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>{processedText.slice(lastIndex, match.index)}</span>
      )
    }
    
    if (match[1]) {
      parts.push(<strong key={`bold-${key++}`} className="font-semibold">{match[1]}</strong>)
    } else if (match[2]) {
      parts.push(<em key={`italic-${key++}`} className="italic">{match[2]}</em>)
    } else if (match[3]) {
      parts.push(<sup key={`sup-${key++}`} className="text-xs align-super">{match[3]}</sup>)
    } else if (match[4]) {
      parts.push(<sub key={`sub-${key++}`} className="text-xs align-sub">{match[4]}</sub>)
    } else if (match[5] || match[7]) {
      const content = match[5] || match[7]
      parts.push(<strong key={`bold-${key++}`} className="font-semibold">{content}</strong>)
    } else if (match[6] || match[8]) {
      const content = match[6] || match[8]
      parts.push(<em key={`italic-${key++}`} className="italic">{content}</em>)
    }
    
    lastIndex = regex.lastIndex
  }
  
  if (lastIndex < processedText.length) {
    parts.push(<span key={`text-${key++}`}>{processedText.slice(lastIndex)}</span>)
  }
  
  return parts.length > 0 ? parts : [<span key="0">{processedText}</span>]
}

// Code block with syntax highlighting and copy button
function CodeBlock({ code, onCopy }: { code: string; onCopy?: (code: string) => void }) {
  const [copied, setCopied] = React.useState(false)
  
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      if (onCopy) onCopy(code)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  // Detect JSON arrays for table rendering
  const trimmedCode = code.trim()
  if ((trimmedCode.startsWith('[') && trimmedCode.endsWith(']')) || code.includes('json')) {
    try {
      const parsedData = JSON.parse(trimmedCode.startsWith('[') ? trimmedCode : trimmedCode.replace(/^json\s*/, ''))
      if (Array.isArray(parsedData) && parsedData.length > 0 && typeof parsedData[0] === 'object') {
        return <DataTable data={parsedData} />
      }
    } catch (e) {
      // Not valid JSON, render as code
    }
  }
  
  return (
    <div className="my-3 rounded-lg overflow-hidden bg-slate-900/80 border border-slate-700">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono">Code</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-slate-200 font-mono">{code}</code>
      </pre>
    </div>
  )
}

// Render JSON arrays as tables
function DataTable({ data }: { data: Record<string, any>[] }) {
  if (!data || data.length === 0) return null
  
  const headers = Object.keys(data[0])
  
  return (
    <div className="my-4 overflow-x-auto rounded-xl shadow-lg border border-blue-500/30">
      <table className="w-full table-auto">
        <thead>
          <tr style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)' }}>
            {headers.map((header, idx) => (
              <th 
                key={idx}
                className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-blue-400/30 last:border-r-0"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-slate-800/50 divide-y divide-slate-700/50">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-700/50 transition-colors">
              {headers.map((header, cellIdx) => (
                <td 
                  key={cellIdx}
                  className="px-4 py-3 text-sm text-slate-200 border-r border-slate-700/30 last:border-r-0"
                >
                  {row[header]?.toString() || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Main message renderer component
export function AIMessageRenderer({ 
  content, 
  onCopy, 
  showCopyButton = true,
  accentColor = 'blue',
  theme = 'dark' // 'light' for white bg, 'dark' for dark bg
}: { 
  content: string
  onCopy?: (code: string) => void
  showCopyButton?: boolean
  accentColor?: 'blue' | 'purple'
  theme?: 'light' | 'dark'
}) {
  const [copied, setCopied] = React.useState(false)
  
  const handleCopyAll = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const gradientColors = accentColor === 'purple' 
    ? 'linear-gradient(to right, #a855f7, #ec4899, #f472b6)'
    : 'linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)'
  
  // Text colors based on theme
  const textColors = {
    primary: theme === 'light' ? 'text-slate-800' : 'text-slate-200',
    secondary: theme === 'light' ? 'text-slate-600' : 'text-slate-300',
    heading: theme === 'light' ? 'text-slate-900' : 'text-white',
    headingAlt: theme === 'light' ? 'text-slate-800' : 'text-slate-100',
    muted: theme === 'light' ? 'text-slate-500' : 'text-slate-400',
    bold: theme === 'light' ? 'text-slate-900' : 'text-white',
    italic: theme === 'light' ? 'text-slate-700' : 'text-slate-100'
  }
  
  const formatContent = (text: string) => {
    // Check for graphs
    const graphPattern = /<<<GRAPH:(line|bar|area|scatter)>>>\s*({[\s\S]*?})\s*<<<END_GRAPH>>>/g
    const graphMatches = Array.from(text.matchAll(graphPattern))
    
    if (graphMatches.length > 0) {
      const elements: React.ReactNode[] = []
      let lastIndex = 0
      
      graphMatches.forEach((match, idx) => {
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
          elements.push(
            <div key={`error-${idx}`} className="text-red-400 text-sm">
              ⚠️ Graph data parsing error
            </div>
          )
        }
        
        lastIndex = match.index! + match[0].length
      })
      
      if (lastIndex < text.length) {
        const textAfter = text.substring(lastIndex)
        if (textAfter.trim()) {
          elements.push(<div key="text-final">{formatTextContent(textAfter)}</div>)
        }
      }
      
      return <>{elements}</>
    }
    
    return formatTextContent(text)
  }
  
  const formatTextContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, partIndex) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim()
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
        
        // Markdown tables
        if (line.includes('|') && line.trim().startsWith('|')) {
          const tableLines: string[] = []
          let j = i
          while (j < lines.length && lines[j].includes('|') && lines[j].trim()) {
            tableLines.push(lines[j])
            j++
          }
          
          if (tableLines.length >= 2) {
            const parseTableRow = (row: string) => {
              return row.trim().split('|')
                .map(cell => cell.trim())
                .filter((cell, idx, arr) => cell !== '' || (idx > 0 && idx < arr.length - 1))
            }
            
            const headers = parseTableRow(tableLines[0])
            const isSeparator = tableLines[1].includes('-') && tableLines[1].includes('|')
            const startDataRow = isSeparator ? 2 : 1
            
            if (headers.length > 0 && tableLines.length > startDataRow) {
              const rows = tableLines.slice(startDataRow)
                .map(row => parseTableRow(row))
                .filter(row => row.length > 0 && !row.every(cell => cell === ''))
              
              if (rows.length > 0) {
                const colCount = headers.length
                const colWidths = headers.map((_, idx) => {
                  const maxLength = Math.max(
                    headers[idx]?.length || 0,
                    ...rows.map(row => row[idx]?.length || 0)
                  )
                  return `${Math.max(15, Math.min(35, maxLength * 1.2))}%`
                })
                
                elements.push(
                  <div key={key} className="my-4 overflow-x-auto rounded-xl shadow-lg border border-blue-500/30">
                    <table className="w-full table-fixed" style={{ minWidth: `${colCount * 200}px` }}>
                      <thead>
                        <tr style={{ background: gradientColors }}>
                          {headers.map((header, idx) => (
                            <th 
                              key={idx}
                              style={{ width: colWidths[idx] }}
                              className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-blue-400/30 last:border-r-0"
                            >
                              <div className="break-words">{parseInlineMarkdown(header)}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`${theme === 'light' ? 'bg-white divide-y divide-slate-200' : 'bg-slate-800/50 divide-y divide-slate-700/50'}`}>
                        {rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className={`${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-700/50'} transition-colors`}>
                            {headers.map((_, cellIdx) => (
                              <td 
                                key={cellIdx}
                                style={{ width: colWidths[cellIdx] }}
                                className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} border-r ${theme === 'light' ? 'border-slate-200/50' : 'border-slate-700/30'} last:border-r-0`}
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
                i = j
                continue
              }
            }
          }
        }
        
        // Headers
        if (line.match(/^#{1,4}\s/)) {
          const level = line.match(/^#+/)?.[0].length || 1
          const heading = line.replace(/^#+\s/, '').trim()
          
          if (level === 1 || level === 2) {
            elements.push(
              <h2 key={key} className={`text-xl font-bold mt-6 mb-4 ${textColors.heading} border-b ${theme === 'light' ? 'border-slate-200' : 'border-slate-700/50'} pb-2`}>
                {parseInlineMarkdown(heading)}
              </h2>
            )
          } else if (level === 3) {
            elements.push(
              <h3 key={key} className={`text-lg font-semibold mt-5 mb-3 ${textColors.headingAlt}`}>
                {parseInlineMarkdown(heading)}
              </h3>
            )
          } else {
            elements.push(
              <h4 key={key} className={`text-base font-semibold mt-4 mb-2 ${textColors.primary}`}>
                {parseInlineMarkdown(heading)}
              </h4>
            )
          }
          i++
          continue
        }
        
        // Numbered lists with nested bullets
        if (line.match(/^\d+\.\s/)) {
          const number = line.match(/^\d+/)?.[0]
          const content = line.replace(/^\d+\.\s*/, '')
          
          const nestedItems: JSX.Element[] = []
          let j = i + 1
          while (j < lines.length && lines[j].match(/^\s*[*-]\s/)) {
            const nestedContent = lines[j].replace(/^\s*[*-]\s/, '')
            nestedItems.push(
              <div key={`${key}-nested-${j}`} className="flex gap-2.5 my-1">
                <span className={`${textColors.muted} min-w-[0.75rem] text-xs mt-1`}>•</span>
                <span className={`flex-1 ${textColors.secondary} leading-relaxed text-sm`}>{parseInlineMarkdown(nestedContent)}</span>
              </div>
            )
            j++
          }
          
          const numberColor = accentColor === 'purple' ? '#c084fc' : '#60a5fa'
          elements.push(
            <div key={key} className="flex gap-3 my-2">
              <span className="font-bold min-w-[2rem] text-sm mt-0.5 flex-shrink-0" style={{ color: numberColor }}>{number}.</span>
              <div className="flex-1">
                <div className={`${textColors.primary} leading-relaxed font-medium mb-1`}>
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
        
        // Standalone bullets
        if (line.match(/^[*-]\s/)) {
          const content = line.replace(/^[*-]\s/, '')
          elements.push(
            <div key={key} className="flex gap-3 my-1.5">
              <span className={`${textColors.muted} font-bold min-w-[1rem] text-sm mt-0.5`}>•</span>
              <span className={`flex-1 ${textColors.primary} leading-relaxed`}>{parseInlineMarkdown(content)}</span>
            </div>
          )
          i++
          continue
        }
        
        // Links
        if (line.includes('[') && line.includes('](')) {
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
          const parts: React.ReactNode[] = []
          let lastIndex = 0
          let match
          
          while ((match = linkRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
              parts.push(parseInlineMarkdown(line.substring(lastIndex, match.index)))
            }
            const linkColor = accentColor === 'purple' ? 'text-purple-400 hover:text-purple-300 decoration-purple-400/50' : 'text-blue-400 hover:text-blue-300 decoration-blue-400/50'
            parts.push(
              <a 
                key={match.index}
                href={match[2]} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${linkColor} underline hover:decoration-current transition-colors`}
              >
                {match[1]}
              </a>
            )
            lastIndex = match.index + match[0].length
          }
          
          if (lastIndex < line.length) {
            parts.push(parseInlineMarkdown(line.substring(lastIndex)))
          }
          
          elements.push(
            <p key={key} className={`my-2 leading-relaxed ${textColors.primary}`}>
              {parts}
            </p>
          )
          i++
          continue
        }
        
        // Regular paragraphs
        const parsedLine = parseInlineMarkdown(line)
        elements.push(
          <p key={key} className={`my-2 leading-relaxed ${textColors.primary}`}>
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
        <div className={`mt-4 pt-3 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-700/50'}`}>
          <button
            onClick={handleCopyAll}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-700'} rounded-lg transition-colors`}
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
