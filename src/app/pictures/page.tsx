'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { RandomLayout } from './components/random-layout'
import UploadDialog from './components/upload-dialog'
import { pushPictures } from './services/push-pictures'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import type { ImageItem } from '../projects/components/image-upload-dialog'
import { useRouter } from 'next/navigation'
export interface Picture { id: string; uploadedAt: string; description?: string; image?: string; images?: string[] }
const GALLERY_API = 'http://20.187.125.248/api/images/'
const MAX_RANDOM = 40
interface GalleryImage { id: number; name: string; tags: string; image_url: string; thumbnail_url: string; uploaded_at: string }
async function fetchAllGalleryImages(): Promise<GalleryImage[]> {
  const all: GalleryImage[] = []; let url: string|null = GALLERY_API
  while (url) { const res = await fetch(url); if (!res.ok) break; const d = await res.json(); all.push(...d.results); url = d.next }
  return all
}
function shuffleAndPick<T>(a: T[], n: number): T[] {
  const c = [...a]; for (let i = c.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [c[i],c[j]]=[c[j],c[i]] }
  return c.slice(0,n)
}
export default function Page() {
  const [p, setP] = useState<Picture[]>([]); const [op, setOp] = useState<Picture[]>([])
  const [edit, setEdit] = useState(false); const [saving, setSaving] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false); const [loading, setLoading] = useState(true)
  const [imgs, setImgs] = useState<Map<string,ImageItem>>(new Map()); const [err, setErr] = useState<string|null>(null)
  const keyRef = useRef<HTMLInputElement>(null); const router = useRouter()
  const { isAuth, setPrivateKey } = useAuthStore(); const { siteContent } = useConfigStore()
  const hideEdit = siteContent.hideEditButton ?? false
  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try { const all = await fetchAllGalleryImages()
      if (!all.length) { setErr('图站暂无图片'); setP([]); return }
      const picked = shuffleAndPick(all, MAX_RANDOM)
      setP(picked.map(img => ({id:'gallery-'+img.id,uploadedAt:img.uploaded_at,description:img.name+(img.tags?'  ('+img.tags+')':''),images:[img.thumbnail_url||img.image_url]})))
      setOp(p)
    } catch { setErr('无法连接到星瞳图站') } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  const handleUpload = ({images,description}:{images:ImageItem[];description:string}) => {
    if (!images.length) { toast.error('请至少选择一张图片'); return }
    const id = Date.now()+'-'+Math.random().toString(16).slice(2)
    const np: Picture = {id, uploadedAt: new Date().toISOString(), description: description.trim()||undefined, images: images.map(im => im.type==='url'?im.url:im.previewUrl)}
    const nm = new Map(imgs); images.forEach((im,i) => { if(im.type==='file') nm.set(id+'::'+i,im) })
    setP(prev => [...prev, np]); setImgs(nm); setUploadOpen(false)
  }
  const handleDelete = (pid:string, idx:number|'single') => {
    setP(prev => prev.map(pic => {if(pic.id!==pid) return pic; if(idx==='single') return null; if(pic.images?.length){const ni=pic.images.filter((_,i)=>i!==idx);return ni.length?{...pic,images:ni}:null}return pic}).filter(Boolean) as Picture[])
    setImgs(prev => { const n = new Map(prev)
      if(idx==='single') { for(const k of n.keys()) if(k.startsWith(pid+'::')) n.delete(k) }
      else { n.delete(pid+'::'+idx); for(const k of n.keys()){const m=k.match(new RegExp('^'+pid+'::(\\d+)$'));if(m&&Number(m[1])>idx){n.set(pid+'::'+(Number(m[1])-1),n.get(k));n.delete(k)}}}
      return n
    })
  }
  const handleDelGroup = (pic:Picture) => { if(!confirm('确定删除？')) return; setP(prev=>prev.filter(p=>p.id!==pic.id)) }
  const handleKey = async (f:File) => { try{const t=await f.text();setPrivateKey(t);await save()}catch{toast.error('读取密钥文件失败')} }
  const handleSaveClick = () => { if(!isAuth)keyRef.current?.click();else save() }
  const save = async () => {
    setSaving(true)
    try { await pushPictures({pictures:p,imageItems:imgs}); setOp(p); setImgs(new Map()); setEdit(false); toast.success('保存成功！') }
    catch(e:any){toast.error('保存失败: '+(e?.message||'未知错误'))} finally{setSaving(false)}
  }
  const cancel = () => { setP(op); setImgs(new Map()); setEdit(false) }
  useEffect(() => {
    const h = (e:KeyboardEvent) => { if(!edit&&(e.ctrlKey||e.metaKey)&&e.key===','){e.preventDefault();setEdit(true)} }
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h)
  }, [edit])
  if(loading) return <><div className='text-secondary flex min-h-screen items-center justify-center text-center text-sm'>正在加载星瞳图站图片...</div><input ref={keyRef} type='file' accept='.pem' className='hidden' onChange={async e=>{const f=e.target.files?.[0];if(f)await handleKey(f);if(e.currentTarget)e.currentTarget.value=''}}/></>
  return <><input ref={keyRef} type='file' accept='.pem' className='hidden' onChange={async e=>{const f=e.target.files?.[0];if(f)await handleKey(f);if(e.currentTarget)e.currentTarget.value=''}}/>
    {err ? <div className='flex min-h-screen flex-col items-center justify-center gap-4 text-center'><div className='text-secondary text-sm'>{err}</div><motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={load} className='brand-btn rounded-xl px-6 py-2 text-sm'>重试</motion.button></div>
    : <><RandomLayout pictures={p} isEditMode={edit} onDeleteSingle={handleDelete} onDeleteGroup={handleDelGroup}/>{!p.length&&<div className='text-secondary flex min-h-screen items-center justify-center text-center text-sm'>暂无图片</div>}</>}
    <motion.div initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} className='absolute top-4 right-6 flex gap-3 max-sm:hidden'>
      {!err&&<motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={load} className='rounded-xl border bg-white/60 px-4 py-2 text-sm backdrop-blur-sm hover:bg-white/80' title='重新随机加载一批'>🔄 换一批</motion.button>}
      {edit ? <><motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>router.push('/image-toolbox')} className='rounded-xl border bg-blue-50 px-4 py-2 text-sm text-blue-700'>压缩工具</motion.button>
      <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={cancel} disabled={saving} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>取消</motion.button>
      <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setUploadOpen(true)} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>上传</motion.button>
      <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={handleSaveClick} disabled={saving} className='brand-btn px-6'>{saving?'保存中...':'保存'}</motion.button></>
      : !hideEdit&&<motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setEdit(true)} className='rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm hover:bg-white/80'>编辑</motion.button>}
    </motion.div>
    {uploadOpen&&<UploadDialog onClose={()=>setUploadOpen(false)} onSubmit={handleUpload}/>}
  </>
}
