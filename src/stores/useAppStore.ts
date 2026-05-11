'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AppState {
  readonly sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
      }),
      { name: 'app-storage' },
    ),
    { name: 'AppStore' },
  ),
)
