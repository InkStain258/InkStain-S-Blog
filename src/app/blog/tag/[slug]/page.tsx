'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowLeft, Tag } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import PostList from '@/components/post-list'

export default function TagPage() {
	const params = useParams<{ slug: string }>()
	const tag = decodeURIComponent(params.slug || '')
	const { items, loading } = useBlogIndex()

	const list = useMemo(
		() => items.filter(i => (i.tags || []).includes(tag)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
		[items, tag]
	)

	// 同一批文章里其它相关标签
	const related = useMemo(() => {
		const m = new Map<string, number>()
		for (const it of list) for (const t of it.tags || []) if (t !== tag) m.set(t, (m.get(t) ?? 0) + 1)
		return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
	}, [list, tag])

	const category = list[0]?.category

	return (
		<div className='mx-auto w-full max-w-[800px] px-6 pt-28 pb-24 max-sm:px-4'>
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
				<Link href='/blog' className='text-secondary hover:text-brand inline-flex items-center gap-1.5 text-xs transition-colors'>
					<ArrowLeft className='h-3.5 w-3.5' />
					返回博客
				</Link>

				<div className='mt-4 flex items-end justify-between gap-4'>
					<div>
						<div className='text-secondary mb-1.5 flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase opacity-70'>
							<Tag className='h-3 w-3' />
							标签
						</div>
						<h1 className='text-[28px] leading-tight font-semibold'>
							<span className='text-brand/40 mr-1'>#</span>
							{tag}
						</h1>
					</div>
					<div className='text-secondary text-right text-xs'>
						<div className='text-brand text-2xl leading-none font-semibold tabular-nums'>{loading && !list.length ? '—' : list.length}</div>
						<div className='mt-1 opacity-60'>篇文章</div>
					</div>
				</div>

				{category && (
					<Link
						href={`/blog/category/${encodeURIComponent(category)}`}
						className='text-secondary hover:text-brand mt-4 inline-flex items-center gap-1 text-[11.5px] transition-colors'>
						所属分类：{category}
					</Link>
				)}

				{related.length > 0 && (
					<div className='mt-5 flex flex-wrap gap-2'>
						{related.map(([t, n]) => (
							<Link
								key={t}
								href={`/blog/tag/${encodeURIComponent(t)}`}
								className='text-secondary hover:border-brand/40 hover:text-brand rounded-full border px-2.5 py-1 text-[11px] transition-colors'>
								#{t}
								<span className='ml-1 opacity-50'>{n}</span>
							</Link>
						))}
					</div>
				)}
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 14 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				className='card relative w-full mt-8 px-6 py-3'>
				<PostList items={list} showTags={false} empty='这个标签下还没有文章' />
			</motion.div>
		</div>
	)
}
