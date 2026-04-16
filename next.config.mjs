import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  onDemandEntries: {
    // Keep dev pages hot longer to avoid tab-switch recompiles that feel like reloads.
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 8,
  },
};

export default nextConfig;
