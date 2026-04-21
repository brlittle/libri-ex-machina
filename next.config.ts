import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Next.js output-file tracing doesn't automatically include native .so.node
  // binaries from custom Prisma output paths. This forces them into the bundle
  // so Prisma can find the query engine at runtime on Vercel (rhel-openssl-3.0.x).
  outputFileTracingIncludes: {
    "/**": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
