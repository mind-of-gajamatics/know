'use client'

import { useState, useEffect, useRef } from 'react'

interface Point3D {
  x: number
  y: number
  z: number
}

interface Point2D {
  x: number
  y: number
}

interface SurfaceDef {
  func: (x: number, y: number) => number
  color?: string
  label?: string
}

interface MathGraph3DProps {
  func?: (x: number, y: number) => number  // Single surface function
  surfaces?: SurfaceDef[]                   // Multiple surfaces
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
  width?: number
  height?: number
  color?: string
  title?: string
  showGrid?: boolean
  gridSize?: number
  showAxes?: boolean
  showLegend?: boolean
}

export default function MathGraph3D({
  func,
  surfaces,
  xMin = -5,
  xMax = 5,
  yMin = -5,
  yMax = 5,
  width = 600,
  height = 500,
  color = '#3b82f6',
  title,
  showGrid = true,
  gridSize = 20,
  showAxes = true,
  showLegend = true
}: MathGraph3DProps) {
  const [mounted, setMounted] = useState(false)
  const [rotationX, setRotationX] = useState(0.6) // Rotation around X-axis (pitch)
  const [rotationZ, setRotationZ] = useState(0.8) // Rotation around Z-axis (yaw)
  const [isDragging, setIsDragging] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [autoRotate, setAutoRotate] = useState(false)
  const [velocity, setVelocity] = useState({ x: 0, z: 0 })
  const [showGridState, setShowGridState] = useState(showGrid)
  const svgRef = useRef<SVGSVGElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastMoveTime = useRef<number>(Date.now())
  const lastMove = useRef({ x: 0, z: 0 })

  // Normalize to array of surfaces
  const defaultColors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6']
  const surfacesToPlot: SurfaceDef[] = surfaces || (func ? [{ func, color, label: 'f(x,y)' }] : [])
  
  const surfacesWithColors = surfacesToPlot.map((s, i) => ({
    ...s,
    color: s.color || defaultColors[i % defaultColors.length],
    label: s.label || `f${i + 1}(x,y)`
  }))

  // 3D to 2D projection using rotation matrices with enhanced perspective
  const project3D = (point: Point3D): Point2D => {
    const { x, y, z } = point
    
    // Apply rotation around X-axis (pitch)
    const cosX = Math.cos(rotationX)
    const sinX = Math.sin(rotationX)
    const y1 = y * cosX - z * sinX
    const z1 = y * sinX + z * cosX
    
    // Apply rotation around Z-axis (yaw)
    const cosZ = Math.cos(rotationZ)
    const sinZ = Math.sin(rotationZ)
    const x2 = x * cosZ - y1 * sinZ
    const y2 = x * sinZ + y1 * cosZ
    
    // Enhanced perspective and zoom with pan offset
    const scale = zoom * 35
    const perspective = 600 / (600 + z1)
    
    return {
      x: width / 2 + x2 * scale * perspective + panOffset.x,
      y: height / 2 - y2 * scale * perspective + panOffset.y
    }
  }

  // Calculate depth for z-ordering (for better visual)
  const getDepth = (point: Point3D): number => {
    const { x, y, z } = point
    const cosX = Math.cos(rotationX)
    const sinX = Math.sin(rotationX)
    const y1 = y * cosX - z * sinX
    const z1 = y * sinX + z * cosX
    
    const cosZ = Math.cos(rotationZ)
    const sinZ = Math.sin(rotationZ)
    return x * sinZ + y1 * cosZ + z1
  }

  // Generate surface mesh
  const generateSurface = (surfaceFunc: (x: number, y: number) => number) => {
    const points: Point3D[][] = []
    const step = (xMax - xMin) / gridSize
    
    for (let i = 0; i <= gridSize; i++) {
      const row: Point3D[] = []
      const x = xMin + i * step
      
      for (let j = 0; j <= gridSize; j++) {
        const y = yMin + j * step
        try {
          const z = surfaceFunc(x, y)
          if (isFinite(z)) {
            row.push({ x, y, z })
          } else {
            row.push({ x, y, z: 0 })
          }
        } catch {
          row.push({ x, y, z: 0 })
        }
      }
      points.push(row)
    }
    return points
  }

  // Generate wireframe with filled polygons for better depth perception
  const generateWireframe = (points: Point3D[][], surfaceColor: string) => {
    const elements: React.ReactElement[] = []
    let elementId = 0
    
    // Create filled quads for better visualization
    const quads: Array<{ points: Point3D[]; depth: number }> = []
    
    for (let i = 0; i < points.length - 1; i++) {
      for (let j = 0; j < points[i].length - 1; j++) {
        const quad = [
          points[i][j],
          points[i + 1][j],
          points[i + 1][j + 1],
          points[i][j + 1]
        ]
        
        // Calculate average depth for sorting
        const avgDepth = quad.reduce((sum, p) => sum + getDepth(p), 0) / 4
        quads.push({ points: quad, depth: avgDepth })
      }
    }
    
    // Sort by depth (painter's algorithm)
    quads.sort((a, b) => a.depth - b.depth)
    
    // Draw filled quads with lighting
    quads.forEach((quad) => {
      const projected = quad.points.map(p => project3D(p))
      const pathData = projected.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
      ).join(' ') + ' Z'
      
      // Calculate lighting based on surface normal (simple shading)
      const brightness = 0.5 + (quad.depth / 50) * 0.3
      
      elements.push(
        <path
          key={`quad-${elementId++}`}
          d={pathData}
          fill={surfaceColor}
          fillOpacity={brightness * 0.3}
          stroke={surfaceColor}
          strokeWidth="0.5"
          strokeOpacity="0.6"
        />
      )
    })
    
    return elements
  }

  // Draw grid floor (like Desmos)
  const drawGrid = () => {
    if (!showGridState) return null
    
    const gridLines: React.ReactElement[] = []
    const gridExtent = 10
    const step = 1
    let lineId = 0
    
    // Grid on XY plane at z=0
    for (let i = -gridExtent; i <= gridExtent; i += step) {
      // Lines parallel to X-axis
      const start1 = project3D({ x: -gridExtent, y: i, z: 0 })
      const end1 = project3D({ x: gridExtent, y: i, z: 0 })
      gridLines.push(
        <line
          key={`grid-x-${lineId++}`}
          x1={start1.x}
          y1={start1.y}
          x2={end1.x}
          y2={end1.y}
          stroke={i === 0 ? '#888' : '#ddd'}
          strokeWidth={i === 0 ? 1 : 0.5}
          opacity={i === 0 ? 0.5 : 0.3}
        />
      )
      
      // Lines parallel to Y-axis
      const start2 = project3D({ x: i, y: -gridExtent, z: 0 })
      const end2 = project3D({ x: i, y: gridExtent, z: 0 })
      gridLines.push(
        <line
          key={`grid-y-${lineId++}`}
          x1={start2.x}
          y1={start2.y}
          x2={end2.x}
          y2={end2.y}
          stroke={i === 0 ? '#888' : '#ddd'}
          strokeWidth={i === 0 ? 1 : 0.5}
          opacity={i === 0 ? 0.5 : 0.3}
        />
      )
    }
    
    return gridLines
  }

  // Draw coordinate axes (with negative directions)
  const drawAxes = () => {
    const axisLength = Math.max(xMax - xMin, yMax - yMin, 10) / 2
    const origin = { x: 0, y: 0, z: 0 }
    
    // Positive directions
    const xAxisPos = { x: axisLength, y: 0, z: 0 }
    const yAxisPos = { x: 0, y: axisLength, z: 0 }
    const zAxisPos = { x: 0, y: 0, z: axisLength }
    
    // Negative directions
    const xAxisNeg = { x: -axisLength, y: 0, z: 0 }
    const yAxisNeg = { x: 0, y: -axisLength, z: 0 }
    const zAxisNeg = { x: 0, y: 0, z: -axisLength }
    
    const originProj = project3D(origin)
    const xProjPos = project3D(xAxisPos)
    const yProjPos = project3D(yAxisPos)
    const zProjPos = project3D(zAxisPos)
    const xProjNeg = project3D(xAxisNeg)
    const yProjNeg = project3D(yAxisNeg)
    const zProjNeg = project3D(zAxisNeg)
    
    return (
      <g className="axes">
        {/* X-axis (red) - positive */}
        <line
          x1={originProj.x}
          y1={originProj.y}
          x2={xProjPos.x}
          y2={xProjPos.y}
          stroke="#ef4444"
          strokeWidth="2"
          markerEnd="url(#arrowX)"
        />
        {/* X-axis (red) - negative */}
        <line
          x1={originProj.x}
          y1={originProj.y}
          x2={xProjNeg.x}
          y2={xProjNeg.y}
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.6"
        />
        <text x={xProjPos.x + 10} y={xProjPos.y} fill="#ef4444" fontSize="14" fontWeight="bold">X</text>
        
        {/* Y-axis (green) - positive */}
        <line
          x1={originProj.x}
          y1={originProj.y}
          x2={yProjPos.x}
          y2={yProjPos.y}
          stroke="#10b981"
          strokeWidth="2"
          markerEnd="url(#arrowY)"
        />
        {/* Y-axis (green) - negative */}
        <line
          x1={originProj.x}
          y1={originProj.y}
          x2={yProjNeg.x}
          y2={yProjNeg.y}
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.6"
        />
        <text x={yProjPos.x + 10} y={yProjPos.y} fill="#10b981" fontSize="14" fontWeight="bold">Y</text>
        
        {/* Z-axis (blue) - positive */}
        <line
          x1={originProj.x}
          y1={originProj.y}
          x2={zProjPos.x}
          y2={zProjPos.y}
          stroke="#3b82f6"
          strokeWidth="2"
          markerEnd="url(#arrowZ)"
        />
        {/* Z-axis (blue) - negative */}
        <line
          x1={originProj.x}
          y1={originProj.y}
          x2={zProjNeg.x}
          y2={zProjNeg.y}
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.6"
        />
        <text x={zProjPos.x + 10} y={zProjPos.y} fill="#3b82f6" fontSize="14" fontWeight="bold">Z</text>
      </g>
    )
  }

  // Rotation handlers with pan support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 || e.shiftKey) {
      // Right-click or Shift+click for panning
      setIsPanning(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    } else {
      // Left-click for rotation
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      lastMoveTime.current = Date.now()
    }
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const currentTime = Date.now()
    const dt = currentTime - lastMoveTime.current
    
    if (isPanning) {
      // Pan movement
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })
      setDragStart({ x: e.clientX, y: e.clientY })
    } else if (isDragging) {
      // Rotation with velocity tracking
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      
      // Calculate velocity for momentum
      if (dt > 0) {
        const vx = dx / dt
        const vz = dy / dt
        lastMove.current = { x: vx * 5, z: vz * 5 }
      }
      
      // Smoother rotation
      setRotationZ(rotationZ + dx * 0.005)
      setRotationX(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX + dy * 0.005)))
      setDragStart({ x: e.clientX, y: e.clientY })
      lastMoveTime.current = currentTime
    }
  }

  const handleMouseUp = () => {
    if (isDragging && !autoRotate) {
      // Apply momentum
      setVelocity(lastMove.current)
    }
    setIsDragging(false)
    setIsPanning(false)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent context menu on right-click
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      lastMoveTime.current = Date.now()
    } else if (e.touches.length === 2) {
      setIsPanning(true)
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      setDragStart({ x: midX, y: midY })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPanning) {
      // Two-finger pan
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const dx = midX - dragStart.x
      const dy = midY - dragStart.y
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })
      setDragStart({ x: midX, y: midY })
    } else if (e.touches.length === 1 && isDragging) {
      // One-finger rotation
      const currentTime = Date.now()
      const dt = currentTime - lastMoveTime.current
      
      const dx = e.touches[0].clientX - dragStart.x
      const dy = e.touches[0].clientY - dragStart.y
      
      if (dt > 0) {
        const vx = dx / dt
        const vz = dy / dt
        lastMove.current = { x: vx * 5, z: vz * 5 }
      }
      
      setRotationZ(rotationZ + dx * 0.005)
      setRotationX(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX + dy * 0.005)))
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      lastMoveTime.current = currentTime
    }
  }

  const handleTouchEnd = () => {
    if (isDragging && !autoRotate) {
      setVelocity(lastMove.current)
    }
    setIsDragging(false)
    setIsPanning(false)
  }

  // Zoom with mouse wheel (smoother)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05
    setZoom(Math.max(0.3, Math.min(4, zoom * zoomFactor)))
  }

  // Auto-rotate toggle
  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate)
  }

  // Reset view
  const handleReset = () => {
    setRotationX(0.6)
    setRotationZ(0.8)
    setZoom(1)
  }

  // View presets
  const viewFromX = () => {
    setRotationX(0) // Look along X-axis
    setRotationZ(Math.PI / 2)
    setZoom(1)
  }

  const viewFromY = () => {
    setRotationX(0) // Look along Y-axis
    setRotationZ(0)
    setZoom(1)
  }

  const viewFromZ = () => {
    setRotationX(Math.PI / 2) // Look down from Z-axis
    setRotationZ(0)
    setZoom(1)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Momentum and auto-rotation animation
  useEffect(() => {
    if (autoRotate) {
      const animate = () => {
        setRotationZ(prev => prev + 0.01)
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else if (!isDragging && (Math.abs(velocity.x) > 0.01 || Math.abs(velocity.z) > 0.01)) {
      // Apply momentum/damping
      const animate = () => {
        setVelocity(prev => {
          const damping = 0.95
          const newVx = prev.x * damping
          const newVz = prev.z * damping
          
          if (Math.abs(newVx) > 0.01 || Math.abs(newVz) > 0.01) {
            setRotationZ(r => r + newVx * 0.001)
            setRotationX(r => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, r + newVz * 0.001)))
            animationRef.current = requestAnimationFrame(animate)
            return { x: newVx, z: newVz }
          } else {
            return { x: 0, z: 0 }
          }
        })
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [autoRotate, velocity, isDragging])

  if (!mounted) {
    return (
      <div className="my-8">
        {title && (
          <h3 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h3>
        )}
        <div className="flex justify-center">
          <div 
            style={{ width, height }}
            className="border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-lg flex items-center justify-center"
          >
            <span className="text-gray-400">Loading 3D graph...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
        >
          {/* Arrow markers */}
          <defs>
            <marker id="arrowX" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
            </marker>
            <marker id="arrowY" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
            </marker>
            <marker id="arrowZ" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Draw grid floor */}
          {drawGrid()}

          {/* Draw coordinate axes */}
          {showAxes && drawAxes()}

          {/* Draw surfaces */}
          {surfacesWithColors.map((surface, i) => {
            const points = generateSurface(surface.func)
            return (
              <g key={i}>
                {generateWireframe(points, surface.color)}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        {showLegend && surfacesWithColors.length > 1 && (
          <div className="flex flex-wrap gap-3 justify-center items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
            {surfacesWithColors.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div 
                  className="w-6 h-1 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm font-mono font-semibold text-gray-700">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-3 items-center">
          {/* Main controls */}
          <div className="flex flex-wrap gap-2 items-center justify-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-sm"
            >
              🏠 Home
            </button>
            
            <button
              onClick={toggleAutoRotate}
              className={`px-4 py-2 ${autoRotate ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-400'} text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-sm`}
            >
              {autoRotate ? '⏸️ Stop' : '▶️ Auto'}
            </button>
            
            <button
              onClick={() => setShowGridState(!showGridState)}
              className={`px-4 py-2 ${showGridState ? 'bg-gradient-to-r from-green-500 to-teal-500' : 'bg-gray-400'} text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-sm`}
            >
              {showGridState ? '🟩 Grid' : '⬜ Grid'}
            </button>
            
            <span className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-2 rounded-lg">
              🔍 {zoom.toFixed(2)}x
            </span>
          </div>
          
          {/* View angle buttons */}
          <div className="flex gap-2">
            <button
              onClick={viewFromX}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-sm"
              title="View from X-axis"
            >
              ↔️ X
            </button>
            <button
              onClick={viewFromY}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-sm"
              title="View from Y-axis"
            >
              ↕️ Y
            </button>
            <button
              onClick={viewFromZ}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-sm"
              title="View from Z-axis (top-down)"
            >
              ⬇️ Z
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-600 text-center max-w-2xl bg-blue-50 px-4 py-2 rounded-lg">
          <p>💡 <strong>Controls:</strong> Left-drag to orbit • Right-drag or Shift+drag to pan • Scroll to zoom • Touch: 1-finger orbit, 2-finger pan</p>
        </div>
      </div>
    </div>
  )
}
