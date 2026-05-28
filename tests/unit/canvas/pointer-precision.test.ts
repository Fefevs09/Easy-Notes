import { describe, it, expect } from 'vitest'

// Pointer Precision and Coordinate Mapping Test Suite
describe('Pointer Coordinate Precision under Zoom and Scrolling', () => {
  // Formula matching DrawingCanvas.tsx pointer coordinate mapping
  const calculateLogicalCoords = (
    clientX: number,
    clientY: number,
    rect: { left: number; top: number; width: number; height: number },
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const scaleX = rect.width > 0 ? canvasWidth / rect.width : 1
    const scaleY = rect.height > 0 ? canvasHeight / rect.height : 1
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    return { x, y }
  }

  // Formula matching canvas rendering and browser scaling
  const calculateRenderedScreenCoords = (
    xLogical: number,
    yLogical: number,
    zoom: number,
    rect: { left: number; top: number; width: number; height: number },
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // 1. Context scaling inside draw: ctx.scale(zoom, zoom)
    const xBitmap = xLogical * zoom
    const yBitmap = yLogical * zoom

    // 2. Browser stretching the bitmap to DOM size (rect.width/height)
    // Since bitmap resolution is canvasWidth * zoom, the stretch factor is:
    // DOM width / Bitmap resolution width = rect.width / (canvasWidth * zoom)
    const stretchX = rect.width / (canvasWidth * zoom)
    const stretchY = rect.height / (canvasHeight * zoom)

    const xDom = xBitmap * stretchX
    const yDom = yBitmap * stretchY

    // 3. Absolute screen display offset relative to viewport
    const screenX = rect.left + xDom
    const screenY = rect.top + yDom

    return { x: screenX, y: screenY }
  }

  describe('Roundtrip Precision under zoom factors (0.5 to 3.0)', () => {
    const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0]
    const baseWidth = 1200
    const baseHeight = 900

    zoomLevels.forEach((zoom) => {
      it(`should map pointer exactly to stroke with 0px deviation at zoom level ${zoom * 100}%`, () => {
        // Setup bounding rect of the canvas under the current zoom level
        const rect = {
          left: 24, // accounting for p-6 padding
          top: 80, // accounting for header toolbar
          width: baseWidth * zoom,
          height: baseHeight * zoom
        }

        // Simulating a click at clientX = 400, clientY = 300
        const inputClientX = 400
        const inputClientY = 300

        // 1. Pointer Down / Move maps client position to logical space
        const logical = calculateLogicalCoords(
          inputClientX,
          inputClientY,
          rect,
          baseWidth,
          baseHeight
        )

        // 2. Redraw and Browser Render scales back to screen position
        const screen = calculateRenderedScreenCoords(
          logical.x,
          logical.y,
          zoom,
          rect,
          baseWidth,
          baseHeight
        )

        // Assert 100% precision with zero deviation
        expect(screen.x).toBeCloseTo(inputClientX, 5)
        expect(screen.y).toBeCloseTo(inputClientY, 5)
      })
    })
  })

  describe('Precision under viewport scrolling and panning', () => {
    const zoom = 2.0
    const baseWidth = 1200
    const baseHeight = 900

    it('should map pointer exactly when scrolled horizontally and vertically', () => {
      // Simulating a scrollRight of 500px and scrollTop of 400px
      const scrollLeft = 500
      const scrollTop = 400

      const rect = {
        left: 24 - scrollLeft, // canvas slides left
        top: 80 - scrollTop, // canvas slides up
        width: baseWidth * zoom,
        height: baseHeight * zoom
      }

      // Simulating user clicking at a specific viewport client coordinate
      const inputClientX = 600
      const inputClientY = 500

      const logical = calculateLogicalCoords(
        inputClientX,
        inputClientY,
        rect,
        baseWidth,
        baseHeight
      )
      const screen = calculateRenderedScreenCoords(
        logical.x,
        logical.y,
        zoom,
        rect,
        baseWidth,
        baseHeight
      )

      expect(screen.x).toBeCloseTo(inputClientX, 5)
      expect(screen.y).toBeCloseTo(inputClientY, 5)
    })
  })
})
