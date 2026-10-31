'use client'

import { useEffect, useRef, useState } from 'react'

export type TocProgressState = {
	/** 当前章节 id；还没读到第一个标题时为空串 */
	activeId: string
	/** 0–1，按标题在正文里的位置线性插值出的阅读进度 */
	progress: number
}

/**
 * 与 `.prose [id] { scroll-margin-top: 100px }` 对齐，再留 12px 缓冲。
 * 锚点跳转后标题落在这个位置，判定阈值必须是同一个值，否则点完目录高亮会跳到下一节。
 */
const HEADING_OFFSET = 112

/**
 * 目录进度与「当前章节」。
 *
 * 为什么不用 IntersectionObserver：相邻标题间距常常小于视口高度，IO 会同时命中多个
 * 标题，只能拿到一个集合再去猜「当前」；滚动惯性下回调还有一帧以上的延迟，进度条会抖。
 * 这里直接按滚动位置取「最后一个顶边已越过阈值线的标题」，位置即事实。
 */
export function useTocProgress(ids: string[]): TocProgressState {
	const [activeId, setActiveId] = useState('')
	const [progress, setProgress] = useState(0)
	const idsKey = ids.join('|')
	const raf = useRef(0)

	useEffect(() => {
		const list = idsKey ? idsKey.split('|') : []
		if (list.length === 0) {
			setActiveId('')
			setProgress(0)
			return
		}

		let retry = 0
		let retryTimer: ReturnType<typeof setTimeout> | undefined

		// 返回 false 表示标题还没进 DOM（正文异步渲染），调用方会重试
		const compute = (): boolean => {
			const tops: number[] = []
			for (const id of list) {
				const el = document.getElementById(id)
				if (!el) return false
				tops.push(el.getBoundingClientRect().top + window.scrollY)
			}

			const y = window.scrollY + HEADING_OFFSET
			let index = -1
			for (let i = 0; i < tops.length; i++) if (tops[i] <= y) index = i

			let ratio = 0
			if (index >= 0) {
				const start = tops[index]
				// 最后一节没有下一个标题，用文档底作为终点
				const end =
					index + 1 < tops.length
						? tops[index + 1]
						: Math.max(start + 1, document.documentElement.scrollHeight - window.innerHeight + HEADING_OFFSET)
				const t = Math.min(Math.max((y - start) / Math.max(end - start, 1), 0), 1)
				ratio = (index + t) / tops.length
			}

			const nextActive = index < 0 ? '' : list[index]
			const nextProgress = Math.min(Math.max(ratio, 0), 1)

			setActiveId(prev => (prev === nextActive ? prev : nextActive))
			setProgress(prev => (Math.abs(prev - nextProgress) < 0.004 ? prev : nextProgress))
			return true
		}

		const schedule = () => {
			if (raf.current) return
			raf.current = requestAnimationFrame(() => {
				raf.current = 0
				compute()
			})
		}

		const boot = () => {
			if (compute() || retry >= 10) return
			retry += 1
			retryTimer = setTimeout(boot, 200)
		}
		boot()

		window.addEventListener('scroll', schedule, { passive: true })
		window.addEventListener('resize', schedule)
		// 图片、字体加载会推动标题位置，重新量一遍
		const ro = new ResizeObserver(schedule)
		ro.observe(document.body)

		return () => {
			cancelAnimationFrame(raf.current)
			raf.current = 0
			if (retryTimer) clearTimeout(retryTimer)
			window.removeEventListener('scroll', schedule)
			window.removeEventListener('resize', schedule)
			ro.disconnect()
		}
	}, [idsKey])

	return { activeId, progress }
}
