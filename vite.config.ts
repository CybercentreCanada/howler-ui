import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mock } from './setupMock';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
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
    build: {
      sourcemap: false
    },
    define: {
      'process.env': {}
    },
    server: {
      port: 3000,
      proxy: env.VITE_API === 'REST' && {
        '/api': {
          target: `http://localhost:${env.VITE_REST_PORT ?? 5000}`,
          changeOrigin: true
        }
      }
    }
  };
});
