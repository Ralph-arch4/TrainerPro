import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  // Prevent clickjacking — page cannot be embedded in an iframe
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME sniffing — browser must respect declared Content-Type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Enforce HTTPS for 2 years including subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Limit Referer header leakage
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not used by this app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Legacy XSS protection (belt-and-suspenders for older browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Content Security Policy — allows Supabase, Vercel analytics, Three.js/WebGL,
  // inline styles (needed by Tailwind JIT & React inline style props).
  // 'unsafe-inline' is required for CSS-in-JS and inline style props.
  // 'wasm-unsafe-eval' is required for Three.js WebGL shaders.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Vercel analytics
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
      // Styles: self + inline (required by Tailwind inline style props)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + Supabase storage (signed URLs) + data URIs (canvas)
      "img-src 'self' data: blob: https://*.supabase.co",
      // API calls: self + Supabase + Anthropic (server-side only, but include for fetch)
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live",
      // WebWorkers and blobs (Three.js)
      "worker-src 'self' blob:",
      // No frames allowed
      "frame-src 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

  webpack(config) {
    // @mediapipe/pose has no proper ESM exports; TF.js pose-detection imports
    // it statically but MoveNet (the only model we use) never calls it at runtime.
    // Alias to an empty stub to prevent Turbopack/webpack build errors.
    (config.resolve.alias as Record<string, string>)["@mediapipe/pose"] =
      path.resolve("./lib/mediapipe-stub.js");
    return config;
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
