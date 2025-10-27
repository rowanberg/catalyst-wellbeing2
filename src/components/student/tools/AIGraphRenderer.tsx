'use client'

import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface GraphData {
  type: 'line' | 'bar' | 'area' | 'scatter'
  title?: string
  data: any[]
  xKey: string
  yKeys: string[]
  colors?: string[]
}

interface AIGraphRendererProps {
  graphData: GraphData
}

export default function AIGraphRenderer({ graphData }: AIGraphRendererProps) {
  const { type, title, data, xKey, yKeys, colors } = graphData
  
  const defaultColors = ['#a855f7', '#ec4899', '#f472b6', '#8b5cf6', '#d946ef']
  const chartColors = colors || defaultColors

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3 shadow-xl">
          <p className="text-slate-200 font-semibold mb-1">{`${xKey}: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = useMemo(() => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    }

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis 
              dataKey={xKey} 
              stroke="#94a3b8" 
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#cbd5e1', fontSize: '13px' }}
              iconType="line"
            />
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={2.5}
                dot={{ fill: chartColors[index % chartColors.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis 
              dataKey={xKey} 
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#cbd5e1', fontSize: '13px' }}
            />
            {yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={chartColors[index % chartColors.length]}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              {yKeys.map((key, index) => (
                <linearGradient key={key} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.1}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis 
              dataKey={xKey} 
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#cbd5e1', fontSize: '13px' }}
            />
            {yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={2}
                fill={`url(#gradient-${index})`}
              />
            ))}
          </AreaChart>
        )

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis 
              dataKey={xKey} 
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <YAxis 
              dataKey={yKeys[0]} 
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#cbd5e1', fontSize: '13px' }}
            />
            {yKeys.map((key, index) => (
              <Scatter
                key={key}
                name={key}
                data={data}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </ScatterChart>
        )

      default:
        return <></> as any
    }
  }, [type, data, xKey, yKeys, chartColors])

  return (
    <div className="my-6 p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-purple-500/30 shadow-xl">
      {title && (
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500"></span>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        {renderChart}
      </ResponsiveContainer>
    </div>
  )
}
