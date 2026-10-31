'use client'

/**
 * 文章骨架屏：结构与真实文章一致（系列徽标 → 标题 → 元信息 → 正文段 → 侧边封面/目录），
 * 加载完成时位置不跳。延迟 150ms 出现（-animation-delay 不适用于淡入，所以用 apper 动画），
 * 首屏命中缓存时用户看不到它闪一下。
 */
export default function ArticleSkeleton() {
	const widths = ['92%', '100%', '86%', '97%', '74%', '100%', '88%', '63%']

	return (
		<div
			aria-busy='true'
			aria-label='文章加载中'
			className='mx-auto flex max-w-[1140px] justify-center gap-6 px-6 pt-28 pb-12 max-sm:px-0'>
			<div className='card card-content relative w-full flex-1 overflow-hidden p-8 skeleton-appear'>
				<div className='flex flex-col items-center gap-4'>
					<div className='skeleton-bar h-4 w-40' />
					<div className='skeleton-bar h-7 w-[70%]' />
					<div className='skeleton-bar h-3 w-52' />
				</div>

				<div className='mt-10 space-y-3'>
					{widths.map((w, i) => (
						<div key={i} className='skeleton-bar h-3.5' style={{ width: w }} />
					))}
					<div className='skeleton-bar mt-6 h-3.5 w-[45%]' />
					<div className='mt-4 space-y-3'>
						{widths.slice(0, 5).map((w, i) => (
							<div key={i} className='skeleton-bar h-3.5' style={{ width: w }} />
						))}
					</div>
				</div>
			</div>

			<div className='sticky flex w-[200px] shrink-0 flex-col gap-4 self-start max-sm:hidden' style={{ top: 24 }}>
				<div className='glass-1 rounded-xl p-3 skeleton-appear skeleton-appear-2'>
					<div className='skeleton-bar aspect-[4/3] w-full rounded-lg' />
				</div>
				<div className='glass-1 space-y-2 rounded-xl p-3 skeleton-appear skeleton-appear-3'>
					{[...Array(6)].map((_, i) => (
						<div key={i} className='skeleton-bar h-3' style={{ width: `${88 - i * 6}%` }} />
					))}
				</div>
			</div>
		</div>
	)
}
