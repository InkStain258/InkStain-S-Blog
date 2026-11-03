'use client'

import { useEffect, useRef } from 'react'

/**
 * 全站背景粒子：飘落的花瓣 + 偶发流星。
 *
 * 挂在 RootLayout 的 .site-aurora 之后，画在同一个负层级里，
 * 所以玻璃卡片（backdrop-filter）会把它们一起糊成底纹，不会压在正文上。
 *
 * 性能与可访问性：
 * - 粒子数按视口面积算，上限 96，手机大概 34 个
 * - devicePixelRatio 封顶 2，避免 3x 屏上画布过大
 * - prefers-reduced-motion: reduce 直接不启动
 * - 页面隐藏（visibilitychange）时暂停 rAF
 */
export default function SiteParticles() {
	const ref = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = ref.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

		let w = 0
		let h = 0
		let raf = 0
		let running = true

		type Petal = {
			x: number
			y: number
			r: number
			vx: number
			vy: number
			rot: number
			vr: number
			a: number
			phase: number
			hue: number
		}
		type Star = { x: number; y: number; len: number; vx: number; vy: number; life: number; max: number }

		const petals: Petal[] = []
		const stars: Star[] = []

		// 暗色下用青白色，亮色/纸色下用墨色，透明度都很低
		const isDark = () => document.documentElement.classList.contains('dark')

		const spawnPetal = (initial = false): Petal => {
			const dark = isDark()
			return {
				x: Math.random() * w,
				y: initial ? Math.random() * h : -20 - Math.random() * 120,
				r: 1.7 + Math.random() * 3.9,
				vx: -0.18 + Math.random() * 0.36,
				vy: 0.28 + Math.random() * 0.62,
				rot: Math.random() * Math.PI,
				vr: (-0.4 + Math.random() * 0.8) * 0.012,
				a: dark ? 0.14 + Math.random() * 0.22 : 0.1 + Math.random() * 0.16,
				phase: Math.random() * Math.PI * 2,
				hue: Math.random() < 0.3 ? 1 : 0
			}
		}

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2)
			w = window.innerWidth
			h = window.innerHeight
			canvas.width = Math.round(w * dpr)
			canvas.height = Math.round(h * dpr)
			canvas.style.width = `${w}px`
			canvas.style.height = `${h}px`
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

			const count = Math.round(Math.min(96, Math.max(34, (w * h) / 21000)))
			petals.length = 0
			for (let i = 0; i < count; i++) petals.push(spawnPetal(true))
			stars.length = 0
		}

		const spawnStar = () => {
			const dark = isDark()
			const fromLeft = Math.random() < 0.75
			const speed = 11 + Math.random() * 8
			stars.push({
				x: fromLeft ? -140 - Math.random() * 120 : w * (0.35 + Math.random() * 0.5),
				y: -60 - Math.random() * 120,
				len: 110 + Math.random() * 130,
				vx: speed,
				vy: speed * (0.55 + Math.random() * 0.25),
				life: 0,
				max: dark ? 1 : 0.55
			})
		}

		const drawPetal = (p: Petal) => {
			const dark = isDark()
			ctx.save()
			ctx.translate(p.x, p.y)
			ctx.rotate(p.rot)
			ctx.globalAlpha = p.a
			ctx.fillStyle = p.hue ? (dark ? 'rgb(120, 226, 245)' : 'rgb(31, 140, 165)') : dark ? 'rgb(226, 236, 255)' : 'rgb(64, 78, 92)'
			ctx.beginPath()
			ctx.ellipse(0, 0, p.r, p.r * 0.52, 0, 0, Math.PI * 2)
			ctx.fill()
			ctx.restore()
		}

		const drawStar = (s: Star) => {
			const t = s.life / s.max
			const alpha = Math.round(Math.sin(Math.PI * Math.min(t, 1)) * 0.55 * 100) / 100
			if (alpha <= 0) return
			const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * (s.len / 14), s.y - s.vy * (s.len / 14))
			g.addColorStop(0, `rgba(190, 240, 255, ${alpha})`)
			g.addColorStop(1, 'rgba(190, 240, 255, 0)')
			ctx.save()
			ctx.strokeStyle = g
			ctx.lineWidth = 1.4
			ctx.lineCap = 'round'
			ctx.beginPath()
			ctx.moveTo(s.x, s.y)
			ctx.lineTo(s.x - s.vx * (s.len / 14), s.y - s.vy * (s.len / 14))
			ctx.stroke()
			ctx.restore()
		}

		const loop = () => {
			if (!running) return
			ctx.clearRect(0, 0, w, h)

			for (let i = 0; i < petals.length; i++) {
				const p = petals[i]
				p.phase += 0.012
				p.x += p.vx + Math.sin(p.phase) * 0.34
				p.y += p.vy
				p.rot += p.vr
				if (p.y > h + 30 || p.x < -40 || p.x > w + 40) {
					petals[i] = spawnPetal()
					continue
				}
				drawPetal(p)
			}

			// 流星：平均每 6–14 秒一颗，越窄的屏幕越少
			if (Math.random() < 0.0042) spawnStar()
			for (let i = stars.length - 1; i >= 0; i--) {
				const s = stars[i]
				s.x += s.vx
				s.y += s.vy
				s.life += 0.0075
				if (s.life >= s.max || s.x > w + 260 || s.y > h + 260) {
					stars.splice(i, 1)
					continue
				}
				drawStar(s)
			}

			raf = requestAnimationFrame(loop)
		}

		const onVisibility = () => {
			if (document.hidden) {
				running = false
				cancelAnimationFrame(raf)
			} else if (!running) {
				running = true
				raf = requestAnimationFrame(loop)
			}
		}

		resize()
		raf = requestAnimationFrame(loop)
		window.addEventListener('resize', resize)
		document.addEventListener('visibilitychange', onVisibility)

		return () => {
			running = false
			cancelAnimationFrame(raf)
			window.removeEventListener('resize', resize)
			document.removeEventListener('visibilitychange', onVisibility)
		}
	}, [])

	return <canvas ref={ref} aria-hidden='true' className='site-particles' />
}
