export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
}

export class LayerSystem {
  private layers: Layer[] = []
  private activeLayerId = 'drawing'

  constructor() {
    this.layers = [
      { id: 'background', name: 'Background', visible: true, locked: false },
      { id: 'drawing', name: 'Drawing', visible: true, locked: false },
      { id: 'shapes', name: 'Shapes', visible: true, locked: false },
      { id: 'text', name: 'Text', visible: true, locked: false }
    ]
  }

  getLayers(): Layer[] {
    return this.layers
  }

  getActiveLayerId(): string {
    return this.activeLayerId
  }

  getActiveLayer(): Layer | undefined {
    return this.layers.find((l) => l.id === this.activeLayerId)
  }

  setActiveLayer(id: string) {
    if (this.layers.some((l) => l.id === id)) {
      this.activeLayerId = id
    }
  }

  addLayer(id: string, name: string) {
    if (!this.layers.some((l) => l.id === id)) {
      this.layers.push({
        id,
        name,
        visible: true,
        locked: false
      })
    }
  }

  removeLayer(id: string) {
    this.layers = this.layers.filter((l) => l.id !== id)
    if (this.activeLayerId === id && this.layers.length > 0) {
      this.activeLayerId = this.layers[0].id
    }
  }

  toggleVisibility(id: string) {
    const layer = this.layers.find((l) => l.id === id)
    if (layer) {
      layer.visible = !layer.visible
    }
  }

  toggleLock(id: string) {
    const layer = this.layers.find((l) => l.id === id)
    if (layer) {
      layer.locked = !layer.locked
    }
  }
}
