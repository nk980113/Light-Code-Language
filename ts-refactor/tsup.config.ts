import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
    },
    minify: true,
    tsconfig: './tsconfig.json',
    keepNames: false,
});
