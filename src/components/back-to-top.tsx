'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowUp } from 'lucide-react'

const SIZE = 44
const STROKE = 3
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

/**
 * 回到顶部：右侧悬浮按钮，外圈进度环实时反映阅读进度。
 * 位于右下角偏上，避免与播放中的音乐卡重叠。
 */
export default function BackToTop() {
	const [visible, setVisible] = useState(false)
	const [ratio, setRatio] = useState(0)

	useEffect(() => {
		let frame = 0
		const update = () => {
			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(() => {
				const doc = document.documentElement
				const max = doc.scrollHeight - doc.clientHeight
				const y = doc.scrollTop
				setRatio(max > 0 ? Math.min(1, y / max) : 0)
				setVisible(y > 320)
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
		<AnimatePresence>
			{visible && (
				<motion.button
					initial={{ opacity: 0, scale: 0.6, y: 8 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.6, y: 8 }}
					transition={{ duration: 0.22, ease: 'easeOut' }}
					whileHover={{ scale: 1.08 }}
					whileTap={{ scale: 0.94 }}
					onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
					aria-label='回到顶部'
					title='回到顶部'
					className='bg-card border-backdrop fixed right-6 bottom-24 z-40 grid place-items-center rounded-full border shadow-lg backdrop-blur-md max-sm:right-4 max-sm:bottom-20'
					style={{ width: SIZE, height: SIZE }}>
					<svg width={SIZE} height={SIZE} className='absolute inset-0 -rotate-90' aria-hidden>
						<circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill='none' stroke='currentColor' strokeWidth={STROKE} className='text-secondary/15' />
						<circle
							cx={SIZE / 2}
							cy={SIZE / 2}
							r={R}
							fill='none'
							stroke='var(--color-brand)'
							strokeWidth={STROKE}
							strokeLinecap='round'
							strokeDasharray={CIRC}
							strokeDashoffset={CIRC * (1 - ratio)}
							style={{ transition: 'stroke-dashoffset 120ms linear' }}
						/>
					</svg>
					<ArrowUp className='text-brand relative h-4 w-4' />
				</motion.button>
			)}
		</AnimatePresence>
	)
}
