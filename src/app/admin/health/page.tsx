'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { AlertTriangle, CheckCircle2, ImageOff, Tag, FileText } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'

type Issue = { s: string; t: string; k: string; v: string }
type Health = { generatedAt: string; count: number; issues: Issue[]; tagStats: { total: number; once: string[] } }

const KIND: Record<string, { label: string; color: string }> = {
	summary: { label: '摘要', color: 'text-amber-500' },
	title: { label: '标题', color: 'text-amber-500' },
	category: { label: '分类', color: 'text-amber-500' },
	blob: { label: '临时图', color: 'text-red-500' },
	image: { label: '缺图', color: 'text-red-500' }
}

export default function HealthPage() {
	const { items } = useBlogIndex()
	const [h, setH] = useState<Health | null>(null)

	useEffect(() => {
		fetch('/search-index.json')
			.then(r => r.json())
			.then(d => setH({ generatedAt: d.generatedAt, count: d.count, issues: d.issues ?? [], tagStats: d.tagStats ?? { total: 0, once: [] } }))
			.catch(() => setH(null))
	}, [])

	const byCategory = useMemo(() => {
		const m = new Map<string, number>()
		for (const it of items) m.set((it.category || '未分类').trim() || '未分类', (m.get((it.category || '未分类').trim() || '未分类') ?? 0) + 1)
		return [...m.entries()].sort((a, b) => b[1] - a[1])
	}, [items])

	const total = items.length
	const issues = h?.issues ?? []

	return (
		<div className='mx-auto w-full max-w-[820px] px-6 pt-28 pb-24 max-sm:px-4'>
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
				<div className='text-secondary mb-1.5 text-[11px] tracking-[0.18em] uppercase opacity-70'>内容体检</div>
				<h1 className='text-[26px] leading-tight font-semibold'>站点健康状况</h1>
				<p className='text-secondary mt-2 text-[12px] opacity-70'>
					每次构建时生成。{h ? `上次生成 ${new Date(h.generatedAt).toLocaleString('zh-CN')}` : '报告加载中…'}
				</p>
			</motion.div>

			{/* 概览 */}
			<div className='mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4'>
				{[
					{ label: '文章', value: total, icon: FileText },
					{ label: '分类', value: byCategory.length, icon: Tag },
					{ label: '标签', value: h?.tagStats.total ?? '—', icon: Tag },
					{ label: '待处理', value: issues.length, icon: issues.length ? AlertTriangle : CheckCircle2 }
				].map(c => (
					<div key={c.label} className='bg-card rounded-2xl border px-4 py-3'>
						<div className='text-secondary flex items-center gap-1.5 text-[10.5px] opacity-70'>
							<c.icon className='h-3 w-3' />
							{c.label}
						</div>
						<div className={`mt-1 text-[20px] leading-none font-semibold tabular-nums ${c.label === '待处理' && issues.length ? 'text-amber-500' : ''}`}>
							{c.value}
						</div>
					</div>
				))}
			</div>

			{/* 分类分布 */}
			<section className='mt-8'>
				<h2 className='mb-3 text-[14px] font-semibold'>分类分布</h2>
				<div className='bg-card rounded-2xl border px-5 py-4'>
					{byCategory.map(([c, n]) => (
						<div key={c} className='flex items-center gap-3 py-1.5'>
							<Link href={`/blog/category/${encodeURIComponent(c)}`} className='hover:text-brand w-28 shrink-0 truncate text-[12px] transition-colors'>
								{c}
							</Link>
							<div className='bg-border/40 h-1.5 flex-1 overflow-hidden rounded-full'>
								<div className='bg-brand/70 h-full rounded-full' style={{ width: `${(n / Math.max(total, 1)) * 100}%` }} />
							</div>
							<span className='text-secondary w-8 shrink-0 text-right text-[11px] tabular-nums opacity-70'>{n}</span>
						</div>
					))}
					{!byCategory.length && <div className='text-secondary py-4 text-center text-[12px]'>加载中…</div>}
				</div>
			</section>

			{/* 问题清单 */}
			<section className='mt-8'>
				<h2 className='mb-3 flex items-center gap-2 text-[14px] font-semibold'>
					待处理
					{!issues.length && <span className='text-[11px] font-normal text-emerald-500'>全部通过</span>}
				</h2>
				<div className='bg-card rounded-2xl border px-5 py-3'>
					{issues.map((i, idx) => (
						<div key={`${i.s}-${i.k}-${idx}`} className='flex items-start gap-3 border-b py-2.5 last:border-0'>
							<ImageOff className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${KIND[i.k]?.color ?? 'text-secondary'}`} />
							<div className='min-w-0 flex-1'>
								<Link href={`/blog/${i.s}`} className='hover:text-brand block truncate text-[12.5px] font-medium transition-colors'>
									{i.t}
								</Link>
								<div className='text-secondary mt-0.5 truncate text-[11px] opacity-70'>{i.v}</div>
							</div>
							<span className='text-secondary shrink-0 text-[10px] opacity-60'>{KIND[i.k]?.label ?? i.k}</span>
						</div>
					))}
					{!issues.length && <div className='text-secondary py-4 text-center text-[12px]'>没有发现坏链、缺图或缺失摘要</div>}
				</div>
			</section>

			{/* 单次标签 */}
			<section className='mt-8'>
				<h2 className='mb-3 text-[14px] font-semibold'>
					只用过一次的标签
					<span className='text-secondary ml-2 text-[11px] font-normal opacity-60'>{h?.tagStats.once.length ?? 0} 个，可以考虑合并</span>
				</h2>
				<div className='bg-card flex flex-wrap gap-2 rounded-2xl border px-5 py-4'>
					{(h?.tagStats.once ?? []).map(t => (
						<Link
							key={t}
							href={`/blog/tag/${encodeURIComponent(t)}`}
							className='text-secondary hover:border-brand/40 hover:text-brand rounded-full border px-2.5 py-1 text-[11px] transition-colors'>
							#{t}
						</Link>
					))}
					{!h?.tagStats.once.length && <span className='text-secondary text-[12px] opacity-60'>没有</span>}
				</div>
			</section>
		</div>
	)
}
