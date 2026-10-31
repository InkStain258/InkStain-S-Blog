'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * 靠近视口才挂载子树。
 *
 * 用途：文章页底部的 Gitalk 评论区，打包下来 160KB（gzip）——它需要 GitHub 登录，
 * 绝大多数访客根本不往下滚到那儿，却要为它付掉整页最重的一份 JS。
 * 这里用 IntersectionObserver 延迟挂载：滚到附近才开始下载，行为本身不变。
 */
type LazyMountProps = {
	children: ReactNode
	/** 提前多少像素开始加载，默认提前一屏的 1/3 */
	rootMargin?: string
	/** 未挂载时占位高度，避免滚动条跳动 */
	minHeight?: number
	className?: string
}

export default function LazyMount({ children, rootMargin = '600px 0px', minHeight = 120, className }: LazyMountProps) {
	const ref = useRef<HTMLDivElement>(null)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		const el = ref.current
		if (!el || mounted) return
		if (typeof IntersectionObserver === 'undefined') {
			setMounted(true)
			return
		}
		const io = new IntersectionObserver(
			entries => {
				if (entries.some(e => e.isIntersecting)) {
					setMounted(true)
					io.disconnect()
				}
			},
			{ rootMargin }
		)
		io.observe(el)
		return () => io.disconnect()
	}, [mounted, rootMargin])

	return (
		<div ref={ref} className={className} style={mounted ? undefined : { minHeight }}>
			{mounted ? children : null}
		</div>
	)
}
