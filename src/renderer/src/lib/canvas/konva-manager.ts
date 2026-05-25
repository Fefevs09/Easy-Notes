export class KonvaManager {
  private color = '#000000'
  private strokeWidth = 3

  getColor(): string {
    return this.color
  }

  setColor(color: string) {
    this.color = color
  }

  getStrokeWidth(): number {
    return this.strokeWidth
  }

  setStrokeWidth(width: number) {
    this.strokeWidth = width
  }

  computeRectGeometry(start: { x: number; y: number }, end: { x: number; y: number }) {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(start.x - end.x)
    const height = Math.abs(start.y - end.y)
    return { x, y, width, height }
  }

  computeCircleGeometry(start: { x: number; y: number }, end: { x: number; y: number }) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const radius = Math.sqrt(dx * dx + dy * dy)
    return {
      x: start.x,
      y: start.y,
      radius
    }
  }

  computeLineGeometry(start: { x: number; y: number }, end: { x: number; y: number }) {
    return {
      points: [start.x, start.y, end.x, end.y]
    }
  }

  computeArrowGeometry(start: { x: number; y: number }, end: { x: number; y: number }) {
    return {
      points: [start.x, start.y, end.x, end.y]
    }
  }

  computeTriangleGeometry(start: { x: number; y: number }, end: { x: number; y: number }) {
    const minX = Math.min(start.x, end.x)
    const maxX = Math.max(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const maxY = Math.max(start.y, end.y)

    const topCenterX = minX + (maxX - minX) / 2

    return {
      points: [
        topCenterX, minY, // Top vertex
        minX, maxY,       // Bottom left
        maxX, maxY        // Bottom right
      ]
    }
  }
}
