/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/vertex-light-final v2.html',
      },
    ];
  },
};

export default nextConfig;
