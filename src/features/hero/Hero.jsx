import { lazy, Suspense, useEffect, useState } from 'react'
import './hero.css'
import { useScrollSequence } from './useScrollSequence.js'

const HalftoneReveal = lazy(() => import('./HalftoneReveal.jsx'))

function Hero() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 600px)').matches)
  const [showHalftone, setShowHalftone] = useState(false)
  const { canvasRef, trackRef } = useScrollSequence(isMobile)

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 600px)')
    const updateMobileState = () => setIsMobile(mobileQuery.matches)
    mobileQuery.addEventListener('change', updateMobileState)
    return () => mobileQuery.removeEventListener('change', updateMobileState)
  }, [])

  useEffect(() => {
    if (isMobile) return undefined

    let timeoutId
    const reveal = () => setShowHalftone(true)
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(reveal, { timeout: 1800 })
      return () => window.cancelIdleCallback(idleId)
    }

    timeoutId = window.setTimeout(reveal, 1200)
    return () => window.clearTimeout(timeoutId)
  }, [isMobile])

  return (
    <section className="hero-page" ref={trackRef}>
      <section id="home" className="hero" aria-labelledby="hero-title">
        <canvas className="hero-canvas" ref={canvasRef} aria-hidden="true" />
        {!isMobile && showHalftone && (
          <Suspense fallback={null}>
            <HalftoneReveal
              sourceCanvasRef={canvasRef}
              className="hero-halftone"
              inkColor="#292830"
              paperColor="#FBFAF6"
              mode="mono"
              dotDensity={94}
              angle={28}
              revealRadius={0.3}
              borderRadius="0"
            />
          </Suspense>
        )}
        <div className="hero-copy">
          <img
            className="eyebrow"
            src="/aerotech_logo.webp"
            alt="Aerotech logo"
          />
          <h1 id="hero-title">WHERE CURIOSITY<br />MEETS INNOVATION</h1>
        </div>

        <div className="hero-note">
          <p>From imagination to flight — be part of the innovation taking off at AeroTech 2026.</p>
          <a className="hero-cta" href="https://forms.gle/z39S2hrjK98vmJFCA">
            <span>Register Now</span>
            <span className="cta-arrow" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M4 10h11M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        </div>
      </section>
    </section>
  )
}

export default Hero
