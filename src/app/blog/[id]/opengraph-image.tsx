import { ImageResponse } from 'next/og'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * 文章分享卡（1200×630）。
 *
 * 分享到微信 / Telegram / X 时，链接下方的那张图就是它。原来只有纯文字，转发出去
 * 没有任何视觉信息。用 next/og 在请求时生成，不占仓库、不用设计工具。
 *
 * 字体必须是 ttf/otf/woff —— satori 不支持 woff2。所以 public/fonts 里同时放了
 * lxgw-wenkai.woff2（前端用）和 lxgw-og.ttf（这里用，1.9 MB，不被浏览器加载）。
 */
export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'InkStain 的文章分享卡'

type Post = {
	title: string
	summary?: string
	date: string
	category?: string
	categoryPath?: string[]
	words?: number
	slug: string
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params

	let post: Post | undefined
	try {
		const raw = await fs.readFile(path.join(process.cwd(), 'public/blogs/index.json'), 'utf-8')
		const list = JSON.parse(raw) as Post[]
		post = list.find(p => p.slug === id)
	} catch {
		post = undefined
	}

	let font: ArrayBuffer | null = null
	try {
		const buf = await fs.readFile(path.join(process.cwd(), 'public/fonts/lxgw-og.ttf'))
		font = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
	} catch {
		font = null
	}

	const title = post?.title ?? 'InkStain'
	const category = post?.category ?? ''
	const date = post?.date ? new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
	const words = post?.words ? `${post.words.toLocaleString('zh-CN')} 字` : ''
	const meta = [date, words].filter(Boolean).join(' · ')
	// 标题太长时缩小字号，两行以内放得下
	const fontSize = title.length > 34 ? 46 : title.length > 22 ? 54 : 62

	return new ImageResponse(
		(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: '68px 76px',
					backgroundColor: '#16213e',
					backgroundImage: 'radial-gradient(circle at 82% 12%, rgba(47,203,231,0.22), transparent 58%), radial-gradient(circle at 8% 92%, rgba(120,140,255,0.16), transparent 55%)',
					fontFamily: font ? 'LXGW' : 'sans-serif'
				}}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
						<div style={{ width: 34, height: 2, backgroundColor: '#2fcbe7' }} />
						<div style={{ fontSize: 22, letterSpacing: 6, color: '#8fd8e8', textTransform: 'uppercase' }}>InkStain</div>
					</div>
					{category ? <div style={{ fontSize: 22, color: '#9aa8c8' }}>{category}</div> : null}
				</div>

				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 26,
						flex: 1,
						justifyContent: 'center',
						paddingRight: 40
					}}>
					<div style={{ fontSize, lineHeight: 1.32, color: '#f2f6ff', letterSpacing: 2, display: 'flex' }}>{title}</div>
					{post?.summary ? (
						<div style={{ fontSize: 24, lineHeight: 1.6, color: '#9aa8c8', display: 'flex' }}>
							{post.summary.replace(/\*\*/g, '').slice(0, 62)}
						</div>
					) : null}
				</div>

				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: 26 }}>
					<div style={{ fontSize: 22, color: '#7f8cab', letterSpacing: 1 }}>{meta}</div>
					<div style={{ fontSize: 22, color: '#2fcbe7', letterSpacing: 1 }}>inkstain.top</div>
				</div>
			</div>
		),
		{
			...size,
			fonts: font ? [{ name: 'LXGW', data: font, style: 'normal' as const, weight: 400 as const }] : undefined
		}
	)
}