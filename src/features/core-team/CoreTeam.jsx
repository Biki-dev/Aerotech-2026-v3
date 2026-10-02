import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import './core-team.css'

const members = [
  { name: 'Amlanjyoti', role: 'Aerotech Head', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790924516/IMG_20260626_102409_1_-removebg-preview_1_rgnood.png' },
  { name: 'Biki', role: 'Technical', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790091182/ChatGPT_Image_Sep_21_2026_01_03_58_PM_fpgswf.png' },
  { name: 'Ipshita', role: 'PR', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790092212/IMG_20260913_135616.jpg_1_-Photoroom_gnajgs.png' },
  { name: 'Tushar', role: 'Motion', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790092148/IMG_20260913_135743.jpg_3_-Photoroom_obhudj.png' },
  { name: 'Akashdeep', role: 'Finance', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790925255/IMG_2900_1_-Photoroom_j4jvek.png' },
  { name: 'Himanshu', role: 'Management', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790924172/ChatGPT_Image_Sep_21_2026_02_08_34_PM_xqg3r5.png' },
  { name: 'Swapnali', role: 'Graphics', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790924036/WhatsApp_Image_2026-10-02_at_11.45.33-removebg-preview_b0psjf.png' },
  { name: 'Mung Chung', role: 'Content Manager', image: 'https://res.cloudinary.com/dnmobechs/image/upload/v1790924636/WhatsApp_Image_2026-10-02_at_11.13.16-removebg-preview_jm5ndz.png' },
]

const INTRO_END = 0.76
const LAYOUT_END = 0.86

// Cover-fit a portrait into a frame, biasing the crop toward the TOP
// so faces are never cut off when a tall photo lands in a wide slot.
function imageCover(texture, width, height) {
  const image = texture.image
  if (!image?.width || !image?.height) return

  const imageRatio = image.width / image.height
  const frameRatio = width / height
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.repeat.set(1, 1)

  if (frameRatio > imageRatio) {
    // Frame wider than image: crop vertically, center Y
    texture.repeat.y = imageRatio / frameRatio
    texture.repeat.x = 1
    texture.offset.y = (1 - texture.repeat.y) / 2
    texture.offset.x = 0
  } else {
    // Frame taller than image: crop horizontally, center X
    texture.repeat.x = frameRatio / imageRatio
    texture.repeat.y = 1
    texture.offset.x = (1 - texture.repeat.x) / 2
    texture.offset.y = 0
  }
}

function PortraitScene({ progress, stageRef, featuredRef, collectionRefs, finalRefs }) {
  const textures = useTexture(members.map((member) => member.image))
  const meshes = useRef([])
  const materials = useMemo(() => textures.map((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true

    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    })
  }), [textures])

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])

  useFrame(({ size, viewport }) => {
    const stage = stageRef.current
    if (!stage) return

    const bounds = stage.getBoundingClientRect()
    const introPosition = Math.min(progress / INTRO_END * members.length, members.length)
    const activeIndex = Math.min(Math.floor(introPosition), members.length - 1)
    const memberProgress = Math.min(introPosition - activeIndex, 1)
    const layoutProgress = THREE.MathUtils.smoothstep(progress, INTRO_END, LAYOUT_END)

    const getFrame = (element) => {
      if (!element) return null
      const rect = element.getBoundingClientRect()
      if (!rect.width || !rect.height) return null
      return {
        x: ((rect.left + rect.width / 2 - bounds.left) / size.width - 0.5) * viewport.width,
        y: (0.5 - (rect.top + rect.height / 2 - bounds.top) / size.height) * viewport.height,
        width: rect.width / size.width * viewport.width,
        height: rect.height / size.height * viewport.height,
      }
    }

    const featuredFrame = getFrame(featuredRef.current)

    members.forEach((_, index) => {
      const mesh = meshes.current[index]
      const material = materials[index]
      const collectionFrame = getFrame(collectionRefs.current[index])
      const finalFrame = getFrame(finalRefs.current[index])
      if (!mesh || !finalFrame) return

      let frame = finalFrame
      let opacity = 1

      if (progress < INTRO_END) {
        if (!collectionFrame || !featuredFrame) return
        frame = collectionFrame

        if (index < activeIndex) {
          frame = collectionFrame
        } else if (index === activeIndex) {
          const imageIn = THREE.MathUtils.smoothstep(memberProgress, 0.02, 0.28)
          const flight = THREE.MathUtils.smoothstep(memberProgress, 0.64, 1)
          frame = {
            x: THREE.MathUtils.lerp(featuredFrame.x, collectionFrame.x, flight),
            y: THREE.MathUtils.lerp(featuredFrame.y, collectionFrame.y, flight),
            width: THREE.MathUtils.lerp(featuredFrame.width * 0.78, collectionFrame.width, flight),
            height: THREE.MathUtils.lerp(featuredFrame.height * 0.78, collectionFrame.height, flight),
          }
          opacity = imageIn
        } else {
          opacity = 0
        }
      } else if (progress < LAYOUT_END) {
        if (!collectionFrame) return
        frame = {
          x: THREE.MathUtils.lerp(collectionFrame.x, finalFrame.x, layoutProgress),
          y: THREE.MathUtils.lerp(collectionFrame.y, finalFrame.y, layoutProgress),
          width: THREE.MathUtils.lerp(collectionFrame.width, finalFrame.width, layoutProgress),
          height: THREE.MathUtils.lerp(collectionFrame.height, finalFrame.height, layoutProgress),
        }
      }

      mesh.position.set(frame.x, frame.y, 0)
      mesh.scale.set(frame.width, frame.height, 1)
      material.opacity = opacity
      if (material.map) imageCover(material.map, frame.width, frame.height)
      mesh.visible = opacity > 0.001
    })
  })

  return (
    <>
      {members.map((member, index) => (
        <mesh
          key={member.image}
          ref={(mesh) => { meshes.current[index] = mesh }}
          material={materials[index]}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </>
  )
}

function PortraitCanvas(props) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 10], fov: 40 }}
      gl={{ alpha: true, antialias: false }}
      aria-hidden="true"
    >
      <PortraitScene {...props} />
    </Canvas>
  )
}

export default function CoreTeam() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const featuredRef = useRef(null)
  const collectionRefs = useRef([])
  const finalRefs = useRef([])
  const [progress, setProgress] = useState(0)
  const [isNearViewport, setIsNearViewport] = useState(false)

  useEffect(() => {
    let frame = 0
    let targetProgress = 0
    let currentProgress = 0
    let lastTimestamp = 0

    const animateProgress = (timestamp) => {
      const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 1 / 60
      lastTimestamp = timestamp
      currentProgress = THREE.MathUtils.damp(currentProgress, targetProgress, 10, delta)

      if (Math.abs(targetProgress - currentProgress) < 0.0005) {
        currentProgress = targetProgress
        frame = 0
        lastTimestamp = 0
      } else {
        frame = requestAnimationFrame(animateProgress)
      }

      setProgress(currentProgress)
    }

    const updateProgress = () => {
      const section = sectionRef.current
      if (!section) return

      if (window.matchMedia('(max-width: 700px)').matches) {
        targetProgress = 1
        currentProgress = 1
        lastTimestamp = 0
        if (frame) cancelAnimationFrame(frame)
        frame = 0
        setProgress(1)
        return
      }

      const distance = section.offsetHeight - window.innerHeight
      targetProgress = THREE.MathUtils.clamp(-section.getBoundingClientRect().top / Math.max(distance, 1), 0, 1)
      if (!frame) frame = requestAnimationFrame(animateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !('IntersectionObserver' in window)) {
      setIsNearViewport(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsNearViewport(true)
        observer.disconnect()
      }
    }, { rootMargin: '1000px 0px' })

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  const introPosition = Math.min(progress / INTRO_END * members.length, members.length)
  const activeIndex = Math.min(Math.floor(introPosition), members.length - 1)
  const memberProgress = Math.min(introPosition - activeIndex, 1)
  const nameProgress = THREE.MathUtils.smoothstep(memberProgress, 0.28, 0.43)
    * (1 - THREE.MathUtils.smoothstep(memberProgress, 0.66, 0.84))
  const layoutProgress = THREE.MathUtils.smoothstep(progress, INTRO_END, LAYOUT_END)

  return (
    <section
      id="team"
      className="core-team-section"
      ref={sectionRef}
      aria-labelledby="core-team-title"
      style={{ '--roster-progress': progress }}
    >
      <div className="core-team-stage" ref={stageRef}>
        <div className="core-team-shell">
          <header className="core-team-header">
            <span className="core-team-kicker">AEROTECH / 2026</span>
            <h2 id="core-team-title">CORE TEAM</h2>
            <span className="core-team-index">PEOPLE BEHIND THE FLIGHT</span>
          </header>

          <div className={`core-team-layout${progress >= INTRO_END ? ' is-final' : ''}`}>
            <div className="core-team-feature">
              <div className="core-team-feature-frame">
                <div className="core-team-feature-photo" ref={featuredRef} />
                </div>
              <div
                className="core-team-member-copy"
                style={{ opacity: nameProgress * (1 - layoutProgress) }}
                aria-live="polite"
              >
               <h3>{members[activeIndex].name}</h3>
                <p>{members[activeIndex].role}</p>
              </div>
            </div>

            <div className="core-team-collection" aria-hidden="true">
              <div className="core-team-collection-label">
                <span>FLIGHT CREW</span><span>08 MEMBERS</span>
              </div>
              <div className="core-team-collection-grid">
                {members.map((member, index) => (
                  <div className="core-team-collection-slot" key={member.image}>
                    <div
                      className="core-team-collection-photo"
                      ref={(element) => { collectionRefs.current[index] = element }}
                    />
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="core-team-final" style={{ opacity: layoutProgress }}>
              <div className="core-team-final-heading">
                <span>THE PEOPLE BEHIND THE FLIGHT</span>
                <span>CORE TEAM / 2026</span>
              </div>
              <div className="core-team-final-grid">
                {members.map((member, index) => (
                  <article className="core-team-final-card" key={member.image}>
                    <div
                      className="core-team-final-photo"
                      ref={(element) => { finalRefs.current[index] = element }}
                    />
                    <div className="core-team-final-copy">
                      <h3>{member.name}</h3>
                      <p>{member.role}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="core-team-scroll-note" aria-hidden="true">
            <span>{progress < INTRO_END ? `MEMBER ${String(activeIndex + 1).padStart(2, '0')} / 08` : 'THE CREW'}</span>
            <div className="core-team-scroll-track"><span /></div>
            <span>SCROLL TO EXPLORE</span>
          </div>
        </div>
        {isNearViewport && (
          <div className="core-team-canvas">
            <PortraitCanvas
              progress={progress}
              stageRef={stageRef}
              featuredRef={featuredRef}
              collectionRefs={collectionRefs}
              finalRefs={finalRefs}
            />
          </div>
        )}
      </div>
    </section>
  )
}