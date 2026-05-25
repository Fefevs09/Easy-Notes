import React from 'react'
import { useNotesStore } from '../../store/notes-store'
import { useUiStore } from '../../store/ui-store'
import { Search, Plus, Star, Calendar } from 'lucide-react'

export default function NotesList(): React.JSX.Element {
  const { notes, activeNoteId, searchQuery, setActiveNoteId, setSearchQuery, addNote, toggleFavorite } = useNotesStore()
  const { activeFolderId } = useUiStore()

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
      return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)
    }

    return true
  })

  const handleAddNote = () => {
    const folder = activeFolderId === 'favorites' ? 'all' : activeFolderId
    addNote('Nova Nota', folder)
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
  const getNotePreview = (content: string) => {
    if (!content) return 'Nenhum conteúdo de texto...'
    if (content.startsWith('[')) {
      try {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          return parsed.map((b) => b.text).join(' ').trim() || 'Nenhum conteúdo de texto...'
        }
      } catch (e) {}
    }
    return content
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

        <button
          onClick={handleAddNote}
          className="flex items-center justify-center gap-2 w-full py-2 bg-red-400 hover:bg-red-500 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all hover-scale"
        >
          <Plus size={16} />
          <span>Criar Nota</span>
        </button>
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
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {getNotePreview(note.content)}
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
    </div>
  )
}
