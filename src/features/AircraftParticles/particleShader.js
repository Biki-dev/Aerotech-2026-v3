export const aircraftVertexShader = `
uniform float uTime;
uniform float uProgress;
uniform vec2 uMouse;
uniform float uPixelRatio;
uniform float uTurbulence;
uniform float uHoverStrength;
uniform float uDissolve;

varying float vAlpha;
varying float vGlow;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);

  return mix(nxy0, nxy1, f.z);
}

void main() {
  vec3 raw = position;
  float time = uTime * 0.9;
  float scrollEarly = smoothstep(0.0, 0.25, uProgress);
  float scrollPeak = smoothstep(0.2, 0.68, uProgress);
  float scrollFade = 1.0 - smoothstep(0.76, 1.0, uProgress);
  float dispersion = mix(0.0, 1.0, smoothstep(0.18, 0.52, uProgress)) * scrollFade;
  float turbulence = mix(0.0, 1.0, scrollPeak) * (0.75 + uTurbulence);
  float offsetScale = 7.0 + uHoverStrength * 12.0 + dispersion * 15.0;

  float n = noise(raw * 2.2 + vec3(0.0, time * 0.5, time * 0.4));
  vec3 drift = normalize(raw + vec3(0.5, 0.1, 0.3)) * (n - 0.5) * offsetScale * (0.45 + turbulence);

  float hover = sin(raw.x * 2.3 + time * 1.7) * 0.8 + sin(raw.y * 3.1 - time * 1.2) * 0.6;
  vec2 localMouse = vec2(raw.x, raw.y) - (uMouse * 1.8);
  float mouseDist = length(localMouse);
  float mouseForce = exp(-mouseDist * 2.8) * (0.7 + uHoverStrength);
  vec3 mouseDir = normalize(vec3(localMouse.x, localMouse.y, raw.z * 0.6 + 0.2));
  vec3 mouseOffset = mouseDir * mouseForce * (18.0 + uTurbulence * 14.0);

  float spread = (0.22 + dispersion) * (1.0 - smoothstep(0.8, 1.0, uProgress));
  vec3 finalPosition = raw + drift + mouseOffset + vec3(0.0, hover * 1.3 * uHoverStrength, 0.0);
  finalPosition += normalize(raw + 1e-4) * spread * 18.0;
  finalPosition += vec3(
    sin(time + raw.y * 2.1) * (1.0 + uTurbulence) * 2.2,
    cos(time * 1.2 + raw.z * 2.4) * (1.0 + uHoverStrength) * 2.0,
    sin(time * 0.8 + raw.x * 2.5) * 1.5
  );

  vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = (5.1 + (1.0 + uPixelRatio) * 0.45) * (1.0 + mouseForce * 0.9) * (1.0 + spread * 0.35);
  gl_PointSize *= clamp(720.0 / -mvPosition.z, 0.9, 1.7);

  vAlpha = 0.76 + 0.18 * sin(raw.x * 1.7 + time * 0.8 + raw.z * 1.2) + (0.25 + uDissolve * 0.2);
  vGlow = 0.45 + mouseForce * 0.8 + scrollEarly * 0.2;
}
`

export const aircraftFragmentShader = `
varying float vAlpha;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  float alpha = smoothstep(0.48, 0.12, dist);
  float core = smoothstep(0.24, 0.0, dist);

  vec3 inner = mix(vec3(0.12, 0.18, 0.24), vec3(0.78, 0.84, 0.92), core);
  vec3 color = mix(inner, vec3(0.96, 0.99, 1.0), clamp(core * 0.9, 0.0, 1.0));
  color += vec3(0.08, 0.12, 0.18) * vGlow;

  gl_FragColor = vec4(color, alpha * vAlpha * (0.7 + core * 0.45));
}
`
