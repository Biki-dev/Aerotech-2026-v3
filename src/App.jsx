import Hero from './features/hero/Hero.jsx'
import Timeline from './features/timeline/Timeline.jsx'
import Sponsors from './features/sponsors/Sponsors.jsx'
import AircraftParticleSection from './features/AircraftParticles/AircraftParticles.jsx'
import CoreTeam from './features/core-team/CoreTeam.jsx'
import Gallery from './features/gallery/Gallery.jsx'
import Footer from './features/footer/Footer.jsx'
import LineSidebar from './features/navigation/LineSidebar.jsx'
import { PageLoader } from './features/loader/WanderingEyes.jsx'

const navigationItems = ['Home', 'Timeline', 'Sponsors', 'About', 'Team', 'Gallery', 'Contact']
const sectionIds = ['home', 'timeline', 'sponsors', 'about', 'team', 'gallery', 'contact']

function App() {
  return (
    <>
      <PageLoader />
      <main id="main-content">
        <Hero />
        <Timeline />
        <Sponsors />
        <AircraftParticleSection />
        <CoreTeam />
        <Gallery />
        <Footer />
      </main>
      <LineSidebar
        items={navigationItems}
        sectionIds={sectionIds}
        accentColor="#d75b34"
        textColor="#292830"
        markerColor="#85837e"
        markerLength={38}
        markerGap={8}
        itemGap={12}
        fontSize={0.95}
        maxShift={14}
        smoothing={150}
        defaultActive={0}
      />
    </>
  )
}

export default App
