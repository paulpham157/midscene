import { defineConfig, moduleTools } from '@modern-js/module-tools';

const commonConfig = {
  input: {
    index: './src/index.ts',
    img: './src/img/index.ts',
    constants: './src/constants/index.ts',
    extractor: './src/extractor/index.ts',
    'extractor-debug': './src/extractor/debug.ts',
    fs: './src/fs/index.ts',
    utils: './src/utils.ts',
    'us-keyboard-layout': './src/us-keyboard-layout.ts',
  },
};

export default defineConfig({
  plugins: [moduleTools()],
  buildPreset: 'npm-library',
  buildConfig: [
    {
      platform: 'node',
      format: 'cjs',
      ...commonConfig,
      outDir: 'dist/lib',
      target: 'es6',
    },
    {
      platform: 'node',
      format: 'esm',
      ...commonConfig,
      outDir: 'dist/es',
      target: 'es6',
    },
    {
      platform: 'browser',
      ...commonConfig,
      outDir: 'dist/browser',
      target: 'es6',
    },
  ],
});
