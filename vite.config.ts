import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { exec, spawn } from 'child_process';
import fs from 'fs';

function dynamicZipPlugin() {
  return {
    name: 'dynamic-zip-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.split('?')[0] === '/nhan-xet-diem-v3.zip') {
          console.log('Building zip dynamically...');
          const child = spawn('npm', ['run', 'build'], { shell: true });
          
          let stderrData = '';
          child.stderr.on('data', (data) => {
            stderrData += data.toString();
          });
          
          child.on('close', (code) => {
            if (code !== 0) {
              console.error('Failed to build zip. Exit code:', code);
              console.error('stderr:', stderrData);
              res.statusCode = 500;
              res.end('Build failed: ' + stderrData);
              return;
            }
            try {
              const fileContent = fs.readFileSync('public/nhan-xet-diem-v3.zip');
              res.setHeader('Content-Type', 'application/zip');
              res.setHeader('Content-Disposition', 'attachment; filename="nhan-xet-diem-v3.zip"');
              res.setHeader('Content-Length', fileContent.length);
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
              res.end(fileContent);
            } catch (err) {
              console.error('Failed to read built zip:', err);
              res.statusCode = 500;
              res.end('Read failed');
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), dynamicZipPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'Tien-ich-nhan-xet',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          popup: path.resolve(__dirname, 'popup.html'),
          options: path.resolve(__dirname, 'options.html'),
          auth: path.resolve(__dirname, 'auth-ui.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled explicitly
      hmr: false,
    },
  };
});
