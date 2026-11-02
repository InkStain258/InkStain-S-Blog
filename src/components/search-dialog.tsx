'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import EmptyState from '@/components/empty-state'
import { Search, CornerDownLeft, X } from 'lucide-react'

type Hit = { s: string; t: string; d: string; c: string; g: string[]; m: string; snippet: string; score: number }

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** 命中词高亮：只按用户输入的整串切，避免 bigram 把词切碎 */
function Highlight({ text, q }: { text: string; q: string }) {
	const needle = q.trim()
	if (!needle) return <>{text}</>
	const parts = text.split(new RegExp(`(${escapeRe(needle)})`, 'gi'))
	return (
		<>
			{parts.map((part, i) =>
				part && part.toLowerCase() === needle.toLowerCase() ? (
					<mark key={i} className='bg-brand/25 text-inherit rounded-[3px] px-0.5'>
						{part}
					</mark>
				) : (
					<span key={i}>{part}</span>
				)
			)}
		</>
	)
}

export default function SearchDialog() {
	const [open, setOpen] = useState(false)
	const [q, setQ] = useState('')
	const [hits, setHits] = useState<Hit[]>([])
	const [active, setActive] = useState(0)
	const [loading, setLoading] = useState(false)
	const [took, setTook] = useState<number | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const abortRef = useRef<AbortController | null>(null)

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
		setActive(0)
		const t = setTimeout(() => inputRef.current?.focus(), 60)
		return () => clearTimeout(t)
	}, [open])

	// 查询走服务端倒排索引（/api/search）：客户端不再下载索引文件，
	// 冷门词也不会像旧方案那样额外拉 240KB 正文分片。
	useEffect(() => {
		const query = q.trim()
		if (!query) {
			setHits([])
			setLoading(false)
			return
		}
		setLoading(true)
		const timer = setTimeout(async () => {
			abortRef.current?.abort()
			const ac = new AbortController()
			abortRef.current = ac
			try {
				const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ac.signal })
				const j = await r.json()
				setHits(Array.isArray(j?.hits) ? j.hits : [])
				setTook(typeof j?.took === 'number' ? j.took : null)
				setActive(0)
			} catch {
				// 被后续输入打断，忽略
			} finally {
				setLoading(false)
			}
		}, 160)
		return () => clearTimeout(timer)
	}, [q])

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
				className='glass-2 text-secondary hover:text-brand fixed top-16 right-4 z-40 hidden h-11 w-11 place-items-center rounded-xl transition-colors hover:scale-105 md:grid'>
				<Search className='h-4 w-4' />
			</button>

			{open && (
				<div
					onClick={() => setOpen(false)}
					className='ink-fade-in fixed inset-0 z-[80] flex items-start justify-center bg-black/25 px-4 pt-[12vh] backdrop-blur-sm'
					style={{ animationDuration: '0.18s' }}>
					<div
						onClick={e => e.stopPropagation()}
						className='ink-pop glass-overlay w-full max-w-[580px] overflow-hidden rounded-2xl'>
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
								{loading && <div className='text-secondary px-4 py-8 text-center text-[12px]'>搜索中…</div>}

								{!loading && !q && (
									<div className='text-secondary px-4 py-6 text-center text-[12px]'>
										输入关键词开始搜索
										<div className='mt-2 text-[11px] opacity-60'>↑ ↓ 选择 · Enter 打开 · Esc 关闭</div>
									</div>
								)}

								{!loading && q && !hits.length && <EmptyState dense title={`没找到「${q}」`} hint='试试更短的关键词，或者去归档翻。' />}

								{hits.map((h, i) => (
									<Link
										key={h.s}
										href={`/blog/${h.s}`}
										onMouseEnter={() => setActive(i)}
										className={`block border-b px-4 py-3 last:border-0 transition-colors ${i === active ? 'bg-brand/8' : ''}`}>
										<div className='flex items-center justify-between gap-3'>
											<div className='text-[13px] font-medium'>
							<Highlight text={h.t} q={q} />
						</div>
											<span className='text-secondary shrink-0 text-[10.5px] tabular-nums opacity-60'>{(h.d || '').slice(0, 10)}</span>
										</div>
										<div className='text-secondary mt-1 line-clamp-1 text-[11.5px] opacity-75'>
							<Highlight text={h.snippet} q={q} />
						</div>
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

							{!loading && !!hits.length && (
								<div className='text-secondary flex items-center justify-between border-t px-4 py-2 text-[10.5px] opacity-55'>
									<span>{hits.length} 条结果</span>
									<span className='tabular-nums'>{took !== null ? `${took}ms` : ''}</span>
								</div>
							)}
					</div>
				</div>
			)}
		</>
	)
}
