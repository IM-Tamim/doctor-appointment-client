/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the MongoDB driver out of the bundler and let it stay a plain Node
  // require on the server. It ships native/CJS bits that bundlers handle badly.
  //
  // Note: this is the Next 15/16 name. Netlify's error page suggests
  // `experimental.serverComponentsExternalPackages`, which was renamed and is
  // now a no-op — and it would not have fixed the edge bundle anyway, since
  // that failure came from middleware importing the driver at all.
  serverExternalPackages: ["mongodb", "nodemailer"],

  // next-intl reads its request config through this alias. Set directly rather
  // than via next-intl's plugin, which eagerly loads @swc/core (a native
  // binary) only for message-extraction features this app doesn't use.
  turbopack: {
    resolveAlias: {
      "next-intl/config": "./src/i18n/request.js",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
