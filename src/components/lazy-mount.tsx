'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * 靠近视口才挂载子树。
 *
 * 用途：文章页底部的 Gitalk 评论区，打包下来 160KB（gzip）——它需要 GitHub 登录，
 * 绝大多数访客根本不往下滚到那儿，却要为它付掉整页最重的一份 JS。
 * 这里用「滚动 + 页面尺寸变化」双条件判定：文章页正文是客户端拉取的，
 * 刚渲染出来时页面只有骨架屏那么高，底部这块自然「在视口附近」，
 * 单纯用 IntersectionObserver 会立刻触发、等于没延迟。所以额外要求
 * 页面已经比两屏更长，并且正文加载完（ResizeObserver 回调）时重新判定。
 */
type LazyMountProps = {
	children: ReactNode
	/** 提前多少像素开始加载 */
	margin?: number
	/** 未挂载时占位高度，避免滚动条跳动 */
	minHeight?: number
	className?: string
}

export default function LazyMount({ children, margin = 600, minHeight = 120, className }: LazyMountProps) {
	const ref = useRef<HTMLDivElement>(null)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		if (mounted) return
		if (!ref.current) return

		let raf = 0
		let done = false
		let ro: ResizeObserver | null = null

		const cleanup = () => {
			ro?.disconnect()
			window.removeEventListener('scroll', schedule)
			window.removeEventListener('resize', schedule)
			if (raf) cancelAnimationFrame(raf)
		}

		const check = () => {
			raf = 0
			if (done) return
			const node = ref.current
			if (!node) return
			// 页面还没长过两屏，说明正文仍在路上，先不判定
			if (document.documentElement.scrollHeight <= window.innerHeight * 2) return
			const rect = node.getBoundingClientRect()
			const near = rect.top < window.innerHeight + margin && rect.bottom > -margin
			if (!near) return
			done = true
			setMounted(true)
			cleanup()
		}

		const schedule = () => {
			if (raf) return
			raf = requestAnimationFrame(check)
		}

		// 页面尺寸变化（正文/图片加载）与滚动都会重新判定
		ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
		ro?.observe(document.documentElement)
		window.addEventListener('scroll', schedule, { passive: true })
		window.addEventListener('resize', schedule)
		schedule()

		return cleanup
	}, [mounted, margin])

	return (
		<div ref={ref} className={className} style={mounted ? undefined : { minHeight }}>
			{mounted ? children : null}
		</div>
	)
}
