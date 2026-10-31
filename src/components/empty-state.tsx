'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import clsx from 'clsx'

type EmptyStateProps = {
	title: string
	hint?: string
	icon?: LucideIcon
	/** 给读者一个出口，而不是死路 */
	action?: { label: string; href: string }
	/** 紧凑版：嵌在卡片里（评论区、搜索面板） */
	dense?: boolean
}

/**
 * 空状态统一版式。之前各处分别是「这里还没有文章」「暂无」「加载中...」，
 * 同一个站四种说法，读者分不清是空了还是坏了。
 */
export default function EmptyState({ title, hint, icon: Icon = Inbox, action, dense = false }: EmptyStateProps) {
	return (
		<div className={clsx('flex flex-col items-center justify-center text-center', dense ? 'gap-2 py-8' : 'gap-3 py-16')}>
			<div
				className={clsx(
					'text-secondary/60 grid place-items-center rounded-2xl border border-dashed',
					dense ? 'h-9 w-9' : 'h-12 w-12'
				)}>
				<Icon className={dense ? 'h-4 w-4' : 'h-5 w-5'} />
			</div>
			<div className={clsx('font-medium', dense ? 'text-[12.5px]' : 'text-sm')}>{title}</div>
			{hint && <div className={clsx('text-secondary max-w-[36ch] leading-relaxed', dense ? 'text-[11.5px]' : 'text-[12.5px]')}>{hint}</div>}
			{action && (
				<Link
					href={action.href}
					className='text-brand hover:border-brand/40 mt-1 rounded-full border px-3 py-1 text-[11.5px] transition-colors'>
					{action.label}
				</Link>
			)}
		</div>
	)
}
