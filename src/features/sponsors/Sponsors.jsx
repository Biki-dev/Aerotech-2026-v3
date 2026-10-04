import { useState } from 'react'
import './sponsors.css'

const currentSponsors = [
  { name: 'Campa', logo: '/sponsors_logos/campa.webp' },
  { name: 'Pakhtun Biriyani', logo: '/sponsors_logos/pakhtun_biriyani.webp' },
  { name: 'Safar Travels', logo: '/sponsors_logos/safar_travels.webp' },
  { name: 'Bazar Bakers', logo: '/sponsors_logos/Bazar_Bakers.webp' },
  { name: 'The Culture', logo: '/sponsors_logos/the_culture.webp' },
]

const previousSponsors = [
  { name: 'Rolls Mania', logo: '/sponsors_logos/rolls_mania.webp' },
  { name: 'Decathlon', logo: '/sponsors_logos/Decathlon-Logo.webp' },
  { name: 'AAI', logo: '/sponsors_logos/aai.webp' },
  { name: 'Cultees', logo: '/sponsors_logos/cultees.webp' },
  { name: 'Robopixel', logo: '/sponsors_logos/robopixel.webp' },
]

function SponsorLogo({ src, alt, className }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <span className={`${className} sponsor-logo__fallback`} aria-hidden="true">{alt}</span>
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

function Sponsors() {
  return (
    <section id="sponsors" className="sponsors-section" aria-labelledby="sponsors-title">
      <div className="sponsors-shell">
        <header className="sponsors-header">
          <span className="sponsors-kicker">With thanks</span>
          <h2 id="sponsors-title">SPONSORS</h2>
        </header>

        {/* ACTIVE FLEET — current sponsors, full-bleed logo tiles */}
        <div className="sponsor-group">
          <h3 className="group-label">
            <span className="group-label__dot" aria-hidden="true" />
            Active fleet — 2026
          </h3>

          <div className="present-grid">
            {currentSponsors.map((sponsor) => (
              <div className="present-card" key={sponsor.name}>
                <SponsorLogo
                  className="present-card__logo"
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* LEGACY FLEET — previous sponsors on the runway */}
        <div className="sponsor-group sponsor-group--past">
          <h3 className="group-label">
            <span className="group-label__dash" aria-hidden="true" />
            Legacy fleet — previous editions
          </h3>

          <div className="runway">
            <span className="runway__threshold" aria-hidden="true"></span>
            {previousSponsors.map((sponsor, index) => (
              <div className="runway-slot" key={sponsor.name}>
                <SponsorLogo
                  className="runway-slot__logo"
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                />
                <span className="runway-slot__label">
                  {String(index + 1).padStart(2, '0')} · {sponsor.name}
                </span>
              </div>
            ))}
            <span className="runway__threshold runway__threshold--end" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Sponsors
