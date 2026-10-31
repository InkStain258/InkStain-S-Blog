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
		// 关键：只能用"扩展名白名单"来匹配。写成 '/blogs/:slug/:file*' 时 :file* 可以匹配 0 段，
		// 会把 /blogs/index.json 一起缓存成 immutable，导致发布新文章后访客要等一年才看到。
		const immutable = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
		const asset = '(.*\.(?:webp|png|jpg|jpeg|gif|svg|avif|ico|mp3|m4a|ogg|wav|json5|woff2?|ttf|otf))'
		return [
			{ source: '/blogs/:slug/:file' + asset, headers: immutable },
			// 预生成的图片变体内容按内容寻址（文件名含源图哈希），可以长期缓存
			{ source: '/_img/:path' + asset, headers: immutable },
			{ source: '/images/:path' + asset, headers: immutable },
			{ source: '/music/:path' + asset, headers: immutable },
			{ source: '/live2d/:path' + asset, headers: immutable },
			{ source: '/fonts/:path' + asset, headers: immutable },
			{
				// 搜索索引会随每次发布变化，给短缓存 + 后台续期：打开搜索不再每次都拉 108KB
				source: '/search-index.json',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=86400' }]
			},
			{
				// meta 与正文分片同理；默认的 max-age=0 会让每次打开搜索都回源校验
				source: '/search-index/:path*',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=86400' }]
			}
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
