import { NextConfig } from 'next'
import { codeInspectorPlugin } from 'code-inspector-plugin'

const nextConfig: NextConfig = {
	devIndicators: false,
	reactStrictMode: false,
	reactCompiler: true,
	pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
	// RSS 路由会用 fs 读取 public 下的封面文件做 statSync，Next 无法静态推断路径，
	// 于是把整个 public（含 38MB 音频）都打进函数包，导致超过 Vercel 250MB 限制。
	// RSS 是 force-static，构建期即完成，运行时不需要这些文件，直接排除。
	outputFileTracingExcludes: {
		'/rss.xml': ['./public/**'],
		'/*': ['./public/music/**']
	},
	typescript: {
		ignoreBuildErrors: true
	},
	experimental: {
		scrollRestoration: false
	},
	turbopack: {
		rules: {
			'*.svg': {
				loaders: ['@svgr/webpack'],
				as: '*.js'
			}
			// ...codeInspectorPlugin({
			// 	bundler: 'turbopack'
			// })
		},

		resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json', 'css']
	},
	webpack: config => {
		config.module.rules.push({
			test: /\.svg$/i,
			use: [{ loader: '@svgr/webpack', options: { svgo: false } }]
		})

		return config
	},

	async headers() {
		// 静态资源一年强缓存（文件名带 hash，内容不可变）。
		// 注意：/blogs/index.json、/blogs/categories.json 这类数据文件必须保持可重验证，
		// 因此下面排除掉"单段路径"，只缓存 /blogs/<slug>/<file> 这种两段以上的资源。
		const immutable = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
		return [
			{ source: '/blogs/:slug/:file*', headers: immutable },
			{ source: '/images/:path*', headers: immutable },
			{ source: '/music/:path*', headers: immutable },
			{ source: '/live2d/:path*', headers: immutable },
			{ source: '/fonts/:path*', headers: immutable }
		]
	},

	async redirects() {
		return [
			{
				source: '/zh',
				destination: '/',
				permanent: true
			},
			{
				source: '/en',
				destination: '/',
				permanent: true
			}
		]
	}
}

export default nextConfig
