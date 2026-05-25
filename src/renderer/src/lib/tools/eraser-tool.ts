export class EraserTool {
  private baseWidth = 20
  private mode: 'stroke' | 'pixel' = 'stroke'

  constructor(baseWidth = 20, mode: 'stroke' | 'pixel' = 'stroke') {
    this.baseWidth = baseWidth
    this.mode = mode
  }

  getBaseWidth(): number {
    return this.baseWidth
  }

  setBaseWidth(width: number) {
    this.baseWidth = width
  }

  getMode(): 'stroke' | 'pixel' {
    return this.mode
  }

  setMode(mode: 'stroke' | 'pixel') {
    this.mode = mode
  }

  eraseStroke(strokeId: string, allStrokes: any[]): any[] {
    return allStrokes.filter((stroke) => stroke.id !== strokeId)
  }

  checkIntersection(eraserPoint: { x: number; y: number }, stroke: any): boolean {
    if (!stroke.bounds) return false
    const { left, top, right, bottom } = stroke.bounds
    return (
      eraserPoint.x >= left &&
      eraserPoint.x <= right &&
      eraserPoint.y >= top &&
      eraserPoint.y <= bottom
    )
  }
}
