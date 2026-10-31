#!/usr/bin/env node
/**
 * 生成全站搜索索引 public/search-index.json
 *
 * 正文只留纯文本（去代码块、图片、链接语法），每篇截断到 4000 字，
 * 25 篇的索引约 120–200KB，gzip 后 40–60KB，客户端按需加载。
 *
 * package.json 里挂了 prebuild，Vercel 构建前会自动跑。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blogsDir = join(root, 'public', 'blogs')
const indexPath = join(blogsDir, 'index.json')

if (!existsSync(indexPath)) {
	console.error('[search-index] 找不到 public/blogs/index.json')
	process.exit(1)
}

const index = JSON.parse(readFileSync(indexPath, 'utf8'))

/** 去掉 Markdown 语法，只留可搜索的文本 */
function toPlain(md) {
	return md
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s{0,3}#{1,6}\s+/gm, '')
		.replace(/^\s{0,3}>\s?/gm, '')
		.replace(/[*_~`]/g, '')
		.replace(/^\s*[-*+]\s+/gm, '')
		.replace(/\n{2,}/g, '\n')
		.replace(/[ \t]{2,}/g, ' ')
		.trim()
}

const docs = []
const issues = []
let missing = 0

for (const item of index) {
	const file = join(blogsDir, item.slug, 'index.md')
	let body = ''
	if (existsSync(file)) {
		body = toPlain(readFileSync(file, 'utf8')).slice(0, 4000)
	} else {
		missing++
	}
	// 内容体检（构建期顺手做，结果给 /admin/health 用）
	if (!item.summary || item.summary.trim().length < 20) issues.push({ s: item.slug, t: item.title || item.slug, k: 'summary', v: `摘要${item.summary ? '过短（' + item.summary.length + ' 字）' : '缺失'}` })
	if ((item.title || '').length > 40) issues.push({ s: item.slug, t: item.title, k: 'title', v: `标题 ${item.title.length} 字，偏长` })
	if (!item.category) issues.push({ s: item.slug, t: item.title || item.slug, k: 'category', v: '未分类' })

	if (body || existsSync(file)) {
		const raw = readFileSync(file, 'utf8')
		if (raw.includes('blob:')) issues.push({ s: item.slug, t: item.title || item.slug, k: 'blob', v: '正文里有 blob: 临时图片地址' })

		// 本地图片引用是否存在
		const refs = [...raw.matchAll(/!\[[^\]]*\]\((?!https?:)([^)]+)\)/g)].map(m => m[1].split(/[?#]/)[0])
		for (const ref of refs) {
			const abs = ref.startsWith('/') ? join(root, 'public', ref) : join(blogsDir, item.slug, ref)
			if (!existsSync(abs)) issues.push({ s: item.slug, t: item.title || item.slug, k: 'image', v: `图片缺失：${ref}` })
		}
	}

	docs.push({
		s: item.slug,
		t: item.title || item.slug,
		d: item.date || '',
		c: item.category || '',
		g: item.tags || [],
		m: (item.summary || '').slice(0, 200),
		b: body
	})
}

// 标签使用频次：只用一次的标签对读者没意义
const tagCount = {}
for (const d of docs) for (const t of d.g) tagCount[t] = (tagCount[t] || 0) + 1
const onceTags = Object.entries(tagCount).filter(([, n]) => n === 1).map(([t]) => t)

const out = {
	generatedAt: new Date().toISOString(),
	count: docs.length,
	tagStats: { total: Object.keys(tagCount).length, once: onceTags },
	issues,
	docs
}
writeFileSync(join(root, 'public', 'search-index.json'), JSON.stringify(out), 'utf8')

const kb = (Buffer.byteLength(JSON.stringify(out)) / 1024).toFixed(0)
console.log(`[search-index] ${docs.length} 篇，${kb}KB${missing ? `，${missing} 篇缺正文` : ''}，体检问题 ${issues.length} 项，单次标签 ${onceTags.length} 个`)
