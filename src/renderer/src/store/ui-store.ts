import { create } from 'zustand'

interface UiState {
  isSidebarOpen: boolean
  isNotesListOpen: boolean
  theme: 'light' | 'dark'
  activeFolderId: string

  toggleSidebar: () => void
  toggleNotesList: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setActiveFolderId: (folderId: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  isNotesListOpen: true,
  theme: 'light',
  activeFolderId: 'all',

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleNotesList: () => set((state) => ({ isNotesListOpen: !state.isNotesListOpen })),
  setTheme: (theme) => set({ theme }),
  setActiveFolderId: (folderId) => set({ activeFolderId: folderId })
}))
