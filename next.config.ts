import type { NextConfig } from "next";

/**
 * Launch security headers. CSP allows MediaPipe WASM/CDN, Supabase, Stripe,
 * OpenAI-backed app routes, and Vercel Analytics without blocking the product.
 */
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://va.vercel-scripts.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://storage.googleapis.com https://api.openai.com https://api.stripe.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** HTML shells must revalidate so regular Safari does not keep a pre-fix CTA. */
const htmlRevalidateHeaders = [
  {
    key: "Cache-Control",
    value: "private, no-cache, no-store, must-revalidate",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Document routes only — hashed /_next/static assets stay immutable.
      { source: "/", headers: htmlRevalidateHeaders },
      { source: "/r", headers: htmlRevalidateHeaders },
      { source: "/r/:path*", headers: htmlRevalidateHeaders },
      { source: "/assessments", headers: htmlRevalidateHeaders },
      { source: "/login", headers: htmlRevalidateHeaders },
      { source: "/unlock", headers: htmlRevalidateHeaders },
    ];
  },
};

export default nextConfig;
