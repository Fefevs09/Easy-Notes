import React, { useRef, useEffect } from 'react'
import { useNotesStore, Note } from '../../store/notes-store'
import { Plus, Trash2, FileText } from 'lucide-react'

interface PageSidebarProps {
  activeNote: Note | undefined
}

export default function PageSidebar({ activeNote }: PageSidebarProps): React.JSX.Element {
  const { addPage, deletePage, setActivePage } = useNotesStore()

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

            {/* Visual Placeholder for Page Content */}
            <div
              className={`w-full aspect-[3/4] rounded-lg border flex items-center justify-center transition-colors ${
                activeNote.activePageId === page.id
                  ? 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700'
                  : 'bg-slate-200/50 dark:bg-zinc-800/50 border-slate-300/30 dark:border-zinc-700/30'
              }`}
            >
              {page.strokes.length > 0 || page.shapes.length > 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-1 bg-slate-300 dark:bg-zinc-600 rounded-full" />
                  <div className="w-6 h-1 bg-slate-300 dark:bg-zinc-600 rounded-full" />
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-zinc-600 italic">Vazia</span>
              )}
            </div>

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
