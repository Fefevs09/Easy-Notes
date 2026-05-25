import { create } from 'zustand'

export interface Note {
  id: string
  title: string
  content: string
  folderId: string
  favorite: boolean
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
}

interface NotesState {
  notes: Note[]
  folders: Folder[]
  activeNoteId: string | null
  searchQuery: string

  addFolder: (name: string) => void
  addNote: (title: string, folderId: string) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  toggleFavorite: (id: string) => void
  setSearchQuery: (query: string) => void
  setActiveNoteId: (id: string | null) => void
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  folders: [
    { id: 'all', name: 'All Notes' },
    { id: 'favorites', name: 'Favorites' }
  ],
  activeNoteId: null,
  searchQuery: '',

  addFolder: (name) =>
    set((state) => {
      const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 5)
      return {
        folders: [...state.folders, { id, name }]
      }
    }),

  addNote: (title, folderId) =>
    set((state) => {
      const newNote: Note = {
        id: 'note-' + Math.random().toString(36).substr(2, 9),
        title,
        content: '',
        folderId,
        favorite: false,
        updatedAt: new Date().toISOString()
      }
      return {
        notes: [newNote, ...state.notes],
        activeNoteId: newNote.id
      }
    }),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    })),

  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
    })),

  toggleFavorite: (id) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, favorite: !note.favorite } : note
      )
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveNoteId: (id) => set({ activeNoteId: id })
}))
