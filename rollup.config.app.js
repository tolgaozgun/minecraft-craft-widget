const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser').default;
const postcss = require('rollup-plugin-postcss');
const copy = require('rollup-plugin-copy');

module.exports = {
  input: 'src/index-app.jsx',
  output: {
    file: 'dist/app.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    postcss({
      extract: 'app.css',
      minimize: true
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      extensions: ['.js', '.jsx']
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: '> 0.5%, last 2 versions, not dead'
          }
        }],
        '@babel/preset-react'
      ],
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx']
    }),
    terser({
      compress: {
        drop_console: true
      }
    }),
    copy({
      targets: [
        { src: 'public/index.html', dest: 'dist' }
      ],
      hook: 'writeBundle'
    })
  ]
};