import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    
  }
};

export default nextConfig;

