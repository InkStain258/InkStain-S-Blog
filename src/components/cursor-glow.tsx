'use client'

import { useEffect, useRef } from 'react'

/** 光晕直径（px），改这一个值即可 */
const SIZE = 200

/**
 * 鼠标跟随氛围光：一小团柔和的品牌色光晕平滑跟随光标。
 * 触屏设备与「减少动态效果」偏好下自动禁用。
 */
export default function CursorGlow() {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (window.matchMedia('(hover: none)').matches) return
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

		const el = ref.current
		if (!el) return

		const half = SIZE / 2
		let tx = window.innerWidth / 2
		let ty = window.innerHeight / 2
		let cx = tx
		let cy = ty
		let raf = 0

		const onMove = (e: MouseEvent) => {
			tx = e.clientX
			ty = e.clientY
			el.style.opacity = '1'
		}

		const loop = () => {
			cx += (tx - cx) * 0.14
			cy += (ty - cy) * 0.14
			el.style.transform = `translate3d(${cx - half}px, ${cy - half}px, 0)`
			raf = requestAnimationFrame(loop)
		}

		window.addEventListener('mousemove', onMove, { passive: true })
		raf = requestAnimationFrame(loop)

		return () => {
			window.removeEventListener('mousemove', onMove)
			cancelAnimationFrame(raf)
		}
	}, [])

	return (
		<div
			ref={ref}
			aria-hidden
			className='cursor-glow pointer-events-none fixed top-0 left-0 z-[5] rounded-full opacity-0 blur-[32px]'
			style={{
				width: SIZE,
				height: SIZE,
				background: 'radial-gradient(circle, color-mix(in srgb, var(--color-brand) 38%, transparent) 0%, transparent 62%)',
				willChange: 'transform',
				transition: 'opacity 600ms ease'
			}}
		/>
	)
}
