import React, { useState, useEffect } from 'react'
import { useNotesStore } from '../../store/notes-store'
import { useUiStore } from '../../store/ui-store'
import { Search, Plus, Star, Calendar, FileText, Trash2 } from 'lucide-react'
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

export default function NotesList(): React.JSX.Element {
  const {
    notes,
    activeNoteId,
    searchQuery,
    setActiveNoteId,
    setSearchQuery,
    addNote,
    addPdfNote,
    toggleFavorite,
    deleteNote
  } = useNotesStore()
  const { activeFolderId } = useUiStore()

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    noteId: string
  } | null>(null)

  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  // Close context menu on global click/contextmenu
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null)
    window.addEventListener('click', handleGlobalClick)
    window.addEventListener('contextmenu', handleGlobalClick)
    return () => {
      window.removeEventListener('click', handleGlobalClick)
      window.removeEventListener('contextmenu', handleGlobalClick)
    }
  }, [])

  const handleConfirmDelete = () => {
    if (!noteToDelete) return
    deleteNote(noteToDelete)
    setNoteToDelete(null)
  }

  // Listen to Escape and Enter keys when confirm modal is active
  useEffect(() => {
    if (!noteToDelete) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setNoteToDelete(null)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleConfirmDelete()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [noteToDelete])

  const handleContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const menuWidth = 160
    const menuHeight = 50

    let x = e.clientX
    let y = e.clientY

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }

    setContextMenu({ x, y, noteId })
  }

  // Filter notes based on active folder & search query
  const filteredNotes = notes.filter((note) => {
    // 1. Folder match
    if (activeFolderId === 'favorites') {
      if (!note.favorite) return false
    } else if (activeFolderId !== 'all') {
      if (note.folderId !== activeFolderId) return false
    }

    // 2. Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return note.title.toLowerCase().includes(q)
    }

    return true
  })

  const handleAddNote = () => {
    const folder = activeFolderId === 'favorites' ? 'all' : activeFolderId
    addNote('Nova Nota', folder)
  }

  const handleImportPdf = async () => {
    if (typeof window === 'undefined' || !(window as any).electron) return
    const vaultPath = useNotesStore.getState().vaultPath
    if (!vaultPath) return

    try {
      const result = await (window as any).electron.ipcRenderer.invoke(
        'import-pdf-to-vault',
        vaultPath
      )
      if (!result) return

      const { relativePath, title } = result
      const folder = activeFolderId === 'favorites' ? 'all' : activeFolderId

      // Load PDF to count pages
      const arrayBuffer = await (window as any).electron.ipcRenderer.invoke(
        'read-pdf-file',
        vaultPath,
        relativePath
      )
      if (!arrayBuffer) {
        alert('Erro ao ler o arquivo PDF importado.')
        return
      }

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      const pageCount = pdf.numPages

      // Add PDF note to the store
      addPdfNote(title, relativePath, pageCount, folder)
    } catch (err) {
      console.error('Failed to import PDF:', err)
      alert('Falha ao processar o arquivo PDF.')
    }
  }

  // Format date helper
  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Parse note content to show a beautiful plaintext preview
  const getNotePreview = (note: any) => {
    const pagesCount = note.pages?.length || 0
    return `${pagesCount} ${pagesCount === 1 ? 'página' : 'páginas'}`
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 text-sm">
      {/* Search & Actions Bar */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar notas..."
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-full outline-none bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-red-400 dark:focus:border-red-500 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddNote}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-400 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all hover-scale cursor-pointer"
          >
            <Plus size={14} />
            <span>Criar Nota</span>
          </button>

          <button
            onClick={handleImportPdf}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all hover-scale border border-slate-200/50 dark:border-zinc-700/50 cursor-pointer"
          >
            <FileText size={14} className="text-red-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Note Cards List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">Nenhuma nota encontrada.</div>
        ) : (
          filteredNotes.map((note) => {
            const isActive = activeNoteId === note.id

            return (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
                className={`relative group p-4 rounded-xl cursor-pointer border transition-all hover-scale ${
                  isActive
                    ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-zinc-800/40 hover:bg-slate-50 dark:hover:bg-zinc-800/60 border-slate-100 dark:border-zinc-800/50'
                }`}
              >
                {/* Note title */}
                <div className="font-semibold text-slate-800 dark:text-slate-100 truncate pr-6">
                  {note.title || 'Sem Título'}
                </div>

                {/* Note preview content snippet */}
                <p className="text-xs text-slate-400 mt-1 truncate italic">
                  {getNotePreview(note)}
                </p>

                {/* Footer card metrics */}
                <div className="flex items-center gap-1.5 text-xxs text-slate-400 mt-3 font-medium">
                  <Calendar size={10} />
                  <span>{formatDate(note.updatedAt)}</span>
                </div>

                {/* Favorite toggle star */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(note.id)
                  }}
                  className={`absolute top-4 right-4 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors ${
                    note.favorite
                      ? 'text-yellow-400 opacity-100'
                      : 'text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity'
                  }`}
                >
                  <Star size={14} fill={note.favorite ? 'currentColor' : 'transparent'} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[160px] py-1 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/60 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-100 ease-out"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setNoteToDelete(contextMenu.noteId)
              setContextMenu(null)
            }}
            className="w-full text-left px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2 cursor-pointer font-medium"
          >
            <Trash2 size={14} />
            <span>Excluir Nota</span>
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Trash2 size={18} className="text-red-500" />
              <span>Excluir Nota</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-2 leading-relaxed">
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita e removerá o
              arquivo correspondente permanentemente.
            </p>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 rounded-lg cursor-pointer transition-colors"
              >
                Cancelar <span className="text-[10px] opacity-60 ml-1 font-mono">(esc)</span>
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg cursor-pointer shadow-md hover:shadow-lg hover:scale-102 active:scale-98 transition-all duration-150"
              >
                Confirmar <span className="text-[10px] opacity-75 ml-1 font-mono">⏎</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
