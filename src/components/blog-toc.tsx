'use client'

import clsx from 'clsx'
import { motion } from 'motion/react'
import { Bookmark } from 'lucide-react'
import { useEffect, useRef } from 'react'

type TocItem = {
	id: string
	text: string
	level: number
}

type BlogTocProps = {
	toc: TocItem[]
	delay?: number
	/** 当前章节，由 useTocProgress 统一算好后传下来 */
	activeId?: string
	/** 0–1 阅读进度 */
	progress?: number
	/** 上次读到的那一节（localStorage 记忆），点一下跳回去 */
	resume?: { id: string; text: string } | null
	onResume?: () => void
}

const RAIL_LEFT = 3

export function BlogToc({ toc, delay = 0, activeId = '', progress = 0, resume, onResume }: BlogTocProps) {
	const listRef = useRef<HTMLDivElement>(null)
	const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
	const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100)
	const activeIndex = activeId ? toc.findIndex(t => t.id === activeId) : -1

	// 当前章节滚出目录可视区时把目录本身滚过去，长目录也不会「高亮飘在上面看不见」
	useEffect(() => {
		const el = activeId ? itemRefs.current[activeId] : null
		const box = listRef.current
		if (!el || !box) return
		const top = el.offsetTop
		const bottom = top + el.offsetHeight
		if (top < box.scrollTop + 4 || bottom > box.scrollTop + box.clientHeight - 4) {
			box.scrollTo({ top: Math.max(0, top - box.clientHeight / 2 + el.offsetHeight / 2), behavior: 'smooth' })
		}
	}, [activeId])

	const head = (
		<div className='mb-2 flex items-baseline justify-between gap-2'>
			<h2 className='text-secondary font-medium'>目录</h2>
			<span className='text-brand text-[10.5px] tabular-nums opacity-80'>{percent}%</span>
		</div>
	)

	if (toc.length === 0) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay }}
				className='glass-2 w-full rounded-xl p-3 text-sm'>
				{head}
				<div className='text-secondary'>暂无</div>
			</motion.div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay }}
			className='glass-2 glass-gloss w-full rounded-xl p-3 text-sm'>
			{head}

			{resume && resume.id !== activeId && (
				<button
					type='button'
					onClick={() => {
						document.getElementById(resume.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
						onResume?.()
					}}
					className='text-secondary hover:border-brand/40 hover:text-brand mb-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed px-2 py-1 text-left text-[10.5px] transition-colors'>
					<Bookmark className='h-3 w-3 shrink-0' />
					<span className='truncate'>上次读到 · {resume.text}</span>
				</button>
			)}

			<div ref={listRef} className='scrollbar-none relative max-h-[300px] overflow-auto pr-1'>
				<div className='relative'>
					{/* 轨道 */}
					<div className='bg-border pointer-events-none absolute top-0 bottom-0 w-px' style={{ left: RAIL_LEFT }} />
					{/* 已读进度 */}
					<div
						className='from-brand to-brand-secondary pointer-events-none absolute top-0 w-px bg-gradient-to-b'
						style={{ left: RAIL_LEFT, height: `${percent}%`, transition: 'height 150ms linear' }}
					/>

					<div className='space-y-1'>
						{toc.map(item => {
							const active = item.id === activeId
							return (
								<a
									key={item.id}
									ref={node => {
										itemRefs.current[item.id] = node
									}}
									href={`#${item.id}`}
									aria-current={active ? 'location' : undefined}
									className={clsx(
										'relative block py-[3px] text-[12.5px] leading-snug transition-colors',
										active ? 'text-brand font-medium' : 'text-secondary hover:text-brand'
									)}
									style={{ paddingLeft: 14 + (item.level - 1) * 8 }}>
									<span
										className={clsx(
											'absolute top-[0.68em] h-1.5 w-1.5 rounded-full transition-all',
											active ? 'bg-brand scale-125' : 'bg-secondary/35'
										)}
										style={{ left: RAIL_LEFT - 3 }}
									/>
									{item.text}
								</a>
							)
						})}
					</div>
				</div>
			</div>

			<div className='border-border/60 text-secondary mt-2 flex items-center justify-between border-t pt-2 text-[10.5px]'>
				<span className='tabular-nums'>{activeIndex >= 0 ? `第 ${activeIndex + 1} / ${toc.length} 节` : `共 ${toc.length} 节`}</span>
				<span className='opacity-60'>点击跳转</span>
			</div>
		</motion.div>
	)
}
