import { describe, it, expect, beforeEach } from 'vitest'
import { WacomDetector } from '@/lib/input/wacom-detector'
import { PointerHandler } from '@/lib/input/pointer-handler'

describe('WacomDetector', () => {
  let detector: WacomDetector

  beforeEach(() => {
    detector = new WacomDetector()
  })

  it('should start with no Wacom connection and unknown input', () => {
    expect(detector.isConnected()).toBe(false)
    expect(detector.getLastInputType()).toBe('unknown')
  })

  it('should detect pen input and connect Wacom device', () => {
    const penEvent = { pointerType: 'pen' } as PointerEvent
    detector.detectFromEvent(penEvent)
    expect(detector.isConnected()).toBe(true)
    expect(detector.getLastInputType()).toBe('pen')
  })

  it('should detect mouse/touch input and set Wacom disconnected', () => {
    const mouseEvent = { pointerType: 'mouse' } as PointerEvent
    detector.detectFromEvent(mouseEvent)
    expect(detector.isConnected()).toBe(false)
    expect(detector.getLastInputType()).toBe('mouse')

    const touchEvent = { pointerType: 'touch' } as PointerEvent
    detector.detectFromEvent(touchEvent)
    expect(detector.isConnected()).toBe(false)
    expect(detector.getLastInputType()).toBe('touch')
  })

  it('should fallback to unknown for empty pointer type', () => {
    const emptyEvent = { pointerType: '' } as PointerEvent
    detector.detectFromEvent(emptyEvent)
    expect(detector.getLastInputType()).toBe('unknown')
  })

  it('should handle unrecognized pointer types safely', () => {
    const unknownEvent = { pointerType: 'other-device' } as PointerEvent
    detector.detectFromEvent(unknownEvent)
    expect(detector.getLastInputType()).toBe('other-device')
    expect(detector.isConnected()).toBe(false)
  })
})

describe('PointerHandler Pressure Calibration', () => {
  let handler: PointerHandler

  beforeEach(() => {
    handler = new PointerHandler()
  })

  it('should have linear as default pressure curve', () => {
    expect(handler.getPressureCurve()).toBe('linear')
  })

  it('should map pressure linearly when curve is linear', () => {
    handler.setPressureCurve('linear')
    expect(handler.calibratePressure(0.5)).toBe(0.5)
    expect(handler.calibratePressure(0.0)).toBe(0)
    expect(handler.calibratePressure(1.0)).toBe(1)
  })

  it('should map pressure non-linearly when curve is soft (squareroot)', () => {
    handler.setPressureCurve('soft')
    expect(handler.calibratePressure(0.25)).toBe(0.5)
    expect(handler.calibratePressure(0.0)).toBe(0)
    expect(handler.calibratePressure(1.0)).toBe(1)
  })

  it('should map pressure non-linearly when curve is firm (squared)', () => {
    handler.setPressureCurve('firm')
    expect(handler.calibratePressure(0.5)).toBe(0.25)
    expect(handler.calibratePressure(0.0)).toBe(0)
    expect(handler.calibratePressure(1.0)).toBe(1)
  })
})
