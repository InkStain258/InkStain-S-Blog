import type { BlogIndexItem } from '@/app/blog/types'
import { parseSeries } from '@/lib/series'

export type RelatedPost = {
	item: BlogIndexItem
	score: number
	/** 命中的理由，直接显示给读者（「为什么推荐这篇」） */
	reasons: string[]
}

type Current = {
	slug: string
	tags?: string[]
	category?: string
	title?: string
}

/**
 * 相关文章。
 *
 * 这个库只有 25 篇、31 个标签，且大半标签是单次出现（学科史 2 次、其余 1 次），
 * 纯按标签推荐会大面积落空；分类（比较文学 13 / 文学概论 11）反而是稳定信号。
 * 所以权重是「同标签 > 同系列相邻章 > 同分类」，分数相同时取更新的。
 * 标题里的系列靠 `parseSeries` 解析（`<系列>笔记：<章号> <标题>` 约定）。
 */
export function relatedPosts(items: BlogIndexItem[], current: Current, limit = 3): RelatedPost[] {
	if (!current?.slug || items.length < 2) return []

	const curTags = new Set((current.tags || []).filter(Boolean))
	const curSeries = current.title ? parseSeries(current.title) : null

	const scored: RelatedPost[] = []
	for (const item of items) {
		if (!item || item.slug === current.slug || item.hidden) continue

		const reasons: string[] = []
		let score = 0

		const shared = (item.tags || []).filter(t => curTags.has(t))
		if (shared.length > 0) {
			score += 10 * shared.length
			reasons.push(...shared.slice(0, 2).map(t => `#${t}`))
		}

		const s = parseSeries(item.title || '')
		if (curSeries && s && s.name === curSeries.name) {
			const gap = Math.abs(s.chapter - curSeries.chapter)
			if (gap === 1) {
				score += 8
				reasons.push('同系列 · 相邻章节')
			} else if (gap > 1) {
				score += 4
				reasons.push('同系列')
			}
		}

		if (current.category && item.category === current.category) {
			score += 5
			reasons.push('同一分类')
		}

		if (score <= 0) continue
		scored.push({ item, score, reasons: [...new Set(reasons)].slice(0, 2) })
	}

	scored.sort((a, b) => b.score - a.score || (b.item.date || '').localeCompare(a.item.date || ''))
	const top = scored.slice(0, limit)
	if (top.length >= limit) return top

	// 补足：没有共同标签/分类时按时间给最近的几篇，右上角的理由会写明「最近更新」
	const used = new Set(top.map(x => x.item.slug))
	const fill = items
		.filter(i => i && i.slug !== current.slug && !i.hidden && !used.has(i.slug))
		.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
		.slice(0, limit - top.length)
		.map(item => ({ item, score: 0, reasons: ['最近更新'] }))

	return [...top, ...fill]
}
