import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  build: {
    rollupOptions: {
      // Prevent tree-shaking of Firebase Functions
      treeshake: {
        moduleSideEffects: [
          'firebase/functions',
          '@firebase/functions'
        ]
      }
    }
  },
  optimizeDeps: {
    include: [
      'firebase/functions',
      '@firebase/functions'
    ]
  }
})
