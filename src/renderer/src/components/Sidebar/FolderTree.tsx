import React, { useState } from 'react'
import { useNotesStore } from '../../store/notes-store'
import { useUiStore } from '../../store/ui-store'
import { Folder, FolderPlus, Star, Hash, Check } from 'lucide-react'

export default function FolderTree(): React.JSX.Element {
  const { folders, notes, addFolder } = useNotesStore()
  const { activeFolderId, setActiveFolderId } = useUiStore()
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim())
      setNewFolderName('')
      setIsCreating(false)
    }
  }

  // Count notes per folder
  const getNoteCount = (folderId: string) => {
    if (folderId === 'all') return notes.length
    if (folderId === 'favorites') return notes.filter((n) => n.favorite).length
    return notes.filter((n) => n.folderId === folderId).length
  }

  return (
    <div className="flex flex-col h-full text-sm select-none">
      {/* Folder Header */}
      <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-400">
        <span>Pastas</span>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          title="Nova Pasta"
        >
          <FolderPlus size={16} />
        </button>
      </div>

      {/* New Folder Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreateFolder} className="px-3 mb-2 flex items-center gap-1">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nome da pasta..."
            className="flex-1 px-2 py-1 text-xs border rounded-md outline-none bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            autoFocus
          />
          <button
            type="submit"
            className="p-1 text-white bg-red-400 hover:bg-red-500 rounded-md transition-colors"
          >
            <Check size={12} />
          </button>
        </form>
      )}

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {folders.map((folder) => {
          const isActive = activeFolderId === folder.id
          const count = getNoteCount(folder.id)

          // Select icon based on folder type
          let Icon = Folder
          if (folder.id === 'all') Icon = Hash
          else if (folder.id === 'favorites') Icon = Star

          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolderId(folder.id)}
              className={`flex items-center justify-between w-full px-3 py-2 text-left rounded-lg transition-all ${
                isActive
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-500 font-medium'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={isActive ? 'text-red-500' : 'text-slate-400'} />
                <span className="truncate">{folder.name}</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-red-100 dark:bg-red-950 text-red-500'
                    : 'bg-slate-200/60 dark:bg-zinc-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
