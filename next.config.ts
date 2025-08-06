import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
   "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
};

export default nextConfig;

