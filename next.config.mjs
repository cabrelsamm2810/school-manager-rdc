/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure pdfkit is required at runtime from node_modules so its
      // bundled font data files (.afm) resolve correctly.
      config.externals = config.externals || [];
      config.externals.push('pdfkit');
    }
    return config;
  },
};

export default nextConfig;
