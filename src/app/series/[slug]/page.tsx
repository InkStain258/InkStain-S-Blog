'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Circle } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { groupSeries } from '@/lib/series'

export default function SeriesDetailPage() {
	const params = useParams<{ slug: string }>()
	const slug = decodeURIComponent(params.slug || '')
	const { items, loading } = useBlogIndex()

	const group = useMemo(() => groupSeries(items).find(g => g.slug === slug), [items, slug])

	if (!loading && !group) {
		return (
			<div className='mx-auto w-full max-w-[800px] px-6 pt-32 pb-24 text-center'>
				<div className='text-secondary text-sm'>没有这个系列</div>
				<Link href='/series' className='text-brand mt-4 inline-block text-xs underline underline-offset-4'>
					看看其它系列
				</Link>
			</div>
		)
	}

	const first = group?.items[0]
	const last = group?.items[group.items.length - 1]

	return (
		<div className='mx-auto w-full max-w-[800px] px-6 pt-28 pb-24 max-sm:px-4'>
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
				<Link href='/series' className='text-secondary hover:text-brand inline-flex items-center gap-1.5 text-xs transition-colors'>
					<ArrowLeft className='h-3.5 w-3.5' />
					全部系列
				</Link>

				<div className='mt-4 flex items-end justify-between gap-4'>
					<div className='min-w-0'>
						<div className='text-secondary mb-1.5 text-[11px] tracking-[0.18em] uppercase opacity-70'>系列</div>
						<h1 className='text-[26px] leading-tight font-semibold'>{group?.name ?? '…'}</h1>
					</div>
					<div className='text-secondary shrink-0 text-right text-xs'>
						<div className='text-brand text-2xl leading-none font-semibold tabular-nums'>{group?.items.length ?? '—'}</div>
						<div className='mt-1 opacity-60'>篇</div>
					</div>
				</div>

				{first && (
					<Link
						href={`/blog/${first.slug}`}
						className='bg-brand mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90'>
						从第一篇开始读
						<ArrowRight className='h-3.5 w-3.5' />
					</Link>
				)}
			</motion.div>

			<div className='card relative w-full mt-8 overflow-hidden px-6 py-3'>
				{group?.items.map((it, i) => (
					<motion.div
						key={it.slug}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: Math.min(i * 0.03, 0.35), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
						<Link href={`/blog/${it.slug}`} className='group border-border/60 flex items-start gap-4 border-b py-4 last:border-0'>
							<span className='text-secondary/60 mt-0.5 w-7 shrink-0 text-right text-[11px] tabular-nums'>
								{String(it.chapter).padStart(2, '0')}
							</span>
							<Circle className='text-secondary/25 group-hover:text-brand mt-1.5 h-2 w-2 shrink-0 fill-current transition-colors' />
							<span className='flex min-w-0 flex-1 flex-col'>
								<span className='group-hover:text-brand block truncate text-[13.5px] font-medium transition-colors'>{it.chapterTitle || it.title}</span>
								<span className='text-secondary mt-1 block truncate text-[11px] opacity-60'>{it.summary || it.title}</span>
							</span>
							<span className='text-secondary mt-0.5 shrink-0 text-[11px] tabular-nums opacity-50'>{dayjs(it.date).format('YYYY-MM-DD')}</span>
						</Link>
					</motion.div>
				))}
			</div>

			{last && (
				<div className='text-secondary mt-6 text-center text-[11px] opacity-50'>
					最近一篇更新于 {dayjs(last.date).format('YYYY 年 MM 月 DD 日')}
				</div>
			)}
		</div>
	)
}
