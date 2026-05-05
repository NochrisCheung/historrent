/**
 * GLSL shader sources for the timeline string.
 *
 * Hosted as TS template strings rather than separate `.glsl` files
 * (Phase 7 deviation — saves a Turbopack raw-loader rule).
 *
 * Phase 8.5.11: the string is now a clean horizontal line. The vertex
 * shader does no displacement; the fragment shader fades the visible
 * left/right ends to transparent based on world-x distance from the
 * camera centre (`uCurveCenter`), normalised by `uViewportHalfWidth`
 * (= `GRANULARITY_WIDTHS.year / 2 = 6` since 8.5.9 fixed the camera
 * zoom). The earlier curve/wobble shaders are gone; if a future visual
 * pass wants paper texture / vignette, this is the place to add it.
 */

export const curveVertexShader = /* glsl */ `
  varying float vWorldX;

  void main() {
    vWorldX = position.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const curveFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uCurveCenter;
  uniform float uViewportHalfWidth;
  uniform float uAlphaFalloffStart;
  uniform float uAlphaFalloffEnd;

  varying float vWorldX;

  void main() {
    // 0 at camera centre, 1 at the visible viewport edge.
    float t = abs(vWorldX - uCurveCenter) / uViewportHalfWidth;
    float alpha = 1.0 - smoothstep(uAlphaFalloffStart, uAlphaFalloffEnd, t);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/**
 * Default fragment-shader uniforms. `alphaFalloffStart` was 0.7 before
 * Phase 8.5.11; the user wanted "more blurred", so the fade now starts
 * at half the viewport from centre and runs to the visible edge.
 */
export const DEFAULT_FRAGMENT_UNIFORMS = {
  alphaFalloffStart: 0.5,
  alphaFalloffEnd: 1.0,
};
