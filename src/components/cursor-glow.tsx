'use client'

import { useEffect, useRef } from 'react'

/**
 * 鼠标跟随氛围光：一团柔和的品牌色光晕平滑跟随光标。
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
			cx += (tx - cx) * 0.12
			cy += (ty - cy) * 0.12
			el.style.transform = `translate3d(${cx - 190}px, ${cy - 190}px, 0)`
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
			className='cursor-glow pointer-events-none fixed top-0 left-0 z-[5] h-[380px] w-[380px] rounded-full opacity-0 blur-[55px]'
			style={{
				background: 'radial-gradient(circle, color-mix(in srgb, var(--color-brand) 55%, transparent) 0%, transparent 66%)',
				willChange: 'transform',
				transition: 'opacity 600ms ease'
			}}
		/>
	)
}
