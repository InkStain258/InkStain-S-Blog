'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Compass } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { relatedPosts } from '@/lib/related'

type RelatedPostsProps = {
	slug: string
	tags?: string[]
	category?: string
	title?: string
	limit?: number
}

/**
 * 文末「延伸阅读」。
 * 必须渲染在 BlogPreview 内部：页面级的兄弟节点不会被文章卡片的宽度约束（会铺满全屏）。
 */
export default function RelatedPosts({ slug, tags, category, title, limit = 3 }: RelatedPostsProps) {
	const { items } = useBlogIndex()
	const tagsKey = (tags || []).join('|')

	const list = useMemo(
		() => (items.length > 1 ? relatedPosts(items, { slug, tags: tagsKey ? tagsKey.split('|') : [], category, title }, limit) : []),
		[items, slug, tagsKey, category, title, limit]
	)

	if (!list.length) return null

	return (
		<div className='mt-10'>
			<div className='mb-3 flex items-center gap-3'>
				<span className='text-secondary flex items-center gap-1.5 text-[11px] tracking-wider uppercase opacity-60'>
					<Compass className='h-3 w-3' />
					延伸阅读
				</span>
				<div className='from-border h-px flex-1 bg-gradient-to-r to-transparent' />
				<span className='text-secondary shrink-0 text-[10.5px] opacity-50'>{list.length} 篇</span>
			</div>

			<div className='grid gap-3 sm:grid-cols-3'>
				{list.map(({ item, reasons }, i) => (
					<motion.div
						key={item.slug}
						initial={{ opacity: 0, y: 8 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: '-40px' }}
						transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
						whileHover={{ y: -2 }}>
						<Link
							href={`/blog/${item.slug}`}
							className='glass-1 hover:border-brand/35 flex h-full flex-col rounded-2xl p-3.5 transition-colors'>
							<div className='text-secondary mb-1.5 flex flex-wrap items-center gap-1 text-[10px]'>
								{reasons.map(r => (
									<span key={r} className='bg-brand/10 text-brand rounded-full px-1.5 py-0.5 leading-none'>
										{r}
									</span>
								))}
							</div>
							<div className='group-hover:text-brand line-clamp-2 text-[13px] leading-snug font-medium transition-colors'>
								{item.title || item.slug}
							</div>
							<div className='text-secondary mt-auto pt-2 text-[10.5px] opacity-60'>{dayjs(item.date).format('YYYY-MM-DD')}</div>
						</Link>
					</motion.div>
				))}
			</div>
		</div>
	)
}
