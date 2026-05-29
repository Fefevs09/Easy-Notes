import { describe, it, expect } from 'vitest'
import {
  serializeNoteToMarkdown,
  parseMarkdownToNote,
  Note
} from '../../../src/renderer/src/lib/storage/note-serializer'


describe('Note Serializer / Parser (Obsidian-Style)', () => {
  it('should serialize a Note object into correct Markdown structure', () => {
    const note: Note = {
      id: 'note-test-123',
      title: 'Minha Incrível Nota',
      activePageId: 'page-1',
      folderId: 'all',
      favorite: true,
      updatedAt: '2026-05-29T12:00:00.000Z',
      pages: [
        {
          id: 'page-1',
          strokes: [
            {
              id: 's1',
              tool: 'pen',
              points: [{ x: 10, y: 10, p: 0.5 }],
              color: '#000',
              width: 2,
              opacity: 1
            }
          ],
          shapes: []
        }
      ],
      content: JSON.stringify([
        {
          id: 'b1',
          type: 'paragraph',
          text: 'Olá Mundo!',
          bold: true,
          italic: false,
          underline: false
        }
      ])
    }

    const markdown = serializeNoteToMarkdown(note)

    // Check YAML Frontmatter
    expect(markdown).toContain('---')
    expect(markdown).toContain('id: note-test-123')
    expect(markdown).toContain('favorite: true')
    expect(markdown).toContain('activePageId: page-1')
    expect(markdown).toContain('updatedAt: 2026-05-29T12:00:00.000Z')

    // Check Header Title
    expect(markdown).toContain('# Minha Incrível Nota')

    // Check Rich Text content converted to Markdown
    expect(markdown).toContain('**Olá Mundo!**')

    // Check Drawing Code Block
    expect(markdown).toContain('```json {type: "easynotes-drawing"}')
    expect(markdown).toContain('page-1')
    expect(markdown).toContain('s1')
  })

  it('should parse a serialized Markdown string back to a valid Note object', () => {
    const rawMarkdown = `---
id: note-parsed-999
favorite: true
activePageId: page-xyz
updatedAt: 2026-05-29T15:30:00.000Z
---

# Uma Nota de Exemplo

Este é um parágrafo de texto rico.

- Um item de lista

- [ ] Uma tarefa pendente

\`\`\`json {type: "easynotes-drawing"}
[
  {
    "id": "page-xyz",
    "strokes": [],
    "shapes": []
  }
]
\`\`\`
`

    const parsedNote = parseMarkdownToNote(rawMarkdown, 'Uma Nota de Exemplo.md', 'pasta-trabalho')

    expect(parsedNote.id).toBe('note-parsed-999')
    expect(parsedNote.title).toBe('Uma Nota de Exemplo')
    expect(parsedNote.favorite).toBe(true)
    expect(parsedNote.activePageId).toBe('page-xyz')
    expect(parsedNote.folderId).toBe('pasta-trabalho')
    expect(parsedNote.updatedAt).toBe('2026-05-29T15:30:00.000Z')

    // Drawing Canvas pages should match
    expect(parsedNote.pages.length).toBe(1)
    expect(parsedNote.pages[0].id).toBe('page-xyz')

    // Verify parsed Text Blocks
    const blocks = JSON.parse(parsedNote.content || '[]')
    expect(blocks.length).toBe(3)

    expect(blocks[0].type).toBe('paragraph')
    expect(blocks[0].text).toBe('Este é um parágrafo de texto rico.')

    expect(blocks[1].type).toBe('bullet')
    expect(blocks[1].text).toBe('Um item de lista')

    expect(blocks[2].type).toBe('todo')
    expect(blocks[2].text).toBe('Uma tarefa pendente')
    expect(blocks[2].checked).toBe(false)
  })

  it('should parse markdown formatted bold, italic, and underline text', () => {
    const rawMarkdown = `---
id: note-formats
favorite: false
activePageId: page-1
updatedAt: 2026-05-29T12:00:00.000Z
---

# Titulo

**Texto Negrito**

*Texto Italico*

<u>Texto Sublinhado</u>
`

    const note = parseMarkdownToNote(rawMarkdown, 'Titulo.md', 'all')
    const blocks = JSON.parse(note.content || '[]')

    expect(blocks.length).toBe(3)
    expect(blocks[0].bold).toBe(true)
    expect(blocks[0].text).toBe('Texto Negrito')

    expect(blocks[1].italic).toBe(true)
    expect(blocks[1].text).toBe('Texto Italico')

    expect(blocks[2].underline).toBe(true)
    expect(blocks[2].text).toBe('Texto Sublinhado')
  })
})
