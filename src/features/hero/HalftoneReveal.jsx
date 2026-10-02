import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl'
import './HalftoneReveal.css'

const hexToRgb = (hex) => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  return match ? [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255] : [0, 0, 0]
}

const modes = { mono: 0, duotone: 1, color: 2 }
const shapes = { circle: 0, square: 1, diamond: 2, line: 3 }
const triggers = { off: 0, hover: 1, always: 2 }

const vertex = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragment = `#version 300 es
precision highp float;

uniform sampler2D tMap;
uniform vec2 iResolution;
uniform vec2 uImageSize;
uniform vec2 uMouse;
uniform float uActivity;
uniform float uDotSize;
uniform float uDensity;
uniform float uAngle;
uniform int uShape;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform int uMode;
uniform float uContrast;
uniform float uInvert;
uniform float uRevealRadius;
uniform float uEdge;
uniform float uIdleReveal;
uniform int uTrigger;

in vec2 vUv;
out vec4 fragColor;

vec2 uAspect() {
  return vec2(iResolution.x / max(iResolution.y, 1.0), 1.0);
}

vec2 coverUv(vec2 uv) {
  float imageAspect = uImageSize.x / max(uImageSize.y, 1.0);
  float panelAspect = iResolution.x / max(iResolution.y, 1.0);
  vec2 scale = panelAspect > imageAspect ? vec2(1.0, imageAspect / panelAspect) : vec2(panelAspect / imageAspect, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

vec3 gradeRGB(vec3 color) {
  color = clamp((color - 0.5) * uContrast + 0.5, 0.0, 1.0);
  return mix(color, 1.0 - color, uInvert);
}

float shapeDist(vec2 point) {
  if (uShape == 1) return max(abs(point.x), abs(point.y));
  if (uShape == 2) return abs(point.x) + abs(point.y);
  if (uShape == 3) return abs(point.y);
  return length(point);
}

mat2 rot(float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);
  return mat2(cosine, -sine, sine, cosine);
}

vec4 sampleCell(vec2 position, float density, float angle) {
  vec2 rotated = rot(angle) * position * density;
  vec2 center = floor(rotated) + 0.5;
  vec2 cellPosition = rot(-angle) * (center / density);
  return texture(tMap, clamp(coverUv(cellPosition / uAspect()), 0.0, 1.0));
}

float coverage(vec2 position, float density, float angle, float ink, float scale) {
  vec2 rotated = rot(angle) * position * density;
  vec2 localPosition = fract(rotated) - 0.5;
  float distanceToCenter = shapeDist(localPosition);
  float radius = sqrt(clamp(ink, 0.0, 1.0)) * 0.72 * scale * uDotSize;
  float width = length(fwidth(rotated)) * 0.6 + 1e-4;
  return smoothstep(radius + width, radius - width, distanceToCenter);
}

void main() {
  vec2 aspect = uAspect();
  vec2 position = vUv * aspect;
  float angle = radians(uAngle);
  vec2 delta = (vUv - uMouse) * aspect;
  float distanceFromMouse = length(delta);
  float activity = uTrigger == 2 ? 1.0 : (uTrigger == 0 ? 0.0 : uActivity);
  float radius = max(uRevealRadius, 1e-4) * mix(0.4, 1.0, activity);
  float pixelWidth = 1.4 / max(iResolution.y, 1.0);
  float band = max(pixelWidth, radius * (1.0 - clamp(uEdge, 0.0, 1.0)) * 0.45);
  float loupe = 1.0 - smoothstep(radius - band, radius + band, distanceFromMouse);
  float focus = clamp(max(loupe * activity, uIdleReveal), 0.0, 1.0);

  float density = uDensity;
  vec3 printColor;
  if (uMode == 2) {
    vec3 cyanSample = gradeRGB(sampleCell(position, density, angle + radians(15.0)).rgb);
    vec3 magentaSample = gradeRGB(sampleCell(position, density, angle + radians(75.0)).rgb);
    vec3 yellowSample = gradeRGB(sampleCell(position, density, angle).rgb);
    vec3 blackSample = gradeRGB(sampleCell(position, density, angle + radians(45.0)).rgb);
    float cyan = 1.0 - cyanSample.r;
    float magenta = 1.0 - magentaSample.g;
    float yellow = 1.0 - yellowSample.b;
    float black = 1.0 - dot(blackSample, vec3(0.299, 0.587, 0.114));
    float gray = min(min(cyan, magenta), yellow) * 0.5;
    cyan = clamp(cyan - gray, 0.0, 1.0);
    magenta = clamp(magenta - gray, 0.0, 1.0);
    yellow = clamp(yellow - gray, 0.0, 1.0);
    black = clamp(max(gray, black * black * 0.9), 0.0, 1.0);
    float cyanCoverage = coverage(position, density, angle + radians(15.0), cyan, 0.82);
    float magentaCoverage = coverage(position, density, angle + radians(75.0), magenta, 0.82);
    float yellowCoverage = coverage(position, density, angle, yellow, 0.82);
    float blackCoverage = coverage(position, density, angle + radians(45.0), black, 0.78);
    printColor = uPaper;
    printColor = mix(printColor, printColor * vec3(0.10, 0.72, 0.90), cyanCoverage);
    printColor = mix(printColor, printColor * vec3(0.92, 0.10, 0.52), magentaCoverage);
    printColor = mix(printColor, printColor * vec3(0.98, 0.86, 0.10), yellowCoverage);
    printColor = mix(printColor, printColor * vec3(0.08), blackCoverage);
  } else if (uMode == 1) {
    vec3 secondInk = mix(uInk.gbr, vec3(0.90, 0.24, 0.30), 0.7);
    float firstLuminance = dot(gradeRGB(sampleCell(position, density, angle).rgb), vec3(0.299, 0.587, 0.114));
    float secondLuminance = dot(gradeRGB(sampleCell(position, density, angle + radians(38.0)).rgb), vec3(0.299, 0.587, 0.114));
    float firstCoverage = coverage(position, density, angle, 1.0 - firstLuminance, 1.0);
    float secondCoverage = coverage(position, density, angle + radians(38.0), pow(1.0 - secondLuminance, 1.4), 0.92);
    printColor = mix(uPaper, secondInk, secondCoverage * 0.85);
    printColor = mix(printColor, uInk, firstCoverage);
  } else {
    float luminance = dot(gradeRGB(sampleCell(position, density, angle).rgb), vec3(0.299, 0.587, 0.114));
    printColor = mix(uPaper, uInk, coverage(position, density, angle, 1.0 - luminance, 1.0));
  }

  float radialPosition = clamp(distanceFromMouse / radius, 0.0, 1.0);
  float bend = radialPosition * radialPosition * radialPosition * radialPosition;
  vec2 direction = distanceFromMouse > 1e-5 ? delta / distanceFromMouse : vec2(0.0);
  vec2 offset = direction * bend * radius * 0.22 / aspect;
  vec2 chromaticOffset = direction * bend * 0.0045 / aspect;
  vec3 sharpColor = gradeRGB(vec3(
    texture(tMap, clamp(coverUv(vUv - offset - chromaticOffset), 0.0, 1.0)).r,
    texture(tMap, clamp(coverUv(vUv - offset), 0.0, 1.0)).g,
    texture(tMap, clamp(coverUv(vUv - offset + chromaticOffset), 0.0, 1.0)).b
  ));
  fragColor = vec4(mix(printColor, sharpColor, focus), 1.0);
}
`

