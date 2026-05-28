import { describe, it, expect, beforeEach } from 'vitest'
import { TextManager } from '@/lib/editor/text-manager'

describe('TextManager', () => {
  let manager: TextManager

  beforeEach(() => {
    manager = new TextManager()
  })

  it('should initialize with a single empty paragraph block', () => {
    const blocks = manager.getBlocks()
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('paragraph')
    expect(blocks[0].text).toBe('')
  })

  it('should add a new block', () => {
    manager.addBlock('bullet', 'List Item 1')
    const blocks = manager.getBlocks()
    expect(blocks).toHaveLength(2)
    expect(blocks[1].type).toBe('bullet')
    expect(blocks[1].text).toBe('List Item 1')
  })

  it('should remove a block by ID', () => {
    manager.addBlock('paragraph', 'Second Block')
    const secondBlockId = manager.getBlocks()[1].id
    manager.removeBlock(secondBlockId)
    expect(manager.getBlocks()).toHaveLength(1)
  })

  it('should update block text', () => {
    const firstBlockId = manager.getBlocks()[0].id
    manager.updateBlockText(firstBlockId, 'Hello World')
    expect(manager.getBlocks()[0].text).toBe('Hello World')
  })

  it('should toggle format style (bold, italic, underline)', () => {
    const firstBlockId = manager.getBlocks()[0].id
    manager.toggleBlockFormat(firstBlockId, 'bold')
    expect(manager.getBlocks()[0].bold).toBe(true)

    manager.toggleBlockFormat(firstBlockId, 'bold')
    expect(manager.getBlocks()[0].bold).toBe(false)
  })

  it('should toggle checkbox state for todo checklist blocks', () => {
    manager.addBlock('todo', 'Buy groceries')
    const todoId = manager.getBlocks()[1].id
    expect(manager.getBlocks()[1].checked).toBe(false)

    manager.toggleTodoCheck(todoId)
    expect(manager.getBlocks()[1].checked).toBe(true)
  })

  it('should ignore todo checklist toggle on paragraph blocks', () => {
    const firstBlockId = manager.getBlocks()[0].id
    manager.toggleTodoCheck(firstBlockId)
    expect(manager.getBlocks()[0].checked).toBeUndefined()
  })

  it('should change block type', () => {
    const firstBlockId = manager.getBlocks()[0].id
    manager.changeBlockType(firstBlockId, 'todo')
    expect(manager.getBlocks()[0].type).toBe('todo')
    expect(manager.getBlocks()[0].checked).toBe(false)

    manager.changeBlockType(firstBlockId, 'paragraph')
    expect(manager.getBlocks()[0].type).toBe('paragraph')
    expect(manager.getBlocks()[0].checked).toBeUndefined()
  })

  it('should allow setting block array directly', () => {
    const customBlocks = [
      {
        id: '99',
        type: 'paragraph' as const,
        text: 'Custom',
        bold: false,
        italic: false,
        underline: false
      }
    ]
    manager.setBlocks(customBlocks)
    expect(manager.getBlocks()).toHaveLength(1)
    expect(manager.getBlocks()[0].text).toBe('Custom')
  })

  it('should reset single remaining block if removeBlock is called', () => {
    const firstBlock = manager.getBlocks()[0]
    manager.updateBlockText(firstBlock.id, 'Text')
    manager.toggleBlockFormat(firstBlock.id, 'bold')
    manager.changeBlockType(firstBlock.id, 'todo')

    manager.removeBlock(firstBlock.id)

    expect(manager.getBlocks()).toHaveLength(1)
    expect(manager.getBlocks()[0].text).toBe('')
    expect(manager.getBlocks()[0].bold).toBe(false)
    expect(manager.getBlocks()[0].checked).toBe(false)
  })

  it('should safely ignore editing non-existent block IDs', () => {
    manager.updateBlockText('invalid-id', 'test')
    manager.toggleBlockFormat('invalid-id', 'bold')
    manager.toggleTodoCheck('invalid-id')
    manager.changeBlockType('invalid-id', 'todo')
    // No error, safe return
  })
})
