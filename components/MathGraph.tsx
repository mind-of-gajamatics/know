'use client'

import { useState, useEffect } from 'react'

interface MathGraphProps {
  func: (x: number) => number
  xMin?: number
  xMax?: number
  width?: number
  height?: number
  color?: string
  title?: string
  showGrid?: boolean
  points?: number
}

export default function MathGraph({ 
  func = (x: number) => x * x,
  xMin = -5,
  xMax = 5,
  width = 500,
  height = 400,
  color = '#10b981',
  title,
  showGrid = true,
  points = 200
}: MathGraphProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="my-8">
        {title && (
          <h3 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {title}
          </h3>
        )}
        <div className="flex justify-center">
          <div 
            style={{ width, height }}
            className="border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-lg flex items-center justify-center"
          >
            <span className="text-gray-400">Loading graph...</span>
          </div>
        </div>
      </div>
    )
  }

  // Generate points
  const data: { x: number; y: number }[] = []
  for (let i = 0; i <= points; i++) {
    const x = xMin + (i / points) * (xMax - xMin)
    const y = func(x)
    data.push({ x, y })
  }
  
  const maxY = Math.max(...data.map(d => d.y))
  const minY = Math.min(...data.map(d => d.y))
  
  const padding = 50
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const scaleX = (x: number) => ((x - xMin) / (xMax - xMin)) * chartWidth + padding
  const scaleY = (y: number) => height - (((y - minY) / (maxY - minY)) * chartHeight + padding)
  
  // Generate path
  const linePath = data
    .map((point, i) => {
      const x = scaleX(point.x)
      const y = scaleY(point.y)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  // Calculate axis positions
  const xAxisY = scaleY(0)
  const yAxisX = scaleX(0)

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          {title}
        </h3>
      )}
      <div className="flex justify-center">
        <svg 
          width={width} 
          height={height}
          className="border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-lg"
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="grid-lines" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2">
              {Array.from({ length: 11 }).map((_, i) => {
                const y = padding + (i * chartHeight / 10)
                return (
                  <line key={`h-${i}`} x1={padding} y1={y} x2={width - padding} y2={y} opacity="0.5" />
                )
              })}
              {Array.from({ length: 11 }).map((_, i) => {
                const x = padding + (i * chartWidth / 10)
                return (
                  <line key={`v-${i}`} x1={x} y1={padding} x2={x} y2={height - padding} opacity="0.5" />
                )
              })}
            </g>
          )}

          {/* Axes */}
          <g className="axes" stroke="#1f2937" strokeWidth="2">
            {/* X-axis */}
            {xAxisY >= padding && xAxisY <= height - padding && (
              <line x1={padding} y1={xAxisY} x2={width - padding} y2={xAxisY} />
            )}
            {/* Y-axis */}
            {yAxisX >= padding && yAxisX <= width - padding && (
              <line x1={yAxisX} y1={padding} x2={yAxisX} y2={height - padding} />
            )}
          </g>

          {/* Function curve */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-md"
          />

          {/* Labels */}
          <g className="labels" fill="#374151" fontSize="12" fontFamily="monospace">
            {/* X-axis labels */}
            {Array.from({ length: 5 }).map((_, i) => {
              const value = xMin + (i / 4) * (xMax - xMin)
              const x = scaleX(value)
              return (
                <text
                  key={`x-${i}`}
                  x={x}
                  y={height - padding + 20}
                  textAnchor="middle"
                  className="font-semibold"
                >
                  {value.toFixed(1)}
                </text>
              )
            })}
            {/* Y-axis labels */}
            {Array.from({ length: 5 }).map((_, i) => {
              const value = minY + (i / 4) * (maxY - minY)
              const y = height - (padding + (i * chartHeight / 4))
              return (
                <text
                  key={`y-${i}`}
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="font-semibold"
                >
                  {value.toFixed(1)}
                </text>
              )
            })}
          </g>

          {/* Axis labels */}
          <text
            x={width - padding + 10}
            y={xAxisY >= padding && xAxisY <= height - padding ? xAxisY - 10 : height - padding + 10}
            fontSize="14"
            fontWeight="bold"
            fill="#374151"
          >
            x
          </text>
          <text
            x={yAxisX >= padding && yAxisX <= width - padding ? yAxisX + 10 : padding + 10}
            y={padding - 10}
            fontSize="14"
            fontWeight="bold"
            fill="#374151"
          >
            y
          </text>
        </svg>
      </div>
    </div>
  )
}
