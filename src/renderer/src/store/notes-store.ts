import { create } from 'zustand'

export interface NotePage {
  id: string
  strokes: any[]
  shapes: any[]
}

export interface Note {
  id: string
  title: string
  pages: NotePage[]
  activePageId: string
  folderId: string
  favorite: boolean
  updatedAt: string
  content?: string
}

export interface Folder {
  id: string
  name: string
}

interface NotesState {
  vaultPath: string | null
  notes: Note[]
  folders: Folder[]
  activeNoteId: string | null
  searchQuery: string

  setVaultPath: (path: string | null) => void
  initializeVault: (path: string) => Promise<void>
  addFolder: (name: string) => void
  addNote: (title: string, folderId: string) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  toggleFavorite: (id: string) => void
  setSearchQuery: (query: string) => void
  setActiveNoteId: (id: string | null) => void

  // Page actions
  addPage: (noteId: string) => void
  deletePage: (noteId: string, pageId: string) => void
  setActivePage: (noteId: string, pageId: string) => void
  updatePageContent: (noteId: string, pageId: string, strokes: any[], shapes: any[]) => void
}

// Helper to save a note to disk
const saveNoteToDisk = async (vaultPath: string | null, note: Note, folders: Folder[]) => {
  if (!vaultPath) return
  if (typeof window === 'undefined' || !(window as any).electron) return
  try {
    const folder = folders.find((f) => f.id === note.folderId)
    const folderName = folder ? folder.name : 'all'
    const rawData = JSON.stringify(note)
    await (window as any).electron.ipcRenderer.invoke(
      'save-note-file',
      vaultPath,
      folderName,
      note.title,
      rawData
    )
  } catch (err) {
    console.error('Failed to save note to disk:', err)
  }
}

// Helper to delete a note from disk
const deleteNoteFromDisk = async (vaultPath: string | null, note: Note, folders: Folder[]) => {
  if (!vaultPath) return
  if (typeof window === 'undefined' || !(window as any).electron) return
  try {
    const folder = folders.find((f) => f.id === note.folderId)
    const folderName = folder ? folder.name : 'all'
    await (window as any).electron.ipcRenderer.invoke(
      'delete-note-file',
      vaultPath,
      folderName,
      note.title
    )
  } catch (err) {
    console.error('Failed to delete note from disk:', err)
  }
}

// Helper to create a folder directory on disk
const createFolderOnDisk = async (vaultPath: string | null, folderName: string) => {
  if (!vaultPath) return
  if (typeof window === 'undefined' || !(window as any).electron) return
  try {
    await (window as any).electron.ipcRenderer.invoke('create-folder-dir', vaultPath, folderName)
  } catch (err) {
    console.error('Failed to create folder directory on disk:', err)
  }
}

// Helper to rename files/dirs on disk
const renameOnDisk = async (
  vaultPath: string | null,
  folderName: string,
  oldName: string,
  newName: string,
  isFolder: boolean
) => {
  if (!vaultPath) return
  if (typeof window === 'undefined' || !(window as any).electron) return
  try {
    await (window as any).electron.ipcRenderer.invoke(
      'rename-file-or-dir',
      vaultPath,
      folderName,
      oldName,
      newName,
      isFolder
    )
  } catch (err) {
    console.error('Failed to rename on disk:', err)
  }
}

