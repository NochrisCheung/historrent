/**
 * GLSL shader sources for the curved timeline string.
 *
 * Hosted as TS template strings rather than separate `.glsl` files (Phase 7
 * deviation from plan task 7.2a — saves a Turbopack raw-loader rule). The
 * vertex shader's displacement math MUST stay in lockstep with
 * `geometry/curve.ts#curveYAt`; both share the same uniform names and
 * same smoothstep formula.
 *
 * Phase 11 visual iteration may add a fragment-shader vignette / paper
 * texture pass; today the fragment shader is just a flat colour with
 * alpha falloff at the curl tips.
 */

export const curveVertexShader = /* glsl */ `
  uniform float uCenterFlatHalfWidth;
  uniform float uCurveAmount;
  uniform float uCurveSharpness;

  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec3 displaced = position;
    float xAbs = abs(position.x);
    float beyondFlat = max(xAbs - uCenterFlatHalfWidth, 0.0);
    float t = smoothstep(0.0, uCurveSharpness, beyondFlat);
    displaced.y -= t * uCurveAmount;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const curveFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlphaFalloffStart;
  uniform float uAlphaFalloffEnd;

  varying vec2 vUv;

  void main() {
    // 0 at the centre, 1 at the left/right edges.
    float distFromCentre = abs(vUv.x - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(uAlphaFalloffStart, uAlphaFalloffEnd, distFromCentre);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/** Default fragment-shader uniforms; these aren't tunable from Leva today. */
export const DEFAULT_FRAGMENT_UNIFORMS = {
  alphaFalloffStart: 0.7,
  alphaFalloffEnd: 1.0,
};
