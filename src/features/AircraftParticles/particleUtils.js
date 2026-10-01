import * as THREE from 'three'

export const PARTICLE_COUNT_DESKTOP = 60000
export const PARTICLE_COUNT_MOBILE = 24000
const NORMALIZED_AIRCRAFT_SIZE = 4.8

function createRandom(seed = 0x9e3779b9) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function emptyParticleData() {
  return {
    positions: new Float32Array(0),
    basePositions: new Float32Array(0),
    directions: new Float32Array(0),
    randoms: new Float32Array(0),
    bounds: new THREE.Box3(),
  }
}

/**
 * Samples the actual surface of every mesh in the GLB. Source vertices are
 * intentionally not used as particles: aircraft meshes often have long,
 * sparse triangles, so area-weighted barycentric sampling is what keeps the
 * silhouette dense across the fuselage, wings, and tail.
 */
export function buildAircraftParticleData(model, particleCount = PARTICLE_COUNT_DESKTOP) {
  if (!model || particleCount <= 0) return emptyParticleData()

  model.updateMatrixWorld(true)

  const vertices = []
  const cumulativeAreas = []
  const bounds = new THREE.Box3()
  let totalArea = 0
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()

  model.traverse((object) => {
    if (!object.isMesh || !object.geometry) return

    const position = object.geometry.getAttribute('position')
    if (!position || position.count < 3) return
    const index = object.geometry.getIndex()
    const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3)

    for (let triangle = 0; triangle < triangleCount; triangle += 1) {
      const getIndex = (corner) => index
        ? index.getX(triangle * 3 + corner)
        : triangle * 3 + corner

      a.fromBufferAttribute(position, getIndex(0)).applyMatrix4(object.matrixWorld)
      b.fromBufferAttribute(position, getIndex(1)).applyMatrix4(object.matrixWorld)
      c.fromBufferAttribute(position, getIndex(2)).applyMatrix4(object.matrixWorld)

      const area = b.clone().sub(a).cross(c.clone().sub(a)).length() * 0.5
      if (!Number.isFinite(area) || area < 1e-10) continue

      totalArea += area
      cumulativeAreas.push(totalArea)
      vertices.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
      bounds.expandByPoint(a).expandByPoint(b).expandByPoint(c)
    }
  })

  if (!vertices.length || totalArea <= 0) return emptyParticleData()

  const positions = new Float32Array(particleCount * 3)
  const basePositions = new Float32Array(particleCount * 3)
  const directions = new Float32Array(particleCount * 3)
  const randoms = new Float32Array(particleCount)
  const center = bounds.getCenter(new THREE.Vector3())
  const size = bounds.getSize(new THREE.Vector3())
  const scale = NORMALIZED_AIRCRAFT_SIZE / Math.max(size.x, size.y, size.z, 1e-6)
  const random = createRandom()
  const direction = new THREE.Vector3()

  for (let particle = 0; particle < particleCount; particle += 1) {
    const target = random() * totalArea
    let low = 0
    let high = cumulativeAreas.length - 1
    while (low < high) {
      const middle = (low + high) >> 1
      if (cumulativeAreas[middle] < target) low = middle + 1
      else high = middle
    }

    const vertexOffset = low * 9
    const u = random()
    const v = random()
    const rootU = Math.sqrt(u)
    const weightA = 1 - rootU
    const weightB = rootU * (1 - v)
    const weightC = rootU * v
    const x = (vertices[vertexOffset] * weightA + vertices[vertexOffset + 3] * weightB + vertices[vertexOffset + 6] * weightC - center.x) * scale
    const y = (vertices[vertexOffset + 1] * weightA + vertices[vertexOffset + 4] * weightB + vertices[vertexOffset + 7] * weightC - center.y) * scale
    const z = (vertices[vertexOffset + 2] * weightA + vertices[vertexOffset + 5] * weightB + vertices[vertexOffset + 8] * weightC - center.z) * scale
    const offset = particle * 3

    positions[offset] = x
    positions[offset + 1] = y
    positions[offset + 2] = z
    basePositions[offset] = x
    basePositions[offset + 1] = y
    basePositions[offset + 2] = z

    direction.set(x, y, z)
    if (direction.lengthSq() < 1e-8) direction.set(0, 1, 0)
    direction.normalize()
    directions[offset] = direction.x
    directions[offset + 1] = direction.y
    directions[offset + 2] = direction.z
    randoms[particle] = random()
  }

  return { positions, basePositions, directions, randoms, bounds }
}
