'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { useMemo } from 'react'
import { BookMarked } from 'lucide-react'
import { INIT_DELAY } from '@/consts'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { useSize } from '@/hooks/use-size'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { seriesContext } from '@/lib/series'
import PostNav from '@/components/post-nav'
import MobileToc from '@/components/mobile-toc'
import { BlogSidebar } from '@/components/blog-sidebar'
import { useConfigStore } from '@/app/(home)/stores/config-store'

type BlogPreviewProps = {
	markdown: string
	title: string
	tags: string[]
	date: string
	summary?: string
	cover?: string
	slug?: string
}

export function BlogPreview({ markdown, title, tags, date, summary, cover, slug }: BlogPreviewProps) {
	const { maxSM: isMobile } = useSize()
	const { content, toc, loading } = useMarkdownRender(markdown)
	const { siteContent } = useConfigStore()
	const summaryInContent = siteContent.summaryInContent ?? false
	const { items } = useBlogIndex()
	const series = useMemo(() => (slug ? seriesContext(items, slug) : null), [items, slug])

	// 字数与阅读时长（中文按 400 字/分钟）
	const stats = useMemo(() => {
		const plain = markdown
			.replace(/```[\s\S]*?```/g, '')
			.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
			.replace(/[#>*_`~\-\[\]()]/g, '')
			.replace(/\s/g, '')
		const chars = plain.length
		return { chars, minutes: Math.max(1, Math.ceil(chars / 400)) }
	}, [markdown])

	if (loading) {
		return <div className='text-secondary flex h-full items-center justify-center text-sm'>渲染中...</div>
	}

	return (
		<div className='mx-auto flex max-w-[1140px] justify-center gap-6 px-6 pt-28 pb-12 max-sm:px-0'>
			<motion.article
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: INIT_DELAY }}
				className='card bg-article static flex-1 overflow-auto rounded-xl p-8'>
				<div>
					{series && series.total > 1 && (
						<Link
							href={`/series/${encodeURIComponent(series.group.slug)}`}
							className='text-secondary hover:border-brand/40 hover:text-brand mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors'>
							<BookMarked className='h-3 w-3' />
							{series.group.name} · 第 {series.index + 1} / {series.total} 篇
						</Link>
					)}

					<div className='text-center text-2xl font-semibold'>{title}</div>

					<div className='text-secondary mt-4 flex flex-wrap items-center justify-center gap-3 px-8 text-center text-sm'>
						{tags.map(t => (
							<Link key={t} href={`/blog/tag/${encodeURIComponent(t)}`} className='hover:text-brand transition-colors'>
								#{t}
							</Link>
						))}
					</div>

					<div className='text-secondary mt-3 flex flex-wrap items-center justify-center gap-2 text-center text-sm'>
						<span>{date}</span>
						<span className='opacity-40'>·</span>
						<span>{stats.chars.toLocaleString()} 字</span>
						<span className='opacity-40'>·</span>
						<span>约 {stats.minutes} 分钟</span>
					</div>

					{summary && summaryInContent && <div className='text-secondary mt-6 cursor-text text-center text-sm'>“{summary}”</div>}

					<div className='prose mt-6 max-w-none cursor-text'>{content}</div>

					<PostNav slug={slug} />
				</div>
			</motion.article>

			{!isMobile && <BlogSidebar cover={cover} summary={summary} toc={toc} slug={slug} />}
			{isMobile && <MobileToc toc={toc} />}
		</div>
	)
}
