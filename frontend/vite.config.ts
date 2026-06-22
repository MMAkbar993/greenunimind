import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import removeConsole from "vite-plugin-remove-console";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Remove console statements in production builds
    process.env.NODE_ENV === 'production' && removeConsole({
      // Remove most console methods but keep error for critical issues
      includes: ['log', 'warn', 'info', 'debug']
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: 'es', 
  },
  optimizeDeps: {
    exclude: [
      '@ffmpeg/ffmpeg',
      '@ffmpeg/util',
    ],
    include: [
      'react-player/lazy',
      'react-player/file',
      'react-player/youtube',
      'react-player/vimeo',
    ],
  },
  build: {
    target: 'esnext', // Use modern JavaScript features
    outDir: 'dist',
    assetsDir: 'assets',
    // Only include sourcemaps in development
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          'video-player': [
            'video.js',
            'hls.js',
            '@videojs/http-streaming',
            '@silvermine/videojs-quality-selector'
          ],
          'react-player': [
            'react-player',
            'react-player/lazy',
            'react-player/file',
            'react-player/youtube',
            'react-player/vimeo',
          ],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['antd', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    // Optimize for Cloudflare Pages
    minify: 'esbuild',
    cssMinify: true,
  },
});
