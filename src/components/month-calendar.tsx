'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
	/** ISO 日期字符串数组（文章发布日期） */
	dates: string[]
	/** 点击某天时回调（带上给那天准备的 yyyy-MM-dd） */
	onPick?: (day: string) => void
}

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

/**
 * 月历：把已有文章的日期标成纸色圆点。默认落在最近一次发文的那个月，
 * 而不是当前月——博客常常隔几个月才写，落在当前月会是一片空白。
 */
export default function MonthCalendar({ dates, onPick }: Props) {
	const published = useMemo(() => new Set(dates.map(d => dayjs(d).format('YYYY-MM-DD'))), [dates])

	// 最近发文的月份，没有就退回当前月
	const latestMonth = useMemo(() => {
		if (!dates.length) return dayjs().format('YYYY-MM')
		return dates.map(d => dayjs(d).format('YYYY-MM')).sort().at(-1) as string
	}, [dates])

	// 用「手动翻页」状态包一层：数据是 SWR 异步到的，items 一开始是空数组，
	// 如果直接把 latestMonth 当 state 初始值，会永久锁在「当前月」这个空页上。
	const [picked, setPicked] = useState<string | null>(null)
	const month = picked ?? latestMonth
	const cursor = dayjs(`${month}-01`)
	const today = dayjs().format('YYYY-MM-DD')

	// 周一开头的日历格：前面补齐上月末、后面补齐下月初
	const cells = useMemo(() => {
		const start = cursor.startOf('month')
		const lead = (start.day() + 6) % 7
		const daysInMonth = cursor.daysInMonth()
		const list: { day: string; inMonth: boolean; has: boolean }[] = []
		for (let i = 0; i < lead; i++) {
			const d = start.subtract(lead - i, 'day')
			list.push({ day: d.format('YYYY-MM-DD'), inMonth: false, has: published.has(d.format('YYYY-MM-DD')) })
		}
		for (let i = 1; i <= daysInMonth; i++) {
			const d = start.date(i)
			list.push({ day: d.format('YYYY-MM-DD'), inMonth: true, has: published.has(d.format('YYYY-MM-DD')) })
		}
		while (list.length % 7 !== 0) {
			const d = start.add(list.length - lead + 1, 'day')
			list.push({ day: d.format('YYYY-MM-DD'), inMonth: false, has: published.has(d.format('YYYY-MM-DD')) })
		}
		return list
	}, [cursor, published])

	const countThisMonth = cells.filter(c => c.inMonth && c.has).length

	return (
		<div className='glass-1 rounded-xl px-3 py-3'>
			<div className='flex items-center justify-between'>
				<button
					type='button'
					aria-label='上个月'
					onClick={() => setPicked(cursor.subtract(1, 'month').format('YYYY-MM'))}
					className='text-secondary hover:text-brand-ink grid h-6 w-6 place-items-center rounded-md transition-colors'>
					<ChevronLeft className='h-3.5 w-3.5' />
				</button>
				<div className='flex items-baseline gap-2'>
					<span className='handwriting text-[13px] tracking-wide'>{cursor.format('YYYY 年 M 月')}</span>
					{countThisMonth > 0 && <span className='text-secondary text-[10px] tabular-nums'>{countThisMonth} 篇</span>}
				</div>
				<button
					type='button'
					aria-label='下个月'
					onClick={() => setPicked(cursor.add(1, 'month').format('YYYY-MM'))}
					className='text-secondary hover:text-brand-ink grid h-6 w-6 place-items-center rounded-md transition-colors'>
					<ChevronRight className='h-3.5 w-3.5' />
				</button>
			</div>

			<div className='text-secondary mt-2 grid grid-cols-7 gap-1 text-center text-[9.5px]'>
				{WEEK.map(w => (
					<span key={w}>{w}</span>
				))}
			</div>

			<div className='mt-1 grid grid-cols-7 gap-1'>
				{cells.map(c => {
					const isToday = c.day === today
					const base =
						'handwriting relative grid aspect-square place-items-center rounded-md text-[10.5px] transition-all'
					const cls = !c.inMonth
						? `${base} text-secondary/25`
						: c.has
							? `${base} bg-brand/15 text-brand-ink font-medium cursor-pointer hover:bg-brand/25`
							: `${base} text-secondary/70`
					return (
						<button
							key={c.day}
							type='button'
							disabled={!c.has || !onPick}
							onClick={() => onPick?.(c.day)}
							aria-label={`${c.day}${c.has ? ' 有文章' : ''}`}
							className={cls}>
							{dayjs(c.day).date()}
							{c.has && <span className='bg-brand absolute bottom-[3px] h-[3px] w-[3px] rounded-full' />}
							{isToday && <span className='border-brand-ink/50 pointer-events-none absolute inset-0 rounded-md border' />}
						</button>
					)
				})}
			</div>
		</div>
	)
}