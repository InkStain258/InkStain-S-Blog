'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import type { BlogIndexItem } from '@/app/blog/types'

type Props = {
	items: BlogIndexItem[]
	/** 是否显示标签（标签页里隐藏，避免自我重复） */
	showTags?: boolean
	/** 行前缀：章节号 / 日期等 */
	prefix?: (item: BlogIndexItem, index: number) => string
	empty?: string
}

/**
 * 通用文章列表。分类页、标签页、归档页、系列页共用一套排版，
 * 与 /blog 主列表视觉一致（日期 + 圆点 + 标题 + 标签）。
 */
export default function PostList({ items, showTags = true, prefix, empty = '这里还没有文章' }: Props) {
	if (!items.length) {
		return (
			<div className='text-secondary py-16 text-center text-sm'>
				<div className='mx-auto mb-3 h-8 w-8 rounded-full border border-dashed opacity-40' />
				{empty}
			</div>
		)
	}

	return (
		<div className='divide-border/60 divide-y'>
			{items.map((it, i) => (
				<motion.div
					key={it.slug}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
					<Link href={`/blog/${it.slug}`} className='group flex items-center gap-4 py-3.5'>
						<span className='text-secondary w-12 shrink-0 text-[12px] tabular-nums'>
							{prefix ? prefix(it, i) : dayjs(it.date).format('MM-DD')}
						</span>

						<span className='relative flex h-2 w-2 shrink-0 items-center justify-center'>
							<span className='bg-secondary/50 group-hover:bg-brand h-[5px] w-[5px] rounded-full transition-all group-hover:h-3.5' />
						</span>

						<span className='group-hover:text-brand min-w-0 flex-1 truncate text-[13.5px] font-medium transition-all group-hover:translate-x-1'>
							{it.title || it.slug}
						</span>

						{showTags && (
							<span className='text-secondary flex shrink-0 items-center gap-2 text-[11px] max-sm:hidden'>
								{(it.tags || []).slice(0, 2).map(t => (
									<span key={t} className='opacity-60'>
										#{t}
									</span>
								))}
							</span>
						)}

						<ArrowUpRight className='text-secondary h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60' />
					</Link>
				</motion.div>
			))}
		</div>
	)
}
