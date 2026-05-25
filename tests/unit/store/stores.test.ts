import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '@/store/canvas-store'
import { useNotesStore } from '@/store/notes-store'
import { useUiStore } from '@/store/ui-store'

describe('CanvasStore State Management', () => {
  beforeEach(() => {
    // Reset stores to default state
    useCanvasStore.setState({
      activeTool: 'pen',
      color: '#000000',
      strokeWidth: 5,
      opacity: 1,
      pressureCurve: 'linear',
      isAutoShapeEnabled: false,
      zoom: 1.0
    })
  })

  it('should have default states', () => {
    const state = useCanvasStore.getState()
    expect(state.activeTool).toBe('pen')
    expect(state.color).toBe('#000000')
    expect(state.strokeWidth).toBe(5)
    expect(state.zoom).toBe(1.0)
  })

  it('should allow tool selection and property updates', () => {
    useCanvasStore.getState().setActiveTool('highlighter')
    useCanvasStore.getState().setColor('#FFFF00')
    useCanvasStore.getState().setStrokeWidth(15)
    useCanvasStore.getState().setOpacity(0.4)
    useCanvasStore.getState().setPressureCurve('soft')

    const state = useCanvasStore.getState()
    expect(state.activeTool).toBe('highlighter')
    expect(state.color).toBe('#FFFF00')
    expect(state.strokeWidth).toBe(15)
    expect(state.opacity).toBe(0.4)
    expect(state.pressureCurve).toBe('soft')
  })

  it('should toggle auto shape recognition', () => {
    useCanvasStore.getState().setAutoShapeEnabled(true)
    expect(useCanvasStore.getState().isAutoShapeEnabled).toBe(true)
  })

  it('should update and constrain zoom levels', () => {
    useCanvasStore.getState().setZoom(1.5)
    expect(useCanvasStore.getState().zoom).toBe(1.5)

    useCanvasStore.getState().setZoom(4.0) // should cap at 3.0
    expect(useCanvasStore.getState().zoom).toBe(3.0)

    useCanvasStore.getState().setZoom(0.2) // should floor at 0.5
    expect(useCanvasStore.getState().zoom).toBe(0.5)
  })
})

describe('UIStore State Management', () => {
  beforeEach(() => {
    useUiStore.setState({
      isSidebarOpen: true,
      theme: 'light',
      activeFolderId: 'all'
    })
  })

  it('should have default state', () => {
    const state = useUiStore.getState()
    expect(state.isSidebarOpen).toBe(true)
    expect(state.theme).toBe('light')
  })

  it('should toggle sidebar and change active folder', () => {
    useUiStore.getState().toggleSidebar()
    useUiStore.getState().setActiveFolderId('folder-1')
    useUiStore.getState().setTheme('dark')

    const state = useUiStore.getState()
    expect(state.isSidebarOpen).toBe(false)
    expect(state.activeFolderId).toBe('folder-1')
    expect(state.theme).toBe('dark')
  })
})

describe('NotesStore State Management', () => {
  beforeEach(() => {
    useNotesStore.setState({
      notes: [],
      folders: [
        { id: 'all', name: 'All Notes' },
        { id: 'favorites', name: 'Favorites' }
      ],
      activeNoteId: null,
      searchQuery: ''
    })
  })

  it('should allow setting search query and active note ID', () => {
    useNotesStore.getState().setSearchQuery('filter-text')
    useNotesStore.getState().setActiveNoteId('some-note-id')
    expect(useNotesStore.getState().searchQuery).toBe('filter-text')
    expect(useNotesStore.getState().activeNoteId).toBe('some-note-id')
  })

  it('should allow creating a folder', () => {
    useNotesStore.getState().addFolder('Personal')
    const folders = useNotesStore.getState().folders
    expect(folders).toHaveLength(3)
    expect(folders[2].name).toBe('Personal')
  })

  it('should allow creating notes', () => {
    useNotesStore.getState().addNote('Test Note', 'all')
    const notes = useNotesStore.getState().notes
    expect(notes).toHaveLength(1)
    expect(notes[0].title).toBe('Test Note')
    expect(notes[0].folderId).toBe('all')
  })

  it('should allow editing a note title and content', () => {
    useNotesStore.getState().addNote('Test Note', 'all')
    const noteId = useNotesStore.getState().notes[0].id
    
    useNotesStore.getState().updateNote(noteId, { title: 'Updated Title', content: 'Some content text' })
    useNotesStore.getState().updateNote('invalid-id', { title: 'No effect' }) // hit falsy branch
    
    const note = useNotesStore.getState().notes[0]
    expect(note.title).toBe('Updated Title')
    expect(note.content).toBe('Some content text')
  })

  it('should allow deleting a note', () => {
    useNotesStore.getState().addNote('Test Note 1', 'all')
    useNotesStore.getState().addNote('Test Note 2', 'all')
    const note1Id = useNotesStore.getState().notes[1].id
    const note2Id = useNotesStore.getState().notes[0].id
    
    // Set active note to note 2
    useNotesStore.getState().setActiveNoteId(note2Id)
    
    // Delete note 1 (which is not active)
    useNotesStore.getState().deleteNote(note1Id)
    expect(useNotesStore.getState().notes).toHaveLength(1)
    expect(useNotesStore.getState().activeNoteId).toBe(note2Id) // active note unchanged
  })

  it('should support toggle favorite note', () => {
    useNotesStore.getState().addNote('Test Note', 'all')
    const noteId = useNotesStore.getState().notes[0].id

    useNotesStore.getState().toggleFavorite(noteId)
    useNotesStore.getState().toggleFavorite('invalid-id') // hit falsy branch
    expect(useNotesStore.getState().notes[0].favorite).toBe(true)

    useNotesStore.getState().toggleFavorite(noteId)
    expect(useNotesStore.getState().notes[0].favorite).toBe(false)
  })
})
