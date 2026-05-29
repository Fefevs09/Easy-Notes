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
  content?: string
}

/**
 * Serializes a note object into an Obsidian-compatible Markdown string.
 */
export function serializeNoteToMarkdown(note: Note): string {
  const yamlFrontmatter = [
    '---',
    `id: ${note.id}`,
    `favorite: ${note.favorite}`,
    `activePageId: ${note.activePageId}`,
    `updatedAt: ${note.updatedAt}`,
    '---',
    ''
  ].join('\n')

  const titleHeader = `# ${note.title}\n\n`
  const textContent = serializeTextBlocksToMarkdown(note.content || '')

  const drawingBlock = [
    '```json {type: "easynotes-drawing"}',
    JSON.stringify(note.pages || [], null, 2),
    '```'
  ].join('\n')

  return yamlFrontmatter + titleHeader + textContent + drawingBlock
}

/**
 * Parses an Obsidian-style Markdown note string back into a full Note object.
 */
export function parseMarkdownToNote(rawContent: string, fileName: string, folderId: string): Note {
  const title = fileName.replace(/\.md$/, '')
  let id = 'note-' + Math.random().toString(36).substr(2, 9)
  let favorite = false
  let activePageId = ''
  let updatedAt = new Date().toISOString()
  let pages: NotePage[] = []

  // Simple frontmatter parser
  const frontmatterMatch = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  let body = rawContent
  if (frontmatterMatch) {
    body = rawContent.substring(frontmatterMatch[0].length).trim()
    const fmLines = frontmatterMatch[1].split(/\r?\n/)
    for (const line of fmLines) {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const val = parts.slice(1).join(':').trim()
        if (key === 'id') id = val
        else if (key === 'favorite') favorite = val === 'true'
        else if (key === 'activePageId') activePageId = val
        else if (key === 'updatedAt') updatedAt = val
      }
    }
  }

  // Find custom drawing code block: ```json {type: "easynotes-drawing"} ... ```
  const drawingMatch = body.match(
    /```json\s+\{type:\s*"easynotes-drawing"\}\r?\n([\s\S]*?)\r?\n```/
  )
  if (drawingMatch) {
    try {
      pages = JSON.parse(drawingMatch[1].trim())
    } catch (e) {
      console.error('Failed to parse pages JSON block:', e)
    }
    body = body.replace(drawingMatch[0], '').trim()
  }

  if (!activePageId && pages.length > 0) {
    activePageId = pages[0].id
  }

  const richBlocks = parseMarkdownToTextBlocks(body)
  const contentBlocksJson = JSON.stringify(richBlocks)

  return {
    id,
    title,
    pages,
    activePageId,
    folderId,
    favorite,
    updatedAt,
    content: contentBlocksJson
  }
}

/**
 * Helpers for converting TextBlocks JSON string to human-readable Markdown
 */
export function serializeTextBlocksToMarkdown(blocksJson: string): string {
  try {
    if (!blocksJson) return '\n'
    const blocks = JSON.parse(blocksJson)
    if (!Array.isArray(blocks)) return blocksJson + '\n\n'
    return (
      blocks
        .map((block: any) => {
          let text = block.text || ''
          if (block.bold) text = `**${text}**`
          if (block.italic) text = `*${text}*`
          if (block.underline) text = `<u>${text}</u>`

          if (block.type === 'bullet') return `- ${text}`
          if (block.type === 'todo') return `- [${block.checked ? 'x' : ' '}] ${text}`
          return text
        })
        .join('\n\n') + '\n\n'
    )
  } catch (e) {
    return (blocksJson || '') + '\n\n'
  }
}

/**
 * Helpers for converting Markdown body to TextBlocks array
 */
export function parseMarkdownToTextBlocks(md: string): any[] {
  const lines = md.split(/\r?\n\r?\n/)
  const blocks: any[] = []

  let idx = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('# ')) continue // Skip title header

    let type: 'paragraph' | 'bullet' | 'todo' = 'paragraph'
    let text = trimmed
    let checked = false

    if (trimmed.startsWith('- [ ] ')) {
      type = 'todo'
      text = trimmed.substring(6)
      checked = false
    } else if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
      type = 'todo'
      text = trimmed.substring(6)
      checked = true
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      type = 'bullet'
      text = trimmed.substring(2)
    }

    let bold = false
    let italic = false
    let underline = false

    if (text.startsWith('**') && text.endsWith('**')) {
      bold = true
      text = text.substring(2, text.length - 2)
    }
    if (text.startsWith('*') && text.endsWith('*')) {
      italic = true
      text = text.substring(1, text.length - 1)
    }
    if (text.startsWith('<u>') && text.endsWith('</u>')) {
      underline = true
      text = text.substring(3, text.length - 4)
    }

    blocks.push({
      id: `b-${idx++}`,
      type,
      text,
      bold,
      italic,
      underline,
      checked
    })
  }

  if (blocks.length === 0) {
    blocks.push({
      id: 'b-init',
      type: 'paragraph',
      text: '',
      bold: false,
      italic: false,
      underline: false
    })
  }

  return blocks
}
