'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { motion } from 'motion/react'

dayjs.extend(weekOfYear)
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { INIT_DELAY } from '@/consts'
import ShortLineSVG from '@/svgs/short-line.svg'
import { useBlogIndex, type BlogIndexItem } from '@/hooks/use-blog-index'
import { useCategories } from '@/hooks/use-categories'
import { useReadArticles } from '@/hooks/use-read-articles'
import BilibiliSVG from '@/svgs/哔哩哔哩.svg'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { readFileAsText } from '@/lib/file-utils'
import { plainInline } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { saveBlogEdits } from './services/save-blog-edits'
import { Check } from 'lucide-react'
import { BlogCoverHoverPreview, useBlogCoverHover } from './components/blog-cover-hover'
import { CategoryModal } from './components/category-modal'
import { pathsFromTree } from '@/lib/categories'

type DisplayMode = 'day' | 'week' | 'month' | 'year' | 'category'

export default function BlogPage() {
	const { items, loading } = useBlogIndex()
	const { categories: categoriesFromServer, tree: categoryTree } = useCategories()
	const { isRead } = useReadArticles()
	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false
	const enableCategories = siteContent.enableCategories ?? false

	const keyInputRef = useRef<HTMLInputElement>(null)
	const [editMode, setEditMode] = useState(false)
	const [editableItems, setEditableItems] = useState<BlogIndexItem[]>([])
	const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
	const [saving, setSaving] = useState(false)
	const [displayMode, setDisplayMode] = useState<DisplayMode>('year')
	const [categoryModalOpen, setCategoryModalOpen] = useState(false)
	const [categoryList, setCategoryList] = useState<string[]>([])
	const [newCategory, setNewCategory] = useState('')

	const { cancelCoverPreview, onCoverLinkMouseEnter, hoverCoverPreview, mousePosition } = useBlogCoverHover(editMode)

	useEffect(() => {
		if (!editMode) {
			setEditableItems(items)
		}
	}, [items, editMode])

	useEffect(() => {
		setCategoryList(categoryTree.length ? pathsFromTree(categoryTree) : categoriesFromServer || [])
	}, [categoryTree, categoriesFromServer])

	const displayItems = editMode ? editableItems : items

	const { groupedItems, groupKeys, getGroupLabel } = useMemo(() => {
		const sorted = [...displayItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

		const grouped = sorted.reduce(
			(acc, item) => {
				let key: string
				let label: string
				const date = dayjs(item.date)

				switch (displayMode) {
					case 'category': {
						// 多层级分类：直接按「大类/子类」展开成组，不再需要点进去
						const path = item.categoryPath?.length ? item.categoryPath : item.category ? [item.category] : []
						key = path.length ? path.join('/') : '未分类'
						label = path.length ? path.join(' / ') : '未分类'
						break
					}
					case 'day':
						key = date.format('YYYY-MM-DD')
						label = date.format('YYYY年MM月DD日')
						break
					case 'week':
						const week = date.week()
						key = `${date.format('YYYY')}-W${week.toString().padStart(2, '0')}`
						label = `${date.format('YYYY')}年第${week}周`
						break
					case 'month':
						key = date.format('YYYY-MM')
						label = date.format('YYYY年MM月')
						break
					case 'year':
					default:
						key = date.format('YYYY')
						label = date.format('YYYY年')
						break
				}

				if (!acc[key]) {
					acc[key] = { items: [], label }
				}
				acc[key].items.push(item)
				return acc
			},
			{} as Record<string, { items: BlogIndexItem[]; label: string }>
		)

		const keys = Object.keys(grouped).sort((a, b) => {
			if (displayMode === 'category') {
				const categoryOrder = new Map(categoryList.map((c, index) => [c, index]))
				const aOrder = categoryOrder.has(a) ? categoryOrder.get(a)! : Number.MAX_SAFE_INTEGER
				const bOrder = categoryOrder.has(b) ? categoryOrder.get(b)! : Number.MAX_SAFE_INTEGER
				if (aOrder !== bOrder) return aOrder - bOrder
				return a.localeCompare(b)
			}
			// 按时间倒序排序
			if (displayMode === 'week') {
				// 周格式：YYYY-WW
				const [yearA, weekA] = a.split('-W').map(Number)
				const [yearB, weekB] = b.split('-W').map(Number)
				if (yearA !== yearB) return yearB - yearA
				return weekB - weekA
			}
			return b.localeCompare(a)
		})

		return {
			groupedItems: grouped,
			groupKeys: keys,
			getGroupLabel: (key: string) => grouped[key]?.label || key
		}
	}, [displayItems, displayMode, categoryList])

	// 分类模式下按一级大类统计，用于在大类标题旁给出「N 篇 · M 个分类」
	const rootStats = useMemo(() => {
		const m = new Map<string, { count: number; subs: number }>()
		for (const k of groupKeys) {
			const parts = getGroupLabel(k).split(' / ')
			const root = parts[0]
			const cur = m.get(root) ?? { count: 0, subs: 0 }
			cur.count += groupedItems[k]?.items.length ?? 0
			cur.subs += parts.length > 1 ? 1 : 0
			m.set(root, cur)
		}
		return m
	}, [groupKeys, groupedItems, getGroupLabel])

	const selectedCount = selectedSlugs.size
	const buttonText = isAuth ? '保存' : '导入密钥'

	const toggleEditMode = useCallback(() => {
		if (editMode) {
			setEditMode(false)
			setEditableItems(items)
			setSelectedSlugs(new Set())
		} else {
			setEditableItems(items)
			setEditMode(true)
		}
	}, [editMode, items])

	const toggleSelect = useCallback((slug: string) => {
		setSelectedSlugs(prev => {
			const next = new Set(prev)
			if (next.has(slug)) {
				next.delete(slug)
			} else {
				next.add(slug)
			}
			return next
		})
	}, [])

	// 全选所有文章
	const handleSelectAll = useCallback(() => {
		setSelectedSlugs(new Set(editableItems.map(item => item.slug)))
	}, [editableItems])

	// 全选/取消全选某个时间维度分组
	const handleSelectGroup = useCallback(
		(groupKey: string) => {
			const group = groupedItems[groupKey]
			if (!group) return

			// 检查该分组是否所有文章都已选中
			const allSelected = group.items.every(item => selectedSlugs.has(item.slug))

			setSelectedSlugs(prev => {
				const next = new Set(prev)
				if (allSelected) {
					// 如果已全选，则取消该分组的选择
					group.items.forEach(item => {
						next.delete(item.slug)
					})
				} else {
					// 如果未全选，则全选该分组
					group.items.forEach(item => {
						next.add(item.slug)
					})
				}
				return next
			})
		},
		[groupedItems, selectedSlugs]
	)

	// 取消全选
	const handleDeselectAll = useCallback(() => {
		setSelectedSlugs(new Set())
	}, [])

	const handleItemClick = useCallback(
		(event: React.MouseEvent, slug: string) => {
			if (!editMode) return
			event.preventDefault()
			event.stopPropagation()
			toggleSelect(slug)
		},
		[editMode, toggleSelect]
	)

	const handleDeleteSelected = useCallback(() => {
		if (selectedCount === 0) {
			toast.info('请选择要删除的文章')
			return
		}
		setEditableItems(prev => prev.filter(item => !selectedSlugs.has(item.slug)))
		setSelectedSlugs(new Set())
	}, [selectedCount, selectedSlugs])

	const handleAssignCategory = useCallback((slug: string, category?: string) => {
		setEditableItems(prev =>
			prev.map(item => {
				if (item.slug !== slug) return item
				const nextCategory = (category || '').trim()
				if (!nextCategory) return { ...item, category: undefined, categoryPath: undefined }
				const path = nextCategory.split('/').map(x => x.trim()).filter(Boolean)
				return { ...item, category: path[path.length - 1], categoryPath: path.length > 1 ? path : undefined }
			})
		)
	}, [])

	const handleAddCategory = useCallback(() => {
		const value = newCategory.trim()
		if (!value) {
			toast.info('请输入分类名称')
			return
		}
		setCategoryList(prev => (prev.includes(value) ? prev : [...prev, value]))
		setNewCategory('')
	}, [newCategory])

	const handleRemoveCategory = useCallback((category: string) => {
		setCategoryList(prev => prev.filter(item => item !== category))
		setEditableItems(prev => prev.map(item => (item.category === category ? { ...item, category: undefined } : item)))
	}, [])

	const handleReorderCategories = useCallback((nextList: string[]) => {
		setCategoryList(nextList)
	}, [])

	const handleCancel = useCallback(() => {
		setEditableItems(items)
		setSelectedSlugs(new Set())
		setEditMode(false)
	}, [items])

	const handleSave = useCallback(async () => {
		const removedSlugs = items.filter(item => !editableItems.some(editItem => editItem.slug === item.slug)).map(item => item.slug)
		const normalizedCategoryList = categoryList.map(c => c.trim()).filter(Boolean)
		const serverPaths = categoryTree.length ? pathsFromTree(categoryTree) : (categoriesFromServer || []).map(c => c.trim()).filter(Boolean)
		const categoryListChanged = JSON.stringify(normalizedCategoryList) !== JSON.stringify(serverPaths)
		const categoryAssignmentChanged = items.some(origin => {
			const next = editableItems.find(editItem => editItem.slug === origin.slug)
			const originCategory = origin.category || ''
			const nextCategory = next?.category || ''
			return originCategory !== nextCategory
		})
		const hasChanges = removedSlugs.length > 0 || categoryListChanged || categoryAssignmentChanged

		if (!hasChanges) {
			toast.info('没有需要保存的改动')
			return
		}

		try {
			setSaving(true)
			await saveBlogEdits(items, editableItems, normalizedCategoryList)
			setEditMode(false)
			setSelectedSlugs(new Set())
			setCategoryModalOpen(false)
		} catch (error: any) {
			console.error(error)
			toast.error(error?.message || '保存失败')
		} finally {
			setSaving(false)
		}
	}, [items, editableItems, categoryList, categoriesFromServer, categoryTree])

	const handleSaveClick = useCallback(() => {
		if (!isAuth) {
			keyInputRef.current?.click()
			return
		}
		void handleSave()
	}, [handleSave, isAuth])

	const handlePrivateKeySelection = useCallback(
		async (file: File) => {
			try {
				const pem = await readFileAsText(file)
				setPrivateKey(pem)
				toast.success('密钥导入成功，请再次点击保存')
			} catch (error) {
				console.error(error)
				toast.error('读取密钥失败')
			}
		},
		[setPrivateKey]
	)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!editMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				toggleEditMode()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [editMode, toggleEditMode])

	return (
		<>
			<input
				ref={keyInputRef}
				type='file' aria-label='选择文件'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handlePrivateKeySelection(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<div className='flex flex-col items-center justify-center gap-6 px-6 pt-24 max-sm:pt-24'>
				{/* 页头：原来这一页没有 h1，读屏与搜索引擎都拿不到标题 */}
				<header className='ink-fade-up w-full max-w-[840px]'>
					<div className='border-border/60 flex items-center justify-between border-b pb-3'>
						<span className='text-brand-ink text-[10.5px] tracking-[0.3em] uppercase'>Archive</span>
						<span className='text-secondary text-[10.5px] tabular-nums opacity-55'>{loading ? '…' : `${items.length} 篇`}</span>
					</div>
					<h1 className='mt-5 text-[27px] leading-[1.3] font-semibold tracking-[-0.015em] max-sm:text-[23px]'>全部文章</h1>
					<p className='text-secondary mt-2 max-w-[520px] text-[12.5px] leading-[1.9] opacity-80'>
						一锅出，大杂烩，尽情地享受吧
					</p>
				</header>

				{/* 入口：分类 / 标签 / 系列 / 归档 */}
				<motion.div
					initial={{ opacity: 0, y: -6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
					className='text-secondary flex items-center gap-1 text-[11.5px] max-sm:hidden'>
					{[
						{ href: '/series', label: '系列' },
						{ href: '/archive', label: '归档' },
						...(categoryTree.length ? [{ href: `/blog/category/${encodeURIComponent(categoryTree[0].name)}`, label: '分类' }] : []),
						...(items[0]?.tags?.length ? [{ href: `/blog/tag/${encodeURIComponent(items[0].tags[0])}`, label: '标签' }] : [])
					].map((l, i) => (
						<span key={l.href} className='flex items-center gap-1'>
							{i > 0 && <span className='opacity-30'>·</span>}
							<Link href={l.href} className='hover:text-brand-ink transition-colors'>
								{l.label}
							</Link>
						</span>
					))}
				</motion.div>

				{items.length > 0 && (
					<motion.div
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						className='card btn-rounded relative mx-auto flex items-center gap-1 p-1 max-sm:hidden'>
						{[
							{ value: 'day', label: '日' },
							{ value: 'week', label: '周' },
							{ value: 'month', label: '月' },
							{ value: 'year', label: '年' },
							...(enableCategories ? ([{ value: 'category', label: '分类' }] as const) : [])
						].map(option => (
							<motion.button
								key={option.value}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => setDisplayMode(option.value as DisplayMode)}
								className={cn(
									'btn-rounded px-3 py-1.5 text-xs font-medium transition-all',
									displayMode === option.value ? 'bg-brand text-white elev-1' : 'text-secondary hover:text-brand-ink hover:bg-white/60'
								)}>
								{option.label}
							</motion.button>
						))}
					</motion.div>
				)}

				{groupKeys.map((groupKey, index) => {
					const group = groupedItems[groupKey]
					if (!group) return null

					const label = getGroupLabel(groupKey)
					const parts = label.split(' / ')
					const rootName = parts[0]
					const subName = parts[parts.length - 1]
					const prevRoot = index > 0 ? getGroupLabel(groupKeys[index - 1]).split(' / ')[0] : ''
					const showRoot = displayMode === 'category' && parts.length > 1 && rootName !== prevRoot
					const stat = rootStats.get(rootName)

					return (
						<Fragment key={groupKey}>
							{showRoot && (
								<div className='mt-2 w-full max-w-[840px]'>
									<h2 className='text-[17px] font-semibold tracking-tight'>{rootName}</h2>
									<div className='text-secondary mt-1 text-[11px] tabular-nums'>
										{stat?.count ?? group.items.length} 篇 · {stat?.subs ?? 1} 个分类
									</div>
								</div>
							)}
						<motion.div
							onMouseLeave={cancelCoverPreview}
							initial={{ opacity: 0, scale: 0.95 }}
							whileInView={{ opacity: 1, scale: 1 }}
							transition={{ delay: INIT_DELAY / 2 }}
							className='card card-content relative w-full max-w-[840px] space-y-6'>
							<div className='mb-3 flex items-center justify-between gap-3'>
								<div className='flex items-center gap-3'>
									<div className='text-[13.5px] font-medium tracking-[0.01em]'>{subName}</div>
									<div className='h-2 w-2 rounded-full bg-[#D9D9D9]'></div>
									<div className='text-secondary text-sm'>{group.items.length} 篇文章</div>
								</div>
								{editMode &&
									(() => {
										const groupAllSelected = group.items.every(item => selectedSlugs.has(item.slug))
										return (
											<motion.button
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={() => handleSelectGroup(groupKey)}
												className={cn(
													'rounded-lg border px-3 py-1 text-xs transition-colors',
													groupAllSelected
														? 'border-brand/40 bg-brand/10 text-brand-ink hover:bg-brand/20'
														: 'text-secondary hover:border-brand/40 hover:text-brand-ink border-transparent bg-white/60 hover:bg-white/80'
												)}>
												{groupAllSelected ? '取消全选' : '全选该分组'}
											</motion.button>
										)
									})()}
							</div>
							<div className='space-y-2'>
								{group.items.map(it => {
									const hasRead = isRead(it.slug)
									const isSelected = selectedSlugs.has(it.slug)
									const words = (it as { words?: number }).words || 0
									const minutes = Math.max(1, Math.ceil(words / 400))
									return (
										<Link
											onMouseEnter={() => onCoverLinkMouseEnter(it.cover)}
											onMouseLeave={cancelCoverPreview}
											href={`/blog/${it.slug}`}
											key={it.slug}
											onClick={event => handleItemClick(event, it.slug)}
											className={cn(
												'group glass-1 relative block rounded-xl px-4 py-3.5 transition-all',
												editMode
													? cn('border', isSelected ? 'border-brand/60 bg-brand/5' : 'hover:border-brand/40')
													: 'hover:border-brand/40'
											)}>
											<div className='flex items-center gap-2'>
												{editMode && (
													<span
														className={cn(
															'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
															isSelected ? 'border-brand bg-brand text-white' : 'border-[#D9D9D9] text-transparent'
														)}>
														<Check />
													</span>
												)}
												<span className='handwriting text-secondary text-[11.5px] tracking-wide tabular-nums'>
													{dayjs(it.date).format('MM-DD')}
												</span>
												{hasRead && <span className='text-secondary/60 text-[10.5px]'>已读</span>}
											</div>

											<div className='mt-1.5 text-[16.5px] leading-snug font-semibold tracking-tight transition-colors group-hover:text-brand-ink'>
												{it.title || it.slug}
											</div>

											{it.summary && (
												<p className='text-secondary mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed'>{plainInline(it.summary)}</p>
											)}

											<div className='text-secondary mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]'>
												{words > 0 && <span className='tabular-nums'>{words.toLocaleString('zh-CN')} 字</span>}
												{words > 0 && <span className='tabular-nums'>约 {minutes} 分钟</span>}
												{(it.tags || []).map(t => (
													<span key={t} className='text-brand-ink/60'>
														#{t}
													</span>
												))}
											</div>
										</Link>
									)
								})}							</div>
						</motion.div>
						</Fragment>
					)
				})}
				{items.length > 0 && (
					<div className='text-center'>
						<motion.a
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1 }}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							href='https://space.bilibili.com/510729504'
							target='_blank'
							className='card text-secondary static inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs'>
							<BilibiliSVG className='h-4 w-4' />
							更多
						</motion.a>
					</div>
				)}
			</div>

			<div className='pt-12'>
				{!loading && items.length === 0 && <div className='text-secondary py-6 text-center text-sm'>暂无文章</div>}
				{loading && <div className='text-secondary py-6 text-center text-sm'>加载中...</div>}
			</div>

			<motion.div
				initial={{ opacity: 0, scale: 0.6 }}
				animate={{ opacity: 1, scale: 1 }}
				className='absolute top-4 right-6 flex items-center gap-3 max-sm:hidden'>
				{editMode ? (
					<>
						{enableCategories && (
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => setCategoryModalOpen(true)}
								disabled={saving}
								className='rounded-xl border bg-white/60 px-4 py-2 text-sm transition-colors hover:bg-white/80'>
								分类
							</motion.button>
						)}
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleCancel}
							disabled={saving}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							取消
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={selectedCount === editableItems.length ? handleDeselectAll : handleSelectAll}
							className='rounded-xl border bg-white/60 px-4 py-2 text-sm transition-colors hover:bg-white/80'>
							{selectedCount === editableItems.length ? '取消全选' : '全选'}
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleDeleteSelected}
							disabled={selectedCount === 0}
							className='rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 transition-colors disabled:opacity-60'>
							删除(已选:{selectedCount}篇)
						</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={saving} className='brand-btn px-6'>
							{saving ? '保存中...' : buttonText}
						</motion.button>
					</>
				) : (
					!hideEditButton && (
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={toggleEditMode}
							className='bg-card rounded-xl border px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80'>
							编辑
						</motion.button>
					)
				)}
			</motion.div>

			<BlogCoverHoverPreview preview={hoverCoverPreview} position={mousePosition} />

			<CategoryModal
				open={categoryModalOpen}
				onClose={() => setCategoryModalOpen(false)}
				categoryList={categoryList}
				newCategory={newCategory}
				onNewCategoryChange={setNewCategory}
				onAddCategory={handleAddCategory}
				onRemoveCategory={handleRemoveCategory}
				onReorderCategories={handleReorderCategories}
				editableItems={editableItems}
				onAssignCategory={handleAssignCategory}
			/>
		</>
	)
}
