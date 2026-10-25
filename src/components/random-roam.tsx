'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Dices } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { toast } from 'sonner'

/**
 * 随机漫游：在博客列表页与文章页右下角悬浮一个骰子，
 * 点一下跳到一篇随机文章——不知道读什么的时候用。
 */
export default function RandomRoam() {
	const pathname = usePathname()
	const router = useRouter()
	const { items } = useBlogIndex()
	const [spinning, setSpinning] = useState(false)

	if (!pathname.startsWith('/blog')) return null
	if (!items || items.length < 2) return null

	const roam = () => {
		if (spinning) return
		const pool = items.filter(i => `/blog/${i.slug}` !== pathname)
		if (!pool.length) return toast.info('没有别的文章了')
		const pick = pool[Math.floor(Math.random() * pool.length)]
		setSpinning(true)
		setTimeout(() => {
			router.push(`/blog/${pick.slug}`)
			setSpinning(false)
		}, 420)
	}

	return (
		<div className='fixed right-6 bottom-40 z-40 max-sm:right-4 max-sm:bottom-36'>
			<motion.button
				type='button'
				onClick={roam}
				whileHover={{ scale: 1.08 }}
				whileTap={{ scale: 0.92 }}
				aria-label='随机看一篇'
				title='随机看一篇'
				className='bg-card border-backdrop group relative grid h-11 w-11 place-items-center rounded-full border shadow-lg backdrop-blur-md'>
				<motion.span animate={spinning ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.42, ease: 'easeInOut' }}>
					<Dices className='text-brand h-4.5 w-4.5' />
				</motion.span>
				<span className='border-brand/20 bg-card pointer-events-none absolute right-full mr-2 hidden rounded-lg border px-2 py-1 text-[11px] whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover:opacity-100 sm:block'>
					随机看一篇
				</span>
			</motion.button>

			<AnimatePresence>
				{spinning && (
					<motion.span
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						className='text-secondary bg-card border-backdrop absolute right-full mr-2 hidden rounded-lg border px-2 py-1 text-[11px] whitespace-nowrap shadow-md sm:block'
						style={{ bottom: 0 }}>
						掷骰中…
					</motion.span>
				)}
			</AnimatePresence>
		</div>
	)
}
