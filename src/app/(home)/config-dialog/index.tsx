'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { X, Eye, Save, KeyRound, LayoutGrid, Palette, Settings2 } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '../stores/config-store'
import { pushSiteContent } from '../services/push-site-content'
import type { SiteContent, CardStyles } from '../stores/config-store'
import { SiteSettings, type FileItem, type ArtImageUploads, type BackgroundImageUploads, type SocialButtonImageUploads } from './site-settings'
import { ColorConfig } from './color-config'
import { HomeLayout } from './home-layout'

interface ConfigDialogProps {
	open: boolean
	onClose: () => void
}

type TabType = 'site' | 'color' | 'layout'

export default function ConfigDialog({ open, onClose }: ConfigDialogProps) {
	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent, setSiteContent, cardStyles, setCardStyles, regenerateBubbles } = useConfigStore()
	const [formData, setFormData] = useState<SiteContent>(siteContent)
	const [cardStylesData, setCardStylesData] = useState<CardStyles>(cardStyles)
	const [originalData, setOriginalData] = useState<SiteContent>(siteContent)
	const [originalCardStyles, setOriginalCardStyles] = useState<CardStyles>(cardStyles)
	const [isSaving, setIsSaving] = useState(false)
	const [activeTab, setActiveTab] = useState<TabType>('site')
	const keyInputRef = useRef<HTMLInputElement>(null)
	const [faviconItem, setFaviconItem] = useState<FileItem | null>(null)
	const [avatarItem, setAvatarItem] = useState<FileItem | null>(null)
	const [artImageUploads, setArtImageUploads] = useState<ArtImageUploads>({})
	const [backgroundImageUploads, setBackgroundImageUploads] = useState<BackgroundImageUploads>({})
	const [socialButtonImageUploads, setSocialButtonImageUploads] = useState<SocialButtonImageUploads>({})

	useEffect(() => {
		if (open) {
			const current = { ...siteContent }
			const currentCardStyles = { ...cardStyles }
			setFormData(current)
			setCardStylesData(currentCardStyles)
			setOriginalData(current)
			setOriginalCardStyles(currentCardStyles)
			setFaviconItem(null)
			setAvatarItem(null)
			setArtImageUploads({})
			setBackgroundImageUploads({})
			setSocialButtonImageUploads({})
			setActiveTab('site')
		}
	}, [open, siteContent, cardStyles])

	useEffect(() => {
		return () => {
			// Clean up preview URLs on unmount
			if (faviconItem?.type === 'file') {
				URL.revokeObjectURL(faviconItem.previewUrl)
			}
			if (avatarItem?.type === 'file') {
				URL.revokeObjectURL(avatarItem.previewUrl)
			}
			Object.values(artImageUploads).forEach(item => {
				if (item.type === 'file') {
					URL.revokeObjectURL(item.previewUrl)
				}
			})
			Object.values(backgroundImageUploads).forEach(item => {
				if (item.type === 'file') {
					URL.revokeObjectURL(item.previewUrl)
				}
			})
			Object.values(socialButtonImageUploads).forEach(item => {
				if (item.type === 'file') {
					URL.revokeObjectURL(item.previewUrl)
				}
			})
		}
	}, [faviconItem, avatarItem, artImageUploads, backgroundImageUploads, socialButtonImageUploads])

	// 有改动才让「保存」显得有必要
	const dirty = useMemo(() => {
		return (
			JSON.stringify(formData) !== JSON.stringify(originalData) ||
			JSON.stringify(cardStylesData) !== JSON.stringify(originalCardStyles) ||
			!!faviconItem ||
			!!avatarItem ||
			Object.keys(artImageUploads).length > 0 ||
			Object.keys(backgroundImageUploads).length > 0 ||
			Object.keys(socialButtonImageUploads).length > 0
		)
	}, [formData, originalData, cardStylesData, originalCardStyles, faviconItem, avatarItem, artImageUploads, backgroundImageUploads, socialButtonImageUploads])

	const handleChoosePrivateKey = async (file: File) => {
		try {
			const text = await file.text()
			setPrivateKey(text)
			await handleSave()
		} catch (error) {
			console.error('Failed to read private key:', error)
			toast.error('读取密钥文件失败')
		}
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			handleSave()
		}
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			// Calculate removed art images so that we can delete files in repo
			const originalArtImages = originalData.artImages ?? []
			const currentArtImages = formData.artImages ?? []
			const removedArtImages = originalArtImages.filter(orig => !currentArtImages.some(current => current.id === orig.id))

			// Calculate removed background images
			const originalBackgroundImages = originalData.backgroundImages ?? []
			const currentBackgroundImages = formData.backgroundImages ?? []
			const removedBackgroundImages = originalBackgroundImages.filter(orig => !currentBackgroundImages.some(current => current.id === orig.id))

			await pushSiteContent(
				formData,
				cardStylesData,
				faviconItem,
				avatarItem,
				artImageUploads,
				removedArtImages,
				backgroundImageUploads,
				removedBackgroundImages,
				socialButtonImageUploads
			)
			setSiteContent(formData)
			setCardStyles(cardStylesData)
			updateThemeVariables(formData.theme)
			setFaviconItem(null)
			setAvatarItem(null)
			setArtImageUploads({})
			setBackgroundImageUploads({})
			setSocialButtonImageUploads({})
			onClose()
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		// Clean up preview URLs
		if (faviconItem?.type === 'file') {
			URL.revokeObjectURL(faviconItem.previewUrl)
		}
		if (avatarItem?.type === 'file') {
			URL.revokeObjectURL(avatarItem.previewUrl)
		}
		Object.values(artImageUploads).forEach(item => {
			if (item.type === 'file') {
				URL.revokeObjectURL(item.previewUrl)
			}
		})
		Object.values(backgroundImageUploads).forEach(item => {
			if (item.type === 'file') {
				URL.revokeObjectURL(item.previewUrl)
			}
		})
		Object.values(socialButtonImageUploads).forEach(item => {
			if (item.type === 'file') {
				URL.revokeObjectURL(item.previewUrl)
			}
		})
		// Restore to the state when dialog was opened
		setSiteContent(originalData)
		setCardStyles(originalCardStyles)
		regenerateBubbles()
		// Restore document title and meta if they were changed by preview
		if (typeof document !== 'undefined') {
			document.title = originalData.meta.title
			const metaDescription = document.querySelector('meta[name="description"]')
			if (metaDescription) {
				metaDescription.setAttribute('content', originalData.meta.description)
			}
		}
		updateThemeVariables(originalData.theme)
		setFaviconItem(null)
		setAvatarItem(null)
		setArtImageUploads({})
		setBackgroundImageUploads({})
		setSocialButtonImageUploads({})
		onClose()
	}

	const updateThemeVariables = (theme?: SiteContent['theme']) => {
		if (typeof document === 'undefined' || !theme) return

		const { colorBrand, colorBrandSecondary, colorPrimary, colorSecondary, colorBg, colorBorder, colorCard, colorArticle } = theme

		const root = document.documentElement

		if (colorBrand) root.style.setProperty('--color-brand', colorBrand)
		if (colorBrandSecondary) root.style.setProperty('--color-brand-secondary', colorBrandSecondary)
		if (colorPrimary) root.style.setProperty('--color-primary', colorPrimary)
		if (colorSecondary) root.style.setProperty('--color-secondary', colorSecondary)
		if (colorBg) root.style.setProperty('--color-bg', colorBg)
		if (colorBorder) root.style.setProperty('--color-border', colorBorder)
		if (colorCard) root.style.setProperty('--color-card', colorCard)
		if (colorArticle) root.style.setProperty('--color-article', colorArticle)
	}

	const handlePreview = () => {
		setSiteContent(formData)
		setCardStyles(cardStylesData)
		regenerateBubbles()

		// Update document title
		if (typeof document !== 'undefined') {
			document.title = formData.meta.title
			const metaDescription = document.querySelector('meta[name="description"]')
			if (metaDescription) {
				metaDescription.setAttribute('content', formData.meta.description)
			}
		}
		updateThemeVariables(formData.theme)

		onClose()
	}

	const buttonText = isAuth ? '保存' : '导入密钥并保存'

	const tabs: { id: TabType; label: string; icon: typeof Settings2 }[] = [
		{ id: 'site', label: '网站设置', icon: Settings2 },
		{ id: 'color', label: '色彩', icon: Palette },
		{ id: 'layout', label: '首页布局', icon: LayoutGrid }
	]

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handleChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<DialogModal open={open} onClose={handleCancel} className='card scrollbar-none w-[840px] max-w-[94vw] overflow-hidden !rounded-[28px]'>
				<div className='flex h-[min(84vh,820px)] flex-col'>
					{/* ---------- 顶部：标题 + 分段标签 ---------- */}
					<header className='shrink-0 border-b pb-3.5'>
						<div className='flex items-start justify-between gap-4'>
							<div>
								<h2 className='text-[17px] font-semibold tracking-tight'>站点设置</h2>
								<p className='text-secondary mt-1 text-[12px] leading-relaxed'>改动会提交到 GitHub 仓库，保存后一两分钟生效。</p>
							</div>
							<button
								type='button'
								onClick={handleCancel}
								aria-label='关闭'
								className='text-secondary hover:text-primary -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10'>
								<X className='h-4 w-4' />
							</button>
						</div>

						<div className='bg-secondary/[0.06] mt-5 flex w-fit items-center gap-1 rounded-xl p-1'>
							{tabs.map(tab => {
								const active = activeTab === tab.id
								const Icon = tab.icon
								return (
									<button
										key={tab.id}
										type='button'
										onClick={() => setActiveTab(tab.id)}
										className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
											active ? 'text-brand' : 'text-secondary hover:text-primary'
										}`}>
										{active && (
											<motion.span
												layoutId='cfg-tab-pill'
												className='bg-card absolute inset-0 rounded-lg shadow-sm'
												transition={{ type: 'spring', stiffness: 420, damping: 34 }}
											/>
										)}
										<Icon className='relative z-10 h-3.5 w-3.5' />
										<span className='relative z-10'>{tab.label}</span>
									</button>
								)
							})}
						</div>
					</header>

					{/* ---------- 内容：独立滚动 ---------- */}
					<div
						className='cfg scrollbar-none -mx-1 mt-0 flex-1 overflow-y-auto px-1 pt-5 pb-2'
						style={{ boxShadow: 'inset 0 10px 12px -12px rgba(0,0,0,0.35)' }}>
						{activeTab === 'site' && (
							<SiteSettings
								formData={formData}
								setFormData={setFormData}
								faviconItem={faviconItem}
								setFaviconItem={setFaviconItem}
								avatarItem={avatarItem}
								setAvatarItem={setAvatarItem}
								artImageUploads={artImageUploads}
								setArtImageUploads={setArtImageUploads}
								backgroundImageUploads={backgroundImageUploads}
								setBackgroundImageUploads={setBackgroundImageUploads}
								socialButtonImageUploads={socialButtonImageUploads}
								setSocialButtonImageUploads={setSocialButtonImageUploads}
							/>
						)}
						{activeTab === 'color' && <ColorConfig formData={formData} setFormData={setFormData} />}
						{activeTab === 'layout' && <HomeLayout cardStylesData={cardStylesData} setCardStylesData={setCardStylesData} onClose={onClose} />}
					</div>

					{/* ---------- 底部：操作区 ---------- */}
					<footer className='mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4'>
						<p className='text-secondary flex items-center gap-1.5 text-[11px]'>
							{isAuth ? (
								<>
									<span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
									已授权，保存会直接推送到仓库
								</>
							) : (
								<>
									<KeyRound className='h-3 w-3' />
									首次保存需要导入私钥，之后自动记住
								</>
							)}
							{dirty && <span className='text-brand ml-1'>· 有未保存的改动</span>}
						</p>

						<div className='flex items-center gap-2'>
							<button
								type='button'
								onClick={handlePreview}
								className='text-secondary hover:text-primary hover:border-brand/40 inline-flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-[12.5px] transition-colors'>
								<Eye className='h-3.5 w-3.5' />
								预览
							</button>
							<button
								type='button'
								onClick={handleCancel}
								disabled={isSaving}
								className='text-secondary hover:text-primary inline-flex h-9 items-center rounded-xl px-3.5 text-[12.5px] transition-colors disabled:opacity-40'>
								取消
							</button>
							<motion.button
								type='button'
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.97 }}
								onClick={handleSaveClick}
								disabled={isSaving}
								className='brand-btn inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[12.5px] disabled:opacity-50'>
								<Save className='h-3.5 w-3.5' />
								{isSaving ? '保存中…' : buttonText}
							</motion.button>
						</div>
					</footer>
				</div>
			</DialogModal>
		</>
	)
}
