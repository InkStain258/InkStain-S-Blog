'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import GridView, { type Blogger } from './grid-view'
import CreateDialog from './components/create-dialog'
import { pushBloggers } from './services/push-bloggers'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import type { AvatarItem } from './components/avatar-upload-dialog'

/* nginx proxies to GitHub raw */

export default function Page() {
	const [bloggers, setBloggers] = useState<Blogger[]>([])
	const [originalBloggers, setOriginalBloggers] = useState<Blogger[]>([])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [editingBlogger, setEditingBlogger] = useState<Blogger | null>(null)
	const [avatarItems, setAvatarItems] = useState<Map<string, AvatarItem>>(new Map())
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	const loadData = useCallback(async () => {
		setIsLoading(true)
		try {
			const res = await fetch("https://raw.githubusercontent.com/InkStain258/InkStain-S-Blog/main/src/app/bloggers/list.json")
			if (!res.ok) throw new Error('Failed')
			setBloggers(await res.json())
		} catch { toast.error('加载数据失败') }
		finally { setIsLoading(false) }
	}, [])

	useEffect(() => { loadData() }, [loadData])

	const handleUpdate = (u: Blogger, o: Blogger, a?: AvatarItem) => {
		setBloggers(prev => prev.map(b => b.url === o.url ? u : b))
		if (a) setAvatarItems(prev => { const n = new Map(prev); n.set(u.url, a); return n })
	}
	const handleAdd = () => { setEditingBlogger(null); setIsCreateDialogOpen(true) }
	const handleSaveBlogger = (u: Blogger) => {
		if (editingBlogger) setBloggers(prev => prev.map(b => b.url === editingBlogger.url ? u : b))
		else setBloggers(prev => [...prev, u])
	}
	const handleDelete = (b: Blogger) => { if (confirm('确定删除？')) setBloggers(prev => prev.filter(x => x.url !== b.url)) }
	const handleChoosePrivateKey = async (f: File) => { try { setPrivateKey(await f.text()); await handleSave() } catch { toast.error('读取密钥文件失败') } }
	const handleSaveClick = () => { if (!isAuth) keyInputRef.current?.click(); else handleSave() }
	const handleSave = async () => {
		setIsSaving(true)
		try { await pushBloggers({ bloggers, avatarItems }); setOriginalBloggers(bloggers); setAvatarItems(new Map()); setIsEditMode(false); toast.success('保存成功！') }
		catch (e: any) { toast.error('保存失败: ' + (e?.message || '未知错误')) }
		finally { setIsSaving(false) }
	}
	const handleCancel = () => { setBloggers(originalBloggers); setAvatarItems(new Map()); setIsEditMode(false) }
	const buttonText = isAuth ? '保存' : '导入密钥'

	return <>
		<input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={async e => { const f = e.target.files?.[0]; if (f) await handleChoosePrivateKey(f); if (e.currentTarget) e.currentTarget.value = '' }} />
		{isLoading ? <div className='text-secondary flex min-h-screen items-center justify-center text-center text-sm'>加载数据...</div> : <GridView bloggers={bloggers} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={handleDelete} />}
		<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='absolute top-4 right-6 flex gap-3 max-sm:hidden'>
			{isEditMode ? <>
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCancel} disabled={isSaving} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>取消</motion.button>
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAdd} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>添加</motion.button>
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>{isSaving ? '保存中...' : buttonText}</motion.button>
			</> : !hideEditButton && (
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsEditMode(true)} className='rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80'>编辑</motion.button>
			)}
		</motion.div>
		{isCreateDialogOpen && <CreateDialog blogger={editingBlogger} onClose={() => setIsCreateDialogOpen(false)} onSave={handleSaveBlogger} />}
	</>
}
