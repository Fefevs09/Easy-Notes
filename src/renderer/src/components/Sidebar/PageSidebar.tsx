import React, { useRef, useEffect, useState } from 'react'
import { useNotesStore, Note } from '../../store/notes-store'
import { Plus, Trash2, FileText } from 'lucide-react'
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

function drawStroke(ctx: CanvasRenderingContext2D, stroke: any) {
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

function drawShape(ctx: CanvasRenderingContext2D, shape: any) {
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
  }
  ctx.restore()
}

interface PageThumbnailProps {
  page: any
  vaultPath: string | null
}

function PageThumbnail({ page, vaultPath }: PageThumbnailProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [aspectRatio, setAspectRatio] = useState<number>(3 / 4)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let active = true

    const drawThumbnail = async () => {
      try {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let pdfPage: any = null
        let pdfAspect = 3 / 4

        // 1. If has PDF, load page to find aspect ratio
        if (page.pdfPath && page.pageNumber && vaultPath) {
          try {
            const pdf = await getCachedPdf(vaultPath, page.pdfPath)
            if (!active) return
            pdfPage = await pdf.getPage(page.pageNumber)
            if (!active) return
            const viewport = pdfPage.getViewport({ scale: 1.0 })
            pdfAspect = viewport.width / viewport.height
            setAspectRatio(pdfAspect)
          } catch (pdfErr) {
            console.error('Error loading PDF for thumbnail:', pdfErr)
            setAspectRatio(3 / 4)
          }
        } else {
          setAspectRatio(3 / 4)
        }

        const targetWidth = 140
        const targetHeight = targetWidth / pdfAspect

        // Set high DPI canvas resolution (double for ultra sharpness)
        canvas.width = targetWidth * 2
        canvas.height = targetHeight * 2

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.scale(2, 2)

        // 3. Render PDF background
        if (pdfPage) {
          const scale = targetWidth / pdfPage.getViewport({ scale: 1.0 }).width
          const viewport = pdfPage.getViewport({ scale })
          await pdfPage.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise
          if (!active) return
        } else {
          // Fill white background for blank paper
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, targetWidth, targetHeight)
        }

        // 4. Render Drawings
        const scaleFactor = targetWidth / 1200
        ctx.scale(scaleFactor, scaleFactor)

        if (page.shapes && page.shapes.length > 0) {
          for (const shape of page.shapes) {
            drawShape(ctx, shape)
          }
        }

        if (page.strokes && page.strokes.length > 0) {
          for (const stroke of page.strokes) {
            drawStroke(ctx, stroke)
          }
        }

        ctx.restore()
      } catch (err) {
        console.error('Error drawing thumbnail:', err)
      }
    }

    drawThumbnail()

    return () => {
      active = false
    }
  }, [page.strokes, page.shapes, page.pdfPath, page.pageNumber, vaultPath])

  return (
    <div
      className="w-full overflow-hidden rounded-lg border border-slate-200/50 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center shadow-sm select-none pointer-events-none"
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

interface PageSidebarProps {
  activeNote: Note | undefined
}

export default function PageSidebar({ activeNote }: PageSidebarProps): React.JSX.Element {
  const { addPage, deletePage, setActivePage, vaultPath } = useNotesStore()

  const lastWheelTime = useRef<number>(0)
  const activePageRef = useRef<HTMLDivElement | null>(null)

  // Scroll active page thumbnail into view smoothly when activePageId changes
  useEffect(() => {
    if (activePageRef.current) {
      activePageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [activeNote?.activePageId])

  if (!activeNote) return <div className="hidden" />

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    const now = Date.now()
    if (now - lastWheelTime.current < 350) return // 350ms throttle

    const currentIndex = activeNote.pages.findIndex((page) => page.id === activeNote.activePageId)
    if (currentIndex === -1) return

    if (e.deltaY > 0) {
      // Scroll down -> go to next page
      if (currentIndex < activeNote.pages.length - 1) {
        const nextPage = activeNote.pages[currentIndex + 1]
        setActivePage(activeNote.id, nextPage.id)
        lastWheelTime.current = now
      }
    } else if (e.deltaY < 0) {
      // Scroll up -> go to previous page
      if (currentIndex > 0) {
        const prevPage = activeNote.pages[currentIndex - 1]
        setActivePage(activeNote.id, prevPage.id)
        lastWheelTime.current = now
      }
    }
  }

  return (
    <div className="flex w-48 flex-shrink-0 h-full bg-slate-50 dark:bg-zinc-900/40 border-l border-slate-200 dark:border-zinc-800/40 flex-col z-10 transition-all duration-300">
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800/40 flex items-center justify-between bg-white dark:bg-zinc-900/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 flex items-center gap-2">
          <FileText size={14} />
          Páginas
        </h3>
        <button
          onClick={() => addPage(activeNote.id)}
          className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
          title="Nova Página"
        >
          <Plus size={14} />
        </button>
      </div>

      <div onWheel={handleWheel} className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {activeNote.pages.map((page, index) => (
          <div
            key={page.id}
            ref={activeNote.activePageId === page.id ? activePageRef : undefined}
            className={`group relative flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
              activeNote.activePageId === page.id
                ? 'bg-white dark:bg-zinc-800 border-red-200 dark:border-red-900/30 shadow-md ring-1 ring-red-500/10'
                : 'bg-transparent border-transparent hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 text-slate-500 dark:text-zinc-400'
            }`}
            onClick={() => setActivePage(activeNote.id, page.id)}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-[10px] font-bold ${activeNote.activePageId === page.id ? 'text-red-500' : 'text-slate-400'}`}
              >
                PÁGINA {index + 1}
              </span>
              {activeNote.pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('Excluir esta página?')) {
                      deletePage(activeNote.id, page.id)
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Live page thumbnail preview */}
            <PageThumbnail page={page} vaultPath={vaultPath} />

            {activeNote.activePageId === page.id && (
              <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r-full" />
            )}
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-100/50 dark:bg-zinc-900/40 border-t border-slate-200 dark:border-zinc-800/40">
        <p className="text-[9px] text-center text-slate-400 dark:text-zinc-500 font-medium">
          {activeNote.pages.length} {activeNote.pages.length === 1 ? 'PÁGINA' : 'PÁGINAS'} NO TOTAL
        </p>
      </div>
    </div>
  )
}
