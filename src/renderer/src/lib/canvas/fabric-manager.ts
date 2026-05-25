import { fabric } from 'fabric'

export class CanvasManager {
  private objects: any[] = []
  private undoStack: any[][] = []
  private redoStack: any[][] = []
  private fabricCanvas: fabric.Canvas | null = null

  constructor(fabricCanvas?: fabric.Canvas) {
    if (fabricCanvas) {
      this.fabricCanvas = fabricCanvas
    }
  }

  setFabricCanvas(canvas: fabric.Canvas) {
    this.fabricCanvas = canvas
    if (canvas) {
      this.objects = canvas.getObjects()
    }
  }

  getObjects(): any[] {
    if (this.fabricCanvas) {
      return this.fabricCanvas.getObjects()
    }
    return this.objects
  }

  addObject(obj: any) {
    this.saveState()
    this.redoStack = []

    if (this.fabricCanvas) {
      this.fabricCanvas.add(obj)
      this.fabricCanvas.renderAll()
    } else {
      this.objects.push(obj)
    }
  }

  undo() {
    const currentObjects = this.getObjects()
    if (currentObjects.length === 0) return

    const lastObj = this.fabricCanvas
      ? currentObjects[currentObjects.length - 1]
      : this.objects.pop()

    if (lastObj) {
      this.redoStack.push([lastObj])
      if (this.fabricCanvas) {
        this.fabricCanvas.remove(lastObj)
        this.fabricCanvas.renderAll()
      }
    }
  }

  redo() {
    if (this.redoStack.length === 0) return
    const redoGroup = this.redoStack.pop()
    if (redoGroup) {
      for (const obj of redoGroup) {
        if (this.fabricCanvas) {
          this.fabricCanvas.add(obj)
          this.fabricCanvas.renderAll()
        } else {
          this.objects.push(obj)
        }
      }
    }
  }

  clear() {
    this.saveState()
    this.redoStack = []
    if (this.fabricCanvas) {
      this.fabricCanvas.clear()
      this.fabricCanvas.renderAll()
    } else {
      this.objects = []
    }
  }

  private saveState() {
    const current = [...this.getObjects()]
    this.undoStack.push(current)
  }
}

export { CanvasManager as FabricManager }
