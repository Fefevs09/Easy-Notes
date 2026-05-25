export class NoteStorageManager {
  private hasElectron(): boolean {
    return (
      typeof window !== 'undefined' &&
      (window as any).electron !== undefined &&
      (window as any).electron.ipcRenderer !== undefined
    )
  }

  async saveNote(noteId: string, data: any): Promise<boolean> {
    const serialized = JSON.stringify(data)
    if (this.hasElectron()) {
      try {
        return await (window as any).electron.ipcRenderer.invoke('save-note', noteId, serialized)
      } catch (err) {
        console.error('Electron IPC save-note failed, falling back:', err)
      }
    }
    try {
      localStorage.setItem(`easynotes_note_${noteId}`, serialized)
      return true
    } catch (err) {
      console.error('localStorage setItem failed:', err)
      return false
    }
  }

  async loadNote(noteId: string): Promise<any | null> {
    if (this.hasElectron()) {
      try {
        const raw = await (window as any).electron.ipcRenderer.invoke('read-note', noteId)
        if (raw) {
          return JSON.parse(raw)
        }
      } catch (err) {
        console.error('Electron IPC read-note failed, falling back:', err)
      }
    }
    try {
      const raw = localStorage.getItem(`easynotes_note_${noteId}`)
      if (raw) {
        return JSON.parse(raw)
      }
      return null
    } catch (err) {
      console.error('localStorage getItem failed:', err)
      return null
    }
  }

  async deleteNote(noteId: string): Promise<boolean> {
    if (this.hasElectron()) {
      try {
        return await (window as any).electron.ipcRenderer.invoke('delete-note', noteId)
      } catch (err) {
        console.error('Electron IPC delete-note failed, falling back:', err)
      }
    }
    try {
      localStorage.removeItem(`easynotes_note_${noteId}`)
      return true
    } catch (err) {
      console.error('localStorage removeItem failed:', err)
      return false
    }
  }
}
