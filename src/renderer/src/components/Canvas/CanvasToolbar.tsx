import React, { useState } from 'react'
import { useCanvasStore, ToolType } from '../../store/canvas-store'
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  ChevronDown,
  Activity
} from 'lucide-react'

const PEN_COLORS = ['#000000', '#2B59C3', '#D63C3C', '#278A45', '#EAA812', '#7E36C2']
const HIGH_COLORS = ['#FFFF00', '#FF8CC6', '#8CFF95', '#8CE5FF']

export default function CanvasToolbar(): React.JSX.Element {
  const {
    activeTool,
    color,
    strokeWidth,
    opacity,
    pressureCurve,
    isAutoShapeEnabled,
    selectedShape,
    eraserMode,
    setActiveTool,
    setColor,
    setStrokeWidth,
    setOpacity,
    setPressureCurve,
    setAutoShapeEnabled,
    setSelectedShape,
    setEraserMode
  } = useCanvasStore()

  const [activeMenu, setActiveMenu] = useState<'pen' | 'highlighter' | 'eraser' | 'shape' | 'layers' | null>(null)

  const toggleMenu = (menu: 'pen' | 'highlighter' | 'eraser' | 'shape' | 'layers') => {
    setActiveMenu(activeMenu === menu ? null : menu)
  }

  const handleToolClick = (tool: ToolType, menu: any) => {
    setActiveTool(tool)
    toggleMenu(menu)
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Floating Submenus Panels */}
      {activeMenu && (
        <div className="absolute bottom-16 mb-2 glass-panel p-4 rounded-2xl shadow-xl w-64 text-xs space-y-3 z-50 text-slate-800 dark:text-slate-200">
          
          {/* 1. PEN CONFIGURATION */}
          {activeMenu === 'pen' && (
            <>
              <div className="font-semibold border-b border-white/10 pb-1.5 flex justify-between items-center">
                <span>Caneta Caligráfica</span>
                <span className="text-xxs px-1.5 py-0.5 bg-red-400 text-white rounded">Wacom Active</span>
              </div>
              
              {/* Color Palette */}
              <div className="space-y-1.5">
                <span className="text-slate-400">Paleta de Cores</span>
                <div className="flex gap-2.5 flex-wrap">
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border border-white/20 transition-transform ${
                        color === c ? 'scale-120 ring-2 ring-red-400' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke Size Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Espessura do Traço</span>
                  <span>{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full accent-red-400"
                />
              </div>

              {/* Wacom Pressure Sensitivity curve */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Activity size={12} />
                  <span>Sensibilidade à Pressão</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['soft', 'linear', 'firm'] as const).map((curve) => (
                    <button
                      key={curve}
                      onClick={() => setPressureCurve(curve)}
                      className={`py-1 rounded border capitalize transition-all ${
                        pressureCurve === curve
                          ? 'border-red-400 bg-red-400/10 text-red-500 font-semibold'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {curve}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 2. HIGHLIGHTER CONFIGURATION */}
          {activeMenu === 'highlighter' && (
            <>
              <div className="font-semibold border-b border-white/10 pb-1.5">Marcador Semitransparente</div>

              {/* Color Palette */}
              <div className="space-y-1.5">
                <span className="text-slate-400">Paleta Neon</span>
                <div className="flex gap-2.5">
                  {HIGH_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border border-white/20 transition-transform ${
                        color === c ? 'scale-120 ring-2 ring-red-400' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke Size Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Largura do Marcador</span>
                  <span>{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full accent-red-400"
                />
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Transparência</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-red-400"
                />
              </div>
            </>
          )}

          {/* 3. ERASER CONFIGURATION */}
          {activeMenu === 'eraser' && (
            <>
              <div className="font-semibold border-b border-white/10 pb-1.5">Borracha de Precisão</div>

              {/* Eraser Mode Selection */}
              <div className="space-y-1.5">
                <span className="text-slate-400">Modo de Apagamento</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEraserMode('stroke')}
                    className={`py-2 rounded border transition-all ${
                      eraserMode === 'stroke'
                        ? 'border-red-400 bg-red-400/10 text-red-500 font-semibold'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    Traço Inteiro
                  </button>
                  <button
                    onClick={() => setEraserMode('pixel')}
                    className={`py-2 rounded border transition-all ${
                      eraserMode === 'pixel'
                        ? 'border-red-400 bg-red-400/10 text-red-500 font-semibold'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    Por Pixels
                  </button>
                </div>
              </div>

              {/* Eraser Width */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Diâmetro da Borracha</span>
                  <span>{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full accent-red-400"
                />
              </div>
            </>
          )}

          {/* 4. SHAPE CONFIGURATION */}
          {activeMenu === 'shape' && (
            <>
              <div className="font-semibold border-b border-white/10 pb-1.5">Formas Geométricas</div>

              {/* Shape Types Selector Grid */}
              <div className="grid grid-cols-3 gap-2">
                {(['line', 'rect', 'circle', 'triangle', 'arrow'] as const).map((sh) => (
                  <button
                    key={sh}
                    onClick={() => setSelectedShape(sh)}
                    className={`py-2 rounded border capitalize transition-all ${
                      selectedShape === sh
                        ? 'border-red-400 bg-red-400/10 text-red-500 font-semibold'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {sh}
                  </button>
                ))}
              </div>

              {/* Auto Shape Recognition Toggle */}
              <label className="flex items-center justify-between gap-2 pt-2 cursor-pointer">
                <span className="text-slate-400">Reconhecimento Automático</span>
                <input
                  type="checkbox"
                  checked={isAutoShapeEnabled}
                  onChange={(e) => setAutoShapeEnabled(e.target.checked)}
                  className="accent-red-400"
                />
              </label>
            </>
          )}

        </div>
      )}

      {/* Primary Floating Toolbar Bar */}
      <div className="flex items-center gap-1.5 glass-panel p-2 px-3 rounded-full shadow-2xl z-50">
        
        {/* Pen Button */}
        <button
          onClick={() => handleToolClick('pen', 'pen')}
          className={`p-2.5 rounded-full transition-all hover:scale-110 flex items-center gap-0.5 ${
            activeTool === 'pen' ? 'bg-red-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-100'
          }`}
          title="Caneta"
        >
          <Pen size={18} />
          {activeTool === 'pen' && <ChevronDown size={12} />}
        </button>

        {/* Highlighter Button */}
        <button
          onClick={() => handleToolClick('highlighter', 'highlighter')}
          className={`p-2.5 rounded-full transition-all hover:scale-110 flex items-center gap-0.5 ${
            activeTool === 'highlighter' ? 'bg-red-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-100'
          }`}
          title="Marcador"
        >
          <Highlighter size={18} />
          {activeTool === 'highlighter' && <ChevronDown size={12} />}
        </button>

        {/* Eraser Button */}
        <button
          onClick={() => handleToolClick('eraser', 'eraser')}
          className={`p-2.5 rounded-full transition-all hover:scale-110 flex items-center gap-0.5 ${
            activeTool === 'eraser' ? 'bg-red-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-100'
          }`}
          title="Borracha"
        >
          <Eraser size={18} />
          {activeTool === 'eraser' && <ChevronDown size={12} />}
        </button>

        {/* Shapes Overlay Button */}
        <button
          onClick={() => handleToolClick('shape', 'shape')}
          className={`p-2.5 rounded-full transition-all hover:scale-110 flex items-center gap-0.5 ${
            activeTool === 'shape' ? 'bg-red-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-100'
          }`}
          title="Formas"
        >
          <Square size={18} />
          {activeTool === 'shape' && <ChevronDown size={12} />}
        </button>

      </div>
    </div>
  )
}
