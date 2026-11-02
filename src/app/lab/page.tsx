'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Clock, ImageIcon, Music, Images, Code2, Shapes, Sparkles, Gamepad2, ArrowUpRight, FlaskConical } from 'lucide-react'

/**
 * 实验室：把散落在站点各处、以前没有任何入口的小工具集中到一个页面上。
 * 这些页面一直存在（都返回 200），但导航里没有它们，等于没人能走到。
 */
const TOOLS = [
	{
		href: '/clock',
		title: '计时器',
		desc: '秒表与倒计时，随手开一个就能用，不记状态。',
		icon: Clock,
		tag: '效率'
	},
	{
		href: '/image-toolbox',
		title: '图片工具箱',
		desc: 'PNG / JPG 转 WebP，纯浏览器内处理，图片不上传服务器。',
		icon: ImageIcon,
		tag: '图像'
	},
	{
		href: '/pictures',
		title: '相册',
		desc: '按主题分组的图片墙，支持编辑与增删。',
		icon: Images,
		tag: '图像'
	},
	{
		href: '/music',
		title: '背景音乐',
		desc: '站点播放器，收录自己常听的曲子。',
		icon: Music,
		tag: '声音'
	},
	{
		href: '/svgs',
		title: 'SVG 素材库',
		desc: '自己画的与收集的矢量图标，可预览、可下载。',
		icon: Shapes,
		tag: '素材'
	},
	{
		href: '/snippets',
		title: '代码片段',
		desc: '常用命令与短代码的备忘录，支持在线编辑。',
		icon: Code2,
		tag: '效率'
	},
	{
		href: '/live2d',
		title: 'Live2D 看板娘',
		desc: '模型查看器，试试拖动与换装。',
		icon: Sparkles,
		tag: '玩具'
	},
	{
		href: '/wuthering-waves',
		title: '鸣潮抽卡分析',
		desc: '导入抽卡记录，看保底进度与出货曲线。',
		icon: Gamepad2,
		tag: '游戏'
	}
]

export default function LabPage() {
	return (
		<div className='mx-auto w-full max-w-[980px] px-6 pt-28 pb-24 max-sm:px-4'>
			<motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
				<div className='text-secondary mb-2 flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase opacity-70'>
					<FlaskConical className='h-3.5 w-3.5' />
					Lab
				</div>
				<h1 className='text-2xl font-semibold tracking-tight sm:text-[28px]'>实验室</h1>
				<p className='text-secondary mt-2 max-w-[620px] text-[13px] leading-relaxed opacity-80'>
					这里放的是和「写作」无关的小东西：计时、转图、听歌、翻素材。都是一个人用的工具，所以没有一个做得很大。
				</p>
			</motion.header>

			<div className='mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
				{TOOLS.map((t, i) => {
					const Icon = t.icon
					return (
						<motion.div
							key={t.href}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}>
							<Link
								href={t.href}
								className='glass-2 group flex h-full flex-col gap-2 rounded-2xl border p-4 transition-colors hover:border-brand/40'>
								<div className='flex items-center gap-2.5'>
									<span className='bg-brand/10 text-brand grid h-8 w-8 place-items-center rounded-xl'>
										<Icon className='h-4 w-4' />
									</span>
									<span className='text-[14px] font-medium'>{t.title}</span>
									<span className='text-secondary ml-auto text-[10px] tracking-wider opacity-60'>{t.tag}</span>
									<ArrowUpRight className='text-secondary h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-70' />
								</div>
								<p className='text-secondary text-[12px] leading-relaxed opacity-75'>{t.desc}</p>
							</Link>
						</motion.div>
					)
				})}
			</div>
		</div>
	)
}