export const useNotesStore = create<NotesState>((set) => ({
  vaultPath: null,
  notes: [],
  folders: [
    { id: 'all', name: 'All Notes' },
    { id: 'favorites', name: 'Favorites' }
  ],
  activeNoteId: null,
  searchQuery: '',

  setVaultPath: (path) => set({ vaultPath: path }),

  initializeVault: async (vaultPath) => {
    if (typeof window === 'undefined' || !(window as any).electron) return
    try {
      const { folders, notes } = await (window as any).electron.ipcRenderer.invoke(
        'scan-vault',
        vaultPath
      )

      const baseFolders = [
        { id: 'all', name: 'All Notes' },
        { id: 'favorites', name: 'Favorites' }
      ]

      set({
        vaultPath,
        folders: [...baseFolders, ...folders],
        notes,
        activeNoteId: notes.length > 0 ? notes[0].id : null
      })
    } catch (err) {
      console.error('Failed to initialize vault:', err)
    }
  },

  addFolder: (name) =>
    set((state) => {
      const id = name.toLowerCase().replace(/\s+/g, '-')

      // Avoid duplicate folders
      if (state.folders.some((f) => f.id === id)) return {}

      createFolderOnDisk(state.vaultPath, name)

      return {
        folders: [...state.folders, { id, name }]
      }
    }),

  addNote: (title, folderId) =>
    set((state) => {
      const initialPage: NotePage = {
        id: 'page-' + Math.random().toString(36).substr(2, 9),
        strokes: [],
        shapes: []
      }
      const newNote: Note = {
        id: 'note-' + Math.random().toString(36).substr(2, 9),
        title,
        pages: [initialPage],
        activePageId: initialPage.id,
        folderId,
        favorite: false,
        updatedAt: new Date().toISOString(),
        content: JSON.stringify([
          {
            id: 'b-init',
            type: 'paragraph',
            text: '',
            bold: false,
            italic: false,
            underline: false
          }
        ]) // Initial content text block
      }

      saveNoteToDisk(state.vaultPath, newNote, state.folders)

      return {
        notes: [newNote, ...state.notes],
        activeNoteId: newNote.id
      }
    }),

  updateNote: (id, updates) =>
    set((state) => {
      const updatedNotes = state.notes.map((note) => {
        if (note.id === id) {
          const updated = { ...note, ...updates, updatedAt: new Date().toISOString() }

          // If title changes, rename the physical file on disk
          if (updates.title && updates.title !== note.title) {
            const folder = state.folders.find((f) => f.id === note.folderId)
            const folderName = folder ? folder.name : 'all'
            renameOnDisk(state.vaultPath, folderName, note.title, updates.title, false)
          }

          saveNoteToDisk(state.vaultPath, updated, state.folders)
          return updated
        }
        return note
      })
      return { notes: updatedNotes }
    }),

  deleteNote: (id) =>
    set((state) => {
      const note = state.notes.find((n) => n.id === id)
      if (note) {
        deleteNoteFromDisk(state.vaultPath, note, state.folders)
      }
      return {
        notes: state.notes.filter((note) => note.id !== id),
        activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
      }
    }),

  toggleFavorite: (id) =>
    set((state) => {
      const updatedNotes = state.notes.map((note) => {
        if (note.id === id) {
          const updated = { ...note, favorite: !note.favorite, updatedAt: new Date().toISOString() }
          saveNoteToDisk(state.vaultPath, updated, state.folders)
          return updated
        }
        return note
      })
      return { notes: updatedNotes }
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveNoteId: (id) => set({ activeNoteId: id }),

  addPage: (noteId) =>
    set((state) => {
      const updatedNotes = state.notes.map((note) => {
        if (note.id === noteId) {
          const newPage: NotePage = {
            id: 'page-' + Math.random().toString(36).substr(2, 9),
            strokes: [],
            shapes: []
          }
          const updated = {
            ...note,
            pages: [...note.pages, newPage],
            activePageId: newPage.id,
            updatedAt: new Date().toISOString()
          }
          saveNoteToDisk(state.vaultPath, updated, state.folders)
          return updated
        }
        return note
      })
      return { notes: updatedNotes }
    }),

  deletePage: (noteId, pageId) =>
    set((state) => {
      const updatedNotes = state.notes.map((note) => {
        if (note.id === noteId && note.pages.length > 1) {
          const newPages = note.pages.filter((p) => p.id !== pageId)
          let newActivePageId = note.activePageId
          if (note.activePageId === pageId) {
            newActivePageId = newPages[0].id
          }
          const updated = {
            ...note,
            pages: newPages,
            activePageId: newActivePageId,
            updatedAt: new Date().toISOString()
          }
          saveNoteToDisk(state.vaultPath, updated, state.folders)
          return updated
        }
        return note
      })
      return { notes: updatedNotes }
    }),

  setActivePage: (noteId, pageId) =>
    set((state) => {
      const updatedNotes = state.notes.map((note) => {
        if (note.id === noteId) {
          const updated = { ...note, activePageId: pageId }
          saveNoteToDisk(state.vaultPath, updated, state.folders)
          return updated
        }
        return note
      })
      return { notes: updatedNotes }
    }),

  updatePageContent: (noteId, pageId, strokes, shapes) =>
    set((state) => {
      const updatedNotes = state.notes.map((note) => {
        if (note.id === noteId) {
          const updated = {
            ...note,
            pages: note.pages.map((page) =>
              page.id === pageId ? { ...page, strokes, shapes } : page
            ),
            updatedAt: new Date().toISOString()
          }
          saveNoteToDisk(state.vaultPath, updated, state.folders)
          return updated
        }
        return note
      })
      return { notes: updatedNotes }
    })
}))
