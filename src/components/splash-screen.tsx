'use client'
import { useEffect, useState } from 'react'

/**
 * 首访开场层。
 *
 * 这里刻意不用 motion：它在全局 layout 里，一旦 import 就把整个动画库
 * 拉进所有页面的公共 chunk。三个动画用 CSS 完全等价：
 *   - 外环旋转  → animate-[spin_3s_linear_infinite]
 *   - 进度条    → 宽度 0→100% 的 keyframe
 *   - 退出淡出  → .ink-splash-out（1.2s 时淡出，1.55s 卸载）
 */
export default function SplashScreen() {
	const [show, setShow] = useState(false)
	const [leaving, setLeaving] = useState(false)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
		if (sessionStorage.getItem('splash-seen')) return
		setShow(true)
		// 首访别让人干等：1.2s 开始淡出，1.55s 彻底移除。
		// 它是 fixed 覆盖层，不参与文档流，不会造成布局位移。
		const t1 = setTimeout(() => setLeaving(true), 1200)
		const t2 = setTimeout(() => {
			setShow(false)
			sessionStorage.setItem('splash-seen', 'true')
		}, 1550)
		return () => {
			clearTimeout(t1)
			clearTimeout(t2)
		}
	}, [])

	if (!mounted || !show) return null

	return (
		<div
			aria-hidden='true'
			className={`pointer-events-none fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 ${
				leaving ? 'ink-splash-out' : ''
			}`}>
			<div className='relative z-10 flex flex-col items-center'>
				<div className='relative mb-6 h-20 w-20'>
					<div className='ink-splash-ring absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-400 opacity-50 blur-sm' />
					<div className='elev-3 relative h-full w-full rounded-full bg-white p-1'>
						<img src='/images/avatar.png' alt='InkStain' className='h-full w-full rounded-full object-cover' />
					</div>
				</div>
				<h1 className='mb-2 text-xl font-bold tracking-widest text-slate-800 dark:text-white'>InkStain</h1>
				<p className='mb-8 text-[10px] font-bold tracking-[0.4em] text-slate-400'>LOADING BLOG</p>
				<div className='h-[2px] w-36 overflow-hidden rounded-full bg-slate-200'>
					<div className='ink-splash-bar h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(47,203,231,0.8)]' />
				</div>
			</div>
		</div>
	)
}
