export const aircraftVertexShader = `
uniform float uTime;
uniform float uProgress;
uniform vec2 uMouse;
uniform float uPixelRatio;
uniform float uTurbulence;
uniform float uHoverStrength;

attribute vec3 aTarget;
attribute vec3 aDirection;
attribute vec3 aTargetDirection;
attribute float aRandom;

varying float vAlpha;
varying float vGlow;

float hash(float value) {
  return fract(sin(value * 127.1) * 43758.5453123);
}

float noise(vec3 point) {
  vec3 cell = floor(point);
  vec3 local = fract(point);
  local *= local * (3.0 - 2.0 * local);
  float n = dot(cell, vec3(1.0, 57.0, 113.0));
  float a = hash(n);
  float b = hash(n + 1.0);
  float c = hash(n + 57.0);
  float d = hash(n + 58.0);
  float e = hash(n + 113.0);
  float f = hash(n + 114.0);
  float g = hash(n + 170.0);
  float h = hash(n + 171.0);
  return mix(mix(mix(a, b, local.x), mix(c, d, local.x), local.y), mix(mix(e, f, local.x), mix(g, h, local.x), local.y), local.z);
}

void main() {
  float time = uTime * 0.55;
  // Hold the intact F-22 for a deliberate scroll beat after the section pins.
  // The longer runway below makes this feel like roughly two seconds of scroll
  // before the particle change begins, even on a fast trackpad.
  float transitionProgress = clamp((uProgress - 0.30) / 0.70, 0.0, 1.0);
  float morph = smoothstep(0.5, 0.78, transitionProgress);
  float morphWindow = smoothstep(0.3, 0.5, transitionProgress) * (1.0 - smoothstep(0.62, 0.76, transitionProgress));
  float dissolve = smoothstep(0.2, 0.46, transitionProgress) * (1.0 - smoothstep(0.68, 0.8, transitionProgress));
  float activity = 0.018 + uTurbulence * 0.012;
  vec3 basePosition = mix(position, aTarget, morph);
  vec3 baseDirection = normalize(mix(aDirection, aTargetDirection, morph));
  float n = noise(basePosition * 1.7 + vec3(time * 0.35, time * 0.2, -time * 0.3)) - 0.5;

  vec3 finalPosition = basePosition;
  finalPosition += baseDirection * n * activity;
  finalPosition += vec3(
    sin(time + aRandom * 19.0) * activity * 0.6,
    cos(time * 1.17 + aRandom * 13.0) * activity * 0.5,
    sin(time * 0.8 + aRandom * 23.0) * activity * 0.4
  );

  float mouseDistance = distance(basePosition.xy, uMouse * 2.0);
  float mouseInfluence = (1.0 - smoothstep(0.14, 2.0, mouseDistance)) * uHoverStrength;
  vec3 mouseDirection = normalize(vec3(basePosition.xy - uMouse * 2.0, baseDirection.z * 0.35) + vec3(0.0001));
  float hoverSpread = mouseInfluence * (0.085 + aRandom * 0.16);
  finalPosition += mouseDirection * hoverSpread;
  finalPosition += baseDirection * mouseInfluence * (0.035 + aRandom * 0.09);
  finalPosition += baseDirection * n * mouseInfluence * 0.08;

  float shapeChange = morphWindow * (0.18 + aRandom * 0.5);
  finalPosition += baseDirection * shapeChange;
  finalPosition += baseDirection * n * (dissolve * 0.3 + morphWindow * 0.42);
  finalPosition += vec3(
    sin(time * 1.2 + aRandom * 31.0) * morphWindow * 0.16,
    cos(time + aRandom * 17.0) * morphWindow * 0.12,
    sin(time * 0.8 + aRandom * 11.0) * morphWindow * 0.16
  );
  finalPosition.y += sin(time * 1.4) * 0.025;

  vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = (2.15 + aRandom * 1.35) * uPixelRatio;
  gl_PointSize *= clamp(5.6 / -mvPosition.z, 0.7, 1.8);

  vAlpha = 0.7 + aRandom * 0.3 - morphWindow * 0.12;
  vGlow = 0.25 + mouseInfluence * 0.8 + morphWindow * 0.2;
}
`

export const aircraftFragmentShader = `
varying float vAlpha;
varying float vGlow;

void main() {
  vec2 point = gl_PointCoord - 0.5;
  float distanceToCenter = length(point);
  float softEdge = 1.0 - smoothstep(0.28, 0.5, distanceToCenter);
  float core = 1.0 - smoothstep(0.0, 0.28, distanceToCenter);
  if (softEdge < 0.01) discard;

  vec3 color = mix(vec3(0.025, 0.09, 0.19), vec3(0.25, 0.52, 0.82), core);
  color += vec3(0.04, 0.08, 0.14) * vGlow;
  gl_FragColor = vec4(color, softEdge * vAlpha);
}
`
