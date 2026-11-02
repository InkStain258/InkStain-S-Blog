'use client'

import { useCallback, useMemo, useState, type DragEvent } from 'react'
import dayjs from 'dayjs'
import type { BlogIndexItem } from '@/hooks/use-blog-index'
import { DialogModal } from '@/components/dialog-modal'
import { Select } from '@/components/select'
import { X, CornerDownRight } from 'lucide-react'
import { leafOf } from '@/lib/categories'

interface CategoryModalProps {
	open: boolean
	onClose: () => void
	/** 完整路径，`大类/子类` */
	categoryList: string[]
	newCategory: string
	onNewCategoryChange: (value: string) => void
	onAddCategory: () => void
	onRemoveCategory: (category: string) => void
	onReorderCategories: (nextList: string[]) => void
	editableItems: BlogIndexItem[]
	onAssignCategory: (slug: string, category?: string) => void
}

export function CategoryModal({
	open,
	onClose,
	categoryList,
	newCategory,
	onNewCategoryChange,
	onAddCategory,
	onRemoveCategory,
	onReorderCategories,
	editableItems,
	onAssignCategory
}: CategoryModalProps) {
	const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

	const categoryOptions = useMemo(
		() => [
			{ value: '', label: '未分类' },
			...categoryList.map(cat => ({ value: cat, label: cat.replace(/\//g, ' / ') }))
		],
		[categoryList]
	)

	/** 按一级大类分组，渲染成两层：大类名 + 缩进的子类 */
	const groups = useMemo(() => {
		const map = new Map<string, { path: string; index: number }[]>()
		categoryList.forEach((path, index) => {
			const root = path.split('/')[0]
			const arr = map.get(root) ?? []
			arr.push({ path, index })
			map.set(root, arr)
		})
		return [...map.entries()]
	}, [categoryList])

	const handleDragStart = useCallback((index: number) => {
		return () => setDraggingIndex(index)
	}, [])

	const handleDragOver = useCallback((index: number) => {
		return (event: DragEvent<HTMLSpanElement>) => {
			event.preventDefault()
			event.dataTransfer.dropEffect = 'move'
		}
	}, [])

	const handleDrop = useCallback(
		(index: number) => {
			return (event: DragEvent<HTMLSpanElement>) => {
				event.preventDefault()
				if (draggingIndex === null || draggingIndex === index) return
				const next = [...categoryList]
				const [moved] = next.splice(draggingIndex, 1)
				next.splice(index, 0, moved)
				onReorderCategories(next)
				setDraggingIndex(null)
			}
		},
		[categoryList, draggingIndex, onReorderCategories]
	)

	return (
		<DialogModal open={open} onClose={onClose} className='card w-[760px] max-w-[92vw] rounded-2xl p-6'>
			<div className='mb-4 flex items-center justify-between'>
				<div>
					<div className='text-lg font-semibold'>文章分类</div>
					<div className='text-secondary mt-0.5 text-[11px]'>支持两级：输入「大类/子类」，最多三级</div>
				</div>
				<button onClick={onClose} className='text-secondary hover:text-brand-ink text-sm'>
					关闭
				</button>
			</div>

			<div className='space-y-4'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
					<input
						value={newCategory}
						onChange={e => onNewCategoryChange(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter') onAddCategory()
						}}
						placeholder='分类名，或 父类/子类'
						className='focus:border-brand w-full rounded-lg border bg-white/70 px-3 py-2 text-sm outline-none'
					/>
					<button onClick={onAddCategory} className='brand-btn px-4 py-2 text-sm whitespace-nowrap'>
						新增分类
					</button>
				</div>

				<div className='max-h-[220px] space-y-2 overflow-y-auto rounded-lg bg-white/60 p-3 text-sm'>
					{categoryList.length === 0 ? (
						<span className='text-secondary'>暂无分类</span>
					) : (
						groups.map(([root, entries]) => (
							<div key={root}>
								<div className='text-[12px] font-medium tracking-wide'>{root}</div>
								<div className='mt-1.5 flex flex-wrap gap-2'>
									{entries.map(({ path, index }) => {
										const isChild = path.includes('/')
										return (
											<span
												key={path}
												draggable
												onDragStart={handleDragStart(index)}
												onDragOver={handleDragOver(index)}
												onDrop={handleDrop(index)}
												className={`bg-brand/10 flex cursor-move items-center gap-1.5 rounded-full border py-1 pr-1.5 pl-3 ${
													draggingIndex === index ? 'ring-brand/60 opacity-60 ring-1' : ''
												}`}>
												{isChild && <CornerDownRight className='text-secondary h-3 w-3' />}
												<span className='select-none'>{leafOf(path)}</span>
												<button
													type='button'
													onClick={() => onRemoveCategory(path)}
													className='text-secondary hover:text-brand-ink inline-flex h-4 w-4 items-center justify-center'
													aria-label='删除分类'>
													<X className='h-3 w-3' />
												</button>
											</span>
										)
									})}
								</div>
							</div>
						))
					)}
				</div>

				<div className='max-h-[360px] space-y-2 overflow-y-auto rounded-xl bg-white/60 p-3'>
					{editableItems.map(item => {
						const current = item.categoryPath?.join('/') || item.category || ''
						return (
							<div key={item.slug} className='flex flex-col gap-2 rounded-lg border bg-white/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between'>
								<div className='text-sm font-medium'>
									{item.title || item.slug}
									<span className='text-secondary ml-2 text-xs'>{dayjs(item.date).format('YYYY-MM-DD')}</span>
								</div>
								<Select
									value={current}
									onChange={value => onAssignCategory(item.slug, value)}
									options={categoryOptions}
									className='w-full text-sm sm:w-[240px]'
								/>
							</div>
						)
					})}
					{editableItems.length === 0 && <div className='text-secondary text-sm'>暂无文章</div>}
				</div>
			</div>
		</DialogModal>
	)
}
