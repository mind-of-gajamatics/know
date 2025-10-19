'use client'

import { useState, useEffect, useRef } from 'react'

interface FunctionDef {
  func: (x: number) => number
  color?: string
  label?: string
}

interface MathGraphProps {
  func?: (x: number) => number  // Single function (backward compatible)
  functions?: FunctionDef[]      // Multiple functions
  xMin?: number
  xMax?: number
  width?: number
  height?: number
  color?: string
  title?: string
  showGrid?: boolean
  points?: number
  showLegend?: boolean
}

export default function MathGraph({ 
  func,
  functions,
  xMin: initialXMin = -5,
  xMax: initialXMax = 5,
  width = 500,
  height = 400,
  color = '#10b981',
  title,
  showGrid = true,
  points = 200,
  showLegend = true
}: MathGraphProps) {
  const [mounted, setMounted] = useState(false)
  
  // Pan and zoom state
  const [xMin, setXMin] = useState(initialXMin)
  const [xMax, setXMax] = useState(initialXMax)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  // Normalize to array of functions
  const defaultColors = ['#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#ef4444']
  const funcsToPlot: FunctionDef[] = functions || (func ? [{ func, color, label: 'f(x)' }] : [])
  
  // Ensure each function has a color
  const functionsWithColors = funcsToPlot.map((f, i) => ({
    ...f,
    color: f.color || defaultColors[i % defaultColors.length],
    label: f.label || `f${i + 1}(x)`
  }))

  // Generate points for all functions
  const allData = functionsWithColors.map(({ func: f }) => {
    const data: { x: number; y: number }[] = []
    for (let i = 0; i <= points; i++) {
      const x = xMin + (i / points) * (xMax - xMin)
      try {
        const y = f(x)
        if (isFinite(y)) {
          data.push({ x, y })
        }
      } catch {
        // Skip invalid points
      }
    }
    return data
  })
  
  // Calculate bounds across all functions
  const allYValues = allData.flat().map(d => d.y)
  const maxY = Math.max(...allYValues)
  const minY = Math.min(...allYValues)
  
  const padding = 50
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const scaleX = (x: number) => ((x - xMin) / (xMax - xMin)) * chartWidth + padding
  const scaleY = (y: number) => height - (((y - minY) / (maxY - minY)) * chartHeight + padding)
  
  // Generate paths for all functions
  const linePaths = allData.map((data) => 
    data
      .map((point, i) => {
        const x = scaleX(point.x)
        const y = scaleY(point.y)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  )

  // Calculate axis positions
  const xAxisY = scaleY(0)
  const yAxisX = scaleX(0)

  // Pan handlers - use regular functions instead of useCallback to avoid hook issues
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const dx = e.clientX - dragStart.x
    const deltaX = -(dx / chartWidth) * (xMax - xMin)
    
    setXMin(xMin + deltaX)
    setXMax(xMax + deltaX)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    
    const dx = e.touches[0].clientX - dragStart.x
    const deltaX = -(dx / chartWidth) * (xMax - xMin)
    
    setXMin(xMin + deltaX)
    setXMax(xMax + deltaX)
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9
    const center = (xMin + xMax) / 2
    const range = (xMax - xMin) * zoomFactor / 2
    
    setXMin(center - range)
    setXMax(center + range)
  }

  // Reset view
  const handleReset = () => {
    setXMin(initialXMin)
    setXMax(initialXMax)
  }

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

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          {title}
        </h3>
      )}
      <div className="flex flex-col items-center gap-3">
        <svg 
          ref={svgRef}
          width={width} 
          height={height}
          className="border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-lg cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
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

          {/* Function curves */}
          {linePaths.map((linePath, i) => (
            <path
              key={i}
              d={linePath}
              fill="none"
              stroke={functionsWithColors[i].color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-md"
            />
          ))}

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
        
        {/* Legend */}
        {showLegend && functionsWithColors.length > 1 && (
          <div className="flex flex-wrap gap-3 justify-center items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
            {functionsWithColors.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div 
                  className="w-6 h-1 rounded-full"
                  style={{ backgroundColor: f.color }}
                />
                <span className="text-sm font-mono font-semibold text-gray-700">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Controls */}
        <div className="flex gap-2 items-center">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            🔄 Reset View
          </button>
          <span className="text-sm text-gray-500 font-mono">
            Range: [{xMin.toFixed(2)}, {xMax.toFixed(2)}]
          </span>
        </div>
        
        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center max-w-md">
          <p>💡 <strong>Tip:</strong> Drag to pan • Scroll to zoom • Tap Reset to restore</p>
        </div>
      </div>
    </div>
  )
}
