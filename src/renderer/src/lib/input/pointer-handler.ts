export type PressureCurve = 'linear' | 'soft' | 'firm'

export class PointerHandler {
  private pressureCurve: PressureCurve = 'linear'

  getPressureCurve(): PressureCurve {
    return this.pressureCurve
  }

  setPressureCurve(curve: PressureCurve) {
    this.pressureCurve = curve
  }

  calibratePressure(pressure: number): number {
    const p = Math.max(0, Math.min(1, pressure))
    if (this.pressureCurve === 'soft') {
      return Math.pow(p, 0.5)
    }
    if (this.pressureCurve === 'firm') {
      return Math.pow(p, 2)
    }
    return p // linear
  }
}
