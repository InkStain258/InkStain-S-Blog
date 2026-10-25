'use client'

import { motion } from 'motion/react'
import { useConfigStore, type CardStyles } from '../stores/config-store'
import { useLayoutEditStore } from '../stores/layout-edit-store'
import cardStylesDefault from '@/config/card-styles-default.json'

const CARD_LABELS: Record<string, string> = {
	artCard: '首图',
	hiCard: '中心',
	clockCard: '时钟',
	calendarCard: '日历',
	musicCard: '音乐',
	socialButtons: '联系',
	shareCard: '分享',
	articleCard: '文章',
	writeButtons: '写作',
	navCard: '导航',
	likePosition: '点赞',
	hatCard: '帽子',
	beianCard: '备案'
}

interface HomeLayoutProps {
	cardStylesData: CardStyles
	setCardStylesData: React.Dispatch<React.SetStateAction<CardStyles>>
	onClose?: () => void
}

export function HomeLayout({ cardStylesData, setCardStylesData, onClose }: HomeLayoutProps) {
	const { setCardStyles } = useConfigStore()
	const startEditing = useLayoutEditStore(state => state.startEditing)
	const editing = useLayoutEditStore(state => state.editing)

	const handleStartManualLayout = () => {
		setCardStyles(cardStylesData)
		startEditing()
		onClose?.()
	}

	const handleReset = () => {
		setCardStylesData(cardStylesDefault as CardStyles)
	}

	return (
		<div className='overflow-x-auto'>
			<div className='flex items-end justify-between gap-3'>
				<div>
					<div className='cfg-section-head mb-1'>
						<span className='cfg-section-title'>卡片尺寸与位置</span>
						<span className='cfg-section-hint'>偏移是相对画布中心的偏移量，留空表示自动</span>
					</div>
				</div>
				<div className='flex shrink-0 items-center gap-2 whitespace-nowrap'>
					<button
						type='button'
						onClick={handleReset}
						className='text-secondary hover:text-primary hover:border-brand/40 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors'>
						重置
					</button>
					<button
						type='button'
						onClick={handleStartManualLayout}
						disabled={editing}
							className='text-brand hover:bg-brand/10 border-brand/30 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'>
						{editing ? '主页正在编辑中' : '进入主页拖拽布局'}
					</button>
				</div>
			</div>
			<table className='mt-3 w-full border-collapse text-sm whitespace-nowrap'>
				<thead className='sticky top-0 z-10 backdrop-blur'>
					<tr className='border-b text-[11px] tracking-wide text-secondary uppercase'>
						<th className='px-3 py-2 text-left font-medium'>卡片</th>
						<th className='px-3 py-2 text-left font-medium'>宽度</th>
						<th className='px-3 py-2 text-left font-medium'>高度</th>
						<th className='px-3 py-2 text-left font-medium'>显示顺序</th>
						<th className='px-3 py-2 text-left font-medium'>横向偏移</th>
						<th className='px-3 py-2 text-left font-medium'>纵向偏移</th>
						<th className='px-3 py-2 text-left font-medium'>启用</th>
					</tr>
				</thead>
				<tbody>
					{Object.entries(cardStylesData).map(([key, cardStyle]: [string, any]) => (
						<tr
							key={key}
							className={`border-b transition-colors last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] ${
								cardStyle.enabled === false ? 'opacity-40' : ''
							}`}>
							<td className='text-[12.5px] px-3 py-2 align-middle font-medium whitespace-nowrap'>{CARD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').trim()}</td>

							<td className='px-3 py-2'>
								{cardStyle.width !== undefined ? (
									<input
										type='number'
										value={cardStyle.width}
										onChange={e =>
											setCardStylesData(prev => ({
												...prev,
												[key]: {
													...prev[key as keyof CardStyles],
													width: parseInt(e.target.value) || 0
												}
											}))
										}
										className='no-spinner w-full text-center text-xs tabular-nums'
									/>
								) : (
									<span className='text-secondary text-xs opacity-50'>—</span>
								)}
							</td>
							<td className='px-3 py-2'>
								{cardStyle.height !== undefined ? (
									<input
										type='number'
										value={cardStyle.height}
										onChange={e =>
											setCardStylesData(prev => ({
												...prev,
												[key]: {
													...prev[key as keyof CardStyles],
													height: parseInt(e.target.value) || 0
												}
											}))
										}
										className='no-spinner w-full text-center text-xs tabular-nums'
									/>
								) : (
									<span className='text-secondary text-xs opacity-50'>—</span>
								)}
							</td>
							<td className='px-3 py-2'>
								<input
									type='number'
									value={cardStyle.order}
									onChange={e =>
										setCardStylesData(prev => ({
											...prev,
											[key]: {
												...prev[key as keyof CardStyles],
												order: parseInt(e.target.value) || 0
											}
										}))
									}
									className='w-full text-center text-xs tabular-nums'
								/>
							</td>
							<td className='px-3 py-2'>
								<input
									type='number'
									value={cardStyle.offsetX ?? ''}
									placeholder='自动'
									onChange={e => {
										const value = e.target.value === '' ? null : parseInt(e.target.value) || 0
										setCardStylesData(prev => ({
											...prev,
											[key]: {
												...prev[key as keyof CardStyles],
												offsetX: value
											}
										}))
									}}
									className='no-spinner w-full text-center text-xs tabular-nums'
								/>
							</td>
							<td className='px-3 py-2'>
								<input
									type='number'
									value={cardStyle.offsetY ?? ''}
									placeholder='自动'
									onChange={e => {
										const value = e.target.value === '' ? null : parseInt(e.target.value) || 0
										setCardStylesData(prev => ({
											...prev,
											[key]: {
												...prev[key as keyof CardStyles],
												offsetY: value
											}
										}))
									}}
									className='no-spinner w-full text-center text-xs tabular-nums'
								/>
							</td>
							<td className='px-3 py-2'>
								<input
									type='checkbox'
									checked={cardStyle.enabled ?? true}
									onChange={e =>
										setCardStylesData(prev => ({
											...prev,
											[key]: {
												...prev[key as keyof CardStyles],
												enabled: e.target.checked
											}
										}))
									}
									className='h-3.5 w-3.5 rounded'
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
