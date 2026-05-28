import { describe, it, expect, beforeEach } from 'vitest'
import { CanvasManager } from '@/lib/canvas/fabric-manager'

describe('CanvasManager (FabricManager)', () => {
  let canvas: CanvasManager

  beforeEach(() => {
    canvas = new CanvasManager()
  })

  it('should start with an empty list of objects', () => {
    expect(canvas.getObjects()).toHaveLength(0)
  })

  it('should add objects to the canvas', () => {
    const stroke = { id: 'stroke-1', type: 'path', width: 5 }
    canvas.addObject(stroke)
    expect(canvas.getObjects()).toHaveLength(1)
    expect(canvas.getObjects()[0]).toBe(stroke)
  })

  it('should support undoing the last stroke', () => {
    const stroke1 = { id: 'stroke-1', type: 'path' }
    const stroke2 = { id: 'stroke-2', type: 'path' }
    canvas.addObject(stroke1)
    canvas.addObject(stroke2)

    canvas.undo()
    expect(canvas.getObjects()).toHaveLength(1)
    expect(canvas.getObjects()[0]).toBe(stroke1)

    canvas.undo()
    expect(canvas.getObjects()).toHaveLength(0)
  })

  it('should support redoing an undone stroke', () => {
    const stroke = { id: 'stroke-1', type: 'path' }
    canvas.addObject(stroke)
    canvas.undo()
    expect(canvas.getObjects()).toHaveLength(0)

    canvas.redo()
    expect(canvas.getObjects()).toHaveLength(1)
    expect(canvas.getObjects()[0]).toBe(stroke)
  })

  it('should clear redo stack when a new object is added', () => {
    const stroke1 = { id: 'stroke-1' }
    const stroke2 = { id: 'stroke-2' }
    canvas.addObject(stroke1)
    canvas.undo()

    // Redo is available
    canvas.addObject(stroke2)
    canvas.redo() // should do nothing since redo stack is cleared
    expect(canvas.getObjects()).toHaveLength(1)
    expect(canvas.getObjects()[0]).toBe(stroke2)
  })

  it('should clear the canvas and support resetting', () => {
    const stroke1 = { id: 'stroke-1' }
    canvas.addObject(stroke1)
    canvas.clear()
    expect(canvas.getObjects()).toHaveLength(0)
  })

  describe('with mock fabric.Canvas integration', () => {
    let mockCanvas: any

    beforeEach(() => {
      mockCanvas = {
        objects: [] as any[],
        getObjects() {
          return this.objects
        },
        add(obj: any) {
          this.objects.push(obj)
        },
        remove(obj: any) {
          this.objects = this.objects.filter((o) => o !== obj)
        },
        clear() {
          this.objects = []
        },
        renderAll() {}
      }
      canvas = new CanvasManager(mockCanvas)
    })

    it('should set canvas and read objects', () => {
      canvas.setFabricCanvas(mockCanvas)
      expect(canvas.getObjects()).toHaveLength(0)
    })

    it('should add object to fabric canvas', () => {
      const stroke = { id: 'stroke-1' }
      canvas.addObject(stroke)
      expect(mockCanvas.getObjects()).toHaveLength(1)
      expect(canvas.getObjects()[0]).toBe(stroke)
    })

    it('should undo last object in fabric canvas', () => {
      const stroke1 = { id: '1' }
      const stroke2 = { id: '2' }
      canvas.addObject(stroke1)
      canvas.addObject(stroke2)
      canvas.undo()
      expect(mockCanvas.getObjects()).toHaveLength(1)
      expect(mockCanvas.getObjects()[0]).toBe(stroke1)

      canvas.undo()
      expect(mockCanvas.getObjects()).toHaveLength(0)
    })

    it('should redo object in fabric canvas', () => {
      const stroke = { id: '1' }
      canvas.addObject(stroke)
      canvas.undo()
      canvas.redo()
      expect(mockCanvas.getObjects()).toHaveLength(1)
      expect(mockCanvas.getObjects()[0]).toBe(stroke)
    })

    it('should clear fabric canvas', () => {
      const stroke = { id: '1' }
      canvas.addObject(stroke)
      canvas.clear()
      expect(mockCanvas.getObjects()).toHaveLength(0)
    })

    it('should handle setFabricCanvas with null', () => {
      canvas.setFabricCanvas(null as any)
      expect(canvas.getObjects()).toHaveLength(0)
    })

    it('should do nothing on undo when fabric canvas is empty', () => {
      canvas.undo()
      expect(mockCanvas.getObjects()).toHaveLength(0)
    })

    it('should do nothing on redo when fabric redo stack is empty', () => {
      canvas.redo()
      expect(mockCanvas.getObjects()).toHaveLength(0)
    })
  })
})
