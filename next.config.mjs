/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/index",        destination: "/ai-index",        permanent: false },
      { source: "/index/:path*", destination: "/ai-index/:path*", permanent: false },
    ];
  },
  webpack: (config) => {
    // react-pdf uses canvas internally — exclude it from the server bundle
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
