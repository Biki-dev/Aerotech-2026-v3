import './hero.css'
import { useScrollSequence } from './useScrollSequence.js'

function Hero() {
  const { canvasRef, trackRef } = useScrollSequence()

  return (
    <main className="hero-page" ref={trackRef}>
      <section className="hero" aria-labelledby="hero-title">
        <canvas className="hero-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="hero-copy">
          <img
            className="eyebrow"
            src="/aerotech_logo.png"
            alt="Aerotech logo"
          />
          <h1 id="hero-title">WHERE CURIOSITY<br />MEETS INNOVATION</h1>
        </div>

        <div className="hero-note">
          <p>From imagination to flight — be part of the innovation taking off at AeroTech 2026.</p>
          <a className="hero-cta" href="#get-started">
            <span>Register Now</span>
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