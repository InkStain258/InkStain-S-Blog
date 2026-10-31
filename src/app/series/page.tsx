'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { ArrowLeft, BookMarked, ArrowRight } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { groupSeries } from '@/lib/series'

export default function SeriesIndexPage() {
	const { items, loading } = useBlogIndex()
	const groups = useMemo(() => groupSeries(items), [items])

	return (
		<div className='mx-auto w-full max-w-[800px] px-6 pt-28 pb-24 max-sm:px-4'>
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
				<Link href='/blog' className='text-secondary hover:text-brand inline-flex items-center gap-1.5 text-xs transition-colors'>
					<ArrowLeft className='h-3.5 w-3.5' />
					返回博客
				</Link>
				<div className='mt-4'>
					<div className='text-secondary mb-1.5 flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase opacity-70'>
						<BookMarked className='h-3 w-3' />
						系列
					</div>
					<h1 className='text-[28px] leading-tight font-semibold'>按系列读</h1>
					<p className='text-secondary mt-2 text-[12.5px] opacity-70'>成组的笔记按章节顺序排好了，从第一篇往下读不会断线。</p>
				</div>
			</motion.div>

			<div className='mt-8 space-y-4'>
				{groups.map((g, i) => {
					const last = g.items[g.items.length - 1]
					return (
						<motion.div
							key={g.slug}
							initial={{ opacity: 0, y: 14 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.06 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
							<Link href={`/series/${encodeURIComponent(g.slug)}`} className='card relative w-full group block px-6 py-5 transition-colors hover:border-brand/35'>
								<div className='flex items-center justify-between gap-4'>
									<div className='min-w-0'>
										<div className='group-hover:text-brand flex items-center gap-2 text-[15px] font-semibold transition-colors'>
											{g.name}
											<ArrowRight className='h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-60' />
										</div>
										<div className='text-secondary mt-1.5 truncate text-[11.5px] opacity-70'>
											共 {g.items.length} 篇 · 最近更新 {dayjs(last.date).format('YYYY-MM-DD')}
										</div>
									</div>
									<div className='text-brand shrink-0 text-2xl leading-none font-semibold tabular-nums opacity-80'>{g.items.length}</div>
								</div>
								<div className='bg-brand/8 mt-4 h-1 overflow-hidden rounded-full'>
									<div className='from-brand to-brand-secondary h-full w-full rounded-full bg-gradient-to-r opacity-70' />
								</div>
							</Link>
						</motion.div>
					)
				})}

				{!loading && !groups.length && <div className='text-secondary py-16 text-center text-sm'>还没有识别到系列</div>}
			</div>
		</div>
	)
}
