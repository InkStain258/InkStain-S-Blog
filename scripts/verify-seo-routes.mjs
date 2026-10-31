#!/usr/bin/env node
/**
 * 构建后自检：SEO 路由必须存在，且域名必须是规范域名。
 *
 * 这几条历史上都真出过事：
 * - sitemap 26 条 loc 全是每次部署都变的 vercel.app 预览域名
 * - rss 的 <link> 兜底成了别人的域名 yysuni.com
 * - robots.txt 直接 404
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

console.log(info.map(l => '✓ ' + l).join('\n'))
if (problems.length) {
	console.error('\n✗ ' + problems.join('\n✗ '))
	process.exit(1)
}
console.log('\nSEO 路由自检通过')
