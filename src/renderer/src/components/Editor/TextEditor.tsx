import React, { useEffect, useRef } from 'react'
import { TextManager, TextBlock, BlockType } from '../../lib/editor/text-manager'
import { Bold, Italic, Underline, List, CheckSquare, Type, Trash } from 'lucide-react'

interface TextEditorProps {
  note: any
  onContentChange: (text: string) => void
}

export default function TextEditor({ note, onContentChange }: TextEditorProps): React.JSX.Element {
  const textManager = useRef(new TextManager())
  const [blocks, setBlocks] = React.useState<TextBlock[]>([])

  // Initialize and load blocks from note content
  useEffect(() => {
    if (note) {
      if (note.content && note.content.startsWith('[')) {
        try {
          const parsed = JSON.parse(note.content)
          textManager.current.setBlocks(parsed)
        } catch (e) {
          // Content is raw text, convert to single paragraph block
          const singleBlock: TextBlock = {
            id: 'b-init',
            type: 'paragraph',
            text: note.content,
            bold: false,
            italic: false,
            underline: false
          }
          textManager.current.setBlocks([singleBlock])
        }
      } else {
        // Empty or raw content
        const singleBlock: TextBlock = {
          id: 'b-init',
          type: 'paragraph',
          text: note.content || '',
          bold: false,
          italic: false,
          underline: false
        }
        textManager.current.setBlocks([singleBlock])
      }
      setBlocks([...textManager.current.getBlocks()])
    }
  }, [note?.id])

  // Sync back to note store
  const syncContent = () => {
    const freshBlocks = textManager.current.getBlocks()
    setBlocks([...freshBlocks])
    onContentChange(JSON.stringify(freshBlocks))
  }

  const handleTextChange = (id: string, text: string) => {
    textManager.current.updateBlockText(id, text)
    syncContent()
  }

  const handleToggleFormat = (id: string, format: 'bold' | 'italic' | 'underline') => {
    textManager.current.toggleBlockFormat(id, format)
    syncContent()
  }

  const handleToggleCheck = (id: string) => {
    textManager.current.toggleTodoCheck(id)
    syncContent()
  }

  const handleChangeType = (id: string, type: BlockType) => {
    textManager.current.changeBlockType(id, type)
    syncContent()
  }

  const handleAddBlock = (type: BlockType) => {
    textManager.current.addBlock(type)
    syncContent()
  }

  const handleRemoveBlock = (id: string) => {
    textManager.current.removeBlock(id)
    syncContent()
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string, index: number, text: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Insert a block of the same type after current one
      const currentBlock = blocks[index]
      textManager.current.addBlock(currentBlock.type)
      syncContent()
    } else if (e.key === 'Backspace' && text === '' && blocks.length > 1) {
      e.preventDefault()
      textManager.current.removeBlock(id)
      syncContent()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl p-6 select-text overflow-y-auto space-y-4">
      {/* Editor Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/60 pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Editor de Texto Rico</span>
        
        {/* Quick Toolbar insert buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleAddBlock('paragraph')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Parágrafo"
          >
            <Type size={14} />
          </button>
          <button
            onClick={() => handleAddBlock('bullet')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Lista com Marcadores"
          >
            <List size={14} />
          </button>
          <button
            onClick={() => handleAddBlock('todo')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Lista de Tarefas"
          >
            <CheckSquare size={14} />
          </button>
        </div>
      </div>

      {/* Editor Blocks */}
      <div className="flex-1 space-y-3.5 pr-2">
        {blocks.map((block, index) => {
          return (
            <div key={block.id} className="group flex items-start gap-3 w-full">
              {/* Type Bullet / Numbers / Checkbox Indicators */}
              <div className="flex items-center justify-center h-6 pt-0.5">
                {block.type === 'bullet' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                )}
                {block.type === 'number' && (
                  <span className="text-xs font-semibold text-slate-400">{index + 1}.</span>
                )}
                {block.type === 'todo' && (
                  <input
                    type="checkbox"
                    checked={block.checked || false}
                    onChange={() => handleToggleCheck(block.id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-red-500 accent-red-400 cursor-pointer mt-1 focus:ring-red-400"
                  />
                )}
                {block.type === 'paragraph' && (
                  <div className="w-1.5" />
                )}
              </div>

              {/* Editable Text Area Input */}
              <div className="flex-1 flex flex-col space-y-1">
                <input
                  type="text"
                  value={block.text}
                  onChange={(e) => handleTextChange(block.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, block.id, index, block.text)}
                  placeholder="Escreva algo ou pressione Enter..."
                  className={`w-full bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-zinc-700 ${
                    block.bold ? 'font-bold' : 'font-normal'
                  } ${block.italic ? 'italic' : 'not-italic'} ${
                    block.underline ? 'underline' : 'no-underline'
                  } ${block.type === 'todo' && block.checked ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}
                />

                {/* Inline Action Bar (visible on hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-slate-400 text-xxs pt-1">
                  
                  {/* Formattings toggles */}
                  <button
                    onClick={() => handleToggleFormat(block.id, 'bold')}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                      block.bold ? 'text-red-400 bg-red-400/10' : ''
                    }`}
                  >
                    <Bold size={11} />
                  </button>
                  <button
                    onClick={() => handleToggleFormat(block.id, 'italic')}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                      block.italic ? 'text-red-400 bg-red-400/10' : ''
                    }`}
                  >
                    <Italic size={11} />
                  </button>
                  <button
                    onClick={() => handleToggleFormat(block.id, 'underline')}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                      block.underline ? 'text-red-400 bg-red-400/10' : ''
                    }`}
                  >
                    <Underline size={11} />
                  </button>

                  <div className="w-px h-3 bg-slate-200 dark:bg-zinc-800 mx-1" />

                  {/* Block style converters */}
                  <button
                    onClick={() => handleChangeType(block.id, 'paragraph')}
                    className={`px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                      block.type === 'paragraph' ? 'text-red-400 bg-red-400/10 font-bold' : ''
                    }`}
                  >
                    T
                  </button>
                  <button
                    onClick={() => handleChangeType(block.id, 'bullet')}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                      block.type === 'bullet' ? 'text-red-400 bg-red-400/10' : ''
                    }`}
                  >
                    <List size={11} />
                  </button>
                  <button
                    onClick={() => handleChangeType(block.id, 'todo')}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                      block.type === 'todo' ? 'text-red-400 bg-red-400/10' : ''
                    }`}
                  >
                    <CheckSquare size={11} />
                  </button>

                  <div className="w-px h-3 bg-slate-200 dark:bg-zinc-800 mx-1" />

                  {/* Trash delete block */}
                  <button
                    onClick={() => handleRemoveBlock(block.id)}
                    className="p-1 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    title="Excluir Bloco"
                  >
                    <Trash size={11} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
