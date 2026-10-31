#!/usr/bin/env node
/**
 * 构建后自检：SEO 路由必须存在，且域名必须是规范域名。
 *
 * 这几条历史上都真出过事：
 * - sitemap 26 条 loc 全是每次部署都变的 vercel.app 预览域名
 * - rss 的 <link> 兜底成了别人的域名 yysuni.com
 * - robots.txt 直接 404
 * - OAuth client secret 被写死在源码里、跟着 git 历史一起泄漏
 */
import fs from 'node:fs'
import path from 'node:path'

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://inkstain.top').replace(/\/+$/, '')
const APP_DIR = path.join('.next', 'server', 'app')
const read = name => {
	const p = path.join(APP_DIR, name)
	if (!fs.existsSync(p)) return null
	return fs.readFileSync(p, 'utf8')
}

const problems = []
const info = []

const robots = read('robots.txt.body')
if (!robots) problems.push('robots.txt 未生成')
else {
	if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) problems.push(`robots.txt 缺少 Sitemap 行（期望 ${SITE}/sitemap.xml）`)
	info.push(`robots.txt: ${robots.split('\n').length} 行`)
}

const sitemap = read('sitemap.xml.body')
if (!sitemap) problems.push('sitemap.xml 未生成')
else {
	const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
	const foreign = locs.filter(u => !u.startsWith(SITE))
	if (foreign.length) problems.push(`sitemap 有 ${foreign.length} 条不是规范域名，例如 ${foreign[0]}`)
	if (locs.length < 30) problems.push(`sitemap 条目只有 ${locs.length} 条，疑似漏了文章或标签页`)
	if (sitemap.includes('yysuni')) problems.push('sitemap 里出现 yysuni')
	info.push(`sitemap.xml: ${locs.length} 条，全部为 ${SITE}`)
}

const rss = read('rss.xml.body')
if (!rss) problems.push('rss.xml 未生成')
else {
	if (rss.includes('yysuni')) problems.push('rss.xml 里出现别人的域名 yysuni')
	const links = [...rss.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1])
	const foreign = links.filter(u => !u.startsWith(SITE))
	if (foreign.length) problems.push(`rss 有 ${foreign.length} 条链接不是规范域名，例如 ${foreign[0]}`)
	info.push(`rss.xml: ${links.length} 条 link，起始 ${links[0] || 'n/a'}`)
}

// 密钥字面量守卫：源码里不允许再出现 40 位十六进制（GitHub OAuth App secret 的形态）。
// 历史上 client_secret 就是被这么写死后进了 git 历史，轮换过一次才收场。
const SRC_DIR = 'src'
const hex40 = /\b[0-9a-fA-F]{40}\b/
const secretHits = []
const walk = dir => {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name)
		if (e.isDirectory()) {
			if (e.name === 'generated') continue
			walk(p)
		} else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) {
			const text = fs.readFileSync(p, 'utf8')
			if (hex40.test(text)) secretHits.push(p)
		}
	}
}
if (fs.existsSync(SRC_DIR)) walk(SRC_DIR)
if (secretHits.length) problems.push(`源码里出现疑似密钥的 40 位十六进制串：${secretHits.join(', ')}`)
else info.push('源码无 40 位十六进制密钥字面量')

console.log(info.map(l => '✓ ' + l).join('\n'))
if (problems.length) {
	console.error('\n✗ ' + problems.join('\n✗ '))
	process.exit(1)
}
console.log('\nSEO 路由自检通过')
