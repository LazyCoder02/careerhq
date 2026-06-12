import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs) and mammoth use Node-specific runtime loading that breaks
  // when bundled into the server build. Opt them out so they're required from
  // node_modules at runtime, as they expect.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
