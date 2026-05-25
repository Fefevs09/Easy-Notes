export class WacomDetector {
  private connected = false
  private lastInputType: 'unknown' | 'mouse' | 'touch' | 'pen' = 'unknown'

  isConnected(): boolean {
    return this.connected
  }

  getLastInputType(): 'unknown' | 'mouse' | 'touch' | 'pen' {
    return this.lastInputType
  }

  detectFromEvent(e: PointerEvent) {
    const type = e.pointerType as 'mouse' | 'touch' | 'pen'
    this.lastInputType = type || 'unknown'
    if (type === 'pen') {
      this.connected = true
    } else if (type === 'mouse' || type === 'touch') {
      this.connected = false
    }
  }
}
