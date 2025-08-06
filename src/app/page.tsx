// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/',
                destination: '/home',
                permanent: true, // 308 redirect
            },
        ];
    },
};

module.exports = nextConfig;