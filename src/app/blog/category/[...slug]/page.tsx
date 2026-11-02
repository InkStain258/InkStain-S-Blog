'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { useCategories } from '@/hooks/use-categories'
import PostList from '@/components/post-list'
import { findNode, itemUnder, pathOf } from '@/lib/categories'

export default function CategoryPage() {
	const params = useParams<{ slug: string[] }>()
	const raw = params.slug
	const path = (Array.isArray(raw) ? raw : raw ? [raw] : []).map(s => {
		try {
			return decodeURIComponent(s)
		} catch {
			return s
		}
	})

	const { items, loading } = useBlogIndex()
	const { tree, categories } = useCategories()

	// 大类名本身；兼容老链接（直接拿子类名访问）
	const isRootName = tree.some(n => n.name === path[0])
	const node = findNode(tree, path)

	const list = useMemo(() => {
		const matched = items.filter(i => (isRootName || path.length > 1 ? itemUnder(i, path) : pathOf(i).includes(path[0])))
		return matched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	}, [items, path.join('/'), isRootName])

	const siblings = useMemo(() => {
		if (path.length >= 2) {
			const parent = findNode(tree, path.slice(0, -1))
			return (parent?.children || []).map(c => c.name)
		}
		return node?.children?.map(c => c.name) || []
	}, [tree, path.join('/')])

	const tags = useMemo(() => {
		const m = new Map<string, number>()
		for (const it of list) for (const t of it.tags || []) m.set(t, (m.get(t) ?? 0) + 1)
		return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
	}, [list])

	const title = path.length ? path[path.length - 1] : '全部'
	const parentPath = path.slice(0, -1)
	const parentName = parentPath[parentPath.length - 1]

	return (
		<div className='mx-auto w-full max-w-[800px] px-6 pt-28 pb-24 max-sm:px-4'>
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
				<Link href='/blog' className='text-secondary hover:text-brand-ink inline-flex items-center gap-1.5 text-xs transition-colors'>
					<ChevronLeft className='h-3.5 w-3.5' />
					返回博客
				</Link>

				<div className='text-secondary mt-4 flex flex-wrap items-center gap-1.5 text-[11px]'>
					<Link href='/blog' className='hover:text-brand-ink transition-colors'>
						博客
					</Link>
					{path.map((seg, i) => (
						<span key={seg} className='flex items-center gap-1.5'>
							<ChevronRight className='h-3 w-3 opacity-40' />
							{i === path.length - 1 ? (
								<span className='text-brand-ink'>{seg}</span>
							) : (
								<Link href={`/blog/category/${path.slice(0, i + 1).map(encodeURIComponent).join('/')}`} className='hover:text-brand-ink transition-colors'>
									{seg}
								</Link>
							)}
						</span>
					))}
				</div>

				<div className='mt-4 flex items-end justify-between gap-4'>
					<div>
						<div className='text-secondary mb-1.5 text-[11px] tracking-[0.18em] uppercase'>{parentName || '分类'}</div>
						<h1 className='text-[28px] leading-tight font-semibold max-sm:text-[24px]'>{title}</h1>
					</div>
					<div className='text-secondary text-right text-xs'>
						<div className='text-brand-ink text-2xl leading-none font-semibold tabular-nums'>{loading && !list.length ? '—' : list.length}</div>
						<div className='mt-1'>篇文章</div>
					</div>
				</div>

				{tags.length > 0 && (
					<div className='mt-5 flex flex-wrap gap-2'>
						{tags.map(([t, n]) => (
							<Link
								key={t}
								href={`/blog/tag/${encodeURIComponent(t)}`}
								className='text-secondary hover:border-brand/40 hover:text-brand-ink rounded-full border px-2.5 py-1 text-[11px] transition-colors'>
								#{t}
								<span className='ml-1 opacity-50'>{n}</span>
							</Link>
						))}
					</div>
				)}

				{/* 一级：子类入口；二级：同级切换 */}
				{siblings.length > 0 && (
					<div className='mt-6 flex flex-wrap gap-2'>
						{path.length >= 2 && (
							<Link
								href={`/blog/category/${path.slice(0, -1).map(encodeURIComponent).join('/')}`}
								className='text-secondary hover:text-brand-ink rounded-full border px-3 py-1 text-[11.5px] transition-colors'>
								全部
							</Link>
						)}
						{siblings.map(c => {
							const p = path.length >= 2 ? [...path.slice(0, -1), c] : [...path, c]
							const active = c === title
							return (
								<Link
									key={c}
									href={`/blog/category/${p.map(encodeURIComponent).join('/')}`}
									className={`rounded-full px-3 py-1 text-[11.5px] transition-colors ${
										active ? 'bg-brand text-white' : 'text-secondary hover:text-brand-ink border'
									}`}>
									{c}
								</Link>
							)
						})}
					</div>
				)}

				{categories.length === 0 && !loading && (
					<div className='text-secondary mt-6 text-[11.5px]'>分类配置还没加载出来</div>
				)}
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 14 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				className='card card-content relative mt-8 w-full px-6 py-3'>
				<PostList items={list} empty='这个分类下还没有文章' />
			</motion.div>
		</div>
	)
}
