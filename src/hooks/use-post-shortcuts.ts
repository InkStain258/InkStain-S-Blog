'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { seriesContext } from '@/lib/series'

/**
 * 文章页键盘快捷键：J 下一篇 / K 上一篇（与文末导航同一套顺序：系列按章节，其它按时间）。
 * 输入框、文本域、可编辑区域里不抢键；带修饰键（⌘/Ctrl/Alt）不接管。
 */
export function usePostShortcuts(slug?: string) {
	const router = useRouter()
	const { items } = useBlogIndex()

	const target = useMemo(() => {
		if (!slug || items.length < 2) return null
		const ctx = seriesContext(items, slug)
		if (ctx && ctx.total > 1) return { next: ctx.next?.slug, prev: ctx.prev?.slug }
		const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		const i = sorted.findIndex(x => x.slug === slug)
		if (i < 0) return null
		return { next: sorted[i - 1]?.slug, prev: sorted[i + 1]?.slug }
	}, [items, slug])

	useEffect(() => {
		if (!target) return
		const onKey = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
			const el = e.target as HTMLElement | null
			if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
			const key = e.key.toLowerCase()
			if (key !== 'j' && key !== 'k') return
			const dest = key === 'j' ? target.next : target.prev
			if (!dest) return
			e.preventDefault()
			router.push(`/blog/${dest}`)
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [target, router])

	return target
}
