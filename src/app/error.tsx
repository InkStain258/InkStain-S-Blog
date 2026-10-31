'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * 路由级错误边界：某个页面渲染/数据出错时，只挂掉这一块，不再整站白屏。
 * digest 是 Next 给的一次性哈希，便于拿日志对账时定位同一次错误。
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error('[route-error]', error)
		// GA4 里留一条可查询的记录（没有 gtag 就跳过）
		try {
			const w = window as unknown as { gtag?: (...args: unknown[]) => void }
			w.gtag?.('event', 'exception', { description: String(error?.message || error), fatal: false, digest: error?.digest })
		} catch {
			/* ignore */
		}
	}, [error])

	return (
		<div className='mx-auto flex min-h-[60vh] w-full max-w-[560px] flex-col items-center justify-center px-6 text-center'>
			<div
				className='glass-2 flex w-full flex-col items-center rounded-[20px] px-6 py-9'
				style={{ background: 'linear-gradient(var(--color-card), var(--color-card)), var(--color-bg)' }}>
				<div className='mb-3 text-[26px] leading-none'>🧩</div>
				<h1 className='text-[16px] font-semibold'>这一块没能渲染出来</h1>
				<p className='text-secondary mt-2 max-w-[420px] text-[12px] leading-relaxed opacity-75'>
					页面里有个组件抛错了，其余部分还正常。可以先重试，或回首页换个入口。
					{error?.digest ? <span className='mt-1 block font-mono text-[10.5px] opacity-60'>digest {error.digest}</span> : null}
				</p>
				<div className='mt-6 flex items-center gap-2.5'>
					<button
						type='button'
						onClick={reset}
						className='bg-brand rounded-full px-5 py-2 text-[12.5px] font-medium text-white transition hover:opacity-90'>
						重试
					</button>
					<Link
						href='/'
						className='text-secondary rounded-full border border-[var(--ink-border)] px-5 py-2 text-[12.5px] transition hover:opacity-80'>
						回首页
					</Link>
				</div>
			</div>
		</div>
	)
}
