import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { terser } from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  external: ['react', 'react-dom'],
  plugins: [
    resolve(),
    babel({
      babelHelpers: 'runtime', // change from 'bundled' to 'runtime' for plugin-transform-runtime
      exclude: 'node_modules/**'
    }),
    terser()
  ]
};
