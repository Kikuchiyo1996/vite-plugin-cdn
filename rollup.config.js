import typescript from 'rollup-plugin-typescript2'
/* import nodeResolve from '@rollup/plugin-node-resolve'
import builtins from 'rollup-plugin-node-builtins'
import cjs from '@rollup/plugin-commonjs' */

export default [
	{
		input: `src/index.ts`,
		plugins: [typescript()],
		output: [
			{
				dir: `dist/`,
				format: 'cjs',
				entryFileNames: '[name].cjs',
			},
			{
				dir: `dist/`,
				format: 'umd',
				name: 'vite-plugin-cdn',
				inlineDynamicImports: true,
				entryFileNames: '[name].umd.js',
			},
			{
				dir: `dist/`,
				format: 'es',
				entryFileNames: '[name].esm.mjs',
			},
		],
	},
]
