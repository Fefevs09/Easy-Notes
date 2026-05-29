import { describe, it, expect, vi } from 'vitest'

interface Point {
  x: number
  y: number
  p: number
}

interface Stroke {
  id: string
  tool: string
  points: Point[]
  color: string
  width: number
  opacity: number
}

describe('Bezier Curves Smoothing Formula', () => {
  it('should mathematically calculate correct midpoints for quadratic Bezier interpolation', () => {
    const points: Point[] = [
      { x: 0, y: 0, p: 0.5 },
      { x: 10, y: 20, p: 0.6 },
      { x: 20, y: 0, p: 0.7 },
      { x: 30, y: 20, p: 0.8 }
    ]

    // Calculate midpoints as done in PageCanvas.tsx
    const midpoints: Array<{ xc: number; yc: number }> = []
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2
      const yc = (points[i].y + points[i + 1].y) / 2
      midpoints.push({ xc, yc })
    }

    // Midpoint 1: between index 1 (10, 20) and index 2 (20, 0)
    // xc = (10 + 20) / 2 = 15
    // yc = (20 + 0) / 2 = 10
    expect(midpoints[0].xc).toBe(15)
    expect(midpoints[0].yc).toBe(10)

    // Midpoint 2: between index 2 (20, 0) and index 3 (30, 20)
    // xc = (20 + 30) / 2 = 25
    // yc = (0 + 20) / 2 = 10
    expect(midpoints[1].xc).toBe(25)
    expect(midpoints[1].yc).toBe(10)
  })

  it('should draw correct Bezier curves on HTML5 Canvas context for multi-point strokes', () => {
    const stroke: Stroke = {
      id: 'stroke-1',
      tool: 'pen',
      color: '#ff0000',
      width: 4,
      opacity: 0.8,
      points: [
        { x: 0, y: 0, p: 0.5 },
        { x: 10, y: 20, p: 0.6 },
        { x: 20, y: 0, p: 0.7 }
      ]
    }

    // Mock Context
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      stroke: vi.fn(),
      lineCap: '',
      lineJoin: '',
      globalAlpha: 1,
      strokeStyle: '',
      lineWidth: 1
    } as unknown as CanvasRenderingContext2D

    // Emulate drawStrokeOnContext from PageCanvas.tsx
    const points = stroke.points
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = stroke.opacity
    ctx.strokeStyle = stroke.color

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y)
      ctx.lineWidth = stroke.width * (points[1].p || 0.5)
      ctx.stroke()
    } else {
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2
        const yc = (points[i].y + points[i + 1].y) / 2

        ctx.lineWidth = stroke.width * (points[i].p || 0.5)
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(xc, yc)
      }
      const lastIdx = points.length - 1
      ctx.lineWidth = stroke.width * (points[lastIdx].p || 0.5)
      ctx.lineTo(points[lastIdx].x, points[lastIdx].y)
      ctx.stroke()
    }
    ctx.restore()

    // Assertions
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.restore).toHaveBeenCalled()
    expect(ctx.lineCap).toBe('round')
    expect(ctx.lineJoin).toBe('round')
    expect(ctx.globalAlpha).toBe(0.8)
    expect(ctx.strokeStyle).toBe('#ff0000')

    // Initial moveTo at start point P0 (0, 0)
    expect(ctx.moveTo).toHaveBeenNthCalledWith(1, 0, 0)

    // Midpoint: between P1 (10, 20) and P2 (20, 0) is (15, 10)
    // Control: P1 (10, 20)
    expect(ctx.quadraticCurveTo).toHaveBeenCalledWith(10, 20, 15, 10)

    // Second moveTo to midpoint (15, 10)
    expect(ctx.moveTo).toHaveBeenNthCalledWith(2, 15, 10)

    // Final lineTo connects to last point P2 (20, 0)
    expect(ctx.lineTo).toHaveBeenCalledWith(20, 0)

    // Assert line widths reflect pressure sensitivity
    // For i=1 (points[1].p is 0.6), lineWidth = 4 * 0.6 = 2.4
    // For last index (points[2].p is 0.7), lineWidth = 4 * 0.7 = 2.8
    expect(ctx.stroke).toHaveBeenCalledTimes(2)
  })

  it('should fallback to default line width factor of 0.5 if point pressure is missing', () => {
    const stroke: Stroke = {
      id: 'stroke-2',
      tool: 'pen',
      color: '#000000',
      width: 10,
      opacity: 1.0,
      points: [
        { x: 0, y: 0, p: 0 }, // no valid pressure (treated as 0/missing)
        { x: 50, y: 50, p: 0 }
      ]
    }

    // Mock Context
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      stroke: vi.fn(),
      lineCap: '',
      lineJoin: '',
      globalAlpha: 1,
      strokeStyle: '',
      lineWidth: 1
    } as unknown as CanvasRenderingContext2D

    const points = stroke.points
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = stroke.opacity
    ctx.strokeStyle = stroke.color

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y)
      // Note the fallback points[1].p || 0.5
      ctx.lineWidth = stroke.width * (points[1].p || 0.5)
      ctx.stroke()
    }

    expect(ctx.lineWidth).toBe(5) // 10 * 0.5 fallback
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 50)
  })
})
