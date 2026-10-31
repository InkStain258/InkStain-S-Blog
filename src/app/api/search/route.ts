import { NextResponse } from 'next/server'
import data from '@/generated/search-data.json'
import { tokenize } from '@/lib/search-tokenize'

/**
 * 服务端搜索：倒排索引直接打包进这个函数，客户端一个请求拿结果。
 *
 * 为什么不在浏览器里做：正文索引 255KB（gzip 108KB），冷门词还得再拉 242KB 分片。
 * 索引放在服务端后，客户端只回一个几百字节的 JSON，「首结果等多久」与「查的词冷门不冷门」无关。
 * 索引文件由 scripts/build-search-index.mjs 在 prebuild 阶段生成。
 */
type Doc = { s: string; t: string; d: string; c: string; g: string[]; m: string; b: string }
type Postings = Record<string, [number, number][]>

const DOCS = (data as unknown as { docs: Doc[] }).docs
const INV = (data as unknown as { inv: Postings }).inv

// mask 位：1 标题、2 标签、4 摘要、8 正文
const BIT_TITLE = 1
const BIT_TAGS = 2
const BIT_SUMMARY = 4
const BIT_BODY = 8

const LIMIT = 12
const MAX_Q = 40

function weightFor(mask: number): number {
	let w = 0
	if (mask & BIT_TITLE) w = Math.max(w, 45)
	if (mask & BIT_TAGS) w = Math.max(w, 30)
	if (mask & BIT_SUMMARY) w = Math.max(w, 22)
	if (mask & BIT_BODY) w = Math.max(w, 10)
	return w
}

function makeSnippet(body: string, summary: string, terms: string[]): string {
	if (!body) return summary
	let at = -1
	for (const t of terms) {
		const i = body.indexOf(t)
		if (i >= 0 && (at === -1 || i < at)) at = i
	}
	if (at === -1) return summary
	const start = Math.max(0, at - 40)
	return (start > 0 ? '…' : '') + body.slice(start, at + 100).replace(/\s+/g, ' ').trim() + '…'
}

export async function GET(request: Request) {
	const started = Date.now()
	const raw = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, MAX_Q)
	if (!raw) return NextResponse.json({ q: '', total: 0, hits: [], took: 0 })

	const terms = tokenize(raw)
	if (!terms.length) return NextResponse.json({ q: raw, total: 0, hits: [], took: 0 })

	// 多词按 AND：先求各 term 文档集合的交集
	let candidate: Set<number> | null = null
	for (const term of terms) {
		const post = INV[term]
		const ids = new Set<number>((post || []).map(p => p[0]))
		if (!candidate) {
			candidate = ids
		} else {
			const next = new Set<number>()
			for (const id of candidate) if (ids.has(id)) next.add(id)
			candidate = next
		}
		if (candidate.size === 0) break
	}

	const hits = []
	for (const idx of candidate ?? []) {
		const doc = DOCS[idx]
		if (!doc) continue

		let score = 0
		for (const term of terms) {
			const post = INV[term]
			let mask = 0
			if (post) {
				for (const [i, m] of post) {
					if (i === idx) {
						mask = m
						break
					}
				}
			}
			score += weightFor(mask)
		}

		// 整串命中额外加权，保持与旧版一致的排序直觉
		const title = doc.t.toLowerCase()
		const q = raw.toLowerCase()
		if (title === q) score += 120
		else if (title.startsWith(q)) score += 60
		else if (title.includes(q)) score += 45

		// 关键词在标题里出现得越早越靠前
		const pos = title.indexOf(terms[0])
		if (pos > 0) score += Math.max(0, 12 - pos)

		hits.push({
			s: doc.s,
			t: doc.t,
			d: doc.d,
			c: doc.c,
			g: doc.g,
			m: doc.m,
			snippet: makeSnippet(doc.b, doc.m, terms),
			score
		})
	}

	hits.sort((a, b) => b.score - a.score || (a.d < b.d ? 1 : -1))

	return NextResponse.json(
		{ q: raw, total: hits.length, hits: hits.slice(0, LIMIT), took: Date.now() - started },
		{ headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' } }
	)
}
