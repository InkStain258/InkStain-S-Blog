'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import PostList from '@/components/post-list'

export default function ArchivePage() {
	const { items, loading } = useBlogIndex()

	const years = useMemo(() => {
		const m = new Map<string, typeof items>()
		for (const it of [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())) {
			const y = dayjs(it.date).format('YYYY')
			m.set(y, [...(m.get(y) ?? []), it])
		}
		return [...m.entries()]
	}, [items])

	const total = items.length

	return (
		<div className='mx-auto w-full max-w-[800px] px-6 pt-28 pb-24 max-sm:px-4'>
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
				<Link href='/blog' className='text-secondary hover:text-brand inline-flex items-center gap-1.5 text-xs transition-colors'>
					<ArrowLeft className='h-3.5 w-3.5' />
					返回博客
				</Link>

				<div className='mt-4 flex items-end justify-between gap-4'>
					<div>
						<div className='text-secondary mb-1.5 text-[11px] tracking-[0.18em] uppercase opacity-70'>归档</div>
						<h1 className='text-[28px] leading-tight font-semibold'>全部文章</h1>
					</div>
					<div className='text-secondary text-right text-xs'>
						<div className='text-brand text-2xl leading-none font-semibold tabular-nums'>{loading && !total ? '—' : total}</div>
						<div className='mt-1 opacity-60'>篇 · {years.length} 年</div>
					</div>
				</div>

				{years.length > 1 && (
					<div className='mt-5 flex flex-wrap gap-2'>
						{years.map(([y, list]) => (
							<a key={y} href={`#y-${y}`} className='text-secondary hover:border-brand/40 hover:text-brand rounded-full border px-3 py-1 text-[11.5px] transition-colors'>
								{y}
								<span className='ml-1 opacity-50'>{list.length}</span>
							</a>
						))}
					</div>
				)}
			</motion.div>

			<div className='mt-8 space-y-6'>
				{years.map(([y, list], yi) => (
					<motion.section
						key={y}
						id={`y-${y}`}
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.06 + yi * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className='card relative w-full scroll-mt-24 px-6 py-4'>
						<div className='mb-1 flex items-baseline justify-between'>
							<h2 className='text-[15px] font-semibold tracking-wide'>{y} 年</h2>
							<span className='text-secondary text-[11px] opacity-60'>{list.length} 篇</span>
						</div>
						<PostList items={list} />
					</motion.section>
				))}

				{!loading && !total && (
					<div className='text-secondary py-16 text-center text-sm'>还没有文章</div>
				)}
			</div>
		</div>
	)
}
