import { describe, it, expect } from 'vitest'
import { simplifyStrokePoints } from '../../../src/renderer/src/lib/tools/stroke-simplifier'

describe('Stroke Simplifier (RDP Point Compression)', () => {
  it('should return points unchanged if length is 2 or less', () => {
    const singlePoint = [{ x: 10, y: 10, p: 0.5 }]
    expect(simplifyStrokePoints(singlePoint)).toEqual(singlePoint)

    const twoPoints = [
      { x: 10, y: 10, p: 0.5 },
      { x: 20, y: 20, p: 0.6 }
    ]
    expect(simplifyStrokePoints(twoPoints)).toEqual(twoPoints)
  })

  it('should simplify collinear points perfectly', () => {
    // 5 points in a perfect straight line: (0,0), (1,1), (2,2), (3,3), (4,4)
    // Only start (0,0) and end (4,4) are needed. Intermediate ones should be compressed.
    const collinearPoints = [
      { x: 0, y: 0, p: 0.5 },
      { x: 1, y: 1, p: 0.5 },
      { x: 2, y: 2, p: 0.5 },
      { x: 3, y: 3, p: 0.5 },
      { x: 4, y: 4, p: 0.5 }
    ]

    const simplified = simplifyStrokePoints(collinearPoints, 0.5)

    expect(simplified.length).toBe(2)
    expect(simplified[0]).toEqual(collinearPoints[0])
    expect(simplified[1]).toEqual(collinearPoints[4])
  })

  it('should retain sharp corners/turns that exceed tolerance', () => {
    // A sharp turn: (0,0) -> (10,0) -> (10,10)
    // Point (10,0) is far from the line connecting (0,0) and (10,10), so it must be kept.
    const sharpCorner = [
      { x: 0, y: 0, p: 0.5 },
      { x: 5, y: 0, p: 0.5 },
      { x: 10, y: 0, p: 0.5 }, // Corner
      { x: 10, y: 5, p: 0.5 },
      { x: 10, y: 10, p: 0.5 }
    ]

    const simplified = simplifyStrokePoints(sharpCorner, 1.0)

    expect(simplified.length).toBe(3)
    expect(simplified[0]).toEqual(sharpCorner[0])
    expect(simplified[1]).toEqual(sharpCorner[2]) // Corner preserved
    expect(simplified[2]).toEqual(sharpCorner[4])
  })
})
