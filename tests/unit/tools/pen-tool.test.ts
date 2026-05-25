import { describe, it, expect, beforeEach } from 'vitest'
import { PenTool } from '@/lib/tools/pen-tool'

describe('PenTool', () => {
  let penTool: PenTool

  beforeEach(() => {
    penTool = new PenTool()
  })

  describe('Pressure Detection', () => {
    it('should apply correct width with 50% pressure', () => {
      const stroke = penTool.createStroke(0.5)
      expect(stroke.width).toBe(2.5)
    })

    it('should apply correct width with 100% pressure', () => {
      const stroke = penTool.createStroke(1.0)
      expect(stroke.width).toBe(5)
    })

    it('should apply correct width with 0% pressure', () => {
      const stroke = penTool.createStroke(0)
      expect(stroke.width).toBe(0)
    })

    it('should handle pressure > 1', () => {
      const stroke = penTool.createStroke(1.5)
      expect(stroke.width).toBe(5)
    })

    it('should handle negative pressure', () => {
      const stroke = penTool.createStroke(-0.5)
      expect(stroke.width).toBe(0)
    })
  });

  describe('Color Application', () => {
    it('should use default black color', () => {
      const stroke = penTool.createStroke(0.5)
      expect(stroke.color).toBe('#000000')
      expect(penTool.getColor()).toBe('#000000')
    })

    it('should apply custom color', () => {
      penTool.setColor('#FF0000')
      const stroke = penTool.createStroke(0.5)
      expect(stroke.color).toBe('#FF0000')
      expect(penTool.getColor()).toBe('#FF0000')
    })
  })

  describe('Base Width Accessors', () => {
    it('should get default base width', () => {
      expect(penTool.getBaseWidth()).toBe(5)
    })

    it('should set and get custom base width', () => {
      penTool.setBaseWidth(12)
      expect(penTool.getBaseWidth()).toBe(12)
      const stroke = penTool.createStroke(1.0)
      expect(stroke.width).toBe(12)
    })
  })
})
