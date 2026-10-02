import FlexCarousel from './FlexCarousel.jsx'
import './gallery.css'

const galleryItems = [
  { src: '/gallery/1.jpg', alt: 'Aerotech team preparing the aircraft in the studio', title: 'Prototype Lab', subtitle: 'Flight 01' },
  { src: '/gallery/2.jpeg', alt: 'Aircraft design and inspection in progress', title: 'Design Review', subtitle: 'Flight 02' },
  { src: '/gallery/3.jpg', alt: 'The team discussing build details around a model', title: 'Build Sprint', subtitle: 'Flight 03' },
  { src: '/gallery/4.jpeg', alt: 'Aircraft parts assembled for testing', title: 'Assembly', subtitle: 'Flight 04' },
  { src: '/gallery/5.jpeg', alt: 'Clean cockpit and tail assembly details', title: 'Precision Build', subtitle: 'Flight 05' },
  { src: '/gallery/6.jpeg', alt: 'Aero team posing with the aircraft at a field setup', title: 'Field Day', subtitle: 'Flight 06' }
]

export default function Gallery() {
  return (
    <section id="gallery" className="gallery-section" aria-labelledby="gallery-title">
      <div className="gallery-shell">
        <header className="gallery-header">
          <span className="gallery-kicker">AEROTECH / 2026</span>
          <h2 id="gallery-title">GALLERY</h2>
          <span className="gallery-index">CAPTURED MOMENTS</span>
          <p className="gallery-copy">Moments from the workshop, testing floor, and flight campaigns.</p>
        </header>

        <div className="gallery-carousel-shell" aria-label="Aircraft and team gallery">
          <FlexCarousel
            items={galleryItems}
            preset="liquid"
            intro="rise"
            cardHeight={0.6}
            gap={18}
            squeeze={0.22}
            focusOnClick
            captions
          />
        </div>
      </div>
    </section>
  )
}
