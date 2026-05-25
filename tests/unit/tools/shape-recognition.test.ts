import { describe, it, expect } from 'vitest'
import { detectShape } from '@/lib/tools/shape-tools'

describe('Auto-Shape Recognition', () => {
  it('should return unknown for empty or too few points', () => {
    expect(detectShape([])).toEqual({ type: 'unknown', confidence: 0 })
    expect(detectShape([{ x: 0, y: 0 }])).toEqual({ type: 'unknown', confidence: 0 })
  })

  it('should recognize a straight line', () => {
    // Generate perfectly straight points from (0,0) to (100,100)
    const points = []
    for (let i = 0; i <= 10; i++) {
      points.push({ x: i * 10, y: i * 10 })
    }
    const shape = detectShape(points)
    expect(shape.type).toBe('line')
    expect(shape.confidence).toBeGreaterThan(0.8)
  })

  it('should recognize a rough rectangle', () => {
    // Generate a 4-sided loop
    const points = [
      { x: 10, y: 10 },
      { x: 100, y: 10 },
      { x: 100, y: 100 },
      { x: 10, y: 100 },
      { x: 10, y: 12 } // Close enough to start
    ]
    const shape = detectShape(points)
    expect(shape.type).toBe('rect')
    expect(shape.confidence).toBeGreaterThan(0.7)
  })

  it('should recognize a rough triangle', () => {
    // Generate a 3-sided loop
    const points = [
      { x: 50, y: 10 },
      { x: 10, y: 90 },
      { x: 90, y: 90 },
      { x: 48, y: 12 } // Close enough to start
    ]
    const shape = detectShape(points)
    expect(shape.type).toBe('triangle')
    expect(shape.confidence).toBeGreaterThan(0.7)
  })

  it('should recognize a rough circle', () => {
    // Generate circular points
    const points = []
    const center = { x: 50, y: 50 }
    const radius = 40
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      points.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      })
    }
    const shape = detectShape(points)
    expect(shape.type).toBe('circle')
    expect(shape.confidence).toBeGreaterThan(0.7)
  })

  it('should handle identical points (diag === 0)', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 10 }
    ]
    expect(detectShape(points)).toEqual({ type: 'unknown', confidence: 0 })
  })

  it('should return unknown for wavy open lines', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
      { x: 10, y: 90 },
      { x: 100, y: 100 }
    ]
    const shape = detectShape(points)
    expect(shape.type).toBe('unknown')
  })

  it('should fall back to rect based on area ratio for smooth ovals', () => {
    const points = []
    const center = { x: 50, y: 50 }
    for (let i = 0; i <= 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      points.push({
        x: center.x + Math.cos(angle) * 45,
        y: center.y + Math.sin(angle) * 15
      })
    }
    const shape = detectShape(points)
    expect(shape.type).toBe('rect')
    expect(shape.confidence).toBe(0.75)
  })

  it('should fall back to triangle based on area ratio for smooth crescent shapes', () => {
    const points = []
    const center = { x: 50, y: 50 }
    for (let i = 0; i <= 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const radius = 10 + 35 * Math.abs(Math.sin(angle * 2))
      points.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      })
    }
    const shape = detectShape(points)
    expect(shape.type).toBe('triangle')
    expect(shape.confidence).toBe(0.75)
  })
})
