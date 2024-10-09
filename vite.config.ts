import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mock } from './setupMock';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiTarget = env.VITE_API_TARGET ?? `http://localhost:${env.VITE_REST_PORT ?? 5000}`;

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      {
        name: 'markdown-loader',
        transform(code, id) {
          if (id.slice(-3) === '.md') {
            // For .md files, get the raw content
            return `export default ${JSON.stringify(code)};`;
          }
        }
      },
      env.VITE_API !== 'REST' && mock()
    ],
    worker: {
      plugins: () => [tsconfigPaths()]
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        plugins: [],
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'node_modules';
            }
          }
        }
      }
    },
    define: {
      'process.env': {}
    },
    server: {
      port: 3000,
      proxy: env.VITE_API === 'REST' && {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    },
    preview: {
      port: 3000,
      proxy: env.VITE_API === 'REST' && {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  };
});
