import { useEffect, useRef } from 'react'

const FRAME_COUNT = 152

export function useScrollSequence() {
  const canvasRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const track = trackRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !track || !context) return undefined

    const frames = new Array(FRAME_COUNT)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let targetFrame = 0
    let currentFrame = 0
    let lastRequestedFrame = -1
    let lastDrawnFrame = -1
    let animationFrameId
    let disposed = false

    const loadFrame = (index) => {
      if (frames[index]) return frames[index].promise

      const image = new Image()
      const promise = new Promise((resolve) => {
        image.onload = () => resolve(image)
        image.onerror = () => resolve(null)
      })

      frames[index] = { image, promise }
      image.src = `/scroll-frames/frame_${String(index + 1).padStart(3, '0')}.png`
      return promise
    }

    const nearestLoadedFrame = (index) => {
      for (let distance = 0; distance < FRAME_COUNT; distance += 1) {
        const before = Math.max(0, index - distance)
        const after = Math.min(FRAME_COUNT - 1, index + distance)

        for (const candidate of [before, after]) {
          const image = frames[candidate]?.image
          if (image?.complete && image.naturalWidth) return { image, index: candidate }
        }
      }

      return null
    }

    const drawFrame = (index) => {
      const loaded = nearestLoadedFrame(index)
      const bounds = canvas.getBoundingClientRect()
      const width = bounds.width
      const height = bounds.height

      context.fillStyle = '#FBFAF6'
      context.fillRect(0, 0, width, height)

      if (loaded) {
        const scale = Math.min(width / loaded.image.naturalWidth, height / loaded.image.naturalHeight)
        const imageWidth = loaded.image.naturalWidth * scale
        const imageHeight = loaded.image.naturalHeight * scale
        context.drawImage(loaded.image, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight)
        lastDrawnFrame = loaded.index
      } else {
        lastDrawnFrame = -1
      }

      lastRequestedFrame = index
    }

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(bounds.width * dpr)
      canvas.height = Math.round(bounds.height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      lastRequestedFrame = -1
      lastDrawnFrame = -1
      drawFrame(Math.round(currentFrame))
    }

    const updateTargetFrame = () => {
      const trackTop = track.getBoundingClientRect().top + window.scrollY
      const scrollDistance = Math.max(1, track.offsetHeight - window.innerHeight)
      const progress = Math.max(0, Math.min(1, (window.scrollY - trackTop) / scrollDistance))
      targetFrame = progress * (FRAME_COUNT - 1)
      loadFrame(Math.round(targetFrame))
    }

    const renderLoop = () => {
      if (disposed) return

      if (reducedMotion) {
        currentFrame = targetFrame
      } else {
        currentFrame += (targetFrame - currentFrame) * 0.12
        if (Math.abs(targetFrame - currentFrame) < 0.01) currentFrame = targetFrame
      }

      const frameToDraw = Math.round(currentFrame)
      const nearestFrame = nearestLoadedFrame(frameToDraw)
      if (frameToDraw !== lastRequestedFrame || (nearestFrame?.index ?? -1) !== lastDrawnFrame) {
        drawFrame(frameToDraw)
      }
      animationFrameId = window.requestAnimationFrame(renderLoop)
    }

    const preloadFrames = async () => {
      await loadFrame(0)
      if (disposed) return

      let nextFrame = 1
      const worker = async () => {
        while (!disposed && nextFrame < FRAME_COUNT) {
          const index = nextFrame
          nextFrame += 1
          await loadFrame(index)
        }
      }

      await Promise.all(Array.from({ length: 6 }, worker))
    }

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas)
    window.addEventListener('scroll', updateTargetFrame, { passive: true })
    window.addEventListener('resize', updateTargetFrame, { passive: true })

    resizeCanvas()
    updateTargetFrame()
    animationFrameId = window.requestAnimationFrame(renderLoop)
    preloadFrames()

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', updateTargetFrame)
      window.removeEventListener('resize', updateTargetFrame)
      resizeObserver.disconnect()
    }
  }, [])

  return { canvasRef, trackRef }
}