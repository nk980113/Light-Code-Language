import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
    entry: {
        index: 'src/index.ts',
        worker: 'src/worker/index.ts',
    },
    outDir: 'dist',
    minify: true,
    tsconfig: './tsconfig.json',
    format: 'esm',
    target: 'esnext',
}));
