import { describe, it, expect, beforeEach } from 'vitest'
import { HighlighterTool } from '@/lib/tools/highlighter-tool'

describe('HighlighterTool', () => {
  let highlighter: HighlighterTool

  beforeEach(() => {
    highlighter = new HighlighterTool()
  })

  describe('Properties', () => {
    it('should have default yellow color', () => {
      expect(highlighter.getColor()).toBe('#FFFF00')
    })

    it('should have default base width of 15', () => {
      expect(highlighter.getBaseWidth()).toBe(15)
    })

    it('should have default opacity of 0.4', () => {
      expect(highlighter.getOpacity()).toBe(0.4)
    })
  })

  describe('Stroke Creation', () => {
    it('should create stroke with semi-transparent properties', () => {
      const stroke = highlighter.createStroke()
      expect(stroke.color).toBe('#FFFF00')
      expect(stroke.width).toBe(15)
      expect(stroke.opacity).toBe(0.4)
    })

    it('should allow custom color and width', () => {
      highlighter.setColor('#00FF00')
      highlighter.setBaseWidth(20)
      highlighter.setOpacity(0.6)
      const stroke = highlighter.createStroke()
      expect(stroke.color).toBe('#00FF00')
      expect(stroke.width).toBe(20)
      expect(stroke.opacity).toBe(0.6)
      expect(highlighter.getOpacity()).toBe(0.6)
    })
  })
})
