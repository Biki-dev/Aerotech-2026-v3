import './hero.css'
import { useScrollSequence } from './useScrollSequence.js'

function Hero() {
  const { canvasRef, trackRef } = useScrollSequence()

  return (
    <main className="hero-page" ref={trackRef}>
      <section className="hero" aria-labelledby="hero-title">
        <canvas className="hero-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">Tools built for what&apos;s next.</p>
          <h1 id="hero-title">Work Smarter,<br />Future Faster</h1>
        </div>

        <div className="hero-note">
          <p>Redefine how you work with a sleek, intelligent web app designed for speed, clarity, and tomorrow&apos;s challenges.</p>
          <a className="hero-cta" href="#get-started">
            <span>Get it now</span>
            <span className="cta-arrow" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M4 10h11M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        </div>
      </section>
    </main>
  )
}

export default Hero