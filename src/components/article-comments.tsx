'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MessageSquare, Send, ShieldCheck, Loader2, CornerDownRight } from 'lucide-react'
import dayjs from 'dayjs'

type Comment = {
	id: string
	name: string
	content: string
	createdAt: string
	reply?: { content: string; at: string }
}

/** 匿名评论：不登录、不依赖 Gitalk，走 GitHub Issues 审核队列 */
export default function ArticleComments({ slug }: { slug: string }) {
	const [items, setItems] = useState<Comment[]>([])
	const [loading, setLoading] = useState(true)
	const [name, setName] = useState('')
	const [content, setContent] = useState('')
	const [site, setSite] = useState('') // 蜜罐
	const [sending, setSending] = useState(false)
	const [tip, setTip] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
	const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		let alive = true
		fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
			.then(r => r.json())
			.then(d => {
				if (alive) setItems(Array.isArray(d?.items) ? d.items : [])
			})
			.catch(() => {})
			.finally(() => alive && setLoading(false))
		return () => {
			alive = false
		}
	}, [slug])

	const flash = (kind: 'ok' | 'err', text: string) => {
		setTip({ kind, text })
		if (tipTimer.current) clearTimeout(tipTimer.current)
		tipTimer.current = setTimeout(() => setTip(null), 5000)
	}

	async function submit() {
		if (sending) return
		if (content.trim().length < 2) return flash('err', '至少写两个字吧')
		setSending(true)
		try {
			const r = await fetch('/api/comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug, name: name.trim(), content: content.trim(), website: site })
			})
			const d = await r.json()
			if (d?.ok) {
				setContent('')
				flash('ok', d.message || '已提交，等待审核')
			} else {
				flash('err', d?.error || '提交失败')
			}
		} catch {
			flash('err', '网络不太顺畅，稍后再试')
		} finally {
			setSending(false)
		}
	}

	return (
		<section className='mx-auto mt-14 w-full max-w-[760px] px-1'>
			<div className='mb-4 flex items-center justify-between'>
				<h2 className='flex items-center gap-2 text-[15px] font-semibold'>
					<MessageSquare className='text-brand h-4 w-4' />
					说两句
					<span className='text-secondary text-[11px] font-normal opacity-60'>{items.length ? `${items.length} 条` : '还没有评论'}</span>
				</h2>
				<span className='text-secondary flex items-center gap-1 text-[10.5px] opacity-60'>
					<ShieldCheck className='h-3 w-3' />
					无需登录 · 审核后展示
				</span>
			</div>

			{/* 输入区 */}
			<div className='bg-card rounded-2xl border p-4'>
				<div className='flex gap-2.5'>
					<input
						value={name}
						onChange={e => setName(e.target.value)}
						placeholder='昵称（可留空）'
						maxLength={24}
						className='bg-bg/60 w-[142px] rounded-xl border px-3 py-2 text-[12px] outline-none focus:border-brand/50 max-sm:w-[110px]'
					/>
					<div className='flex-1' />
				</div>

				<textarea
					value={content}
					onChange={e => setContent(e.target.value)}
					placeholder='想聊的、想问的、指正的，都行。'
					rows={3}
					maxLength={800}
					className='bg-bg/60 mt-2.5 w-full resize-y rounded-xl border px-3 py-2.5 text-[12.5px] leading-relaxed outline-none focus:border-brand/50'
				/>

				{/* 蜜罐，正常用户看不到 */}
				<input
					value={site}
					onChange={e => setSite(e.target.value)}
					name='website'
					tabIndex={-1}
					autoComplete='off'
					className='pointer-events-none absolute h-0 w-0 opacity-0'
					aria-hidden
				/>

				<div className='mt-3 flex items-center justify-between gap-3'>
					<span className='text-secondary text-[10.5px] opacity-55'>最多 800 字 · 同一 IP 30 秒一次</span>
					<button
						type='button'
						onClick={submit}
						disabled={sending}
						className='bg-brand inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60'>
						{sending ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Send className='h-3.5 w-3.5' />}
						发送
					</button>
				</div>

				<AnimatePresence>
					{tip && (
						<motion.div
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							className={`mt-2.5 rounded-lg px-3 py-1.5 text-[11.5px] ${
								tip.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
							}`}>
							{tip.text}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* 列表 */}
			<div className='mt-3 space-y-2.5'>
				{loading && <div className='text-secondary py-6 text-center text-[11.5px] opacity-50'>加载评论…</div>}
				{!loading && !items.length && (
					<div className='text-secondary py-6 text-center text-[11.5px] opacity-50'>第一条评论的位置留给你了</div>
				)}
				{items.map(c => (
					<motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className='bg-card rounded-2xl border px-4 py-3'>
						<div className='flex items-baseline gap-2'>
							<span className='text-[12.5px] font-medium'>{c.name || '匿名'}</span>
							<span className='text-secondary text-[10.5px] opacity-50'>{dayjs(c.createdAt).format('YYYY-MM-DD HH:mm')}</span>
						</div>
						<p className='text-secondary mt-1.5 text-[12.5px] leading-relaxed whitespace-pre-wrap'>{c.content}</p>
						{c.reply?.content && (
							<div className='mt-2.5 rounded-xl border-l-2 border-brand/40 pl-3'>
								<div className='text-brand flex items-center gap-1 text-[10.5px]'>
									<CornerDownRight className='h-3 w-3' />
									站长回复
								</div>
								<p className='text-secondary mt-1 text-[12px] leading-relaxed whitespace-pre-wrap'>{c.reply.content}</p>
							</div>
						)}
					</motion.div>
				))}
			</div>
		</section>
	)
}
