import process from 'node:process';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ibase/ui'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
