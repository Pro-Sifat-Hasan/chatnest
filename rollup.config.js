// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js', // Replace with the actual entry file path
  output: {
    file: 'dist/bundle.js', // The output file path
    format: 'cjs', // CommonJS format, or 'esm' for ES modules
  },
  plugins: [resolve(), commonjs()]
};
