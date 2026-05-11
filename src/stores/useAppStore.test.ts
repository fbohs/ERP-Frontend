import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ sidebarOpen: true })
  })

  it('defaults to sidebar open', () => {
    expect(useAppStore.getState().sidebarOpen).toBe(true)
  })

  it('toggles the sidebar closed', () => {
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(false)
  })

  it('toggles the sidebar back open', () => {
    useAppStore.getState().toggleSidebar()
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(true)
  })

  it('sets sidebar open explicitly', () => {
    useAppStore.getState().setSidebarOpen(false)
    expect(useAppStore.getState().sidebarOpen).toBe(false)
  })
})
