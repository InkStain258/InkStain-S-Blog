'use client'

import { useEffect, useState } from 'react'

/**
 * 阅读进度条：顶部 3px 渐变条，随滚动增长。
 * 仅在页面可滚动时显示，首页（拖拽画布）不收影响。
 */
export default function ReadingProgress() {
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		let frame = 0
		const update = () => {
			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(() => {
				const doc = document.documentElement
				const max = doc.scrollHeight - doc.clientHeight
				const percent = max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0
				setProgress(percent)
			})
		}
		update()
		window.addEventListener('scroll', update, { passive: true })
		window.addEventListener('resize', update)
		return () => {
			cancelAnimationFrame(frame)
			window.removeEventListener('scroll', update)
			window.removeEventListener('resize', update)
		}
	}, [])

	return (
		<div className='pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]'>
			<div
				className='h-full bg-gradient-to-r from-[var(--color-brand)] via-[var(--color-brand-secondary)] to-[var(--color-brand)] shadow-[0_0_10px_var(--color-brand)]'
				style={{
					width: `${progress}%`,
					opacity: progress > 0.5 ? 1 : 0,
					transition: 'width 120ms ease-out, opacity 300ms ease'
				}}
			/>
		</div>
	)
}
