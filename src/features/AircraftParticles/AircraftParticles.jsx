import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'

const fighterModelUrl = new URL('../../assets/f-22.glb', import.meta.url).href
const cessnaModelUrl = new URL('../../assets/cessna-172.glb', import.meta.url).href

import {
  buildAircraftParticleData,
  PARTICLE_COUNT_DESKTOP,
  PARTICLE_COUNT_MOBILE,
} from './particleUtils.js'
import { aircraftFragmentShader, aircraftVertexShader } from './particleShader.js'
import './aircraft-particles.css'

function AircraftModel({ scrollProgress }) {
  const groupRef = useRef(null)
  const pointsRef = useRef(null)
  const { scene: fighterScene } = useGLTF(fighterModelUrl)
  const { scene: cessnaScene } = useGLTF(cessnaModelUrl)
  const [screenSize, setScreenSize] = useState(() => (
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
  ))

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth < 768 ? 'mobile' : 'desktop')
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const particleCount = screenSize === 'mobile' ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP

  useEffect(() => {
    window.__aerotechAircraftReady = true
    window.dispatchEvent(new Event('aerotech:aircraft-ready'))
  }, [fighterScene, cessnaScene])

  const particleData = useMemo(() => {
    const fighter = buildAircraftParticleData(fighterScene, particleCount)
    const cessna = buildAircraftParticleData(cessnaScene, particleCount)
    return { fighter, cessna }
  }, [fighterScene, cessnaScene, particleCount])

  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry()
    nextGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particleData.fighter.positions, 3))
    nextGeometry.setAttribute('aTarget', new THREE.Float32BufferAttribute(particleData.cessna.positions, 3))
    nextGeometry.setAttribute('aDirection', new THREE.Float32BufferAttribute(particleData.fighter.directions, 3))
    nextGeometry.setAttribute('aTargetDirection', new THREE.Float32BufferAttribute(particleData.cessna.directions, 3))
    nextGeometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(particleData.fighter.randoms, 1))
    nextGeometry.computeBoundingSphere()
    return nextGeometry
  }, [particleData])

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: 1 },
      uTurbulence: { value: 0.6 },
      uHoverStrength: { value: 0.88 },
    },
    vertexShader: aircraftVertexShader,
    fragmentShader: aircraftFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  }), [])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame((state) => {
    const group = groupRef.current
    const points = pointsRef.current
    if (group) {
      const pointerX = state.pointer.x || 0
      const pointerY = state.pointer.y || 0
      group.position.y = Math.sin(state.clock.elapsedTime * 0.85) * 0.06
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, -0.62 - pointerX * 0.12, 0.035)
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0.22 + pointerY * 0.05, 0.035)
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, pointerX * 0.025, 0.035)
    }
    if (!points) return

    const uniforms = points.material.uniforms
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uProgress.value = scrollProgress
    uniforms.uMouse.value.lerp(state.pointer, 0.12)
    uniforms.uPixelRatio.value = Math.min(state.viewport.dpr, 1.8)
    uniforms.uTurbulence.value = 0.55 + scrollProgress * 1.15
    uniforms.uHoverStrength.value = 0.88 + scrollProgress * 0.35
  })

  return (
    <group ref={groupRef} scale={[-1, 1, 1]}>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}

function AircraftScene({ scrollProgress }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.55, 7.2], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={['#FBFAF6']} />
      <AircraftModel scrollProgress={scrollProgress} />
    </Canvas>
  )
}

export default function AircraftParticleSection() {
  const sectionRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches
  ))

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 700px)')
    const updateMobileState = () => setIsMobile(mobileQuery.matches)
    mobileQuery.addEventListener('change', updateMobileState)
    return () => mobileQuery.removeEventListener('change', updateMobileState)
  }, [])

  useEffect(() => {
    if (isMobile) return undefined
    useGLTF.preload(fighterModelUrl)
    useGLTF.preload(cessnaModelUrl)
    return undefined
  }, [isMobile])

  useEffect(() => {
    if (isMobile) return undefined

    const updateProgress = () => {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      setScrollProgress(THREE.MathUtils.clamp(
        (viewportHeight - rect.top) / rect.height,
        0,
        1,
      ))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [isMobile])

  return (
    <section id="about" className="aircraft-particle-section" ref={sectionRef} aria-labelledby="aircraft-particle-title">
      <div className="aircraft-particle-shell">
        <div className="aircraft-particle-layout">
          <div className="aircraft-particle-copy">
            <span className="aircraft-particle-kicker">AEROTECH / 2026</span>
            <h2 id="aircraft-particle-title" className="aircraft-particle-title">
              ABOUT
            </h2>
            <div className="aircraft-particle-description">
              <p>
                Aerotech is the flagship aeromodelling workshop and competition — a convergence of innovation, engineering, and the boundless sky.
              </p>
              <p>
                From hands-on aeromodelling workshops to building and flying model aircraft, from keynote sessions by chief guests from the industry to exciting competitions — Aerotech brings together the brightest minds who dare to take flight.
              </p>
              <p>
                Now in its 2026 edition, Aerotech continues to grow as a platform where future aeromodelling enthusiasts are born, ideas take flight, and innovation is celebrated.
              </p>
            </div>
            <div className="aircraft-particle-copy-meta">
              <span>WORKSHOP / COMPETITION / FLIGHT</span>
            </div>
          </div>

          <div className="aircraft-particle-visual">
            <div className="aircraft-particle-stage">
              {!isMobile && <AircraftScene scrollProgress={scrollProgress} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
