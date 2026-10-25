'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { Send, Loader2, MessageSquareQuote, Clock3, ShieldCheck, Sparkles, CornerDownRight } from 'lucide-react'
import { toast } from 'sonner'
import { INIT_DELAY } from '@/consts'

type GuestMessage = {
	id: string
	name: string
	contact?: string
	content: string
	createdAt: string
	status: 'pending' | 'approved'
	reply?: { content: string; at: string }
}

function timeAgo(iso: string) {
	const t = Date.parse(iso)
	if (Number.isNaN(t)) return ''
	const diff = Date.now() - t
	const min = Math.floor(diff / 60000)
	if (min < 1) return '刚刚'
	if (min < 60) return `${min} 分钟前`
	const h = Math.floor(min / 60)
	if (h < 24) return `${h} 小时前`
	const d = Math.floor(h / 24)
	if (d < 30) return `${d} 天前`
	return new Date(t).toLocaleDateString('zh-CN')
}

const PALETTE = ['#2fcbe7', '#7c9cff', '#f08fb0', '#f0b46a', '#6ee7b7', '#b48cf2']

function avatarColor(name: string) {
	let h = 0
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997
	return PALETTE[h % PALETTE.length]
}

export default function GuestbookPage() {
	const [list, setList] = useState<GuestMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [configured, setConfigured] = useState(true)
	const [sending, setSending] = useState(false)
	const [name, setName] = useState('')
	const [contact, setContact] = useState('')
	const [content, setContent] = useState('')
	const [cooldown, setCooldown] = useState(0)

	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const load = async () => {
		try {
			const r = await fetch('/api/guestbook', { cache: 'no-store' })
			const d = await r.json()
			setList(Array.isArray(d.items) ? d.items : [])
			setConfigured(d.configured !== false)
		} catch {
			setList([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		load()
		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [])

	const startCooldown = (sec: number) => {
		setCooldown(sec)
		if (timerRef.current) clearInterval(timerRef.current)
		timerRef.current = setInterval(() => {
			setCooldown(v => {
				if (v <= 1) {
					if (timerRef.current) clearInterval(timerRef.current)
					return 0
				}
				return v - 1
			})
		}, 1000)
	}

	const submit = async () => {
		const text = content.trim()
		if (text.length < 2) {
			toast.error('写点什么再提交吧')
			return
		}
		setSending(true)
		try {
			const r = await fetch('/api/guestbook', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: name.trim(), contact: contact.trim(), content: text, website: '' })
			})
			const d = await r.json()
			if (!r.ok || !d.ok) {
				toast.error(d.error || '提交失败')
				const m = String(d.error || '').match(/(\d+)\s*秒/)
				if (r.status === 429 && m) startCooldown(Number(m[1]))
				return
			}
			setContent('')
			toast.success(d.message || '已提交，等待审核')
			startCooldown(30)
		} catch {
			toast.error('网络异常，稍后再试')
		} finally {
			setSending(false)
		}
	}

	const total = list.length
	const isEmpty = !loading && total === 0

	return (
		<div className='mx-auto w-full max-w-[860px] px-6 pt-28 pb-16 max-sm:px-4'>
			<motion.header
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY }}
				className='text-center'>
				<span className='border-brand/25 bg-brand/10 text-brand mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium'>
					<Sparkles className='h-3 w-3' />
					无需登录，留个名字就行
				</span>
				<h1 className='text-2xl font-semibold tracking-tight'>
					留<span className='text-linear'>言</span>板
				</h1>
				<p className='text-secondary mx-auto mt-2 max-w-[440px] text-[13px] leading-relaxed'>
					说点什么都可以——建议、吐槽、想看的选题，或者只是打个招呼。
					<br />
					提交后我会人工过一遍，合适的会贴在下面。
				</p>
			</motion.header>

			{/* 表单 */}
			<motion.div
				initial={{ opacity: 0, y: 14 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY + 0.08 }}
				className='bg-card mt-8 rounded-[28px] border p-5 shadow-sm backdrop-blur-md'>
				<div className='flex flex-col gap-3 sm:flex-row'>
					<input
						value={name}
						onChange={e => setName(e.target.value)}
						maxLength={24}
						placeholder='昵称（可留空，默认「匿名」）'
						className='bg-bg/60 focus:border-brand/50 flex-1 rounded-xl border px-3.5 py-2.5 text-[13px] outline-none transition-colors'
					/>
					<input
						value={contact}
						onChange={e => setContact(e.target.value)}
						maxLength={64}
						placeholder='邮箱 / 主页（可选，不公开）'
						className='bg-bg/60 focus:border-brand/50 flex-1 rounded-xl border px-3.5 py-2.5 text-[13px] outline-none transition-colors'
					/>
				</div>

				<div className='relative mt-3'>
					<textarea
						value={content}
						onChange={e => setContent(e.target.value.slice(0, 600))}
						rows={4}
						placeholder='想说的话…'
						className='bg-bg/60 focus:border-brand/50 w-full resize-none rounded-xl border px-3.5 py-3 pb-8 text-[13px] leading-relaxed outline-none transition-colors'
					/>
					<span className='text-secondary pointer-events-none absolute right-3 bottom-2.5 text-[10px] tabular-nums opacity-60'>
						{content.length}/600
					</span>
				</div>

				<div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
					<div className='text-secondary flex items-center gap-4 text-[11px] opacity-75'>
						<span className='flex items-center gap-1'>
							<ShieldCheck className='h-3 w-3' />
							仅记录 IP 哈希用于限流
						</span>
						{cooldown > 0 && (
							<span className='text-brand flex items-center gap-1'>
								<Clock3 className='h-3 w-3' />
								{cooldown}s 后可再发
							</span>
						)}
					</div>
					<button
						onClick={submit}
						disabled={sending || cooldown > 0 || !configured}
						className='bg-brand hover:bg-brand/90 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-45'>
						{sending ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Send className='h-3.5 w-3.5' />}
						提交留言
					</button>
				</div>

				{!configured && (
					<p className='mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400'>
						当前部署未配置 <code>GUESTBOOK_TOKEN</code>，暂时无法接收留言。
					</p>
				)}
			</motion.div>

			{/* 列表 */}
			<div className='mt-10 flex items-center gap-3'>
				<h2 className='flex items-center gap-1.5 text-sm font-medium'>
					<MessageSquareQuote className='text-brand h-4 w-4' />
					大家说
				</h2>
				<span className='text-secondary text-[11px] opacity-70'>{loading ? '加载中…' : `共 ${total} 条`}</span>
				<div className='from-border h-px flex-1 bg-gradient-to-r to-transparent' />
			</div>

			{isEmpty && (
				<div className='text-secondary mt-8 rounded-2xl border border-dashed py-10 text-center text-[13px] opacity-70'>
					还没有留言，来做第一个吧。
				</div>
			)}

			<div className='mt-4 grid gap-3'>
				<AnimatePresence initial={false}>
					{list.map((m, i) => (
						<motion.article
							key={m.id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ delay: Math.min(i * 0.04, 0.3) }}
							className='bg-card group hover:border-brand/30 rounded-2xl border p-4 transition-colors'>
							<div className='flex items-start gap-3'>
								<span
									className='grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white shadow-sm'
									style={{ backgroundColor: avatarColor(m.name) }}>
									{m.name.slice(0, 1).toUpperCase()}
								</span>
								<div className='min-w-0 flex-1'>
									<div className='flex items-baseline gap-2'>
										<span className='text-[13px] font-medium'>{m.name}</span>
										<span className='text-secondary text-[10px] opacity-60'>{timeAgo(m.createdAt)}</span>
									</div>
									<p className='mt-1 text-[13px] leading-relaxed break-words whitespace-pre-wrap'>{m.content}</p>
									{m.reply && (
										<motion.div
											initial={{ opacity: 0, y: -4 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.08 }}
											className='border-brand/40 bg-brand/[0.06] mt-2.5 rounded-r-xl border-l-2 px-3 py-2'>
											<div className='text-brand flex items-center gap-1 text-[10px] font-medium'>
												<CornerDownRight className='h-3 w-3' />
												站长回复
												{m.reply.at && <span className='text-secondary ml-1 font-normal opacity-60'>{timeAgo(m.reply.at)}</span>}
											</div>
											<p className='mt-1 text-[12.5px] leading-relaxed break-words whitespace-pre-wrap'>{m.reply.content}</p>
										</motion.div>
									)}
								</div>
							</div>
						</motion.article>
					))}
				</AnimatePresence>
			</div>

			<p className='text-secondary mt-10 text-center text-[11px] opacity-50'>
				<Link href='/guestbook/manage' className='hover:text-brand transition-colors'>
					管理
				</Link>
			</p>
		</div>
	)
}
