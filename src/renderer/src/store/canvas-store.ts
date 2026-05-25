import { create } from 'zustand'
import { PressureCurve } from '../lib/input/pointer-handler'

export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'shape' | 'text'
export type ShapeType = 'line' | 'rect' | 'circle' | 'triangle' | 'arrow'
export type EraserMode = 'stroke' | 'pixel'

interface CanvasState {
  activeTool: ToolType
  color: string
  strokeWidth: number
  opacity: number
  pressureCurve: PressureCurve
  isAutoShapeEnabled: boolean
  selectedShape: ShapeType
  eraserMode: EraserMode
  zoom: number

  setActiveTool: (tool: ToolType) => void
  setColor: (color: string) => void
  setStrokeWidth: (width: number) => void
  setOpacity: (opacity: number) => void
  setPressureCurve: (curve: PressureCurve) => void
  setAutoShapeEnabled: (enabled: boolean) => void
  setSelectedShape: (shape: ShapeType) => void
  setEraserMode: (mode: EraserMode) => void
  setZoom: (zoom: number) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  activeTool: 'pen',
  color: '#000000',
  strokeWidth: 5,
  opacity: 1,
  pressureCurve: 'linear',
  isAutoShapeEnabled: false,
  selectedShape: 'line',
  eraserMode: 'stroke',
  zoom: 1.0,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setOpacity: (opacity) => set({ opacity }),
  setPressureCurve: (curve) => set({ pressureCurve: curve }),
  setAutoShapeEnabled: (enabled) => set({ isAutoShapeEnabled: enabled }),
  setSelectedShape: (shape) => set({ selectedShape: shape }),
  setEraserMode: (mode) => set({ eraserMode: mode }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3.0, zoom)) })
}))
