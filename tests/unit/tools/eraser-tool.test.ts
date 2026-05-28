import { describe, it, expect, beforeEach } from 'vitest'
import { EraserTool } from '@/lib/tools/eraser-tool'

describe('EraserTool', () => {
  let eraser: EraserTool

  beforeEach(() => {
    eraser = new EraserTool()
  })

  describe('Properties', () => {
    it('should have default base width of 20', () => {
      expect(eraser.getBaseWidth()).toBe(20)
    })

    it('should have default mode of stroke', () => {
      expect(eraser.getMode()).toBe('stroke')
    })
  })

  describe('Mode Selection', () => {
    it('should allow changing base width', () => {
      eraser.setBaseWidth(40)
      expect(eraser.getBaseWidth()).toBe(40)
    })

    it('should allow changing mode', () => {
      eraser.setMode('pixel')
      expect(eraser.getMode()).toBe('pixel')
    })
  })

  describe('Stroke Erasing Logic', () => {
    it('should remove target stroke by ID', () => {
      const strokes = [
        { id: '1', points: [] },
        { id: '2', points: [] },
        { id: '3', points: [] }
      ]
      const result = eraser.eraseStroke('2', strokes)
      expect(result).toHaveLength(2)
      expect(result.map((s) => s.id)).toEqual(['1', '3'])
    })

    it('should return same list if ID is not found', () => {
      const strokes = [{ id: '1', points: [] }]
      const result = eraser.eraseStroke('999', strokes)
      expect(result).toHaveLength(1)
    })
  })

  describe('Intersection Checking', () => {
    it('should detect intersection if point is within bounding box', () => {
      const stroke = {
        id: '1',
        bounds: { left: 10, top: 10, right: 50, bottom: 50 }
      }
      expect(eraser.checkIntersection({ x: 20, y: 20 }, stroke)).toBe(true)
    })

    it('should not detect intersection if point is outside bounding box', () => {
      const stroke = {
        id: '1',
        bounds: { left: 10, top: 10, right: 50, bottom: 50 }
      }
      expect(eraser.checkIntersection({ x: 100, y: 100 }, stroke)).toBe(false)
    })

    it('should return false if stroke has no bounds', () => {
      const stroke = {
        id: '1'
      }
      expect(eraser.checkIntersection({ x: 20, y: 20 }, stroke)).toBe(false)
    })
  })
})
