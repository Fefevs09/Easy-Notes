import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useCanvasStore } from '../../store/canvas-store'
import { useNotesStore } from '../../store/notes-store'
import PageCanvas from './PageCanvas'
import { Minus, Plus } from 'lucide-react'

interface DrawingCanvasProps {
  noteId: string
  activePageId: string
  template: string
  canvasRefCallback?: (handlers: { undo: () => void; redo: () => void; clear: () => void }) => void
}

export default function DrawingCanvas({
  noteId,
  activePageId,
  template,
  canvasRefCallback
}: DrawingCanvasProps): React.JSX.Element {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const lastCanvasWheelTime = useRef<number>(0)
  const isProgrammaticScroll = useRef<boolean>(false)
  const lastScrolledPageId = useRef<string | null>(null)

  const { notes, setActivePage } = useNotesStore()

  // Find current note data from store
  const activeNote = notes.find((n) => n.id === noteId)

  // Infinite canvas dynamic size states (shared/controlled by parent)
  const [canvasWidth, setCanvasWidth] = useState(1200)
  const [canvasHeight, setCanvasHeight] = useState(1600)

  // Spacebar pan navigation states
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

  const { zoom, setZoom } = useCanvasStore()

  // Dictionary to store Undo/Redo/Clear handlers for all child page canvases
  const childHandlers = useRef<{
    [pageId: string]: { undo: () => void; redo: () => void; clear: () => void }
  }>({})

  const handleRegisterHandlers = useCallback(
    (
      pageId: string,
      handlers: { undo: () => void; redo: () => void; clear: () => void } | null
    ) => {
      if (handlers) {
        childHandlers.current[pageId] = handlers
      } else {
        delete childHandlers.current[pageId]
      }
    },
    []
  )

  // Provide Undo/Redo/Clear handlers of the ACTIVE page to the parent App toolbar
  useEffect(() => {
    if (canvasRefCallback) {
      const activeHandlers = childHandlers.current[activePageId]
      if (activeHandlers) {
        canvasRefCallback({
          undo: () => activeHandlers.undo(),
          redo: () => activeHandlers.redo(),
          clear: () => activeHandlers.clear()
        })
      } else {
        canvasRefCallback({
          undo: () => {},
          redo: () => {},
          clear: () => {}
        })
      }
    }
  }, [activePageId, notes, canvasRefCallback])

  // Spacebar panning key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        )
          return
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

  // Set initial canvas size to fill the viewport (minus padding) or at least 1200x1600
  useEffect(() => {
    const updateSize = () => {
      const viewport = viewportRef.current
      if (viewport) {
        const width = Math.max(1200, viewport.clientWidth - 64)
        const height = Math.max(1600, viewport.clientHeight - 64)
        setCanvasWidth((prev) => Math.max(prev, width))
        setCanvasHeight((prev) => Math.max(prev, height))
      }
    }

    const handle = requestAnimationFrame(updateSize)
    window.addEventListener('resize', updateSize)
    return () => {
      cancelAnimationFrame(handle)
      window.removeEventListener('resize', updateSize)
    }
  }, [noteId])

  // Touchpad trackpad pinch-to-zoom and Alt-scroll page flip handler
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        const scaleChange = -e.deltaY * 0.006
        const targetZoom = zoom + scaleChange
        setZoom(targetZoom)
      } else if (e.altKey) {
        e.preventDefault()
        const now = Date.now()
        if (now - lastCanvasWheelTime.current < 350) return // 350ms throttle

        const currentIndex = activeNote?.pages.findIndex((page) => page.id === activePageId) ?? -1
        if (currentIndex === -1 || !activeNote) return

        let targetPageId: string | null = null
        if (e.deltaY > 0) {
          // Scroll down -> next page
          if (currentIndex < activeNote.pages.length - 1) {
            targetPageId = activeNote.pages[currentIndex + 1].id
          }
        } else if (e.deltaY < 0) {
          // Scroll up -> previous page
          if (currentIndex > 0) {
            targetPageId = activeNote.pages[currentIndex - 1].id
          }
        }

        if (targetPageId) {
          setActivePage(noteId, targetPageId)
          lastCanvasWheelTime.current = now

          // Programmatic smooth scroll to targeted page
          const targetElement = viewport.querySelector(`[data-page-id="${targetPageId}"]`)
          if (targetElement) {
            isProgrammaticScroll.current = true
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            })
            setTimeout(() => {
              isProgrammaticScroll.current = false
            }, 600)
          }
        }
      }
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      viewport.removeEventListener('wheel', handleWheel)
    }
  }, [zoom, setZoom, activeNote, activePageId, noteId, setActivePage])

  // Programmatic Scroll: Scroll to active page when selected externally (e.g., from PageSidebar)
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined = undefined

    if (activePageId !== lastScrolledPageId.current) {
      lastScrolledPageId.current = activePageId

      const viewport = viewportRef.current
      if (viewport) {
        const targetElement = viewport.querySelector(`[data-page-id="${activePageId}"]`)
        if (targetElement) {
          isProgrammaticScroll.current = true
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
          timeout = setTimeout(() => {
            isProgrammaticScroll.current = false
          }, 600)
        }
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [activePageId])

  // Scroll Listener: Detect which page is under the center of the viewport and make it active
  const handleScroll = () => {
    if (isProgrammaticScroll.current) return

    const viewport = viewportRef.current
    if (!viewport) return

    const viewportCenterY = viewport.scrollTop + viewport.clientHeight / 2

    let closestPageId = activePageId
    const pageElements = viewport.querySelectorAll('[data-page-id]')
    pageElements.forEach((el) => {
      const pageId = el.getAttribute('data-page-id')
      if (!pageId) return

      const htmlEl = el as HTMLElement
      const pageTop = htmlEl.offsetTop
      const pageBottom = pageTop + htmlEl.offsetHeight

      // If the viewport center is inside this page sheet boundaries
      if (viewportCenterY >= pageTop && viewportCenterY <= pageBottom) {
        closestPageId = pageId
      }
    })

    if (closestPageId && closestPageId !== activePageId) {
      lastScrolledPageId.current = closestPageId
      setActivePage(noteId, closestPageId)
    }
  }

  // Pointer Panning handlers on the Viewport Wrapper (Spacebar-grab scrolling)
  const handleViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSpacePressed) return
    e.preventDefault()
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
  }

  const handleViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning.current) return
    e.preventDefault()
    const viewport = viewportRef.current
    if (viewport) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      viewport.scrollLeft = panStart.current.scrollLeft - dx
      viewport.scrollTop = panStart.current.scrollTop - dy
    }
  }

  const handleViewportPointerUp = () => {
    isPanning.current = false
  }

  if (!activeNote) return <div className="hidden" />

  return (
    <div className="relative w-full h-full flex-shrink-0">
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={handleViewportPointerUp}
        className={`w-full h-full shadow-inner overflow-auto border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl bg-slate-100 dark:bg-zinc-900/40 flex flex-col items-center gap-12 py-12 custom-scrollbar scroll-smooth select-none ${
          isSpacePressed ? 'cursor-grab active:cursor-grabbing z-40' : ''
        }`}
        style={{ touchAction: 'none' }}
      >
        {activeNote.pages.map((page) => (
          <div
            key={page.id}
            data-page-id={page.id}
            className="relative flex-shrink-0 transition-transform"
          >
            <PageCanvas
              noteId={noteId}
              page={page}
              template={template}
              zoom={zoom}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              isSpacePressed={isSpacePressed}
              onRegisterHandlers={handleRegisterHandlers}
            />
            {/* Visual active page boundary indicator */}
            {activePageId === page.id && (
              <div className="absolute -inset-1 border-2 border-red-500/20 rounded-md pointer-events-none animate-pulse" />
            )}
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-2 glass-panel p-2 px-3 rounded-full shadow-2xl z-40 text-xs font-semibold text-slate-800 dark:text-slate-200">
        <button
          onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
          className="p-1 rounded-full hover:bg-white/20 dark:hover:bg-zinc-700/50 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
          title="Diminuir Zoom"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[42px] text-center select-none">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(Math.min(3.0, zoom + 0.1))}
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
