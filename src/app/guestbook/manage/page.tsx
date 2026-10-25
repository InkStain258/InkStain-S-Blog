'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, X, Loader2, LogOut, Undo2 } from 'lucide-react'
import { toast } from 'sonner'

type GuestMessage = {
	id: string
	name: string
	contact?: string
	content: string
	createdAt: string
	status: 'pending' | 'approved'
}

const KEY_STORE = 'ink-guestbook-key'

function when(iso: string) {
	const t = Date.parse(iso)
	return Number.isNaN(t) ? iso : new Date(t).toLocaleString('zh-CN', { hour12: false })
}

export default function GuestbookManagePage() {
	const [key, setKey] = useState('')
	const [input, setInput] = useState('')
	const [pending, setPending] = useState<GuestMessage[]>([])
	const [approved, setApproved] = useState<GuestMessage[]>([])
	const [loading, setLoading] = useState(false)
	const [busy, setBusy] = useState<string | null>(null)

	const load = useCallback(async (k: string) => {
		setLoading(true)
		try {
			const r = await fetch('/api/guestbook/moderate', { headers: { 'x-admin-key': k }, cache: 'no-store' })
			const d = await r.json()
			if (!r.ok || !d.ok) {
				toast.error(d.error || '口令不正确')
				sessionStorage.removeItem(KEY_STORE)
				setKey('')
				return
			}
			setPending(d.pending || [])
			setApproved(d.approved || [])
			setKey(k)
			sessionStorage.setItem(KEY_STORE, k)
		} catch {
			toast.error('加载失败')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		const saved = sessionStorage.getItem(KEY_STORE)
		if (saved) load(saved)
	}, [load])

	const act = async (id: string, action: 'approve' | 'reject' | 'pending') => {
		setBusy(id)
		try {
			const r = await fetch('/api/guestbook/moderate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
				body: JSON.stringify({ id, action })
			})
			const d = await r.json()
			if (!r.ok || !d.ok) {
				toast.error(d.error || '操作失败')
				return
			}
			toast.success(action === 'approve' ? '已通过，已在留言板展示' : action === 'reject' ? '已删除' : '已移回待审')
			await load(key)
		} finally {
			setBusy(null)
		}
	}

	if (!key) {
		return (
			<div className='mx-auto w-full max-w-[420px] px-6 pt-40'>
				<div className='bg-card rounded-[24px] border p-6 shadow-sm backdrop-blur-md'>
					<h1 className='text-base font-semibold'>留言审核</h1>
					<p className='text-secondary mt-1 text-[12px]'>输入管理口令后可以审核与展示留言。</p>
					<input
						type='password'
						value={input}
						onChange={e => setInput(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && input && load(input)}
						placeholder='管理口令'
						className='bg-bg/60 focus:border-brand/50 mt-4 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none'
					/>
					<button
						onClick={() => input && load(input)}
						disabled={loading || !input}
						className='bg-brand mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-45'>
						{loading ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : null}
						进入
					</button>
				</div>
			</div>
		)
	}

	const Item = ({ m, mode }: { m: GuestMessage; mode: 'pending' | 'approved' }) => (
		<div className='bg-card rounded-2xl border p-4'>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<div className='flex flex-wrap items-baseline gap-2'>
						<span className='text-[13px] font-medium'>{m.name}</span>
						<span className='text-secondary text-[10px] opacity-60'>{when(m.createdAt)}</span>
						<span className='text-secondary text-[10px] opacity-50'>#{m.id}</span>
						{m.contact && <span className='text-brand/80 text-[10px]'>{m.contact}</span>}
					</div>
					<p className='mt-1.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap'>{m.content}</p>
				</div>
				<div className='flex shrink-0 gap-1.5'>
					{mode === 'pending' ? (
						<>
							<button
								onClick={() => act(m.id, 'approve')}
								disabled={busy === m.id}
								className='inline-flex items-center gap-1 rounded-lg bg-emerald-500/12 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400'>
								{busy === m.id ? <Loader2 className='h-3 w-3 animate-spin' /> : <Check className='h-3 w-3' />}
								通过
							</button>
							<button
								onClick={() => act(m.id, 'reject')}
								disabled={busy === m.id}
								className='text-secondary inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-50'>
								<X className='h-3 w-3' />
								删除
							</button>
						</>
					) : (
						<button
							onClick={() => act(m.id, 'pending')}
							disabled={busy === m.id}
							className='text-secondary inline-flex items-center gap-1 rounded-lg bg-white/60 px-2.5 py-1.5 text-[11px] font-medium hover:bg-white/80 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/20'>
							<Undo2 className='h-3 w-3' />
							撤下
						</button>
					)}
				</div>
			</div>
		</div>
	)

	return (
		<div className='mx-auto w-full max-w-[760px] px-6 pt-28 pb-16'>
			<div className='flex items-center justify-between'>
				<h1 className='text-lg font-semibold'>留言审核</h1>
				<button
					onClick={() => {
						sessionStorage.removeItem(KEY_STORE)
						setKey('')
					}}
					className='text-secondary hover:text-brand inline-flex items-center gap-1 text-[12px] transition-colors'>
					<LogOut className='h-3.5 w-3.5' />
					退出
				</button>
			</div>

			<div className='mt-6 flex items-center gap-2'>
				<h2 className='text-sm font-medium'>待审核</h2>
				<span className='bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px]'>{pending.length}</span>
				<div className='from-border h-px flex-1 bg-gradient-to-r to-transparent' />
			</div>
			<div className='mt-3 grid gap-2.5'>
				{pending.length === 0 && <p className='text-secondary py-8 text-center text-[12px] opacity-60'>没有待审核的留言</p>}
				{pending.map(m => (
					<Item key={m.id} m={m} mode='pending' />
				))}
			</div>

			<div className='mt-8 flex items-center gap-2'>
				<h2 className='text-sm font-medium'>已展示</h2>
				<span className='bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px]'>{approved.length}</span>
				<div className='from-border h-px flex-1 bg-gradient-to-r to-transparent' />
			</div>
			<div className='mt-3 grid gap-2.5'>
				{approved.length === 0 && <p className='text-secondary py-8 text-center text-[12px] opacity-60'>还没有展示中的留言</p>}
				{approved.map(m => (
					<Item key={m.id} m={m} mode='approved' />
				))}
			</div>
		</div>
	)
}
