'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { seriesContext } from '@/lib/series'

/**
 * 文章底部的系列导航。
 *
 * 这个站的内容几乎都是成系列的（文学概论 11 篇、比较文学 13 篇），但文章页原来
 * 读完就断在那里，读者不知道「下一篇是哪篇」，也不知道自己在系列里走到哪了。
 *
 * 数据来自 index.json 的标题解析（`XX笔记：04 第X章 …`），不额外维护字段。
 */
export default function SeriesNav({ slug }: { slug: string }) {
	const { items } = useBlogIndex()
	const ctx = seriesContext(items, slug)
	if (!ctx) return null

	const { group, index, total, prev, next } = ctx
	const progress = Math.round(((index + 1) / total) * 100)

	return (
		<section className='mx-auto mt-16 w-full max-w-[760px] px-6 max-sm:px-4' aria-label='系列导航'>
			<div className='glass-1 rounded-2xl px-5 py-4'>
				<div className='flex flex-wrap items-baseline justify-between gap-2'>
					<div className='text-brand-ink flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase'>
						<Layers className='h-3.5 w-3.5' />
						系列
					</div>
					<div className='text-secondary text-[11.5px] tabular-nums'>
						第 {index + 1} / {total} 篇
					</div>
				</div>

				<h3 className='mt-2 text-[16px] font-medium'>{group.name}</h3>

				<div className='bg-secondary/20 mt-3 h-1 w-full overflow-hidden rounded-full'>
					<div className='bg-brand h-full rounded-full transition-[width] duration-500' style={{ width: `${Math.max(progress, 4)}%` }} />
				</div>

				<div className='mt-4 grid gap-2 sm:grid-cols-2'>
					{prev ? (
						<Link
							href={`/blog/${prev.slug}`}
							className='border-border/60 hover:border-brand/40 group flex items-start gap-2 rounded-xl border px-3 py-2.5 transition-colors'>
							<ChevronLeft className='text-secondary mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5' />
							<div className='min-w-0'>
								<div className='text-secondary text-[10.5px]'>上一篇</div>
								<div className='group-hover:text-brand-ink mt-0.5 line-clamp-2 text-[12.5px] leading-snug transition-colors'>{prev.title}</div>
							</div>
						</Link>
					) : (
						<div className='border-border/40 text-secondary rounded-xl border border-dashed px-3 py-2.5 text-[11.5px]'>这是系列第一篇</div>
					)}

					{next ? (
						<Link
							href={`/blog/${next.slug}`}
							className='border-border/60 hover:border-brand/40 group flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-right transition-colors'>
							<div className='min-w-0 flex-1'>
								<div className='text-secondary text-[10.5px]'>下一篇</div>
								<div className='group-hover:text-brand-ink mt-0.5 line-clamp-2 text-[12.5px] leading-snug transition-colors'>{next.title}</div>
							</div>
							<ChevronRight className='text-secondary mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5' />
						</Link>
					) : (
						<div className='border-border/40 text-secondary rounded-xl border border-dashed px-3 py-2.5 text-right text-[11.5px]'>这是系列最后一篇</div>
					)}
				</div>
			</div>
		</section>
	)
}