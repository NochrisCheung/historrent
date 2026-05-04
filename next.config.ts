import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Three.js ships ESM. Most consumers tree-shake fine, but some R3F helpers
  // historically needed transpilation. Add packages here if a build error points
  // to one of them.
  transpilePackages: [],

  // Turbopack is the default builder in Next.js 16+. We add loaders here in
  // Phase 7 when shader files (`.glsl`/`.vert`/`.frag`) need raw-string imports.
  // See implementation plan §3.5 and Phase 7.
  turbopack: {},
};

export default nextConfig;
