import { useState } from 'react'
import './sponsors.css'

const currentSponsors = [
  { name: 'Campa', logo: '/sponsors_logos/campa.png' },
  { name: 'Pakhtun Biriyani', logo: '/sponsors_logos/pakhtun_biriyani.png' },
  { name: 'Safar Travels', logo: '/sponsors_logos/safar_travels.png' },
  { name: 'Bazar Bakers', logo: '/sponsors_logos/Bazar_Bakers.png' },
  { name: 'The Culture', logo: '/sponsors_logos/the_culture.png' },
]

const previousSponsors = [
  { name: 'Rolls Mania', logo: '/sponsors_logos/rolls_mania.png' },
  { name: 'Decathlon', logo: '/sponsors_logos/Decathlon-Logo.png' },
  { name: 'AAI', logo: '/sponsors_logos/aai.png' },
  { name: 'Cultees', logo: '/sponsors_logos/cultees.png' },
  { name: 'Robopixel', logo: '/sponsors_logos/robopixel.png' },
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
            <span className="runway__threshold" aria-hidden="true">09</span>
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
            <span className="runway__threshold runway__threshold--end" aria-hidden="true">27</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Sponsors