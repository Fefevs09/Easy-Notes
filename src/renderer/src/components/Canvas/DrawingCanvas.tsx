import React, { useRef, useState, useEffect } from 'react'
import { useCanvasStore } from '../../store/canvas-store'
import { detectShape } from '../../lib/tools/shape-tools'
import { PointerHandler } from '../../lib/input/pointer-handler'
import { WacomDetector } from '../../lib/input/wacom-detector'
import { Minus, Plus } from 'lucide-react'

interface Point {
  x: number
  y: number
  p: number // stylus pressure
}

interface Stroke {
  id: string
  tool: 'pen' | 'highlighter'
  points: Point[]
  color: string
  width: number
  opacity: number
}

interface ShapeObj {
  id: string
  type: 'line' | 'rect' | 'circle' | 'triangle' | 'arrow'
  color: string
  width: number
  geom: any
}

interface DrawingCanvasProps {
  noteId: string
  template: string
  canvasRefCallback?: (handlers: { undo: () => void; redo: () => void; clear: () => void }) => void
}

export default function DrawingCanvas({
  noteId,
  template,
  canvasRefCallback
}: DrawingCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [shapes, setShapes] = useState<ShapeObj[]>([])
  const [undoStack, setUndoStack] = useState<{ strokes: Stroke[]; shapes: ShapeObj[] }[]>([])
  const [redoStack, setRedoStack] = useState<{ strokes: Stroke[]; shapes: ShapeObj[] }[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null)
  const [shapeCurrent, setShapeCurrent] = useState<{ x: number; y: number } | null>(null)

  // Infinite canvas dynamic size states
  const [canvasWidth, setCanvasWidth] = useState(1200)
  const [canvasHeight, setCanvasHeight] = useState(900)

  // Spacebar pan navigation states
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

  const {
    activeTool,
    color,
    strokeWidth,
    opacity,
    pressureCurve,
    isAutoShapeEnabled,
    selectedShape,
    eraserMode,
    zoom,
    setZoom
  } = useCanvasStore()

  // Input handlers
  const pointerHandler = useRef(new PointerHandler())
  const wacomDetector = useRef(new WacomDetector())

  // Spacebar panning key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Touchpad trackpad pinch-to-zoom native event handler (non-passive to allow e.preventDefault())
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        const scaleChange = -e.deltaY * 0.006 // smooth multiplier
        const targetZoom = zoom + scaleChange
        setZoom(targetZoom)
      }
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      viewport.removeEventListener('wheel', handleWheel)
    }
  }, [zoom, setZoom])

  // Configure pressure curve dynamically
  useEffect(() => {
    pointerHandler.current.setPressureCurve(pressureCurve)
  }, [pressureCurve])

  // Clear or load drawings when note changes
  useEffect(() => {
    setStrokes([])
    setShapes([])
    setUndoStack([])
    setRedoStack([])
    setCanvasWidth(1200)
    setCanvasHeight(900)
  }, [noteId])

  // Provide Undo/Redo handlers to parent Toolbar
  useEffect(() => {
    if (canvasRefCallback) {
      canvasRefCallback({
        undo: handleUndo,
        redo: handleRedo,
        clear: handleClear
      })
    }
  }, [strokes, shapes, undoStack, redoStack])

  // REDRAW CANVAS WHEN STATE MUTATES
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Render Ruled/Grid lines internally if template is pautado/grade (as fallbacks)
    // Draw existing strokes
    for (const stroke of strokes) {
      drawStrokeOnContext(ctx, stroke)
    }

    // Draw current active in-progress stroke
    if (isDrawing && currentStroke.length > 0 && (activeTool === 'pen' || activeTool === 'highlighter')) {
      const activeStrokeObj: Stroke = {
        id: 'active-preview',
        tool: activeTool as any,
        points: currentStroke,
        color,
        width: strokeWidth,
        opacity: activeTool === 'highlighter' ? opacity : 1
      }
      drawStrokeOnContext(ctx, activeStrokeObj)
    }

    // Draw existing geometric shapes
    for (const shape of shapes) {
      drawShapeOnContext(ctx, shape)
    }

    // Draw active shape drag-feedback
    if (activeTool === 'shape' && shapeStart && shapeCurrent) {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = strokeWidth
      ctx.setLineDash([6, 6])
      const activeShapeObj = {
        id: 'preview',
        type: selectedShape as any, // dynamic preview of selected shape
        color,
        width: strokeWidth,
        geom: { x: shapeStart.x, y: shapeStart.y, width: shapeCurrent.x - shapeStart.x, height: shapeCurrent.y - shapeStart.y }
      }
      drawShapeOnContext(ctx, activeShapeObj)
      ctx.restore()
    }
  }, [strokes, shapes, isDrawing, currentStroke, shapeStart, shapeCurrent, template, canvasWidth, canvasHeight])

  const drawStrokeOnContext = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = stroke.opacity

    // Draw segment by segment to vary width by stylus pressure
    for (let i = 1; i < stroke.points.length; i++) {
      const p1 = stroke.points[i - 1]
      const p2 = stroke.points[i]

      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)

      ctx.strokeStyle = stroke.color
      // Vary width dynamically
      ctx.lineWidth = stroke.width * p2.p
      ctx.stroke()
    }
    ctx.restore()
  }

  const drawShapeOnContext = (ctx: CanvasRenderingContext2D, shape: ShapeObj) => {
    ctx.save()
    ctx.strokeStyle = shape.color
    ctx.lineWidth = shape.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const { x, y, width, height } = shape.geom

    ctx.beginPath()
    if (shape.type === 'rect') {
      ctx.strokeRect(x, y, width, height)
    } else if (shape.type === 'circle') {
      const radius = Math.sqrt(width * width + height * height)
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.stroke()
    } else if (shape.type === 'line') {
      ctx.moveTo(x, y)
      ctx.lineTo(x + width, y + height)
      ctx.stroke()
    } else if (shape.type === 'triangle') {
      ctx.moveTo(x + width / 2, y)
      ctx.lineTo(x, y + height)
      ctx.lineTo(x + width, y + height)
      ctx.closePath()
      ctx.stroke()
    } else if (shape.type === 'arrow') {
      // Draw arrow shaft
      const headlen = 12 // length of head in pixels
      const dx = width
      const dy = height
      const angle = Math.atan2(dy, dx)
      const toX = x + dx
      const toY = y + dy

      ctx.moveTo(x, y)
      ctx.lineTo(toX, toY)
      ctx.stroke()

      // Draw arrow head wings
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
    }
    ctx.restore()
  }

  // STATE HISTORY HELPERS
  const saveHistoryState = () => {
    setUndoStack([...undoStack, { strokes: [...strokes], shapes: [...shapes] }])
    setRedoStack([])
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setUndoStack(undoStack.slice(0, -1))
    setRedoStack([...redoStack, { strokes: [...strokes], shapes: [...shapes] }])
    setStrokes(prev.strokes)
    setShapes(prev.shapes)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack(redoStack.slice(0, -1))
    setUndoStack([...undoStack, { strokes: [...strokes], shapes: [...shapes] }])
    setStrokes(next.strokes)
    setShapes(next.shapes)
  }

  const handleClear = () => {
    saveHistoryState()
    setStrokes([])
    setShapes([])
  }

  // POINTER EVENT HANDLERS
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    // If spacebar is pressed, perform panning/dragging instead of drawing
    if (isSpacePressed) {
      isPanning.current = true
      const viewport = viewportRef.current
      if (viewport) {
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          scrollLeft: viewport.scrollLeft,
          scrollTop: viewport.scrollTop
        }
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width > 0 ? (canvas.width / rect.width) : 1
    const scaleY = rect.height > 0 ? (canvas.height / rect.height) : 1
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Stylus pressure reading (from PointerEvent, defaults to 0.5 if mouse/touch)
    const rawPressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5
    const calibratedPressure = pointerHandler.current.calibratePressure(rawPressure)

    // Detect stylus connection
    wacomDetector.current.detectFromEvent(e.nativeEvent)

    setIsDrawing(true)
    saveHistoryState()

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setCurrentStroke([{ x, y, p: calibratedPressure }])
    } else if (activeTool === 'shape') {
      setShapeStart({ x, y })
      setShapeCurrent({ x, y })
    } else if (activeTool === 'eraser') {
      eraseStrokeAtPoint(x, y)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If we are currently panning/dragging the viewport
    if (isPanning.current) {
      e.preventDefault()
      const viewport = viewportRef.current
      if (viewport) {
        const dx = e.clientX - panStart.current.x
        const dy = e.clientY - panStart.current.y
        viewport.scrollLeft = panStart.current.scrollLeft - dx
        viewport.scrollTop = panStart.current.scrollTop - dy
      }
      return
    }

    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width > 0 ? (canvas.width / rect.width) : 1
    const scaleY = rect.height > 0 ? (canvas.height / rect.height) : 1
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Auto-expand canvas size dynamically if drawing near bottom or right boundaries (within 100px)
    if (x > canvasWidth - 100) {
      setCanvasWidth((prev) => prev + 1000)
    }
    if (y > canvasHeight - 100) {
      setCanvasHeight((prev) => prev + 1000)
    }

    const rawPressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5
    const calibratedPressure = pointerHandler.current.calibratePressure(rawPressure)

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      const newStroke = [...currentStroke, { x, y, p: calibratedPressure }]
      setCurrentStroke(newStroke)

      // Draw immediate stroke line to avoid lags
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.save()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = activeTool === 'highlighter' ? opacity : 1
        ctx.beginPath()
        const p1 = newStroke[newStroke.length - 2]
        const p2 = newStroke[newStroke.length - 1]
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = color
        ctx.lineWidth = strokeWidth * p2.p
        ctx.stroke()
        ctx.restore()
      }
    } else if (activeTool === 'shape') {
      setShapeCurrent({ x, y })
    } else if (activeTool === 'eraser') {
      eraseStrokeAtPoint(x, y)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If we were panning/dragging the viewport
    if (isPanning.current) {
      isPanning.current = false
      return
    }

    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      // Auto Shape Recognition heuristics if enabled
      if (isAutoShapeEnabled && currentStroke.length > 5) {
        const detection = detectShape(currentStroke)
        if (detection.type !== 'unknown' && detection.confidence > 0.65) {
          // Add perfect shape instead of rough stroke
          const geom = calculateBoundsFromPoints(currentStroke)
          const newShape: ShapeObj = {
            id: 'shape-' + Math.random().toString(36).substr(2, 5),
            type: detection.type as any,
            color,
            width: strokeWidth,
            geom
          }
          setShapes([...shapes, newShape])
          setCurrentStroke([])
          return
        }
      }

      // Add regular freehand stroke
      const newStrokeObj: Stroke = {
        id: 'stroke-' + Math.random().toString(36).substr(2, 5),
        tool: activeTool as any,
        points: currentStroke,
        color,
        width: strokeWidth,
        opacity: activeTool === 'highlighter' ? opacity : 1
      }
      setStrokes([...strokes, newStrokeObj])
      setCurrentStroke([])
    } else if (activeTool === 'shape' && shapeStart && shapeCurrent) {
      // Add manual geometric shape
      const newShape: ShapeObj = {
        id: 'shape-' + Math.random().toString(36).substr(2, 5),
        type: selectedShape,
        color,
        width: strokeWidth,
        geom: {
          x: shapeStart.x,
          y: shapeStart.y,
          width: shapeCurrent.x - shapeStart.x,
          height: shapeCurrent.y - shapeStart.y
        }
      }
      setShapes([...shapes, newShape])
      setShapeStart(null)
      setShapeCurrent(null)
    }
  }

  const calculateBoundsFromPoints = (points: Point[]) => {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    for (const p of points) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  const eraseStrokeAtPoint = (x: number, y: number) => {
    // Eraser segment / stroke-based detection
    // Adjust threshold based on selected eraserMode (pixel vs stroke removal)
    const threshold = eraserMode === 'pixel' ? strokeWidth : strokeWidth * 2
    let strokeErased = false

    const newStrokes = strokes.filter((stroke) => {
      const intersects = stroke.points.some((p) => {
        const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2)
        return dist < threshold
      })
      if (intersects) strokeErased = true
      return !intersects
    })

    const newShapes = shapes.filter((shape) => {
      const { x: sx, y: sy, width: sw, height: sh } = shape.geom
      // check bounding box
      const minX = Math.min(sx, sx + sw)
      const maxX = Math.max(sx, sx + sw)
      const minY = Math.min(sy, sy + sh)
      const maxY = Math.max(sy, sy + sh)

      const intersects = x >= minX - threshold && x <= maxX + threshold && y >= minY - threshold && y <= maxY + threshold
      if (intersects) strokeErased = true
      return !intersects
    })

    if (strokeErased) {
      setStrokes(newStrokes)
      setShapes(newShapes)
    }
  }

  // Dynamic css paper background class
  let paperClass = 'paper-blank'
  if (template === 'ruled') paperClass = 'paper-ruled'
  else if (template === 'grid') paperClass = 'paper-grid'
  else if (template === 'dotted') paperClass = 'paper-dotted'

  // Calculate dynamic background size based on zoom level to ensure patterns scale proportionally
  let dynamicBackgroundSize: string | undefined = undefined
  if (template === 'ruled') {
    dynamicBackgroundSize = `100% ${28 * zoom}px`
  } else if (template === 'grid') {
    dynamicBackgroundSize = `${24 * zoom}px ${24 * zoom}px`
  } else if (template === 'dotted') {
    dynamicBackgroundSize = `${20 * zoom}px ${20 * zoom}px`
  }

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full shadow-inner overflow-auto border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl bg-slate-100 dark:bg-zinc-900/40 transition-all duration-300 flex items-start justify-start p-6"
      style={{ touchAction: 'none' }}
    >
      {/* Sized Wrapper to force natural DOM scrollbars based on zoom level */}
      <div
        className={`relative shadow-xl border border-slate-200/40 dark:border-zinc-800/40 rounded-xl overflow-hidden flex-shrink-0 bg-white ${paperClass}`}
        style={{
          width: zoom > 1 ? `${1200 * zoom}px` : '100%',
          height: zoom > 1 ? `${900 * zoom}px` : '100%',
          minWidth: '100%',
          minHeight: '100%',
          backgroundSize: dynamicBackgroundSize,
          transition: 'width 0.15s ease-out, height 0.15s ease-out, background-size 0.15s ease-out'
        }}
      >
        <canvas
          ref={canvasRef}
          width={1200}
          height={900}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`absolute top-0 left-0 w-full h-full block ${isSpacePressed ? 'cursor-grab active:cursor-grabbing z-40' : 'cursor-crosshair'}`}
        />
      </div>

      {/* Floating Zoom Control HUD widget at the bottom right corner of the canvas container */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 glass-panel p-2 px-3 rounded-full shadow-2xl z-40 text-xs font-semibold text-slate-800 dark:text-slate-200">
        <button
          onClick={() => setZoom(zoom - 0.1)}
          className="p-1 rounded-full hover:bg-white/20 dark:hover:bg-zinc-700/50 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
          title="Diminuir Zoom"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[42px] text-center select-none">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(zoom + 0.1)}
          className="p-1 rounded-full hover:bg-white/20 dark:hover:bg-zinc-700/50 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
          title="Aumentar Zoom"
        >
          <Plus size={14} />
        </button>
        <div className="w-[1px] h-4 bg-slate-300 dark:bg-zinc-700 mx-0.5" />
        <button
          onClick={() => setZoom(1.0)}
          className="p-1 rounded-full hover:bg-white/20 dark:hover:bg-zinc-700/50 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 text-xxs font-medium"
          title="Ajustar Zoom para 100%"
        >
          100%
        </button>
      </div>
    </div>
  )
}
