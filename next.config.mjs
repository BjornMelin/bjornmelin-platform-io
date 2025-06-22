/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1) In Next.js 14+, this tells Next.js to produce static files in "out/" during `next build`.
    output: 'export',

    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'yourdomain.com'
            }
        ]
    },
    trailingSlash: true,
    reactStrictMode: true,

    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL
    }
};

export default nextConfig;
