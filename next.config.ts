import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    '/api/**/*': ['./fassi7.db'],
  },
};

export default nextConfig;
