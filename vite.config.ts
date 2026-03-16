import { defineConfig } from 'vite'

  
export default defineConfig({
  resolve: {
    alias: {
      'elkjs/lib/elk.bundled.js': 'elkjs/lib/elk.bundled.js',
    }
  },
  optimizeDeps: {
    include: ['elkjs/lib/elk.bundled.js'],
    exclude: ['elkjs'],
  }
});