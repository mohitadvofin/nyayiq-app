import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic rendering for auth pages — no static prerender
  output: 'standalone',
  
  // Ignore build errors on missing env vars in CI
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default nextConfig;
