import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import './core-team.css'

const team = [
  { name: 'Amlanjyoti', role: 'Aerotech Head', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790091019/IMG_20260628_105813.jpg_2_-removebg-preview_fk1bgy.png' },
  { name: 'Biki', role: 'Design & Experience', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790091019/IMG_20260628_105813.jpg_2_-removebg-preview_fk1bgy.png' },
  { name: 'Anurag', role: 'Flight Operations', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790091019/IMG_20260628_105813.jpg_2_-removebg-preview_fk1bgy.png' },
  { name: 'Debanjan', role: 'Technical Lead', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790091019/IMG_20260628_105813.jpg_2_-removebg-preview_fk1bgy.png' },
  { name: 'Kaustav', role: 'Workshop Lead', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790091019/IMG_20260628_105813.jpg_2_-removebg-preview_fk1bgy.png' },
  { name: 'Rishav', role: 'Competition Lead', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790091019/IMG_20260628_105813.jpg_2_-removebg-preview_fk1bgy.png' },
  { name: 'Sayan', role: 'Media & Outreach', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790091019/IMG_20260628_105813.jpg_2_-removebg-preview_fk1bgy.png' },
  { name: 'Tuhin', role: 'Logistics Lead', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790091019/IMG_20260628_105813.jpg_2_-removebg-preview_fk1bgy.png' },
]

const STEP_SIZE = 0.075
const FINAL_START = STEP_SIZE * team.length

function TeamImagePlane({ index, textures, phase }) {
  const groupRef = useRef(null)
  const materialRef = useRef(null)
  const texture = textures[index]

  useFrame(() => {
    if (!groupRef.current || !materialRef.current) return
    const enter = THREE.MathUtils.smoothstep(phase, 0.04, 0.34)
    const hold = 1 - THREE.MathUtils.smoothstep(phase, 0.54, 0.75)
    const fly = THREE.MathUtils.smoothstep(phase, 0.68, 1)
    const visible = Math.max(enter * hold, fly * 0.92)

    groupRef.current.position.x = THREE.MathUtils.lerp(-0.05, 3.8, fly)
    groupRef.current.position.y = THREE.MathUtils.lerp(-0.1, 1.15, fly)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(0, -0.12, fly)
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.8, 0.22, fly))
    materialRef.current.opacity = visible
  })

  return (
    <group ref={groupRef} position={[-0.05, -0.1, 0]}>
      <mesh>
        <planeGeometry args={[2.55, 3.2]} />
        <meshBasicMaterial ref={materialRef} map={texture} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

function TeamCanvas({ activeIndex, phase }) {
  const textures = useLoader(THREE.TextureLoader, team.map((member) => member.image))

  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    })
  }, [textures])

  return (
    <Canvas
      className="core-team-canvas"
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 7], fov: 34 }}
      gl={{ alpha: true, antialias: true }}
    >
      <TeamImagePlane index={activeIndex} textures={textures} phase={phase} />
    </Canvas>
  )
}

function getScrollProgress(section) {
  const rect = section.getBoundingClientRect()
  return THREE.MathUtils.clamp((window.innerHeight - rect.top) / rect.height, 0, 1)
}

export default function CoreTeam() {
  const sectionRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [reducedMotion] = useState(() => (
    typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))

  useEffect(() => {
    const update = () => {
      if (sectionRef.current) setProgress(getScrollProgress(sectionRef.current))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const animationProgress = reducedMotion ? 1 : progress
  const activeIndex = Math.min(team.length - 1, Math.floor(animationProgress / STEP_SIZE))
  const phase = Math.min(1, (animationProgress - activeIndex * STEP_SIZE) / STEP_SIZE)
  const completedCount = Math.min(team.length, Math.max(0, Math.floor(animationProgress / STEP_SIZE)))
  const finalProgress = THREE.MathUtils.smoothstep(animationProgress, FINAL_START, FINAL_START + 0.11)
  const isFinal = animationProgress >= FINAL_START

  const finalTransform = useMemo(() => {
    const rotation = -90 * (1 - finalProgress)
    const scale = 0.78 + finalProgress * 0.22
    return { transform: `rotate(${rotation}deg) scale(${scale})` }
  }, [finalProgress])

  return (
    <section ref={sectionRef} className={`core-team-section${isFinal ? ' is-final' : ''}`} aria-labelledby="core-team-title">
      <div className="core-team-sticky">
        <div className="core-team-shell">
          <header className="core-team-header">
            <span className="core-team-kicker">Aerotech / 2026 / People</span>
            <h2 id="core-team-title">CORE TEAM</h2>
            <span className="core-team-count">{String(Math.min(team.length, completedCount + (isFinal ? 0 : 1))).padStart(2, '0')} / 08</span>
          </header>

          <div className="core-team-layout">
            <div className="core-team-feature">
              <div className="core-team-feature-stage">
                <TeamCanvas activeIndex={activeIndex} phase={isFinal ? 1 : phase} />
                <span className="core-team-stage-label">{isFinal ? 'FULL CREW' : `MEMBER ${String(activeIndex + 1).padStart(2, '0')}`}</span>
              </div>
              <div className={`core-team-feature-copy${isFinal ? ' is-hidden' : ''}`}>
                <span className="core-team-feature-index">0{activeIndex + 1} — 08</span>
                <h3>{team[activeIndex].name}</h3>
                <p>{team[activeIndex].role}</p>
              </div>
            </div>

            <div className="core-team-roster-wrap">
              <div className="core-team-roster" style={isFinal ? finalTransform : undefined}>
                {team.map((member, index) => {
                  const filled = index < completedCount || (isFinal && index < team.length)
                  return (
                    <article className={`core-team-card${filled ? ' is-filled' : ''}`} key={member.name}>
                      <div className="core-team-card-media">
                        {filled ? <img src={member.image} alt={`${member.name}, ${member.role}`} /> : <span>{String(index + 1).padStart(2, '0')}</span>}
                      </div>
                      <div className="core-team-card-copy">
                        <h3>{member.name}</h3>
                        <p>{member.role}</p>
                      </div>
                    </article>
                  )
                })}
              </div>
              <span className="core-team-roster-label">{isFinal ? 'MEET THE CREW' : 'ROLL CALL / 08 POSITIONS'}</span>
            </div>
          </div>

          <div className="core-team-scroll-note">Scroll to assemble the crew <span aria-hidden="true">↘</span></div>
        </div>
      </div>
    </section>
  )
}
