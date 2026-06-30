'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { ProjectCard, type Project } from './components/project-card'
import CreateDialog from './components/create-dialog'
import { pushProjects } from './services/push-projects'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import initialList from "./list.json"
import type { ImageItem } from './components/image-upload-dialog'

/* nginx proxies to GitHub raw */

export default function Page() {
	const [projects, setProjects] = useState<Project[]>([])
	const [originalProjects, setOriginalProjects] = useState<Project[]>([])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [editingProject, setEditingProject] = useState<Project | null>(null)
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	const loadProjects = useCallback(async () => {
		setIsLoading(true)
		try {
			const res = await fetch("https://raw.githubusercontent.com/InkStain258/InkStain-S-Blog/main/src/app/projects/list.json")
			if (!res.ok) throw new Error('Failed')
			setProjects(await res.json())
		} catch {
			toast.error('加载项目数据失败')
		} finally { setIsLoading(false) }
	}, [])

	useEffect(() => { loadProjects() }, [loadProjects])

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await pushProjects({ projects, imageItems })
			setOriginalProjects(projects); setImageItems(new Map()); setIsEditMode(false)
			toast.success('保存成功！')
		} catch (e: any) { toast.error('保存失败: ' + (e?.message || '未知错误')) }
		finally { setIsSaving(false) }
	}

	// ... rest of handlers same as before but with setProjects/editingProject
	const handleUpdate = (updated: Project, old: Project, img?: ImageItem) => {
		setProjects(prev => prev.map(p => p.url === old.url ? updated : p))
		if (img) setImageItems(prev => { const n = new Map(prev); n.set(updated.url, img); return n })
	}
	const handleAdd = () => { setEditingProject(null); setIsCreateDialogOpen(true) }
	const handleSaveProject = (p: Project) => {
		if (editingProject) setProjects(prev => prev.map(x => x.url === editingProject.url ? p : x))
		else setProjects(prev => [...prev, p])
	}
	const handleDelete = (p: Project) => { if (confirm('确定删除？')) setProjects(prev => prev.filter(x => x.url !== p.url)) }
	const handleChoosePrivateKey = async (f: File) => { try { setPrivateKey(await f.text()); await handleSave() } catch { toast.error('读取密钥文件失败') } }
	const handleSaveClick = () => { if (!isAuth) keyInputRef.current?.click(); else handleSave() }
	const handleCancel = () => { setProjects(originalProjects); setImageItems(new Map()); setIsEditMode(false) }
	const buttonText = isAuth ? '保存' : '导入密钥'

	return <>
		<input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={async e => { const f = e.target.files?.[0]; if (f) await handleChoosePrivateKey(f); if (e.currentTarget) e.currentTarget.value = '' }} />
		{isLoading ? <div className='text-secondary flex min-h-screen items-center justify-center text-center text-sm'>加载项目数据...</div> : (
			<div className='flex flex-col items-center justify-center px-6 pt-32 pb-12'>
				<div className='grid w-full max-w-[1200px] grid-cols-2 gap-6 max-md:grid-cols-1'>
					{projects.map((project, i) => <ProjectCard key={project.url} project={project} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={() => handleDelete(project)} />)}
				</div>
			</div>
		)}
		<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='absolute top-4 right-6 flex gap-3 max-sm:hidden'>
			{isEditMode ? <>
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCancel} disabled={isSaving} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>取消</motion.button>
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAdd} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>添加</motion.button>
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>{isSaving ? '保存中...' : buttonText}</motion.button>
			</> : !hideEditButton && (
				<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsEditMode(true)} className='rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80'>编辑</motion.button>
			)}
		</motion.div>
		{isCreateDialogOpen && <CreateDialog project={editingProject} onClose={() => setIsCreateDialogOpen(false)} onSave={handleSaveProject} />}
	</>
}
