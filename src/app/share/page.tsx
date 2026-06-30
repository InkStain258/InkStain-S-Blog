'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import GridView from './grid-view'
import CreateDialog from './components/create-dialog'
import { pushShares } from './services/push-shares'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import type { Share } from './components/share-card'
import type { LogoItem } from './components/logo-upload-dialog'

// Load from GitHub raw via nginx proxy on CF Tunnel
const LIST_URL = '/share-list.json'

export default function Page() {
	const [shares, setShares] = useState<Share[]>([])
	const [originalShares, setOriginalShares] = useState<Share[]>([])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [editingShare, setEditingShare] = useState<Share | null>(null)
	const [logoItems, setLogoItems] = useState<Map<string, LogoItem>>(new Map())
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	const loadShares = useCallback(async () => {
		setIsLoading(true)
		try {
			const res = await fetch(LIST_URL)
			if (!res.ok) throw new Error()
			setShares(await res.json())
		} catch { setShares([]) }
		finally { setIsLoading(false) }
	}, [])

	useEffect(() => { loadShares() }, [loadShares])

	const handleUpdate = (u: Share, o: Share, l?: LogoItem) => {
		setShares(p => p.map(s => s.url === o.url ? u : s))
		if (l) setLogoItems(p => { const n = new Map(p); n.set(u.url, l); return n })
	}

	const handleSaveShare = (u: Share) => {
		if (editingShare) setShares(p => p.map(s => s.url === editingShare.url ? u : s))
		else setShares(p => [...p, u])
	}
	const handleDelete = (s: Share) => { if (confirm('确定删除？')) setShares(p => p.filter(x => x.url !== s.url)) }
	const handleChoosePrivateKey = async (f: File) => { try { setPrivateKey(await f.text()); await handleSave() } catch { toast.error('密钥文件错误') } }
	const handleSaveClick = () => { if (!isAuth) keyInputRef.current?.click(); else handleSave() }
	const handleSave = async () => {
		setIsSaving(true)
		try { await pushShares({ shares, logoItems }); setOriginalShares(shares); setLogoItems(new Map()); setIsEditMode(false); toast.success('保存成功！') }
		catch (e: any) { toast.error('保存失败: ' + (e?.message || '未知错误')) } finally { setIsSaving(false) }
	}
	const handleCancel = () => { setShares(originalShares); setLogoItems(new Map()); setIsEditMode(false) }
	const buttonText = isAuth ? '保存' : '导入密钥'

	useEffect(() => {
		const h = (e: KeyboardEvent) => { if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); setIsEditMode(true) } }
		window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
	}, [isEditMode])

	return <>
		<input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={async e => { const f = e.target.files?.[0]; if (f) await handleChoosePrivateKey(f); if (e.currentTarget) e.currentTarget.value = '' }} />
		{isLoading ? <div className='text-secondary flex min-h-screen items-center justify-center text-center text-sm'>加载友链数据...</div> : (
			<GridView shares={shares} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={handleDelete} />
		)}
		<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='absolute top-4 right-6 flex gap-3 max-sm:hidden'>
			{isEditMode ? <>
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCancel} disabled={isSaving} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>取消</motion.button>
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setEditingShare(null); setIsCreateDialogOpen(true) }} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>添加</motion.button>
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>{isSaving ? '保存中...' : buttonText}</motion.button>
			</> : !hideEditButton && (
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsEditMode(true)} className='rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80'>编辑</motion.button>
			)}
		</motion.div>
		{isCreateDialogOpen && <CreateDialog share={editingShare} onClose={() => setIsCreateDialogOpen(false)} onSave={handleSaveShare} />}
	</>
}
