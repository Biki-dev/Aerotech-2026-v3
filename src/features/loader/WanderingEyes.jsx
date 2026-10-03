import { useEffect, useState } from 'react'
import './wandering-eyes.css'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function WanderingEyes({
  className = '',
  style,
  eyeScale = 0.62,
  gapScale = 0.09,
  pupilScale = 0.32,
  blinkScale = 0.375,
  travelScale = 0.3125,
  ...props
}) {
  const eyesStyle = {
    ...style,
    '--eyes-size': `${clamp(eyeScale, 0.28, 0.7) * 100}cqmin`,
    '--eyes-gap': `${clamp(gapScale, 0.04, 0.3) * 100}cqmin`,
    '--eyes-pupil-scale': clamp(pupilScale, 0.12, 0.45),
    '--eyes-blink-scale': clamp(blinkScale, 0.15, 1),
    '--eyes-travel-scale': clamp(travelScale, 0.08, 0.5),
  }

  return (
    <span className={`wandering-eyes ${className}`.trim()} style={eyesStyle} {...props}>
      <span className="wandering-eyes__pair" aria-hidden="true">
        {Array.from({ length: 2 }, (_, index) => (
          <span className="wandering-eyes__eye" key={index} />
        ))}
      </span>
      <span className="visually-hidden">Loading</span>
    </span>
  )
}

function waitForDocumentLoad() {
  if (document.readyState === 'complete') return Promise.resolve()

  return new Promise((resolve) => {
    window.addEventListener('load', resolve, { once: true })
  })
}

function waitForImage(image) {
  if (image.complete) {
    return image.decode?.().catch(() => {}) ?? Promise.resolve()
  }

  return new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true })
    image.addEventListener('error', resolve, { once: true })
  })
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })
}

function waitForCriticalAsset(eventName, readyFlag) {
  return new Promise((resolve) => {
    if (window[readyFlag]) {
      resolve()
      return
    }

    const handleReady = () => {
      window.removeEventListener(eventName, handleReady)
      resolve()
    }

    window.addEventListener(eventName, handleReady, { once: true })

    // The asset can finish between the initial check and listener setup.
    if (window[readyFlag]) handleReady()
  })
}

function PageLoader() {
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    let cancelled = false
    const startedAt = performance.now()

    const waitForPage = async () => {
      await waitForDocumentLoad()
      await (document.fonts?.ready ?? Promise.resolve())

      const images = Array.from(document.images).filter((image) => {
        if (image.loading !== 'lazy') return true
        const bounds = image.getBoundingClientRect()
        return bounds.top < window.innerHeight && bounds.bottom > 0
      })

      const criticalAssets = [
        ...images.map(waitForImage),
        waitForCriticalAsset('aerotech:hero-ready', '__aerotechHeroReady'),
      ]

      // The 3D aircraft is intentionally not mounted on mobile for
      // performance, so its ready event cannot be used as a mobile gate.
      if (!window.matchMedia('(max-width: 700px)').matches) {
        criticalAssets.push(
          waitForCriticalAsset('aerotech:aircraft-ready', '__aerotechAircraftReady'),
        )
      }

      await Promise.all(criticalAssets)
      await waitForPaint()

      const minimumDisplayTime = 500
      const remainingTime = Math.max(0, minimumDisplayTime - (performance.now() - startedAt))
      window.setTimeout(() => {
        if (!cancelled) setVisible(false)
      }, remainingTime)
    }

    waitForPage()
    return () => { cancelled = true }
  }, [])

  if (!mounted) return null

  return (
    <div
      className={`page-loader${visible ? '' : ' page-loader--leaving'}`}
      role={visible ? 'status' : undefined}
      aria-label={visible ? 'Loading AeroTech 2026' : undefined}
      aria-hidden={!visible}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && !visible) setMounted(false)
      }}
    >
      <div className="page-loader__content">
        <WanderingEyes />
        <span className="page-loader__label">AEROTECH / 2026</span>
      </div>
    </div>
  )
}

export { WanderingEyes, PageLoader }
export default WanderingEyes
