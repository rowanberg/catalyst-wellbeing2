// Parse graph data from AI responses
interface GraphData {
  type: 'line' | 'bar' | 'area' | 'scatter'
  title?: string
  data: any[]
  xKey: string
  yKeys: string[]
  colors?: string[]
}

export function detectAndParseGraph(text: string): GraphData | null {
  // Pattern 1: JSON array data with x and y values
  const jsonArrayMatch = text.match(/\[[\s\S]*?\{[\s\S]*?"x"[\s\S]*?:[\s\S]*?\}[\s\S]*?\]/i)
  if (jsonArrayMatch) {
    try {
      const data = JSON.parse(jsonArrayMatch[0])
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        const keys = Object.keys(data[0])
        const xKey = keys.find(k => k.toLowerCase().includes('x')) || keys[0]
        const yKeys = keys.filter(k => k !== xKey)
        
        return {
          type: 'line',
          data,
          xKey,
          yKeys
        }
      }
    } catch (e) {
      // Not valid JSON
    }
  }

  // Pattern 2: Table-like data that could be graphed
  const tableMatch = text.match(/\|(.+)\|[\s\S]+?\|[-\s|]+\|([\s\S]+?)(?:\n\n|\n$|$)/i)
  if (tableMatch) {
    try {
      const lines = tableMatch[0].split('\n').filter(l => l.trim())
      if (lines.length >= 3) {
        const headers = lines[0].split('|').map(h => h.trim()).filter(h => h)
        const dataRows = lines.slice(2).map(row => 
          row.split('|').map(cell => cell.trim()).filter(cell => cell)
        )
        
        if (headers.length >= 2 && dataRows.length > 0) {
          // Check if numeric data (potential graph data)
          const firstDataRow = dataRows[0]
          const hasNumericData = firstDataRow.slice(1).some(cell => !isNaN(parseFloat(cell)))
          
          if (hasNumericData) {
            const data = dataRows.map(row => {
              const obj: any = {}
              headers.forEach((header, idx) => {
                const value = row[idx]
                obj[header] = isNaN(parseFloat(value)) ? value : parseFloat(value)
              })
              return obj
            })
            
            return {
              type: 'bar',
              data,
              xKey: headers[0],
              yKeys: headers.slice(1)
            }
          }
        }
      }
    } catch (e) {
      // Parsing failed
    }
  }

  // Pattern 3: Mathematical function description
  const mathFunctionMatch = text.match(/(?:graph|plot|show|draw|visualize)\s+(?:the\s+)?(?:function|equation|curve)?\s*[:\-]?\s*(?:y\s*=\s*)?([^.\n]+)/i)
  if (mathFunctionMatch) {
    const expression = mathFunctionMatch[1].trim()
    
    // Generate data for common functions
    if (expression.includes('sin')) {
      const data = generateSineWave()
      return {
        type: 'line',
        title: `Graph: ${expression}`,
        data,
        xKey: 'x',
        yKeys: ['y']
      }
    } else if (expression.includes('cos')) {
      const data = generateCosineWave()
      return {
        type: 'line',
        title: `Graph: ${expression}`,
        data,
        xKey: 'x',
        yKeys: ['y']
      }
    } else if (expression.match(/x\^2|x²|x\*\*2|squared/i)) {
      const data = generateParabola()
      return {
        type: 'line',
        title: `Graph: ${expression}`,
        data,
        xKey: 'x',
        yKeys: ['y']
      }
    }
  }

  return null
}

// Helper functions to generate common mathematical functions
function generateSineWave(): any[] {
  const data: Array<{ x: number; y: number }> = []
  for (let x = -2 * Math.PI; x <= 2 * Math.PI; x += 0.1) {
    data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(Math.sin(x).toFixed(3)) })
  }
  return data
}

function generateCosineWave(): any[] {
  const data: Array<{ x: number; y: number }> = []
  for (let x = -2 * Math.PI; x <= 2 * Math.PI; x += 0.1) {
    data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(Math.cos(x).toFixed(3)) })
  }
  return data
}

function generateParabola(): any[] {
  const data: Array<{ x: number; y: number }> = []
  for (let x = -10; x <= 10; x += 0.5) {
    data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat((x * x).toFixed(2)) })
  }
  return data
}
