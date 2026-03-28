/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/vertex-light-4.html',
      },
    ];
  },
};

export default nextConfig;
