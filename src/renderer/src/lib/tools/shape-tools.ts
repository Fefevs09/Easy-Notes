interface Point {
  x: number
  y: number
}

export function detectShape(points: Point[]): {
  type: 'line' | 'rect' | 'circle' | 'triangle' | 'unknown'
  confidence: number
} {
  if (!points || points.length < 3) {
    return { type: 'unknown', confidence: 0 }
  }

  const start = points[0]
  const end = points[points.length - 1]

  // Calculate bounding box
  let minX = Infinity,
    maxX = -Infinity
  let minY = Infinity,
    maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

  const w = maxX - minX
  const h = maxY - minY
  const diag = Math.sqrt(w * w + h * h)

  if (diag === 0) {
    return { type: 'unknown', confidence: 0 }
  }

  // Check straight line (open shape)
  let pathLength = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    pathLength += Math.sqrt(dx * dx + dy * dy)
  }

  const startEndDist = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2)
  const straightness = pathLength > 0 ? startEndDist / pathLength : 0

  if (straightness > 0.85 && startEndDist > 0.5 * diag) {
    return { type: 'line', confidence: straightness }
  }

  // Closed shapes: start and end are close
  const isClosed = startEndDist < 0.25 * diag

  if (isClosed) {
    // Analyze distance from centroid to classify circle vs polygon
    const centroidX = points.reduce((sum, p) => sum + p.x, 0) / points.length
    const centroidY = points.reduce((sum, p) => sum + p.y, 0) / points.length

    const dists = points.map((p) => Math.sqrt((p.x - centroidX) ** 2 + (p.y - centroidY) ** 2))
    const avgDist = dists.reduce((sum, d) => sum + d, 0) / dists.length

    const variance = dists.reduce((sum, d) => sum + (d - avgDist) ** 2, 0) / dists.length
    const stdDev = Math.sqrt(variance)
    const cv = avgDist > 0 ? stdDev / avgDist : 1

    if (cv < 0.12) {
      return { type: 'circle', confidence: 1 - cv }
    }

    // Count sharp angles (corners)
    let corners = 0
    const thresholdAngle = 40 * (Math.PI / 180)

    for (let i = 1; i < points.length - 1; i++) {
      const v1 = { x: points[i].x - points[i - 1].x, y: points[i].y - points[i - 1].y }
      const v2 = { x: points[i + 1].x - points[i].x, y: points[i + 1].y - points[i].y }

      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

      if (len1 > 0 && len2 > 0) {
        const dot = v1.x * v2.x + v1.y * v2.y
        const cos = dot / (len1 * len2)
        const angle = Math.acos(Math.max(-1, Math.min(1, cos)))
        if (angle > thresholdAngle) {
          corners++
        }
      }
    }

    if (corners === 2 || points.length === 4) {
      return { type: 'triangle', confidence: 0.85 }
    }

    if (corners === 3 || points.length === 5) {
      return { type: 'rect', confidence: 0.85 }
    }

    // Fallback based on Area ratio
    const area = w * h
    const pathArea =
      0.5 *
      Math.abs(
        points.reduce((sum, p, i) => {
          const next = points[(i + 1) % points.length]
          return sum + (p.x * next.y - next.x * p.y)
        }, 0)
      )

    const areaRatio = area > 0 ? pathArea / area : 0
    if (areaRatio > 0.65) {
      return { type: 'rect', confidence: 0.75 }
    } else {
      return { type: 'triangle', confidence: 0.75 }
    }
  }

  return { type: 'unknown', confidence: 0.1 }
}
