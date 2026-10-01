import * as THREE from 'three'

export const PARTICLE_COUNT_DESKTOP = 42000
export const PARTICLE_COUNT_MOBILE = 24000

export function buildAircraftParticleData(model, particleCount = PARTICLE_COUNT_DESKTOP) {
  if (!model) {
    return {
      positions: new Float32Array(0),
      basePositions: new Float32Array(0),
      bounds: new THREE.Box3(),
    }
  }

  const sampledPositions = []
  const bounds = new THREE.Box3()

  model.traverse((object) => {
    if (!object.isMesh || !object.geometry) return

    const geometry = object.geometry.clone()
    const worldMatrix = object.matrixWorld.clone()
    geometry.applyMatrix4(worldMatrix)

    const positionAttribute = geometry.getAttribute('position')
    if (!positionAttribute || positionAttribute.count === 0) return

    for (let index = 0; index < positionAttribute.count; index += 1) {
      const x = positionAttribute.getX(index)
      const y = positionAttribute.getY(index)
      const z = positionAttribute.getZ(index)

      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        continue
      }

      sampledPositions.push(x, y, z)
      bounds.expandByPoint(new THREE.Vector3(x, y, z))
    }
  })

  if (!sampledPositions.length) {
    return {
      positions: new Float32Array(0),
      basePositions: new Float32Array(0),
      bounds: new THREE.Box3(),
    }
  }

  const totalVertices = sampledPositions.length / 3
  const step = totalVertices <= particleCount ? 1 : Math.floor(totalVertices / particleCount)
  const selected = []

  for (let index = 0; index < totalVertices; index += step) {
    const i3 = index * 3
    selected.push(sampledPositions[i3], sampledPositions[i3 + 1], sampledPositions[i3 + 2])
  }

  const finalPositions = selected.length > particleCount * 3
    ? selected.slice(0, particleCount * 3)
    : selected

  const positions = new Float32Array(finalPositions.length)
  const basePositions = new Float32Array(finalPositions.length)
  const center = bounds.getCenter(new THREE.Vector3())

  for (let index = 0; index < finalPositions.length; index += 3) {
    positions[index] = finalPositions[index] - center.x
    positions[index + 1] = finalPositions[index + 1] - center.y
    positions[index + 2] = finalPositions[index + 2] - center.z

    basePositions[index] = positions[index]
    basePositions[index + 1] = positions[index + 1]
    basePositions[index + 2] = positions[index + 2]
  }

  return {
    positions,
    basePositions,
    bounds,
  }
}
