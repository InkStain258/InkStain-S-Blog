'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { Send, Loader2, MessageSquareQuote, Clock3, ShieldCheck, Sparkles, CornerDownRight, Crown } from 'lucide-react'
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
	parentId?: string
	isOwner?: boolean
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

const ADMIN_KEY = 'inkstain:admin_key'

function OwnerBadge() {
	return <span className='bg-brand/12 text-brand-ink rounded-full px-1.5 py-[1px] text-[9.5px] font-medium tracking-wide'>博主</span>
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
	const [replyTo, setReplyTo] = useState<string | null>(null)
	const [replyText, setReplyText] = useState('')
	const [replySending, setReplySending] = useState(false)
	const [adminKey, setAdminKey] = useState('')

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
		// 记住上次的昵称（按 IP）
		fetch('/api/guestbook/me')
			.then(r => r.json())
			.then(d => {
				if (typeof d?.name === 'string' && d.name) setName(prev => prev || d.name)
			})
			.catch(() => {})
		try {
			const k = sessionStorage.getItem(ADMIN_KEY)
			if (k) setAdminKey(k)
		} catch {
			/* ignore */
		}
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

	const sendReply = async (parentId: string) => {
		const text = replyText.trim()
		if (replySending) return
		if (text.length < 1) {
			toast.error('回复点什么吧')
			return
		}
		setReplySending(true)
		try {
			if (adminKey) {
				const r = await fetch('/api/guestbook/moderate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
					body: JSON.stringify({ id: parentId, action: 'owner-reply', reply: text })
				})
				const d = await r.json()
				if (!r.ok || !d.ok) throw new Error(d?.error || '发布失败')
				toast.success('已作为博主发布')
				await load()
			} else {
				const r = await fetch('/api/guestbook', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: name.trim(), contact: contact.trim(), content: text, parentId, website: '' })
				})
				const d = await r.json()
				if (!r.ok || !d.ok) throw new Error(d?.error || '提交失败')
				toast.success('回复已提交，审核通过后显示')
			}
			setReplyText('')
			setReplyTo(null)
		} catch (e: any) {
			toast.error(e?.message || '发送失败')
		} finally {
			setReplySending(false)
		}
	}

	const unlockAdmin = () => {
		const key = window.prompt('输入博主口令（只存在本标签页）')
		if (!key) return
		setAdminKey(key)
		try {
			sessionStorage.setItem(ADMIN_KEY, key)
		} catch {
			/* ignore */
		}
		toast.success('已解锁博主身份，回复会直接发布并标注')
	}

	const roots = useMemo(() => list.filter(m => !m.parentId), [list])
	const childrenOf = (id: string) => list.filter(m => m.parentId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

	const total = list.length
	const isEmpty = !loading && total === 0

	const renderBody = (m: GuestMessage) => (
		<>
			<div className='flex items-baseline gap-2'>
				<span className='text-[13px] font-medium'>{m.isOwner ? 'inkstain' : m.name}</span>
				{m.isOwner && <OwnerBadge />}
				<span className='text-secondary text-[10px]'>{timeAgo(m.createdAt)}</span>
			</div>
			<p className='mt-1 text-[13px] leading-relaxed break-words whitespace-pre-wrap'>{m.content}</p>
			{m.reply && (
				<motion.div
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.08 }}
					className='border-brand/40 bg-brand/[0.06] mt-2.5 rounded-r-xl border-l-2 px-3 py-2'>
					<div className='text-brand-ink flex items-center gap-1 text-[10px] font-medium'>
						<CornerDownRight className='h-3 w-3' />
						inkstain
						<OwnerBadge />
						{m.reply.at && <span className='text-secondary ml-1 font-normal'>{timeAgo(m.reply.at)}</span>}
					</div>
					<p className='mt-1 text-[12.5px] leading-relaxed break-words whitespace-pre-wrap'>{m.reply.content}</p>
				</motion.div>
			)}
		</>
	)

	return (
		<div className='mx-auto w-full max-w-[860px] px-6 pt-28 pb-16 max-sm:px-4'>
			<motion.header
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY }}
				className='text-center'>
				<span className='border-brand/25 bg-brand/10 text-brand-ink mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium'>
					<Sparkles className='h-3 w-3' />
					无需登录，留个名字就行
				</span>
				<h1 className='text-2xl font-semibold tracking-tight'>
					留<span className='text-linear'>言</span>板
				</h1>
				<p className='text-secondary mx-auto mt-2 max-w-[440px] text-[13px] leading-relaxed'>聊聊嘛</p>
			</motion.header>

			{/* 表单 */}
			<motion.div
				initial={{ opacity: 0, y: 14 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY + 0.08 }}
				className='bg-card elev-1 mt-8 rounded-[28px] border p-5 backdrop-blur-md'>
				<div className='flex flex-col gap-3 sm:flex-row'>
					<input
						value={name}
						onChange={e => setName(e.target.value)}
						maxLength={24}
						aria-label='昵称（可留空）'
						placeholder='昵称（可留空，默认「匿名」）'
						className='bg-bg/60 focus:border-brand/50 flex-1 rounded-xl border px-3.5 py-2.5 text-[13px] outline-none transition-colors'
					/>
					<input
						value={contact}
						onChange={e => setContact(e.target.value)}
						maxLength={64}
						aria-label='联系方式（邮箱或主页，可选）'
						placeholder='邮箱 / 主页（可选，不公开）'
						className='bg-bg/60 focus:border-brand/50 flex-1 rounded-xl border px-3.5 py-2.5 text-[13px] outline-none transition-colors'
					/>
				</div>

				<div className='relative mt-3'>
					<textarea
						value={content}
						onChange={e => setContent(e.target.value.slice(0, 600))}
						rows={4}
						aria-label='留言内容'
						placeholder='想说的话…'
						className='bg-bg/60 focus:border-brand/50 w-full resize-none rounded-xl border px-3.5 py-3 pb-8 text-[13px] leading-relaxed outline-none transition-colors'
					/>
					<span className='text-secondary pointer-events-none absolute right-3 bottom-2.5 text-[10px] tabular-nums'>
						{content.length}/600
					</span>
				</div>

				<div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
					<div className='text-secondary flex items-center gap-4 text-[11px]'>
						<span className='flex items-center gap-1'>
							<ShieldCheck className='h-3 w-3' />
							仅记录 IP 哈希用于限流
						</span>
						{cooldown > 0 && (
							<span className='text-brand-ink flex items-center gap-1'>
								<Clock3 className='h-3 w-3' />
								{cooldown}s 后可再发
							</span>
						)}
					</div>
					<button
						onClick={submit}
						disabled={sending || cooldown > 0 || !configured}
						className='bg-brand hover:bg-brand/90 elev-1 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-medium text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-45'>
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
					<MessageSquareQuote className='text-brand-ink h-4 w-4' />
					大家说
				</h2>
				<span className='text-secondary text-[11px]'>{loading ? '加载中…' : `共 ${total} 条`}</span>
				<div className='from-border h-px flex-1 bg-gradient-to-r to-transparent' />
			</div>

			{isEmpty && (
				<div className='text-secondary mt-8 rounded-2xl border border-dashed py-10 text-center text-[13px]'>
					还没有留言，来做第一个吧。
				</div>
			)}

			<div className='mt-4 grid gap-3'>
				<AnimatePresence initial={false}>
					{roots.map((m, i) => {
						const replies = childrenOf(m.id)
						return (
							<motion.article
								key={m.id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ delay: Math.min(i * 0.04, 0.3) }}
								className='bg-card group hover:border-brand/30 rounded-2xl border p-4 transition-colors'>
								<div className='flex items-start gap-3'>
									<span
										className='elev-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white'
										style={{ backgroundColor: m.isOwner ? '#2fcbe7' : avatarColor(m.name) }}>
										{(m.isOwner ? 'i' : m.name.slice(0, 1)).toUpperCase()}
									</span>
									<div className='min-w-0 flex-1'>
										{renderBody(m)}

										{replies.length > 0 && (
											<div className='border-border/60 mt-2.5 space-y-2 border-l pl-3'>
												{replies.map(r => (
													<div key={r.id} className='rounded-xl bg-black/[0.02] px-3 py-2 dark:bg-white/[0.02]'>
														<div className='flex items-baseline gap-2'>
															<span className='text-[12px] font-medium'>{r.isOwner ? 'inkstain' : r.name}</span>
															{r.isOwner && <OwnerBadge />}
															<span className='text-secondary text-[10px]'>{timeAgo(r.createdAt)}</span>
														</div>
														<p className='mt-1 text-[12.5px] leading-relaxed break-words whitespace-pre-wrap'>{r.content}</p>
													</div>
												))}
											</div>
										)}

										<div className='mt-2.5 flex items-center gap-3'>
											<button
												type='button'
												onClick={() => {
													setReplyTo(replyTo === m.id ? null : m.id)
													setReplyText('')
												}}
												className='text-secondary hover:text-brand-ink text-[11px] transition-colors'>
												{replyTo === m.id ? '取消' : '回复'}
											</button>
											{adminKey && (
												<span className='text-brand-ink flex items-center gap-1 text-[10px]'>
													<Crown className='h-3 w-3' />
													站长身份已解锁
												</span>
											)}
										</div>

										{replyTo === m.id && (
											<div className='mt-2'>
												<textarea
													value={replyText}
													onChange={e => setReplyText(e.target.value)}
													rows={2}
													maxLength={500}
													aria-label='回复内容'
													placeholder={adminKey ? '以 inkstain 身份回复，发布后立即显示' : '回复这条（审核后显示）'}
													className='bg-bg/60 focus:border-brand/50 w-full resize-y rounded-xl border px-3 py-2 text-[12.5px] leading-relaxed outline-none'
												/>
												<div className='mt-1.5 flex justify-end'>
													<button
														type='button'
														onClick={() => sendReply(m.id)}
														disabled={replySending}
														className='bg-brand inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium text-white disabled:opacity-60'>
														{replySending ? <Loader2 className='h-3 w-3 animate-spin' /> : <Send className='h-3 w-3' />}
														{adminKey ? '以博主发布' : '回复'}
													</button>
												</div>
											</div>
										)}
									</div>
								</div>
							</motion.article>
						)
					})}
				</AnimatePresence>
			</div>

			<p className='text-secondary mt-10 flex items-center justify-center gap-3 text-[11px]'>
				<Link href='/guestbook/manage' className='hover:text-brand-ink transition-colors'>
					管理
				</Link>
				<span className='opacity-30'>·</span>
				<button type='button' onClick={unlockAdmin} className='hover:text-brand-ink transition-colors'>
					{adminKey ? '站长身份已解锁' : '我是站长'}
				</button>
			</p>
		</div>
	)
}
