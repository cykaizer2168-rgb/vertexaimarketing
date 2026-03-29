/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/vertex-light.html',
      },
    ];
  },
};

export default nextConfig;
