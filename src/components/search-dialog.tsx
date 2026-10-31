'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Search, CornerDownLeft, X } from 'lucide-react'

type Doc = { s: string; t: string; d: string; c: string; g: string[]; m: string; b: string }
type Hit = Doc & { score: number; snippet: string }

let cache: Doc[] | null = null

/** 加权评分：标题 > 标签 > 摘要 > 正文；多关键词按 AND 处理 */
function search(docs: Doc[], raw: string): Hit[] {
	const q = raw.trim().toLowerCase()
	if (!q) return []
	const terms = q.split(/\s+/).filter(Boolean)

	const hits: Hit[] = []
	for (const d of docs) {
		const title = d.t.toLowerCase()
		const tags = d.g.join(' ').toLowerCase()
		const summary = d.m.toLowerCase()
		const body = d.b.toLowerCase()
		const haystack = `${title} ${tags} ${summary} ${body}`

		if (!terms.every(t => haystack.includes(t))) continue

		let score = 0
		if (title === q) score += 120
		if (title.startsWith(q)) score += 60
		if (title.includes(q)) score += 45
		if (tags.includes(q)) score += 30
		if (summary.includes(q)) score += 22
		if (body.includes(q)) score += 10

		const idx = body.indexOf(terms[0])
		const snippet = idx >= 0 ? d.b.slice(Math.max(0, idx - 30), idx + 90).replace(/\n/g, ' ') : d.m

		hits.push({ ...d, score, snippet })
	}

	return hits.sort((a, b) => b.score - a.score).slice(0, 12)
}

export default function SearchDialog() {
	const [open, setOpen] = useState(false)
	const [q, setQ] = useState('')
	const [docs, setDocs] = useState<Doc[]>(cache ?? [])
	const [active, setActive] = useState(0)
	const [loading, setLoading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	const load = useCallback(async () => {
		if (cache) return
		setLoading(true)
		try {
			const r = await fetch('/search-index.json')
			const j = await r.json()
			cache = j.docs ?? []
			setDocs(cache!)
		} catch {
			cache = []
			setDocs([])
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault()
				setOpen(v => !v)
				return
			}
			if (e.key === 'Escape') setOpen(false)
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [])

	useEffect(() => {
		if (!open) return
		load()
		setActive(0)
		const t = setTimeout(() => inputRef.current?.focus(), 60)
		return () => clearTimeout(t)
	}, [open, load])

	const hits = useMemo(() => search(docs, q), [docs, q])

	const onInputKey = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setActive(i => Math.min(i + 1, Math.max(hits.length - 1, 0)))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActive(i => Math.max(i - 1, 0))
		} else if (e.key === 'Enter' && hits[active]) {
			window.location.href = `/blog/${hits[active].s}`
		}
	}

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				aria-label='搜索'
				title='搜索（⌘K）'
				className='text-secondary hover:text-brand border-border/60 bg-card fixed top-16 right-4 z-40 hidden h-9 w-9 place-items-center rounded-xl border shadow-md backdrop-blur-sm transition-colors hover:scale-105 md:grid'>
				<Search className='h-4 w-4' />
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.18 }}
						onClick={() => setOpen(false)}
						className='fixed inset-0 z-[80] flex items-start justify-center bg-black/25 px-4 pt-[12vh] backdrop-blur-sm'>
						<motion.div
							initial={{ opacity: 0, y: -12, scale: 0.985 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -8, scale: 0.99 }}
							transition={{ type: 'spring', stiffness: 380, damping: 32 }}
							onClick={e => e.stopPropagation()}
							className='bg-card w-full max-w-[580px] overflow-hidden rounded-2xl border shadow-2xl'>
							<div className='flex items-center gap-2.5 border-b px-4 py-3'>
								<Search className='text-secondary h-4 w-4 shrink-0' />
								<input
									ref={inputRef}
									value={q}
									onChange={e => {
										setQ(e.target.value)
										setActive(0)
									}}
									onKeyDown={onInputKey}
									placeholder='搜标题、标签或正文…'
									className='placeholder:text-secondary/60 flex-1 bg-transparent text-[13.5px] outline-none'
								/>
								{q && (
									<button type='button' onClick={() => setQ('')} aria-label='清空' className='text-secondary hover:text-primary'>
										<X className='h-3.5 w-3.5' />
									</button>
								)}
							</div>

							<div className='scrollbar-none max-h-[52vh] overflow-y-auto'>
								{loading && <div className='text-secondary px-4 py-8 text-center text-[12px]'>索引加载中…</div>}

								{!loading && !q && (
									<div className='text-secondary px-4 py-6 text-center text-[12px]'>
										输入关键词开始搜索
										<div className='mt-2 text-[11px] opacity-60'>↑ ↓ 选择 · Enter 打开 · Esc 关闭</div>
									</div>
								)}

								{!loading && q && !hits.length && <div className='text-secondary px-4 py-8 text-center text-[12px]'>没找到「{q}」</div>}

								{hits.map((h, i) => (
									<Link
										key={h.s}
										href={`/blog/${h.s}`}
										onMouseEnter={() => setActive(i)}
										className={`block border-b px-4 py-3 last:border-0 transition-colors ${i === active ? 'bg-brand/8' : ''}`}>
										<div className='flex items-center justify-between gap-3'>
											<div className='text-[13px] font-medium'>{h.t}</div>
											<span className='text-secondary shrink-0 text-[10.5px] tabular-nums opacity-60'>{(h.d || '').slice(0, 10)}</span>
										</div>
										<div className='text-secondary mt-1 line-clamp-1 text-[11.5px] opacity-75'>{h.snippet}</div>
										<div className='text-secondary mt-1 flex items-center gap-2 text-[10px] opacity-50'>
											{h.c && <span>{h.c}</span>}
											{h.g.slice(0, 2).map(t => (
												<span key={t}>#{t}</span>
											))}
											{i === active && (
												<span className='ml-auto flex items-center gap-1'>
													<CornerDownLeft className='h-2.5 w-2.5' />
													打开
												</span>
											)}
										</div>
									</Link>
								))}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}
