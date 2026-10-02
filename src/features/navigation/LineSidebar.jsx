import { useCallback, useEffect, useRef, useState } from 'react'
import './LineSidebar.css'

const FALLOFF_CURVES = {
  linear: (progress) => progress,
  smooth: (progress) => progress * progress * (3 - 2 * progress),
  sharp: (progress) => progress * progress * progress,
}

export default function LineSidebar({
  items,
  sectionIds,
  accentColor = '#A855F7',
  textColor = '#c4c4c4',
  markerColor = '#6c6c6c',
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 30,
  falloff = 'smooth',
  markerLength = 60,
  markerGap = 0,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 20,
  fontSize = 1.1,
  smoothing = 100,
  defaultActive = null,
  onItemClick,
  className = '',
}) {
  const listRef = useRef(null)
  const itemRefs = useRef([])
  const targetsRef = useRef([])
  const currentRef = useRef([])
  const frameRef = useRef(null)
  const runFrameRef = useRef(null)
  const lastFrameRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(defaultActive)
  const activeRef = useRef(activeIndex)
  const smoothingRef = useRef(smoothing)

  useEffect(() => {
    activeRef.current = activeIndex
    smoothingRef.current = smoothing
  }, [activeIndex, smoothing])

  const runFrame = useCallback((now) => {
    const delta = Math.min((now - lastFrameRef.current) / 1000, 0.05)
    lastFrameRef.current = now
    const timeConstant = Math.max(smoothingRef.current, 1) / 1000
    const interpolation = 1 - Math.exp(-delta / timeConstant)
    let moving = false

    itemRefs.current.forEach((element, index) => {
      if (!element) return
      const target = Math.max(targetsRef.current[index] || 0, activeRef.current === index ? 1 : 0)
      const current = currentRef.current[index] || 0
      const next = current + (target - current) * interpolation
      const settled = Math.abs(target - next) < 0.0015
      const value = settled ? target : next
      currentRef.current[index] = value
      element.style.setProperty('--effect', value.toFixed(4))
      if (!settled) moving = true
    })

    frameRef.current = moving
      ? requestAnimationFrame((nextTime) => runFrameRef.current?.(nextTime))
      : null
  }, [])

  useEffect(() => {
    runFrameRef.current = runFrame
  }, [runFrame])

  const startLoop = useCallback(() => {
    if (frameRef.current !== null) return
    lastFrameRef.current = performance.now()
    frameRef.current = requestAnimationFrame(runFrame)
  }, [runFrame])

  const handlePointerMove = useCallback((event) => {
    const list = listRef.current
    if (!list) return
    const bounds = list.getBoundingClientRect()
    const pointerY = event.clientY - bounds.top
    const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear

    itemRefs.current.forEach((element, index) => {
      if (!element) return
      const center = element.offsetTop + element.offsetHeight / 2
      const distance = Math.abs(pointerY - center)
      targetsRef.current[index] = ease(Math.max(0, 1 - distance / proximityRadius))
    })

    startLoop()
  }, [falloff, proximityRadius, startLoop])

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0)
    startLoop()
  }, [startLoop])

  const handleClick = useCallback((index, label) => {
    setActiveIndex(index)
    onItemClick?.(index, label)
  }, [onItemClick])

  useEffect(() => {
    startLoop()
  }, [activeIndex, startLoop])

  useEffect(() => {
    let scrollFrame = null

    const updateActiveSection = () => {
      scrollFrame = null
      const activationLine = window.innerHeight * 0.45
      let nextActive = 0

      sectionIds.forEach((sectionId, index) => {
        const section = document.getElementById(sectionId)
        if (section && section.getBoundingClientRect().top <= activationLine) {
          nextActive = index
        }
      })

      setActiveIndex((current) => current === nextActive ? current : nextActive)
    }

    const scheduleUpdate = () => {
      if (scrollFrame === null) scrollFrame = requestAnimationFrame(updateActiveSection)
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
    }
  }, [sectionIds])

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }, [])

  return (
    <nav
      className={`line-sidebar line-sidebar--flipped${showMarker ? ' line-sidebar--markers' : ''}${scaleTick ? ' line-sidebar--scale-tick' : ''}${className ? ` ${className}` : ''}`}
      aria-label="Page sections"
      style={{
        '--accent-color': accentColor,
        '--text-color': textColor,
        '--marker-color': markerColor,
        '--marker-length': `${markerLength}px`,
        '--marker-gap': `${markerGap}px`,
        '--tick-scale': tickScale,
        '--max-shift': `${maxShift}px`,
        '--item-gap': `${itemGap}px`,
        '--font-size': `${fontSize}rem`,
        '--smoothing': `${smoothing}ms`,
      }}
    >
      <ul
        ref={listRef}
        className="line-sidebar__list"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {items.map((label, index) => (
          <li
            key={`${label}-${index}`}
            ref={(element) => { itemRefs.current[index] = element }}
            className="line-sidebar__item"
          >
            {showMarker && <span className="line-sidebar__marker" aria-hidden="true" />}
            <a
              className="line-sidebar__label"
              href={`#${sectionIds[index]}`}
              aria-current={activeIndex === index ? 'location' : undefined}
              onClick={() => handleClick(index, label)}
            >
              {showIndex && <span className="line-sidebar__index">{String(index + 1).padStart(2, '0')}</span>}
              <span className="line-sidebar__text">{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}