/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite que el servidor custom (servidor/indice.ts) maneje las peticiones
  // mientras Next.js se encarga del frontend
  experimental: {
    serverComponentsExternalPackages: ["socket.io"],
  },
};

export default nextConfig;
