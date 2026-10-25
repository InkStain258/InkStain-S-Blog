'use client'

import { useEffect, useState } from 'react'

/**
 * 图片灯箱：点击正文中的图片全屏放大，Esc 或点击背景关闭。
 * 只作用于 .prose 内的图片，不影响头像、封面等装饰图。
 */
export default function ImageLightbox() {
	const [src, setSrc] = useState<string | null>(null)

	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null
			if (!target || target.tagName !== 'IMG') return
			if (!target.closest('.prose')) return
			const img = target as HTMLImageElement
			// 内容图才放大，图标/表情/加载失败图跳过
			if (img.naturalWidth < 120) return
			e.preventDefault()
			setSrc(img.currentSrc || img.src)
		}
		document.addEventListener('click', onClick)
		return () => document.removeEventListener('click', onClick)
	}, [])

	useEffect(() => {
		if (!src) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setSrc(null)
		}
		const prevOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		window.addEventListener('keydown', onKey)
		return () => {
			document.body.style.overflow = prevOverflow
			window.removeEventListener('keydown', onKey)
		}
	}, [src])

	if (!src) return null

	return (
		<div
			className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md'
			style={{ animation: 'lb-fade 220ms ease-out' }}
			onClick={() => setSrc(null)}>
			<img
				src={src}
				alt=''
				className='max-h-full max-w-full rounded-xl shadow-2xl'
				style={{ animation: 'lb-zoom 280ms cubic-bezier(0.2, 0.9, 0.3, 1)' }}
				onClick={e => e.stopPropagation()}
			/>
			<button
				type='button'
				onClick={() => setSrc(null)}
				aria-label='关闭'
				className='absolute top-6 right-6 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-lg text-white backdrop-blur transition-colors hover:bg-white/25'>
				✕
			</button>
			<div className='pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs text-white/70 backdrop-blur'>
				点击背景或按 Esc 关闭
			</div>
		</div>
	)
}
