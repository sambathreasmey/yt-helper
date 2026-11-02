// const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
// const basePath =
//   process.env.GITHUB_ACTIONS && repositoryName && !repositoryName.endsWith(".github.io")
//     ? `/${repositoryName}`
//     : "";

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: "export",
//   basePath,
//   trailingSlash: true,
//   allowedDevOrigins: ["192.168.1.50", "*.local", "crushable-ambiance-foothold.ngrok-free.dev"], // replace with your actual dev hostnames/IPs
// };

// module.exports = nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "", // Required to be empty since the custom domain serves from the root
  trailingSlash: true,
  images: {
    unoptimized: true, // Recommended for static exports on GitHub Pages
  },
};

module.exports = nextConfig;