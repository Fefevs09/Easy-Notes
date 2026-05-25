import { create } from 'zustand'

interface UiState {
  isSidebarOpen: boolean
  theme: 'light' | 'dark'
  activeFolderId: string

  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setActiveFolderId: (folderId: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  theme: 'light',
  activeFolderId: 'all',

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setActiveFolderId: (folderId) => set({ activeFolderId: folderId })
}))
