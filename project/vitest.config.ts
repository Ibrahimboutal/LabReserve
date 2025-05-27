import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'src/jest.setup.ts',
    include: ['src/__test__/**/*.test.ts', 'src/__test__/**/*.test.tsx'],
  },
});


