import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NoteStorageManager } from '@/lib/storage/note-storage'

describe('NoteStorageManager Storage Logic', () => {
  let storage: NoteStorageManager

  beforeEach(() => {
    storage = new NoteStorageManager()
    // Reset global mocks
    if (typeof window !== 'undefined') {
      ;(window as any).electron = undefined
    }
    localStorage.clear()
  })

  it('should fall back to localStorage in a browser/test environment', async () => {
    const data = { title: 'Draft', blocks: [], canvasObjects: [] }
    const success = await storage.saveNote('note-123', data)
    expect(success).toBe(true)

    const loaded = await storage.loadNote('note-123')
    expect(loaded).toEqual(data)
  })

  it('should return null when loading non-existent note', async () => {
    const loaded = await storage.loadNote('non-existent')
    expect(loaded).toBeNull()
  })

  it('should delete a note from localStorage', async () => {
    const data = { title: 'Draft' }
    await storage.saveNote('note-123', data)
    const success = await storage.deleteNote('note-123')
    expect(success).toBe(true)

    const loaded = await storage.loadNote('note-123')
    expect(loaded).toBeNull()
  })

  it('should delegate to Electron IPC when running inside the desktop app', async () => {
    // Mock the Electron preload bridge
    const mockInvoke = vi.fn().mockResolvedValue(true)
    const mockLoadInvoke = vi.fn().mockResolvedValue(JSON.stringify({ title: 'Desktop Note' }))
    const mockDeleteInvoke = vi.fn().mockResolvedValue(true)

    if (typeof window !== 'undefined') {
      ;(window as any).electron = {
        ipcRenderer: {
          invoke: (channel: string, ...args: any[]) => {
            if (channel === 'save-note') return mockInvoke(...args)
            if (channel === 'read-note') return mockLoadInvoke(...args)
            if (channel === 'delete-note') return mockDeleteInvoke(...args)
            return Promise.resolve()
          }
        }
      }
    }

    const saveData = { title: 'Desktop Note' }
    const saveSuccess = await storage.saveNote('note-123', saveData)
    expect(saveSuccess).toBe(true)
    expect(mockInvoke).toHaveBeenCalledWith('note-123', JSON.stringify(saveData))

    const loaded = await storage.loadNote('note-123')
    expect(loaded).toEqual(saveData)
    expect(mockLoadInvoke).toHaveBeenCalledWith('note-123')

    const deleteSuccess = await storage.deleteNote('note-123')
    expect(deleteSuccess).toBe(true)
    expect(mockDeleteInvoke).toHaveBeenCalledWith('note-123')
  })

  it('should fall back to localStorage if Electron IPC throws an error', async () => {
    if (typeof window !== 'undefined') {
      ;(window as any).electron = {
        ipcRenderer: {
          invoke: vi.fn().mockRejectedValue(new Error('IPC Error'))
        }
      }
    }

    const data = { title: 'Fallback Note' }
    const success = await storage.saveNote('note-fail', data)
    expect(success).toBe(true)

    const loaded = await storage.loadNote('note-fail')
    expect(loaded).toEqual(data)

    const deleteSuccess = await storage.deleteNote('note-fail')
    expect(deleteSuccess).toBe(true)
  })
})
