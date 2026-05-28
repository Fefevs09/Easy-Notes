import { describe, it, expect, beforeEach } from 'vitest'
import { KonvaManager } from '@/lib/canvas/konva-manager'

describe('KonvaManager', () => {
  let manager: KonvaManager

  beforeEach(() => {
    manager = new KonvaManager()
  })

  describe('State Management', () => {
    it('should have default black color and width of 3', () => {
      expect(manager.getColor()).toBe('#000000')
      expect(manager.getStrokeWidth()).toBe(3)
    })

    it('should set custom color and width', () => {
      manager.setColor('#FF0000')
      manager.setStrokeWidth(5)
      expect(manager.getColor()).toBe('#FF0000')
      expect(manager.getStrokeWidth()).toBe(5)
    })
  })

  describe('Shape Geometry Computations', () => {
    it('should normalize coordinates for a rectangle', () => {
      const start = { x: 50, y: 60 }
      const end = { x: 10, y: 10 }
      const rect = manager.computeRectGeometry(start, end)
      expect(rect).toEqual({
        x: 10,
        y: 10,
        width: 40,
        height: 50
      })
    })

    it('should calculate radius and center for a circle', () => {
      const start = { x: 10, y: 10 }
      const end = { x: 10, y: 20 }
      const circle = manager.computeCircleGeometry(start, end)
      expect(circle.radius).toBe(10)
      expect(circle.x).toBe(10)
      expect(circle.y).toBe(10)
    })

    it('should construct straight line endpoints', () => {
      const start = { x: 10, y: 20 }
      const end = { x: 100, y: 200 }
      const line = manager.computeLineGeometry(start, end)
      expect(line.points).toEqual([10, 20, 100, 200])
    })

    it('should calculate arrow points', () => {
      const start = { x: 10, y: 20 }
      const end = { x: 100, y: 200 }
      const arrow = manager.computeArrowGeometry(start, end)
      expect(arrow.points).toEqual([10, 20, 100, 200])
    })

    it('should calculate triangle geometry vertices', () => {
      const start = { x: 10, y: 10 }
      const end = { x: 50, y: 50 }
      const tri = manager.computeTriangleGeometry(start, end)
      expect(tri.points).toEqual([
        30,
        10, // top center
        10,
        50, // bottom left
        50,
        50 // bottom right
      ])
    })
  })
})
