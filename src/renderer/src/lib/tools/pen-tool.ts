export class PenTool {
  private baseWidth = 5
  private color = '#000000'

  constructor(baseWidth = 5, color = '#000000') {
    this.baseWidth = baseWidth
    this.color = color
  }

  createStroke(pressure: number) {
    const clampedPressure = Math.max(0, Math.min(1, pressure))
    return {
      width: this.baseWidth * clampedPressure,
      color: this.color
    }
  }

  setColor(color: string) {
    this.color = color
  }

  setBaseWidth(width: number) {
    this.baseWidth = width
  }

  getBaseWidth(): number {
    return this.baseWidth
  }

  getColor(): string {
    return this.color
  }
}
