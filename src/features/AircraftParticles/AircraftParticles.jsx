import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'

const fighterModelUrl = new URL('../../assets/f-22.glb', import.meta.url).href

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
  const { scene } = useGLTF(fighterModelUrl)
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window === 'undefined') return 'desktop'
    return window.innerWidth < 768 ? 'mobile' : 'desktop'
  })

  useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth < 768 ? 'mobile' : 'desktop')
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const particleCount = screenSize === 'mobile' ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP

  const particleData = useMemo(
    () => buildAircraftParticleData(scene, particleCount),
    [scene, particleCount],
  )

  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry()
    nextGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(particleData.positions, 3),
    )
    nextGeometry.computeBoundingSphere()
    return nextGeometry
  }, [particleData.positions])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
          uTurbulence: { value: 0.8 },
          uHoverStrength: { value: 1 },
          uDissolve: { value: 0 },
        },
        vertexShader: aircraftVertexShader,
        fragmentShader: aircraftFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    const nextPoints = pointsRef.current
    const nextGroup = groupRef.current

    if (nextGroup) {
      nextGroup.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.26
      nextGroup.rotation.y = THREE.MathUtils.lerp(
        nextGroup.rotation.y,
        -state.pointer.x * 0.85 - 0.9,
        0.05,
      )
      nextGroup.rotation.x = THREE.MathUtils.lerp(
        nextGroup.rotation.x,
        0.42 + state.pointer.y * 0.18,
        0.05,
      )
      nextGroup.rotation.z = THREE.MathUtils.lerp(
        nextGroup.rotation.z,
        -0.08 + state.pointer.x * 0.08,
        0.05,
      )
    }

    if (!nextPoints) return

    const uniforms = nextPoints.material.uniforms
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uProgress.value = scrollProgress
    uniforms.uMouse.value.set(state.pointer.x, state.pointer.y)
    uniforms.uPixelRatio.value = Math.min(state.viewport.dpr, 2)
    uniforms.uTurbulence.value =
      0.8 + scrollProgress * 1.6 + (Math.abs(state.pointer.x) + Math.abs(state.pointer.y)) * 0.35
    uniforms.uHoverStrength.value = 0.9 + scrollProgress * 1.3
    uniforms.uDissolve.value = Math.min(1, scrollProgress * 1.1)
  })

  return (
    <group ref={groupRef} scale={1.52}>
      <points ref={pointsRef} geometry={geometry} material={material} />
    </group>
  )
}

function AircraftScene({ scrollProgress }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.3, 6.5], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={['#FBFAF6']} />
      <fog attach="fog" args={['#FBFAF6', 16, 30]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 3]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-4, -1, -2]} intensity={0.6} color="#b7d0ff" />
      <AircraftModel scrollProgress={scrollProgress} />
    </Canvas>
  )
}

export default function AircraftParticleSection() {
  const sectionRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const progress = THREE.MathUtils.clamp(
        (viewportHeight - rect.top) / (rect.height + viewportHeight * 0.65),
        0,
        1,
      )

      setScrollProgress(progress)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return (
    <section className="aircraft-particle-section" ref={sectionRef} aria-labelledby="aircraft-particle-title">
      <div className="aircraft-particle-shell">
        <header className="aircraft-particle-header">
          <span className="aircraft-particle-kicker">AEROTECH</span>
          <p className="aircraft-particle-subhead">ENGINEERED TO MOVE</p>
          <p className="aircraft-particle-description">
            Fighter-grade design, refined for motion and precision.
          </p>
        </header>

        <div className="aircraft-particle-visual">
          <div className="aircraft-particle-stage">
            <AircraftScene scrollProgress={scrollProgress} />
          </div>

          <div className="aircraft-particle-badge">
            <span className="aircraft-particle-badge__mark" aria-hidden="true">
              ✈
            </span>
            <span id="aircraft-particle-title">PARTICLE AIRCRAFT</span>
          </div>
        </div>

        <div className="aircraft-particle-footer" aria-label="Explore the particle aircraft">
          <span>EXPLORE</span>
          <span className="aircraft-particle-arrow" aria-hidden="true">
            ↓
          </span>
        </div>
      </div>
    </section>
  )
}

useGLTF.preload(fighterModelUrl)
