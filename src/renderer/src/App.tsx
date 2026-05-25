import React, { useState, useEffect } from 'react'
import { useNotesStore } from './store/notes-store'
import { useUiStore } from './store/ui-store'
import { useCanvasStore } from './store/canvas-store'
import FolderTree from './components/Sidebar/FolderTree'
import NotesList from './components/Sidebar/NotesList'
import MainToolbar from './components/Toolbar/MainToolbar'
import DrawingCanvas from './components/Canvas/DrawingCanvas'
import CanvasToolbar from './components/Canvas/CanvasToolbar'
import { Sidebar, Sparkles } from 'lucide-react'

export default function App(): React.JSX.Element {
  const { notes, activeNoteId } = useNotesStore()
  const { isSidebarOpen, theme, toggleSidebar } = useUiStore()

  const [pageTemplate, setPageTemplate] = useState<string>('ruled')

  // Capture canvas handlers for undo/redo integration
  const [canvasHandlers, setCanvasHandlers] = useState<{
    undo: () => void
    redo: () => void
    clear: () => void
  } | null>(null)

  // Find active note object
  const activeNote = notes.find((n) => n.id === activeNoteId)

  // Toggle HTML dark class for Tailwind dark-mode HMR
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }, [theme])

  // Reset active tool to 'pen' whenever a new note is opened or created
  useEffect(() => {
    if (activeNoteId) {
      useCanvasStore.getState().setActiveTool('pen')
    }
  }, [activeNoteId])


  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* 1. SIDEBAR COLUMN: Folders sidebar */}
      {isSidebarOpen && (
        <div className="w-52 h-full bg-slate-100 dark:bg-zinc-900/60 border-r border-slate-200 dark:border-zinc-800/40 p-2 flex flex-col z-20">
          {/* Mac Header */}
          <div className="flex items-center gap-2 px-3 py-4 select-none">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-xs font-bold tracking-wider ml-1 text-slate-500 dark:text-slate-400">EASY NOTES</span>
          </div>

          <div className="flex-1 mt-2">
            <FolderTree />
          </div>
        </div>
      )}

      {/* Toggle Sidebar Button */}
      <button
        onClick={toggleSidebar}
        className="absolute bottom-5 left-5 p-2.5 rounded-full glass-panel shadow-md hover:scale-110 transition-all text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 z-30"
        title="Ocultar Painel"
      >
        <Sidebar size={16} />
      </button>

      {/* 2. MIDDLE COLUMN: Notes list sidebar */}
      <div className="w-72 h-full flex-shrink-0 z-10">
        <NotesList />
      </div>

      {/* 3. RIGHT COLUMN: Main active workspace area */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
        
        {/* Header toolbar */}
        <MainToolbar
          activeNote={activeNote}
          onUndo={canvasHandlers?.undo}
          onRedo={canvasHandlers?.redo}
          onClear={canvasHandlers?.clear}
          pageTemplate={pageTemplate}
          setPageTemplate={setPageTemplate}
        />

        {/* Workspace Panes container */}
        <div className="flex-1 w-full h-full p-6 flex gap-6 overflow-hidden select-none">
          {activeNote ? (
            <div className="flex-1 h-full relative transition-all duration-300">
              <DrawingCanvas
                noteId={activeNote.id}
                template={pageTemplate}
                canvasRefCallback={setCanvasHandlers}
              />

              {/* Floating drawing tools panel */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto">
                <CanvasToolbar />
              </div>
            </div>
          ) : (
            /* EMPTY STATE PANELS */
            <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-8 space-y-4 select-none">
              <div className="p-4 bg-red-400/10 text-red-500 rounded-full animate-bounce">
                <Sparkles size={36} />
              </div>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Nenhuma Nota Aberta</h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Selecione uma nota na barra lateral para começar a desenhar com pressão Wacom, esboçar ideias, ou criar o seu diário gráfico.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
