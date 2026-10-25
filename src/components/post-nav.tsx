'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'

/**
 * 文末的书签式上下篇导航。
 * 按发布时间排序，左边是更早的一篇，右边是更新的一篇。
 */
export default function PostNav({ slug }: { slug: string }) {
	const { items } = useBlogIndex()

	if (!items || items.length < 2) return null

	const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	const index = sorted.findIndex(i => i.slug === slug)
	if (index < 0) return null

	const older = sorted[index + 1]
	const newer = sorted[index - 1]
	if (!older && !newer) return null

	const Card = ({ post, dir }: { post: typeof older; dir: 'older' | 'newer' }) => {
		if (!post) return <div />
		const isOlder = dir === 'older'
		return (
			<motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}>
				<Link
					href={`/blog/${post.slug}`}
					className={`group block h-full rounded-2xl border p-4 transition-colors hover:border-brand/35 ${isOlder ? '' : 'text-right'}`}>
					<div className={`text-secondary flex items-center gap-1.5 text-[11px] ${isOlder ? '' : 'justify-end'}`}>
						{isOlder && <ArrowLeft className='h-3 w-3' />}
						{isOlder ? '更早的一篇' : '更新的一篇'}
						{!isOlder && <ArrowRight className='h-3 w-3' />}
					</div>
					<div className='group-hover:text-brand mt-1.5 line-clamp-2 text-[13.5px] leading-snug font-medium transition-colors'>{post.title}</div>
					<div className='text-secondary mt-1.5 text-[10.5px] opacity-60'>{dayjs(post.date).format('YYYY-MM-DD')}</div>
				</Link>
			</motion.div>
		)
	}

	return (
		<div className='mt-12'>
			<div className='mb-3 flex items-center gap-3'>
				<span className='text-secondary text-[11px] tracking-wider uppercase opacity-60'>继续读</span>
				<div className='from-border h-px flex-1 bg-gradient-to-r to-transparent' />
			</div>
			<div className='grid gap-3 sm:grid-cols-2'>
				<Card post={older} dir='older' />
				<Card post={newer} dir='newer' />
			</div>
		</div>
	)
}
