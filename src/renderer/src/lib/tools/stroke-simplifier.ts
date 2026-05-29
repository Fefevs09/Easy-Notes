interface Point {
  x: number
  y: number
  p: number // pressure
}

// Helper to calculate squared distance from point to segment
function getSqSegDist(p: Point, p1: Point, p2: Point): number {
  let x = p1.x
  let y = p1.y
  let dx = p2.x - x
  let dy = p2.y - y

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy)
    if (t > 1) {
      x = p2.x
      y = p2.y
    } else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }

  dx = p.x - x
  dy = p.y - y

  return dx * dx + dy * dy
}

// Recursive step of RDP algorithm
function simplifyDPStep(
  points: Point[],
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Point[]
): void {
  let maxSqDist = sqTolerance
  let index = -1

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last])
    if (sqDist > maxSqDist) {
      index = i
      maxSqDist = sqDist
    }
  }

  if (index !== -1) {
    simplifyDPStep(points, first, index, sqTolerance, simplified)
    simplified.push(points[index])
    simplifyDPStep(points, index, last, sqTolerance, simplified)
  }
}

/**
 * Simplifies a polyline curve using the Ramer-Douglas-Peucker (RDP) algorithm.
 * Removes redundant points that lie close to line segments within a given tolerance.
 */
export function simplifyStrokePoints(points: Point[], tolerance = 1.0): Point[] {
  if (points.length <= 2) return points

  const sqTolerance = tolerance * tolerance
  const last = points.length - 1
  const simplified: Point[] = [points[0]]

  simplifyDPStep(points, 0, last, sqTolerance, simplified)
  simplified.push(points[last])

  return simplified
}
