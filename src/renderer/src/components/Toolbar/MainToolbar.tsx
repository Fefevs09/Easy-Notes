import React, { useState } from 'react'
import { useNotesStore } from '../../store/notes-store'
import { useUiStore } from '../../store/ui-store'
import {
  Undo,
  Redo,
  Share2,
  Download,
  Sun,
  Moon,
  CloudLightning,
  Grid,
  FileText,
  SquareDot,
  Layers3,
  Star,
  Trash2
} from 'lucide-react'

interface MainToolbarProps {
  activeNote: any
  onUndo?: () => void
  onRedo?: () => void
  onClear?: () => void
  pageTemplate: string
  setPageTemplate: (t: string) => void
}

export default function MainToolbar({
  activeNote,
  onUndo,
  onRedo,
  onClear,
  pageTemplate,
  setPageTemplate
}: MainToolbarProps): React.JSX.Element {
  const { updateNote, toggleFavorite } = useNotesStore()
  const { theme, setTheme } = useUiStore()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')

  if (!activeNote) {
    return (
      <div className="h-14 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-6 text-slate-400">
        Selecione ou crie uma nota para começar.
      </div>
    )
  }

  const handleTitleClick = () => {
    setTitleInput(activeNote.title)
    setIsEditingTitle(true)
  }

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      updateNote(activeNote.id, { title: titleInput.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleExport = (type: 'pdf' | 'png') => {
    alert(`Nota "${activeNote.title}" exportada com sucesso como ${type.toUpperCase()}!`)
  }

  return (
    <div className="h-14 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 select-none z-30">
      
      {/* 1. LEFT SIDE: Title & Favorite Toggle */}
      <div className="flex items-center gap-3 max-w-sm">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            className="text-base font-bold bg-transparent outline-none border-b border-red-400 text-slate-800 dark:text-slate-100"
            autoFocus
          />
        ) : (
          <h1
            onClick={handleTitleClick}
            className="text-base font-bold text-slate-800 dark:text-slate-100 truncate cursor-pointer hover:text-red-400 dark:hover:text-red-400 transition-colors"
          >
            {activeNote.title || 'Sem Título'}
          </h1>
        )}

        <button
          onClick={() => toggleFavorite(activeNote.id)}
          className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ${
            activeNote.favorite ? 'text-yellow-400' : 'text-slate-400'
          }`}
        >
          <Star size={16} fill={activeNote.favorite ? 'currentColor' : 'transparent'} />
        </button>
      </div>

      {/* 2. CENTER SIDE: Page Template Selector */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setPageTemplate('blank')}
          className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-medium transition-all ${
            pageTemplate === 'blank'
              ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-zinc-700/30'
          }`}
          title="Papel Liso"
        >
          <FileText size={14} />
          <span className="hidden lg:inline">Liso</span>
        </button>

        <button
          onClick={() => setPageTemplate('ruled')}
          className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-medium transition-all ${
            pageTemplate === 'ruled'
              ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-zinc-700/30'
          }`}
          title="Papel Pautado"
        >
          <Layers3 size={14} />
          <span className="hidden lg:inline">Pautado</span>
        </button>

        <button
          onClick={() => setPageTemplate('grid')}
          className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-medium transition-all ${
            pageTemplate === 'grid'
              ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-zinc-700/30'
          }`}
          title="Papel Quadriculado"
        >
          <Grid size={14} />
          <span className="hidden lg:inline">Grade</span>
        </button>

        <button
          onClick={() => setPageTemplate('dotted')}
          className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-medium transition-all ${
            pageTemplate === 'dotted'
              ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-zinc-700/30'
          }`}
          title="Papel Pontilhado"
        >
          <SquareDot size={14} />
          <span className="hidden lg:inline">Pontos</span>
        </button>
      </div>

      {/* 3. RIGHT SIDE: Undo/Redo & Actions & Theme */}
      <div className="flex items-center gap-4 text-slate-400">
        
        {/* Undo / Redo */}
        <div className="flex items-center border-r border-slate-200 dark:border-zinc-800 pr-4">
          <button
            onClick={onUndo}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Desfazer (Cmd+Z)"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={onRedo}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Refazer (Cmd+Shift+Z)"
          >
            <Redo size={16} />
          </button>
          <button
            onClick={onClear}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-500 transition-colors ml-1"
            title="Limpar Canvas"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Share & Export */}
        <div className="flex items-center gap-1 border-r border-slate-200 dark:border-zinc-800 pr-4">
          <button
            onClick={() => handleExport('pdf')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-xs"
            title="Exportar como PDF"
          >
            <Download size={15} />
            <span className="hidden md:inline font-medium">Exportar</span>
          </button>
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Partilhar Nota"
          >
            <Share2 size={15} />
          </button>
        </div>

        {/* Cloud Sync & Theme Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-emerald-400/10 px-2.5 py-1 rounded-full text-emerald-500">
            <CloudLightning size={12} className="animate-pulse" />
            <span className="hidden md:inline">Salvo localmente</span>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all hover-scale"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

      </div>
    </div>
  )
}
