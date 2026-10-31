import type { BlogIndexItem } from '@/app/blog/types'

/**
 * 从标题里识别系列与章节。
 * 约定：`<系列名>笔记：<章节号> <章节标题>`
 *   比较文学笔记：03 比较文学与世界文学 → { 比较文学笔记, 3, 比较文学与世界文学 }
 * 标题不符合约定时返回 null，不猜测。
 */
const SERIES_RE = /^(.+?)笔记[：:]\s*(\d+)\s*(.*)$/

export type SeriesInfo = {
	name: string
	chapter: number
	chapterTitle: string
}

export function parseSeries(title: string): SeriesInfo | null {
	const m = (title || '').match(SERIES_RE)
	if (!m) return null
	return { name: m[1].trim() + '笔记', chapter: Number(m[2]), chapterTitle: m[3].trim() }
}

/** 系列名 → 路由段（中文直接进 URL，encodeURIComponent 由 Next 处理） */
export function seriesSlug(name: string) {
	return name.replace(/\s+/g, '')
}

export type SeriesGroup = {
	name: string
	slug: string
	items: (BlogIndexItem & { chapter: number; chapterTitle: string })[]
}

/** 把文章按系列归组，系列内按章节号升序 */
export function groupSeries(items: BlogIndexItem[]): SeriesGroup[] {
	const map = new Map<string, SeriesGroup>()
	for (const it of items) {
		const s = parseSeries(it.title || '')
		if (!s) continue
		const g = map.get(s.name) ?? { name: s.name, slug: seriesSlug(s.name), items: [] }
		g.items.push({ ...it, chapter: s.chapter, chapterTitle: s.chapterTitle })
		map.set(s.name, g)
	}
	return [...map.values()]
		.map(g => ({ ...g, items: g.items.sort((a, b) => a.chapter - b.chapter) }))
		.sort((a, b) => b.items.length - a.items.length)
}

/** 单篇文章的系列上下文：当前第几篇、前后篇 */
export function seriesContext(items: BlogIndexItem[], slug: string) {
	const groups = groupSeries(items)
	for (const g of groups) {
		const i = g.items.findIndex(x => x.slug === slug)
		if (i >= 0) {
			return {
				group: g,
				index: i,
				total: g.items.length,
				prev: g.items[i - 1],
				next: g.items[i + 1]
			}
		}
	}
	return null
}
