'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ShieldAlert } from 'lucide-react'

/**
 * OAuth 回调页：固定在规范域名上。
 * 换到 token 后，带着 #gitalk_token=... 跳回用户原本所在的页面，
 * 这样自定义域名 / vercel.app / CF Tunnel 都能登录。
 */
export default function GitalkCallbackPage() {
	const [err, setErr] = useState('')

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const code = params.get('code') || ''
		const state = params.get('state') || '/'
		const deny = params.get('error')

		if (deny) {
			setErr(params.get('error_description') || deny)
			return
		}
		if (!code) {
			setErr('回调里没有 code')
			return
		}

		let target = '/'
		try {
			// state 里是发起登录时的完整页面地址，只接受同源，避免开放跳转
			const u = new URL(state, window.location.origin)
			if (u.origin === window.location.origin) target = u.pathname + u.search
		} catch {
			/* 用默认首页 */
		}

		fetch('/api/gitalk/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code })
		})
			.then(r => r.json())
			.then(d => {
				if (!d?.access_token) {
					setErr(d?.error || '换取令牌失败')
					return
				}
				const hash = `#gitalk_token=${encodeURIComponent(d.access_token)}`
				window.location.replace(`${target}${hash}`)
			})
			.catch(e => setErr(e?.message || '网络错误'))
	}, [])

	return (
		<div className='mx-auto flex min-h-[60vh] w-full max-w-[520px] flex-col items-center justify-center px-6 text-center'>
			{err ? (
				<>
					<ShieldAlert className='mb-3 h-8 w-8 text-amber-500' />
					<h1 className='text-[16px] font-semibold'>登录没有完成</h1>
					<p className='text-secondary mt-2 text-[12px] leading-relaxed opacity-75'>{err}</p>
					<Link href='/' className='bg-brand mt-6 rounded-full px-5 py-2 text-[12.5px] font-medium text-white'>
						回首页重试
					</Link>
				</>
			) : (
				<>
					<Loader2 className='text-brand mb-3 h-7 w-7 animate-spin' />
					<h1 className='text-[15px] font-semibold'>正在返回文章…</h1>
					<p className='text-secondary mt-2 text-[12px] opacity-70'>正在用 GitHub 账号完成登录</p>
				</>
			)}
		</div>
	)
}
