export class HighlighterTool {
  private baseWidth = 15
  private color = '#FFFF00'
  private opacity = 0.4

  constructor(baseWidth = 15, color = '#FFFF00', opacity = 0.4) {
    this.baseWidth = baseWidth
    this.color = color
    this.opacity = opacity
  }

  createStroke() {
    return {
      width: this.baseWidth,
      color: this.color,
      opacity: this.opacity
    }
  }

  setColor(color: string) {
    this.color = color
  }

  setBaseWidth(width: number) {
    this.baseWidth = width
  }

  setOpacity(opacity: number) {
    this.opacity = Math.max(0, Math.min(1, opacity))
  }

  getBaseWidth(): number {
    return this.baseWidth
  }

  getColor(): string {
    return this.color
  }

  getOpacity(): number {
    return this.opacity
  }
}
