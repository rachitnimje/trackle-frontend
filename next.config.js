// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // Read CSP values from env (no defaults)
    const connectSrc = process.env.NEXT_PUBLIC_CSP_CONNECT_SRC;
    const imgSrc = process.env.NEXT_PUBLIC_CSP_IMG_SRC;
    const scriptSrc = process.env.NEXT_PUBLIC_CSP_SCRIPT_SRC;
    const styleSrc = process.env.NEXT_PUBLIC_CSP_STYLE_SRC;
    const fontSrc = process.env.NEXT_PUBLIC_CSP_FONT_SRC;
    const frameSrc = process.env.NEXT_PUBLIC_CSP_FRAME_SRC;
    if (!connectSrc || !imgSrc || !scriptSrc || !styleSrc || !fontSrc || !frameSrc) {
      throw new Error("Missing one or more required CSP environment variables. Please set all NEXT_PUBLIC_CSP_* variables in your .env file.");
    }
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src ${scriptSrc};
              style-src ${styleSrc};
              img-src ${imgSrc};
              font-src ${fontSrc};
              connect-src ${connectSrc};
              frame-src ${frameSrc};
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
