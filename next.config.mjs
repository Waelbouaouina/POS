import { withPayload } from '@payloadcms/next/withPayload';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbo: {
    resolveAlias: {
      '@payload-config': path.resolve(__dirname, './src/payload.config.ts'),
    },
  },
};

export default withPayload(nextConfig, {
  configPath: path.resolve(__dirname, './src/payload.config.ts'),
});
