'use client'

import type { SiteContent } from '../../stores/config-store'
import type { ArtImageUploads, BackgroundImageUploads, FileItem, SocialButtonImageUploads } from './types'
import { FaviconAvatarUpload } from './favicon-avatar-upload'
import { SiteMetaForm } from './site-meta-form'
import { ArtImagesSection } from './art-images-section'
import { BackgroundImagesSection } from './background-images-section'
import { SocialButtonsSection } from './social-buttons-section'
import { HatSection } from './hat-section'
import { BeianForm } from './beian-form'

export type { FileItem, ArtImageUploads, BackgroundImageUploads, SocialButtonImageUploads } from './types'

interface SiteSettingsProps {
	formData: SiteContent
	setFormData: React.Dispatch<React.SetStateAction<SiteContent>>
	faviconItem: FileItem | null
	setFaviconItem: React.Dispatch<React.SetStateAction<FileItem | null>>
	avatarItem: FileItem | null
	setAvatarItem: React.Dispatch<React.SetStateAction<FileItem | null>>
	artImageUploads: ArtImageUploads
	setArtImageUploads: React.Dispatch<React.SetStateAction<ArtImageUploads>>
	backgroundImageUploads: BackgroundImageUploads
	setBackgroundImageUploads: React.Dispatch<React.SetStateAction<BackgroundImageUploads>>
	socialButtonImageUploads: SocialButtonImageUploads
	setSocialButtonImageUploads: React.Dispatch<React.SetStateAction<SocialButtonImageUploads>>
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
	return (
		<section className='cfg-section'>
			<div className='cfg-section-head'>
				<span className='cfg-section-title'>{title}</span>
				{hint && <span className='cfg-section-hint'>{hint}</span>}
			</div>
			{children}
		</section>
	)
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
	return (
		<label className='flex cursor-pointer items-center gap-2 text-[12.5px] leading-none'>
			<input type='checkbox' checked={checked} onChange={e => onChange(e.target.checked)} className='h-3.5 w-3.5 rounded' />
			<span>{label}</span>
		</label>
	)
}

export function SiteSettings({
	formData,
	setFormData,
	faviconItem,
	setFaviconItem,
	avatarItem,
	setAvatarItem,
	artImageUploads,
	setArtImageUploads,
	backgroundImageUploads,
	setBackgroundImageUploads,
	socialButtonImageUploads,
	setSocialButtonImageUploads
}: SiteSettingsProps) {
	return (
		<div>
			<Section title='图标与头像' hint='favicon 建议 512×512，头像用正方形'>
				<FaviconAvatarUpload faviconItem={faviconItem} setFaviconItem={setFaviconItem} avatarItem={avatarItem} setAvatarItem={setAvatarItem} />
			</Section>

			<Section title='站点信息'>
				<SiteMetaForm formData={formData} setFormData={setFormData} />
			</Section>

			<Section title='备案' hint='没有就留空'>
				<BeianForm formData={formData} setFormData={setFormData} />
			</Section>

			<Section title='社交按钮' hint='列表顺序即首页展示顺序'>
				<SocialButtonsSection
					formData={formData}
					setFormData={setFormData}
					socialButtonImageUploads={socialButtonImageUploads}
					setSocialButtonImageUploads={setSocialButtonImageUploads}
				/>
			</Section>

			<Section title='首页轮播图' hint='拖进来的图片会压缩后存进仓库'>
				<ArtImagesSection formData={formData} setFormData={setFormData} artImageUploads={artImageUploads} setArtImageUploads={setArtImageUploads} />
			</Section>

			<Section title='页面背景'>
				<BackgroundImagesSection
					formData={formData}
					setFormData={setFormData}
					backgroundImageUploads={backgroundImageUploads}
					setBackgroundImageUploads={setBackgroundImageUploads}
				/>
			</Section>

			<Section title='显示选项'>
				<div className='grid grid-cols-2 gap-x-6 gap-y-3.5'>
					<Toggle checked={formData.clockShowSeconds ?? false} onChange={v => setFormData({ ...formData, clockShowSeconds: v })} label='时钟显示秒数' />
					<Toggle checked={formData.summaryInContent ?? false} onChange={v => setFormData({ ...formData, summaryInContent: v })} label='摘要放入正文' />
					<Toggle
						checked={formData.hideEditButton ?? false}
						onChange={v => setFormData({ ...formData, hideEditButton: v })}
						label='隐藏编辑按钮（快捷键 ⌘/Ctrl + ,）'
					/>
					<Toggle checked={formData.enableCategories ?? false} onChange={v => setFormData({ ...formData, enableCategories: v })} label='启用文章分类' />
					<Toggle checked={formData.enableChristmas ?? false} onChange={v => setFormData({ ...formData, enableChristmas: v })} label='开启圣诞装饰' />
					<Toggle
						checked={formData.isCachePem ?? false}
						onChange={v => setFormData({ ...formData, isCachePem: v })}
						label='缓存私钥（已加密，仍有风险）'
					/>
				</div>
			</Section>

			<Section title='彩蛋' hint='首页头像上的小装饰'>
				<HatSection formData={formData} setFormData={setFormData} />
			</Section>
		</div>
	)
}
