import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'setupFiles': 'src/jest.setup.ts',
      'lib/supabase': path.resolve(__dirname, 'src/lib/supabase.ts'),
      'hooks/useAuth': path.resolve(__dirname, 'src/hooks/useAuth.ts'),
      'components/admin/LabManagement': path.resolve(__dirname, 'src/components/admin/LabManagement.tsx'),
      'components/labmanager/ReservationManagement': path.resolve(__dirname, 'src/components/labmanager/ReservationManagement.tsx'),
      'theme': path.resolve(__dirname, 'src/theme.ts'),
      
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});