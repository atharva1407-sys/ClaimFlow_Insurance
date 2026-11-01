/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a build run into a separate folder (NEXT_DIST_DIR=.next-check) without disturbing a running dev server.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/api/**/*': ['./cashless_request_form.pdf'],
  },
  // Allow loading local PDFs for preview
  webpack: (config) => {
    return config;
  }
};

export default nextConfig;
