import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
	return (
		<div className='mx-auto flex min-h-[70vh] w-full max-w-[560px] flex-col items-center justify-center px-6 text-center'>
			<div
				className='text-brand/15 text-[104px] leading-none font-semibold tracking-tighter select-none'
				style={{ letterSpacing: '-0.04em' }}>
				404
			</div>

			<h1 className='mt-2 text-[17px] font-semibold'>这一页跑丢了</h1>
			<p className='text-secondary mt-2 text-[12.5px] leading-relaxed opacity-75'>
				链接可能改过名，也可能文章被删了。
				<br />
				试试搜索，或者回首页看看最近写了什么。
			</p>

			<div className='mt-7 flex flex-wrap items-center justify-center gap-3'>
				<Link
					href='/'
					className='bg-brand inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90'>
					<ArrowLeft className='h-3.5 w-3.5' />
					回首页
				</Link>
				<Link
					href='/blog'
					className='text-secondary hover:text-brand border-border/70 hover:border-brand/40 inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-[12.5px] transition-colors'>
					<Search className='h-3.5 w-3.5' />
					翻文章列表
				</Link>
			</div>

			<p className='text-secondary mt-8 text-[10.5px] opacity-40'>提示：任意页面按 ⌘K / Ctrl+K 可以全站搜索</p>
		</div>
	)
}