function HalftoneReveal({
  sourceCanvasRef,
  inkColor = '#141414',
  paperColor = '#fff7e6',
  mode = 'mono',
  dotSize = 1,
  dotDensity = 71,
  angle = 45,
  shape = 'circle',
  contrast = 1.15,
  invert = false,
  revealRadius = 0.4,
  edge = 0.8,
  follow = 0.37,
  idleReveal = 0,
  trigger = 'hover',
  borderRadius = '16px',
  className = '',
  style,
}) {
  const containerRef = useRef(null)
  const uniformsRef = useRef(null)
  const followRef = useRef(follow)

  useEffect(() => {
    followRef.current = follow
  }, [follow])

  useEffect(() => {
    const container = containerRef.current
    const sourceCanvas = sourceCanvasRef?.current
    if (!container || !sourceCanvas) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: false,
      antialias: true,
    })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 1)
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    gl.canvas.style.display = 'block'
    container.appendChild(gl.canvas)

    const texture = new Texture(gl, { image: sourceCanvas, generateMipmaps: false })
    const uniforms = {
      tMap: { value: texture },
      iResolution: { value: [1, 1] },
      uImageSize: { value: [sourceCanvas.width, sourceCanvas.height] },
      uMouse: { value: [0.5, 0.5] },
      uActivity: { value: 0 },
      uDotSize: { value: dotSize },
      uDensity: { value: dotDensity },
      uAngle: { value: angle },
      uShape: { value: shapes[shape] ?? 0 },
      uInk: { value: hexToRgb(inkColor) },
      uPaper: { value: hexToRgb(paperColor) },
      uMode: { value: modes[mode] ?? 0 },
      uContrast: { value: contrast },
      uInvert: { value: invert ? 1 : 0 },
      uRevealRadius: { value: revealRadius },
      uEdge: { value: edge },
      uIdleReveal: { value: idleReveal },
      uTrigger: { value: triggers[trigger] ?? 1 },
    }
    uniformsRef.current = uniforms

    const program = new Program(gl, { vertex, fragment, uniforms })
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })
    const mouse = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5, active: 0, target: 0 }

    const resize = () => {
      renderer.setSize(container.clientWidth || 1, container.clientHeight || 1)
      uniforms.iResolution.value = [gl.canvas.width, gl.canvas.height]
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const onMove = (event) => {
      const bounds = container.getBoundingClientRect()
      mouse.x = (event.clientX - bounds.left) / bounds.width
      mouse.y = 1 - (event.clientY - bounds.top) / bounds.height
      mouse.target = reducedMotion ? 0 : 1
    }
    const onLeave = () => {
      mouse.target = 0
    }
    container.addEventListener('pointermove', onMove, { passive: true })
    container.addEventListener('pointerenter', onMove, { passive: true })
    container.addEventListener('pointerleave', onLeave, { passive: true })

    let previousTime = performance.now()
    let animationFrameId
    const render = (now) => {
      const deltaTime = Math.min(0.05, Math.max(0.001, (now - previousTime) / 1000))
      previousTime = now
      const followAmount = 1 - Math.exp(-deltaTime / Math.max(0.001, followRef.current))
      const activityAmount = 1 - Math.exp(-deltaTime / 0.18)
      mouse.sx += (mouse.x - mouse.sx) * followAmount
      mouse.sy += (mouse.y - mouse.sy) * followAmount
      mouse.active += (mouse.target - mouse.active) * activityAmount
      uniforms.uMouse.value[0] = mouse.sx
      uniforms.uMouse.value[1] = mouse.sy
      uniforms.uActivity.value = mouse.active
      uniforms.uImageSize.value = [sourceCanvas.width, sourceCanvas.height]
      texture.needsUpdate = true
      renderer.render({ scene: mesh })
      animationFrameId = window.requestAnimationFrame(render)
    }
    animationFrameId = window.requestAnimationFrame(render)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerenter', onMove)
      container.removeEventListener('pointerleave', onLeave)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      gl.canvas.remove()
      uniformsRef.current = null
    }
    // Visual props are kept current by the uniform-sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceCanvasRef])

  useEffect(() => {
    const uniforms = uniformsRef.current
    if (!uniforms) return
    uniforms.uDotSize.value = dotSize
    uniforms.uDensity.value = dotDensity
    uniforms.uAngle.value = angle
    uniforms.uShape.value = shapes[shape] ?? 0
    uniforms.uInk.value = hexToRgb(inkColor)
    uniforms.uPaper.value = hexToRgb(paperColor)
    uniforms.uMode.value = modes[mode] ?? 0
    uniforms.uContrast.value = contrast
    uniforms.uInvert.value = invert ? 1 : 0
    uniforms.uRevealRadius.value = revealRadius
    uniforms.uEdge.value = edge
    uniforms.uIdleReveal.value = idleReveal
    uniforms.uTrigger.value = triggers[trigger] ?? 1
  }, [dotSize, dotDensity, angle, shape, inkColor, paperColor, mode, contrast, invert, revealRadius, edge, idleReveal, trigger])

  return (
    <div
      ref={containerRef}
      className={`halftone-reveal ${className}`.trim()}
      style={{ borderRadius, ...style }}
      aria-hidden="true"
    />
  )
}

export default HalftoneReveal