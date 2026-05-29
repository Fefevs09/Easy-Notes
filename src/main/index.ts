import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Note Storage IPC handlers
  const fs = require('fs').promises
  const storageDir = join(app.getPath('userData'), 'easy-notes-storage')
  fs.mkdir(storageDir, { recursive: true }).catch((err) =>
    console.error('Failed to create storage dir:', err)
  )

  ipcMain.handle('save-note', async (_, noteId, content) => {
    try {
      const filePath = join(storageDir, `${noteId}.json`)
      await fs.writeFile(filePath, content, 'utf-8')
      return true
    } catch (err) {
      console.error('Failed to save note:', err)
      return false
    }
  })

  ipcMain.handle('read-note', async (_, noteId) => {
    try {
      const filePath = join(storageDir, `${noteId}.json`)
      return await fs.readFile(filePath, 'utf-8')
    } catch (err) {
      return null
    }
  })

  ipcMain.handle('delete-note', async (_, noteId) => {
    try {
      const filePath = join(storageDir, `${noteId}.json`)
      await fs.unlink(filePath)
      return true
    } catch (err) {
      return false
    }
  })

  // Obsidian-style Vault Storage IPC handlers
  ipcMain.handle('select-vault-directory', async () => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('scan-vault', async (_, vaultPath) => {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const items = await fs.readdir(vaultPath, { withFileTypes: true })

      const folders: any[] = []
      const notes: any[] = []

      for (const item of items) {
        if (item.isDirectory()) {
          // Skip hidden folders like .git, .obsidian
          if (item.name.startsWith('.')) continue

          const folderId = item.name.toLowerCase().replace(/\s+/g, '-')
          folders.push({
            id: folderId,
            name: item.name
          })

          // Scan subfolder for notes
          const subPath = path.join(vaultPath, item.name)
          const subItems = await fs.readdir(subPath, { withFileTypes: true })
          for (const subItem of subItems) {
            if (subItem.isFile() && subItem.name.endsWith('.md')) {
              const filePath = path.join(subPath, subItem.name)
              const rawContent = await fs.readFile(filePath, 'utf-8')
              const note = parseMarkdownToNote(rawContent, subItem.name, folderId)
              if (note) notes.push(note)
            }
          }
        } else if (item.isFile() && item.name.endsWith('.md')) {
          const filePath = path.join(vaultPath, item.name)
          const rawContent = await fs.readFile(filePath, 'utf-8')
          const note = parseMarkdownToNote(rawContent, item.name, 'all') // 'all' represents vault root
          if (note) notes.push(note)
        }
      }

      return { folders, notes }
    } catch (err) {
      console.error('Failed to scan vault:', err)
      return { folders: [], notes: [] }
    }
  })

  ipcMain.handle('save-note-file', async (_, vaultPath, folderName, fileName, noteDataJson) => {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const note = JSON.parse(noteDataJson)

      let targetDir = vaultPath
      if (folderName && folderName !== 'all') {
        // Find folder by ID if folderName is a slug, but for directory creation we should check if folderName needs to be resolved.
        // To be safe, we assume folderName represents the exact subfolder directory name.
        targetDir = path.join(vaultPath, folderName)
        await fs.mkdir(targetDir, { recursive: true })
      }

      const cleanFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`
      const filePath = path.join(targetDir, cleanFileName)
      const markdownContent = serializeNoteToMarkdown(note)

      await fs.writeFile(filePath, markdownContent, 'utf-8')
      return true
    } catch (err) {
      console.error('Failed to save note file:', err)
      return false
    }
  })

  ipcMain.handle('delete-note-file', async (_, vaultPath, folderName, fileName) => {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const targetDir =
        folderName && folderName !== 'all' ? path.join(vaultPath, folderName) : vaultPath
      const cleanFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`
      const filePath = path.join(targetDir, cleanFileName)
      await fs.unlink(filePath)
      return true
    } catch (err) {
      console.error('Failed to delete note file:', err)
      return false
    }
  })

  ipcMain.handle('create-folder-dir', async (_, vaultPath, folderName) => {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const dirPath = path.join(vaultPath, folderName)
      await fs.mkdir(dirPath, { recursive: true })
      return true
    } catch (err) {
      console.error('Failed to create folder directory:', err)
      return false
    }
  })

  ipcMain.handle('delete-folder-dir', async (_, vaultPath, folderName) => {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const dirPath = path.join(vaultPath, folderName)
      await fs.rm(dirPath, { recursive: true, force: true })
      return true
    } catch (err) {
      console.error('Failed to delete folder directory:', err)
      return false
    }
  })

  ipcMain.handle(
    'rename-file-or-dir',
    async (_, vaultPath, folderName, oldName, newName, isFolder) => {
      try {
        const fs = require('fs').promises
        const path = require('path')
        if (isFolder) {
          const oldPath = path.join(vaultPath, oldName)
          const newPath = path.join(vaultPath, newName)
          await fs.rename(oldPath, newPath)
        } else {
          const targetDir =
            folderName && folderName !== 'all' ? path.join(vaultPath, folderName) : vaultPath
          const oldPath = path.join(targetDir, oldName.endsWith('.md') ? oldName : `${oldName}.md`)
          const newPath = path.join(targetDir, newName.endsWith('.md') ? newName : `${newName}.md`)
          await fs.rename(oldPath, newPath)
        }
        return true
      } catch (err) {
        console.error('Failed to rename:', err)
        return false
      }
    }
  )

  ipcMain.handle('import-pdf-to-vault', async (_, vaultPath) => {
    try {
      const { dialog, BrowserWindow } = require('electron')
      const fs = require('fs').promises
      const path = require('path')

      const focusedWindow = BrowserWindow.getFocusedWindow()
      const result = await dialog.showOpenDialog(focusedWindow || undefined, {
        properties: ['openFile'],
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      const filePath = result.filePaths[0]
      const attachmentsDir = path.join(vaultPath, 'attachments')
      await fs.mkdir(attachmentsDir, { recursive: true })

      const originalName = path.basename(filePath)
      const cleanName = originalName.replace(/[\\/:*?"<>|]/g, '')
      let targetPath = path.join(attachmentsDir, cleanName)

      const fileExists = async (p: string) => {
        try {
          await fs.access(p)
          return true
        } catch {
          return false
        }
      }

      if (await fileExists(targetPath)) {
        const ext = path.extname(cleanName)
        const nameWithoutExt = path.basename(cleanName, ext)
        targetPath = path.join(attachmentsDir, `${nameWithoutExt}-${Date.now()}${ext}`)
      }

      await fs.copyFile(filePath, targetPath)

      return {
        relativePath: path.relative(vaultPath, targetPath),
        title: path.basename(targetPath, path.extname(targetPath))
      }
    } catch (err) {
      console.error('Failed to import PDF file:', err)
      return null
    }
  })

  ipcMain.handle('read-pdf-file', async (_, vaultPath, relativePath) => {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const absolutePath = path.join(vaultPath, relativePath)
      const buffer = await fs.readFile(absolutePath)
      return buffer
    } catch (err) {
      console.error('Failed to read PDF file:', err)
      return null
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Helper functions for parsing and serializing Obsidian-style Markdown notes

function parseMarkdownToNote(rawContent: string, fileName: string, folderId: string): any {
  const title = fileName.replace(/\.md$/, '')
  let id = 'note-' + Math.random().toString(36).substr(2, 9)
  let favorite = false
  let activePageId = ''
  let updatedAt = new Date().toISOString()
  let pages: any[] = []

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
    // Remove drawing block from body to get raw text
    body = body.replace(drawingMatch[0], '').trim()
  }

  // Set activePageId if empty
  if (!activePageId && pages.length > 0) {
    activePageId = pages[0].id
  }

  // Parse body markdown back to rich text blocks
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

function parseMarkdownToTextBlocks(md: string): any[] {
  const lines = md.split(/\r?\n\r?\n/)
  const blocks: any[] = []

  let idx = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('# ')) continue // skip title header

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

function serializeNoteToMarkdown(note: any): string {
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
  const textContent = serializeTextBlocksToMarkdown(note.content)

  const drawingBlock = [
    '```json {type: "easynotes-drawing"}',
    JSON.stringify(note.pages || [], null, 2),
    '```'
  ].join('\n')

  return yamlFrontmatter + titleHeader + textContent + drawingBlock
}

function serializeTextBlocksToMarkdown(blocksJson: string): string {
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
