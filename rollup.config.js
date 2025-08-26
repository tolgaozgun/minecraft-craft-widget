import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import { terser } from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import fs from 'fs';
import path from 'path';

// Load the packed data
const dataPath = path.join(__dirname, 'out/data.min.json');
const packedData = fs.existsSync(dataPath) ? fs.readFileSync(dataPath, 'utf8') : '{}';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/minecraft-craft-widget.min.js',
    format: 'iife',
    name: 'MinecraftCraftWidget',
    compact: true
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      '__PACKED_DATA__': packedData,
      preventAssignment: true
    }),
    postcss({
      extract: false,
      inject: false,
      minimize: true,
      modules: false
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: '> 0.5%, last 2 versions, Firefox ESR, not dead'
          }
        }],
        '@babel/preset-react'
      ],
      exclude: 'node_modules/**'
    }),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: true,
      format: {
        comments: false
      }
    })
  ]
};