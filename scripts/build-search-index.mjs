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
let missing = 0

for (const item of index) {
	const file = join(blogsDir, item.slug, 'index.md')
	let body = ''
	if (existsSync(file)) {
		body = toPlain(readFileSync(file, 'utf8')).slice(0, 4000)
	} else {
		missing++
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

const out = { generatedAt: new Date().toISOString(), count: docs.length, docs }
writeFileSync(join(root, 'public', 'search-index.json'), JSON.stringify(out), 'utf8')

const kb = (Buffer.byteLength(JSON.stringify(out)) / 1024).toFixed(0)
console.log(`[search-index] ${docs.length} 篇，${kb}KB${missing ? `，${missing} 篇缺正文` : ''}`)
