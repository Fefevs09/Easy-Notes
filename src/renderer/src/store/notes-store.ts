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

  // Page actions
  addPage: (noteId: string) => void
  deletePage: (noteId: string, pageId: string) => void
  setActivePage: (noteId: string, pageId: string) => void
  updatePageContent: (noteId: string, pageId: string, strokes: any[], shapes: any[]) => void
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
      const id =
        name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 5)
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
        note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note
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
  setActiveNoteId: (id) => set({ activeNoteId: id }),

  addPage: (noteId) =>
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id === noteId) {
          const newPage: NotePage = {
            id: 'page-' + Math.random().toString(36).substr(2, 9),
            strokes: [],
            shapes: []
          }
          return {
            ...note,
            pages: [...note.pages, newPage],
            activePageId: newPage.id,
            updatedAt: new Date().toISOString()
          }
        }
        return note
      })
    })),

  deletePage: (noteId, pageId) =>
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id === noteId && note.pages.length > 1) {
          const newPages = note.pages.filter((p) => p.id !== pageId)
          let newActivePageId = note.activePageId
          if (note.activePageId === pageId) {
            newActivePageId = newPages[0].id
          }
          return {
            ...note,
            pages: newPages,
            activePageId: newActivePageId,
            updatedAt: new Date().toISOString()
          }
        }
        return note
      })
    })),

  setActivePage: (noteId, pageId) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId ? { ...note, activePageId: pageId } : note
      )
    })),

  updatePageContent: (noteId, pageId, strokes, shapes) =>
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            pages: note.pages.map((page) =>
              page.id === pageId ? { ...page, strokes, shapes } : page
            ),
            updatedAt: new Date().toISOString()
          }
        }
        return note
      })
    }))
}))
