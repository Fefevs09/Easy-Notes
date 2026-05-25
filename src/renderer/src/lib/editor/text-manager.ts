export type BlockType = 'paragraph' | 'bullet' | 'number' | 'todo'

export interface TextBlock {
  id: string
  type: BlockType
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  checked?: boolean
}

export class TextManager {
  private blocks: TextBlock[] = []

  constructor() {
    this.blocks = [
      {
        id: this.generateId(),
        type: 'paragraph',
        text: '',
        bold: false,
        italic: false,
        underline: false
      }
    ]
  }

  getBlocks(): TextBlock[] {
    return this.blocks
  }

  setBlocks(blocks: TextBlock[]) {
    this.blocks = blocks
  }

  addBlock(type: BlockType, text = '') {
    const newBlock: TextBlock = {
      id: this.generateId(),
      type,
      text,
      bold: false,
      italic: false,
      underline: false
    }

    if (type === 'todo') {
      newBlock.checked = false
    }

    this.blocks.push(newBlock)
  }

  removeBlock(id: string) {
    if (this.blocks.length > 1) {
      this.blocks = this.blocks.filter((b) => b.id !== id)
    } else {
      const block = this.blocks[0]
      if (block) {
        block.text = ''
        block.bold = false
        block.italic = false
        block.underline = false
        if (block.type === 'todo') {
          block.checked = false
        }
      }
    }
  }

  updateBlockText(id: string, text: string) {
    const block = this.blocks.find((b) => b.id === id)
    if (block) {
      block.text = text
    }
  }

  toggleBlockFormat(id: string, format: 'bold' | 'italic' | 'underline') {
    const block = this.blocks.find((b) => b.id === id)
    if (block) {
      block[format] = !block[format]
    }
  }

  toggleTodoCheck(id: string) {
    const block = this.blocks.find((b) => b.id === id)
    if (block && block.type === 'todo') {
      block.checked = !block.checked
    }
  }

  changeBlockType(id: string, type: BlockType) {
    const block = this.blocks.find((b) => b.id === id)
    if (block) {
      block.type = type
      if (type === 'todo') {
        block.checked = false
      } else {
        delete block.checked
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}
