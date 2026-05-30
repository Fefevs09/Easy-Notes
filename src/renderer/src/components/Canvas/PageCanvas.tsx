import React, { useRef, useState, useEffect } from 'react'
import { useCanvasStore } from '../../store/canvas-store'
import { useNotesStore } from '../../store/notes-store'
import { detectShape } from '../../lib/tools/shape-tools'
import { PointerHandler } from '../../lib/input/pointer-handler'
import { WacomDetector } from '../../lib/input/wacom-detector'
import { simplifyStrokePoints } from '../../lib/tools/stroke-simplifier'
import * as pdfjsLib from 'pdfjs-dist'

// Set PDF.js worker source with robust fallback (local URL constructor + CDN fallback)
if (typeof window !== 'undefined') {
  try {
    const localWorker = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString()
    pdfjsLib.GlobalWorkerOptions.workerSrc = localWorker
  } catch (e) {
    console.warn('Failed to load local PDF.js worker, falling back to CDN:', e)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  }
}

const pdfPromiseCache: Record<string, Promise<any> | undefined> = {}

async function getCachedPdf(vaultPath: string, pdfPath: string): Promise<any> {
  const cacheKey = `${vaultPath}::${pdfPath}`
  if (pdfPromiseCache[cacheKey] !== undefined) {
    return pdfPromiseCache[cacheKey]
  }

  pdfPromiseCache[cacheKey] = (async () => {
    if (typeof window === 'undefined' || !(window as any).electron) {
      throw new Error('Not running inside Electron')
    }
    const arrayBuffer = await (window as any).electron.ipcRenderer.invoke(
      'read-pdf-file',
      vaultPath,
      pdfPath
    )
    if (!arrayBuffer) {
      throw new Error(`Failed to load PDF: ${pdfPath}`)
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    return await loadingTask.promise
  })()

  return pdfPromiseCache[cacheKey]
}

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

interface PageCanvasProps {
  noteId: string
  page: {
    id: string
    strokes: Stroke[]
    shapes: ShapeObj[]
    pdfPath?: string
    pageNumber?: number
  }
  template: string
  zoom: number
  canvasWidth: number
  canvasHeight: number
  isSpacePressed: boolean
  onRegisterHandlers: (
    pageId: string,
    handlers: { undo: () => void; redo: () => void; clear: () => void } | null
  ) => void
}

export default function PageCanvas({
  noteId,
  page,
  template,
  zoom,
  canvasWidth,
  canvasHeight,
  isSpacePressed,
  onRegisterHandlers
}: PageCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const { updatePageContent } = useNotesStore()

  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [shapes, setShapes] = useState<ShapeObj[]>([])
  const [undoStack, setUndoStack] = useState<{ strokes: Stroke[]; shapes: ShapeObj[] }[]>([])
  const [redoStack, setRedoStack] = useState<{ strokes: Stroke[]; shapes: ShapeObj[] }[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null)
  const [shapeCurrent, setShapeCurrent] = useState<{ x: number; y: number } | null>(null)
  const [pdfPageAspectRatio, setPdfPageAspectRatio] = useState<number | null>(null)

  const logicalHeight = pdfPageAspectRatio ? canvasWidth / pdfPageAspectRatio : canvasHeight

  const {
    activeTool,
    color,
    strokeWidth,
    opacity,
    pressureCurve,
    isAutoShapeEnabled,
    selectedShape,
    eraserMode
  } = useCanvasStore()

  // Input handlers
  const pointerHandler = useRef(new PointerHandler())
  const wacomDetector = useRef(new WacomDetector())
  const isBarrelButtonActive = useRef(false)

  // Render PDF background if pdfPath is provided
  useEffect(() => {
    const pdfPath = page.pdfPath
    const pageNumber = page.pageNumber
    const vaultPath = useNotesStore.getState().vaultPath
    const canvasElement = pdfCanvasRef.current

    if (!pdfPath || !pageNumber || !vaultPath || !canvasElement) {
      setPdfPageAspectRatio(null)
      return
    }

    let active = true

    const renderPdf = async () => {
      try {
        const pdf = await getCachedPdf(vaultPath, pdfPath)
        if (!active) return

        const pdfPage = await pdf.getPage(pageNumber)
        if (!active) return

        const targetCanvas = pdfCanvasRef.current
        if (!targetCanvas) return
        const ctx = targetCanvas.getContext('2d')
        if (!ctx) return

        const unscaledViewport = pdfPage.getViewport({ scale: 1.0 })
        const aspect = unscaledViewport.width / unscaledViewport.height
        setPdfPageAspectRatio(aspect)

        const targetWidth = canvasWidth * zoom
        const scale = targetWidth / unscaledViewport.width
        const viewport = pdfPage.getViewport({ scale })

        targetCanvas.width = viewport.width
        targetCanvas.height = viewport.height

        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
        await pdfPage.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise
      } catch (err) {
        console.error('Error rendering PDF background page:', err)
      }
    }

    renderPdf()

    return () => {
      active = false
    }
  }, [page.pdfPath, page.pageNumber, zoom, canvasWidth])

  // Sync with Store when page data changes (e.g. initial load or external undo/redo updates)
  useEffect(() => {
    setStrokes(page.strokes || [])
    setShapes(page.shapes || [])
  }, [page.strokes, page.shapes])

  // Configure pressure curve dynamically
  useEffect(() => {
    pointerHandler.current.setPressureCurve(pressureCurve)
  }, [pressureCurve])

  // Persistence Helper: Push local state to global store
  const syncToStore = (currentStrokes: Stroke[], currentShapes: ShapeObj[]) => {
    updatePageContent(noteId, page.id, currentStrokes, currentShapes)
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
    syncToStore(prev.strokes, prev.shapes)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack(redoStack.slice(0, -1))
    setUndoStack([...undoStack, { strokes: [...strokes], shapes: [...shapes] }])
    setStrokes(next.strokes)
    setShapes(next.shapes)
    syncToStore(next.strokes, next.shapes)
  }

  const handleClear = () => {
    const confirmClear = window.confirm(
      'Tem certeza de que deseja apagar tudo nesta página? Esta ação pode ser desfeita.'
    )
    if (!confirmClear) return
    saveHistoryState()
    setStrokes([])
    setShapes([])
    syncToStore([], [])
  }

  // Register Handlers up to parent container
  useEffect(() => {
    onRegisterHandlers(page.id, {
      undo: handleUndo,
      redo: handleRedo,
      clear: handleClear
    })
    return () => {
      onRegisterHandlers(page.id, null)
    }
  }, [page.id, strokes, shapes, undoStack, redoStack, onRegisterHandlers])

  // REDRAW CANVAS WHEN STATE MUTATES
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(zoom, zoom)

    for (const stroke of strokes) {
      drawStrokeOnContext(ctx, stroke)
    }

    if (
      isDrawing &&
      currentStroke.length > 0 &&
      (activeTool === 'pen' || activeTool === 'highlighter')
    ) {
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

    for (const shape of shapes) {
      drawShapeOnContext(ctx, shape)
    }

    if (activeTool === 'shape' && shapeStart && shapeCurrent) {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = strokeWidth
      ctx.setLineDash([6, 6])
      const activeShapeObj = {
        id: 'preview',
        type: selectedShape as any,
        color,
        width: strokeWidth,
        geom: {
          x: shapeStart.x,
          y: shapeStart.y,
          width: shapeCurrent.x - shapeStart.x,
          height: shapeCurrent.y - shapeStart.y
        }
      }
      drawShapeOnContext(ctx, activeShapeObj)
      ctx.restore()
    }

    ctx.restore()
  }, [
    strokes,
    shapes,
    isDrawing,
    currentStroke,
    shapeStart,
    shapeCurrent,
    template,
    canvasWidth,
    logicalHeight,
    zoom,
    activeTool,
    color,
    strokeWidth,
    opacity,
    selectedShape
  ])

  const drawStrokeOnContext = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const points = stroke.points
    if (points.length < 2) return
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = stroke.opacity
    ctx.strokeStyle = stroke.color

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y)
      ctx.lineWidth = stroke.width * (points[1].p || 0.5)
      ctx.stroke()
    } else {
      // Quadratic Bezier Midpoint Interpolation
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2
        const yc = (points[i].y + points[i + 1].y) / 2

        ctx.lineWidth = stroke.width * (points[i].p || 0.5)
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(xc, yc)
      }
      const lastIdx = points.length - 1
      ctx.lineWidth = stroke.width * (points[lastIdx].p || 0.5)
      ctx.lineTo(points[lastIdx].x, points[lastIdx].y)
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
      const headlen = 12
      const dx = width
      const dy = height
      const angle = Math.atan2(dy, dx)
      const toX = x + dx
      const toY = y + dy
      ctx.moveTo(x, y)
      ctx.lineTo(toX, toY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(
        toX - headlen * Math.cos(angle - Math.PI / 6),
        toY - headlen * Math.sin(angle - Math.PI / 6)
      )
      ctx.moveTo(toX, toY)
      ctx.lineTo(
        toX - headlen * Math.cos(angle + Math.PI / 6),
        toY - headlen * Math.sin(angle + Math.PI / 6)
      )
      ctx.stroke()
    }
    ctx.restore()
  }

  // POINTER EVENT HANDLERS
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (isSpacePressed) return // Panning handled by parent scroll viewport

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvasWidth / rect.width)
    const y = (e.clientY - rect.top) * (logicalHeight / rect.height)

    const rawPressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5
    const calibratedPressure = pointerHandler.current.calibratePressure(rawPressure)
    wacomDetector.current.detectFromEvent(e.nativeEvent)

    setIsDrawing(true)
    saveHistoryState()

    const isWacomBarrelButton = e.pointerType === 'pen' && (e.button === 2 || e.buttons === 2)
    isBarrelButtonActive.current = isWacomBarrelButton

    const currentActiveTool = isWacomBarrelButton ? 'eraser' : activeTool

    if (currentActiveTool === 'pen' || currentActiveTool === 'highlighter') {
      setCurrentStroke([{ x, y, p: calibratedPressure }])
    } else if (currentActiveTool === 'shape') {
      setShapeStart({ x, y })
      setShapeCurrent({ x, y })
    } else if (currentActiveTool === 'eraser') {
      eraseAtPoint(x, y)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvasWidth / rect.width)
    const y = (e.clientY - rect.top) * (logicalHeight / rect.height)

    const rawPressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5
    const calibratedPressure = pointerHandler.current.calibratePressure(rawPressure)

    const currentActiveTool = isBarrelButtonActive.current ? 'eraser' : activeTool

    if (currentActiveTool === 'pen' || currentActiveTool === 'highlighter') {
      const newStroke = [...currentStroke, { x, y, p: calibratedPressure }]
      setCurrentStroke(newStroke)

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.save()
        ctx.scale(zoom, zoom)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = currentActiveTool === 'highlighter' ? opacity : 1
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
    } else if (currentActiveTool === 'shape') {
      setShapeCurrent({ x, y })
    } else if (currentActiveTool === 'eraser') {
      eraseAtPoint(x, y)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)

    let finalStrokes = strokes
    let finalShapes = shapes

    const currentActiveTool = isBarrelButtonActive.current ? 'eraser' : activeTool

    if (currentActiveTool === 'pen' || currentActiveTool === 'highlighter') {
      // Simplify points using RDP algorithm for compression
      const simplifiedPoints = simplifyStrokePoints(currentStroke, 0.8)

      if (isAutoShapeEnabled && simplifiedPoints.length > 5) {
        const detection = detectShape(simplifiedPoints)
        if (detection.type !== 'unknown' && detection.confidence > 0.65) {
          const geom = calculateBoundsFromPoints(simplifiedPoints)
          const newShape: ShapeObj = {
            id: 'shape-' + Math.random().toString(36).substr(2, 5),
            type: detection.type as any,
            color,
            width: strokeWidth,
            geom
          }
          finalShapes = [...shapes, newShape]
          setShapes(finalShapes)
          setCurrentStroke([])
          syncToStore(finalStrokes, finalShapes)
          isBarrelButtonActive.current = false
          return
        }
      }

      const newStrokeObj: Stroke = {
        id: 'stroke-' + Math.random().toString(36).substr(2, 5),
        tool: currentActiveTool as any,
        points: simplifiedPoints,
        color,
        width: strokeWidth,
        opacity: currentActiveTool === 'highlighter' ? opacity : 1
      }
      finalStrokes = [...strokes, newStrokeObj]
      setStrokes(finalStrokes)
      setCurrentStroke([])
    } else if (currentActiveTool === 'shape' && shapeStart && shapeCurrent) {
      const newShape: ShapeObj = {
        id: 'shape-' + Math.random().toString(36).substr(2, 5),
        type: selectedShape as any,
        color,
        width: strokeWidth,
        geom: {
          x: shapeStart.x,
          y: shapeStart.y,
          width: shapeCurrent.x - shapeStart.x,
          height: shapeCurrent.y - shapeStart.y
        }
      }
      finalShapes = [...shapes, newShape]
      setShapes(finalShapes)
      setShapeStart(null)
      setShapeCurrent(null)
    }

    syncToStore(finalStrokes, finalShapes)
    isBarrelButtonActive.current = false
  }

  const calculateBoundsFromPoints = (points: Point[]) => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity
    for (const p of points) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }

  const eraseAtPoint = (x: number, y: number) => {
    const threshold = eraserMode === 'pixel' ? strokeWidth : strokeWidth * 2
    let changed = false

    const newStrokes = strokes.filter((stroke) => {
      const intersects = stroke.points.some(
        (p) => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) < threshold
      )
      if (intersects) changed = true
      return !intersects
    })

    const newShapes = shapes.filter((shape) => {
      const { x: sx, y: sy, width: sw, height: sh } = shape.geom
      const minX = Math.min(sx, sx + sw)
      const maxX = Math.max(sx, sx + sw)
      const minY = Math.min(sy, sy + sh)
      const maxY = Math.max(sy, sy + sh)
      const intersects =
        x >= minX - threshold &&
        x <= maxX + threshold &&
        y >= minY - threshold &&
        y <= maxY + threshold
      if (intersects) changed = true
      return !intersects
    })

    if (changed) {
      setStrokes(newStrokes)
      setShapes(newShapes)
      syncToStore(newStrokes, newShapes)
    }
  }

  let paperClass = 'paper-blank'
  if (template === 'ruled') paperClass = 'paper-ruled'
  else if (template === 'grid') paperClass = 'paper-grid'
  else if (template === 'dotted') paperClass = 'paper-dotted'

  let dynamicBackgroundSize: string | undefined = undefined
  if (template === 'ruled') dynamicBackgroundSize = `100% ${28 * zoom}px`
  else if (template === 'grid') dynamicBackgroundSize = `${24 * zoom}px ${24 * zoom}px`
  else if (template === 'dotted') dynamicBackgroundSize = `${20 * zoom}px ${20 * zoom}px`

  return (
    <div
      className={`relative shadow-2xl border border-slate-200/40 dark:border-zinc-800/40 rounded-sm overflow-hidden flex-shrink-0 bg-white ${paperClass}`}
      style={{
        width: `${canvasWidth * zoom}px`,
        height: `${logicalHeight * zoom}px`,
        backgroundSize: dynamicBackgroundSize,
        transition: 'background-size 0.15s ease-out'
      }}
    >
      {page.pdfPath && (
        <canvas
          ref={pdfCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none block z-10"
        />
      )}
      <canvas
        ref={canvasRef}
        width={canvasWidth * zoom}
        height={logicalHeight * zoom}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`absolute top-0 left-0 w-full h-full block z-20 ${isSpacePressed ? 'cursor-grab active:cursor-grabbing z-40' : 'cursor-crosshair'}`}
      />
    </div>
  )
}
