/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/vertex-light-final.html',
      },
    ];
  },
};

export default nextConfig;
