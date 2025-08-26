const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser').default;
const postcss = require('rollup-plugin-postcss');
const fs = require('fs');
const path = require('path');

// Load the packed data
const dataPath = path.join(__dirname, 'out/data.min.json');
const packedData = fs.existsSync(dataPath) ? fs.readFileSync(dataPath, 'utf8') : '{}';

module.exports = {
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
      inject: (cssVariableName) => 
        `if (!document.getElementById('minecraft-craft-widget-styles')) {
          const style = document.createElement('style');
          style.id = 'minecraft-craft-widget-styles';
          style.textContent = ${cssVariableName};
          document.head.appendChild(style);
        }`,
      minimize: true,
      modules: false
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
            browsers: '> 0.5%, last 2 versions, Firefox ESR, not dead'
          }
        }],
        '@babel/preset-react'
      ],
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx']
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