'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import dayjs from 'dayjs'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { useCategories } from '@/hooks/use-categories'

/**
 * 本站统计：文章总数、分类分布、标签数、最近更新。
 * 数据来自 /blogs/index.json（SWR，和博客列表同一份缓存），
 * 所以新增/修改文章后这里会自动跟着变。
 */
export default function SiteStats() {
	const { items, loading } = useBlogIndex()
	const { categories } = useCategories()

	const { total, tagCount, rows, latest } = useMemo(() => {
		const counts = new Map<string, number>()
		for (const it of items) {
			const key = (it.category || '').trim() || '未分类'
			counts.set(key, (counts.get(key) ?? 0) + 1)
		}

		const declared = [...categories].filter(Boolean)
		const extra = [...counts.keys()].filter(k => k !== '未分类' && !declared.includes(k))
		const rows = [...declared, ...extra].map(name => ({ name, count: counts.get(name) ?? 0 }))
		const uncategorized = counts.get('未分类') ?? 0
		if (uncategorized > 0) rows.push({ name: '未分类', count: uncategorized })

		const tags = new Set<string>()
		for (const it of items) for (const t of it.tags || []) tags.add(t)

		const latest = items.reduce((acc, it) => (it.date > acc ? it.date : acc), '')

		return { total: items.length, tagCount: tags.size, rows, latest }
	}, [items, categories])

	const max = Math.max(1, ...rows.map(r => r.count))

	return (
		<div className='border-brand/12 from-brand/[0.045] to-brand/[0.015] mt-10 rounded-3xl border bg-gradient-to-br p-5 sm:p-6'>
			<div className='flex items-baseline justify-between gap-3'>
				<div className='flex items-center gap-2'>
					<span className='text-[12.5px] font-semibold tracking-wide'>本站数据</span>
					<span className='text-secondary text-[10.5px] opacity-60'>实时取自博客索引</span>
				</div>
				{latest && <span className='text-secondary text-[10.5px] opacity-60'>最近更新 {dayjs(latest).format('YYYY-MM-DD')}</span>}
			</div>

			<div className='mt-4 flex items-end gap-8'>
				{[
					{ label: '篇文章', value: total },
					{ label: '个分类', value: rows.filter(r => r.count > 0).length },
					{ label: '个标签', value: tagCount }
				].map((s, i) => (
					<motion.div
						key={s.label}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.05 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
						<div className='flex items-baseline gap-1'>
							<span className='text-brand text-[30px] leading-none font-semibold tabular-nums'>{loading && !total ? '—' : s.value}</span>
							<span className='text-secondary text-[11px]'>{s.label}</span>
						</div>
					</motion.div>
				))}
			</div>

			<div className='mt-5 space-y-2'>
				{rows.length === 0 && <div className='text-secondary text-[11px] opacity-60'>还没有分类数据</div>}
				{rows.map((r, i) => (
					<div key={r.name} className='flex items-center gap-3'>
						<span className={`w-32 shrink-0 truncate text-[11.5px] ${r.count ? '' : 'text-secondary opacity-45'}`} title={r.name}>
							{r.name}
						</span>
						{r.count > 0 ? (
							<div className='bg-brand/8 h-1.5 flex-1 overflow-hidden rounded-full'>
								<motion.div
									className='from-brand to-brand-secondary h-full rounded-full bg-gradient-to-r'
									initial={{ width: 0 }}
									animate={{ width: `${(r.count / max) * 100}%` }}
									transition={{ delay: 0.1 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
								/>
							</div>
						) : (
							<div className='border-secondary/15 h-px flex-1 border-t border-dashed' />
						)}
						<span className='text-secondary w-8 shrink-0 text-right text-[11px] tabular-nums'>{r.count}</span>
					</div>
				))}
			</div>
		</div>
	)
}
