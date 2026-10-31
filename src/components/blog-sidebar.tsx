'use client'

import { motion } from 'motion/react'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'
import LikeButton from '@/components/like-button'
import { BlogToc } from '@/components/blog-toc'
import { useConfigStore } from '@/app/(home)/stores/config-store'

type TocItem = {
	id: string
	text: string
	level: number
}

type BlogSidebarProps = {
	cover?: string
	summary?: string
	toc: TocItem[]
	slug?: string
	activeId?: string
	progress?: number
	resume?: { id: string; text: string } | null
	onResume?: () => void
}

export function BlogSidebar({ cover, summary, toc, slug, activeId, progress, resume, onResume }: BlogSidebarProps) {
	const { siteContent } = useConfigStore()
	const summaryInContent = siteContent.summaryInContent ?? false

	return (
		<div
			className='scrollbar-none sticky flex max-h-[calc(100vh-3rem)] w-[200px] shrink-0 flex-col items-start gap-4 self-start overflow-y-auto pb-2 max-sm:hidden'
			style={{ top: 24 }}>
			{cover && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 1 }}
					className='glass-2 w-full rounded-xl p-3'>
					<img src={cover} alt='cover' className='h-auto w-full rounded-xl border object-cover' />
				</motion.div>
			)}

			{summary && !summaryInContent && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 2 }}
					className='glass-2 w-full rounded-xl p-3 text-sm'>
					<h2 className='text-secondary mb-2 font-medium'>摘要</h2>
					<div className='text-secondary scrollbar-none max-h-[240px] cursor-text overflow-auto'>{summary}</div>
				</motion.div>
			)}

			<BlogToc
				toc={toc}
				delay={INIT_DELAY + ANIMATION_DELAY * 3}
				activeId={activeId}
				progress={progress}
				resume={resume}
				onResume={onResume}
			/>

			<LikeButton slug={slug} delay={(INIT_DELAY + ANIMATION_DELAY * 4) * 1000} />
		</div>
	)
}
