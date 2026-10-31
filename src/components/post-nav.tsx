'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, BookMarked } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { seriesContext } from '@/lib/series'

/**
 * 文末导航。
 * - 属于系列的文章：按章节顺序走「上一章 / 下一章」，并给出系列目录入口
 * - 其它文章：按发布时间走「更早的一篇 / 更新的一篇」
 */
export default function PostNav({ slug }: { slug: string }) {
	const { items } = useBlogIndex()

	if (!items || items.length < 2) return null

	const ctx = seriesContext(items, slug)
	const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	const index = sorted.findIndex(i => i.slug === slug)

	const inSeries = !!ctx && ctx.total > 1
	if (!inSeries && index < 0) return null

	const older = inSeries ? ctx!.prev : sorted[index + 1]
	const newer = inSeries ? ctx!.next : sorted[index - 1]
	if (!older && !newer) return null

	const Card = ({ post, dir }: { post: typeof older; dir: 'older' | 'newer' }) => {
		if (!post) return <div className='hidden sm:block' />
		const isOlder = dir === 'older'
		const label = inSeries ? (isOlder ? '上一章' : '下一章') : isOlder ? '更早的一篇' : '更新的一篇'
		const chapter = inSeries ? (post as any).chapter : null
		const chapterTitle = inSeries ? (post as any).chapterTitle : null
		return (
			<motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}>
				<Link
					href={`/blog/${post.slug}`}
					className={`glass-1 group block h-full rounded-2xl p-4 transition-colors hover:border-brand/35 ${isOlder ? '' : 'text-right'}`}>
					<div className={`text-secondary flex items-center gap-1.5 text-[11px] ${isOlder ? '' : 'justify-end'}`}>
						{isOlder && <ArrowLeft className='h-3 w-3' />}
						{label}
						{chapter ? <span className='opacity-50'>· 第 {chapter} 篇</span> : null}
						{!isOlder && <ArrowRight className='h-3 w-3' />}
					</div>
					<div className='group-hover:text-brand mt-1.5 line-clamp-2 text-[13.5px] leading-snug font-medium transition-colors'>
						{chapterTitle || post.title}
					</div>
					<div className='text-secondary mt-1.5 text-[10.5px] opacity-60'>{dayjs(post.date).format('YYYY-MM-DD')}</div>
				</Link>
			</motion.div>
		)
	}

	return (
		<div className='mt-12'>
			<div className='mb-3 flex items-center gap-3'>
				<span className='text-secondary flex items-center gap-1.5 text-[11px] tracking-wider uppercase opacity-60'>
					{inSeries ? (
						<>
							<BookMarked className='h-3 w-3' />
							{ctx!.group.name} · 第 {ctx!.index + 1} / {ctx!.total} 篇
						</>
					) : (
						'继续读'
					)}
				</span>
				<div className='from-border h-px flex-1 bg-gradient-to-r to-transparent' />
				{inSeries && (
					<Link href={`/series/${encodeURIComponent(ctx!.group.slug)}`} className='text-secondary hover:text-brand shrink-0 text-[11px] transition-colors'>
						系列目录
					</Link>
				)}
			</div>
			<div className='grid gap-3 sm:grid-cols-2'>
				<Card post={older} dir='older' />
				<Card post={newer} dir='newer' />
			</div>
		</div>
	)
}
