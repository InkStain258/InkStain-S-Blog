'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import { ChevronLeft, Loader2, Search as SearchIcon } from 'lucide-react'

/**
 * 独立搜索结果页。
 *
 * 弹窗适合「随手查一下」，但结果多了看不全、也没法分享或后退回来。
 * 这里把同一份 /api/search 的结果铺开成列表，URL 带 ?q=，可以收藏、可以粘给别人。
 *
 * 因为要读 useSearchParams，整页必须包在 Suspense 里（Next 16 的构建要求）。
 */
// 服务端为了压体积，字段名都用单字母：s=slug t=title d=date c=category g=tags
type Hit = {
	s: string
	t: string
	d: string
	c?: string
	g?: string[]
	snippet?: string
	score?: number
}

function SearchInner() {
	const router = useRouter()
	const sp = useSearchParams()
	const urlQ = sp.get('q') ?? ''
	const [text, setText] = useState(urlQ)
	const [hits, setHits] = useState<Hit[]>([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(false)
	const [took, setTook] = useState<number | null>(null)

	useEffect(() => setText(urlQ), [urlQ])

	const run = useCallback(async (q: string) => {
		const query = q.trim()
		if (!query) {
			setHits([])
			setTotal(0)
			setTook(null)
			return
		}
		setLoading(true)
		try {
			const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
			const data = (await r.json()) as { hits?: Hit[]; total?: number; took?: number }
			setHits(data.hits ?? [])
			setTotal(data.total ?? (data.hits?.length || 0))
			setTook(typeof data.took === 'number' ? data.took : null)
		} catch {
			setHits([])
			setTotal(0)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void run(urlQ)
	}, [urlQ, run])

	const submit = (e: React.FormEvent) => {
		e.preventDefault()
		const q = text.trim()
		if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
	}

	const meta = useMemo(() => {
		if (!urlQ.trim()) return ''
		if (loading) return '检索中…'
		const parts = [`${total} 条结果`]
		if (took !== null) parts.push(`${took} ms`)
		return parts.join(' · ')
	}, [urlQ, loading, total, took])

	return (
		<div className='mx-auto w-full max-w-[1460px] px-6 pt-24 pb-24 max-sm:px-4 lg:pl-[330px]'>
			<div className='max-w-[820px]'>
				<Link href='/blog' className='text-secondary hover:text-brand-ink inline-flex items-center gap-1.5 text-xs transition-colors'>
					<ChevronLeft className='h-3.5 w-3.5' />
					返回博客
				</Link>

				<div className='mt-4 flex items-end justify-between gap-4'>
					<div>
						<div className='text-brand-ink mb-1.5 text-[10.5px] tracking-[0.3em] uppercase'>Search</div>
						<h1 className='text-[32px] leading-tight font-semibold'>搜索</h1>
					</div>
					<div className='text-secondary text-[11.5px] tabular-nums'>{meta}</div>
				</div>

				<form onSubmit={submit} className='glass-1 mt-6 flex items-center gap-2 rounded-2xl px-4 py-2.5'>
					<SearchIcon className='text-secondary h-4 w-4 shrink-0' />
					<input
						autoFocus
						value={text}
						onChange={e => setText(e.target.value)}
						placeholder='搜标题、标签、摘要或正文…'
						aria-label='搜索关键词'
						className='placeholder:text-secondary/70 min-w-0 flex-1 bg-transparent text-[14px] outline-none'
					/>
					{loading ? <Loader2 className='text-secondary h-4 w-4 animate-spin' /> : null}
					<button type='submit' className='bg-brand/15 text-brand-ink hover:bg-brand/25 rounded-lg px-3 py-1.5 text-[11.5px] transition-colors'>
						搜索
					</button>
				</form>

				<div className='mt-6 space-y-2.5'>
					{hits.map(hit => (
						<Link
							key={hit.s}
							href={`/blog/${hit.s}`}
							className='glass-1 hover:border-brand/40 group block rounded-xl px-4 py-3.5 transition-colors'>
							<div className='text-secondary flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]'>
								<span className='handwriting tabular-nums'>{dayjs(hit.d).format('YYYY-MM-DD')}</span>
								{hit.c ? <span className='text-brand-ink/80'>{hit.c}</span> : null}
								{(hit.g || []).slice(0, 3).map(t => (
									<span key={t} className='text-secondary/80'>
										#{t}
									</span>
								))}
							</div>
							<h2 className='group-hover:text-brand-ink mt-1.5 text-[15.5px] font-medium transition-colors'>{hit.t}</h2>
							{hit.snippet ? <p className='text-secondary mt-1 line-clamp-2 text-[12.5px] leading-relaxed'>{hit.snippet}</p> : null}
						</Link>
					))}

					{!loading && urlQ.trim() && hits.length === 0 ? (
						<div className='text-secondary py-16 text-center text-sm'>
							没有找到「{urlQ}」
							<div className='mt-2 text-[11.5px]'>换个更短的词试试，比如只搜两个字的主题</div>
						</div>
					) : null}

					{!urlQ.trim() ? <div className='text-secondary py-16 text-center text-sm'>输入关键词开始搜索 · 也可以在任意页按 ⌘K</div> : null}
				</div>
			</div>
		</div>
	)
}

export default function SearchPage() {
	return (
		<Suspense fallback={<div className='text-secondary py-32 text-center text-sm'>加载中…</div>}>
			<SearchInner />
		</Suspense>
	)
}