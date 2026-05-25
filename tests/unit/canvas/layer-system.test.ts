import { describe, it, expect, beforeEach } from 'vitest'
import { LayerSystem } from '@/lib/canvas/layer-system'

describe('LayerSystem', () => {
  let system: LayerSystem

  beforeEach(() => {
    system = new LayerSystem()
  })

  describe('Initialization', () => {
    it('should initialize with default layers and active drawing layer', () => {
      const layers = system.getLayers()
      expect(layers).toHaveLength(4)
      expect(layers.map(l => l.id)).toEqual(['background', 'drawing', 'shapes', 'text'])
      expect(system.getActiveLayerId()).toBe('drawing')
    })
  })

  describe('Layer Manipulations', () => {
    it('should add a custom layer', () => {
      system.addLayer('custom-1', 'Custom Layer')
      const layers = system.getLayers()
      expect(layers).toHaveLength(5)
      expect(layers[4]).toEqual({
        id: 'custom-1',
        name: 'Custom Layer',
        visible: true,
        locked: false
      })
    })

    it('should remove a custom layer', () => {
      system.addLayer('custom-1', 'Custom Layer')
      system.removeLayer('custom-1')
      expect(system.getLayers()).toHaveLength(4)
    })

    it('should migrate active layer if active layer is removed', () => {
      system.setActiveLayer('shapes')
      system.removeLayer('shapes')
      expect(system.getActiveLayerId()).toBe('background') // fallback to first layer in array
    })

    it('should ignore duplicate layer additions', () => {
      system.addLayer('drawing', 'New Drawing Name')
      expect(system.getLayers().filter(l => l.id === 'drawing')).toHaveLength(1)
    })

    it('should ignore toggling visibility/lock of non-existent layers', () => {
      system.toggleVisibility('non-existent')
      system.toggleLock('non-existent')
      // No crashes, correct behavior
    })

    it('should toggle visibility of a layer', () => {
      system.toggleVisibility('shapes')
      const shapesLayer = system.getLayers().find(l => l.id === 'shapes')
      expect(shapesLayer?.visible).toBe(false)

      system.toggleVisibility('shapes')
      expect(shapesLayer?.visible).toBe(true)
    })

    it('should toggle lock state of a layer', () => {
      system.toggleLock('drawing')
      const layer = system.getLayers().find(l => l.id === 'drawing')
      expect(layer?.locked).toBe(true)
    })

    it('should change the active layer ID', () => {
      system.setActiveLayer('text')
      expect(system.getActiveLayerId()).toBe('text')
      expect(system.getActiveLayer()?.id).toBe('text')
    })

    it('should ignore setting active layer to non-existent ID', () => {
      system.setActiveLayer('non-existent')
      expect(system.getActiveLayerId()).toBe('drawing') // stays at default or previous
    })
  })
})
