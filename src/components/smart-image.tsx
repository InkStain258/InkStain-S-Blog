import type { CSSProperties } from 'react'
import manifest from '@/generated/image-manifest.json'

/**
 * 零费用的图片优化：不用 next/image（Vercel 图片优化按量计费），
 * 改成构建前用 ffmpeg 预生成 480/960 两档 AVIF + WebP，
 * 运行时只输出 <picture> + srcset，由浏览器挑合适的那个。
 *
 * 清单由 scripts/build-images.mjs 生成（manifest.json 也同步到 src/generated）。
 * 命中清单 → 出 AVIF/WebP 多档；没命中 → 退回普通 <img>（照样带 lazy 与解码提示）。
 */
type Variant = { w: number; webp: string; avif: string }
type Entry = { w: number; h: number; sizes: Variant[] }

const MAP = manifest as Record<string, Entry>

// 封面的 config.json 里存的是 raw.githubusercontent 外链，清单里是站内路径，
// 所以先按文件名建一份索引：拿 basename 就能找回对应的变体。
const BY_NAME = new Map<string, string>()
for (const key of Object.keys(MAP)) {
	const name = key.split('/').pop()
	if (name) BY_NAME.set(name, key)
}

function resolveEntry(src: string, slug?: string): Entry | undefined {
	if (MAP[src]) return MAP[src]
	const name = (src.split(/[?#]/)[0].split('/').pop() || '').trim()
	if (!name) return undefined
	if (slug) {
		const k = `/blogs/${slug}/${name}`
		if (MAP[k]) return MAP[k]
	}
	const k = BY_NAME.get(name)
	return k ? MAP[k] : undefined
}

export type SmartImageProps = {
	src: string
	alt?: string
	className?: string
	width?: number
	height?: number
	/** 告诉浏览器这张图在版面里占多宽，决定它挑哪一档 */
	sizes?: string
	/** 首屏图：关掉 lazy，避免拖 LCP */
	priority?: boolean
	onClick?: () => void
	style?: CSSProperties
	title?: string
	/** 封面外链靠文件名反查清单时，用 slug 精确匹配 */
	slug?: string
}

export function SmartImage({
	src,
	alt = '',
	className = '',
	width,
	height,
	sizes = '(max-width: 640px) 90vw, 480px',
	priority = false,
	onClick,
	style,
	title,
	slug
}: SmartImageProps) {
	const entry = resolveEntry(src, slug)
	const loading = priority ? 'eager' : 'lazy'
	const fetchPriority = priority ? 'high' : undefined

	if (!entry?.sizes?.length) {
		return (
			<img
				src={src}
				alt={alt}
				title={title}
				width={width}
				height={height}
				className={className}
				loading={loading}
				decoding='async'
				{...(fetchPriority ? { fetchPriority } : {})}
				onClick={onClick}
				style={style}
			/>
		)
	}

	const avifSet = entry.sizes.map(v => `${v.avif} ${v.w}w`).join(', ')
	const webpSet = entry.sizes.map(v => `${v.webp} ${v.w}w`).join(', ')
	const fallback = entry.sizes[entry.sizes.length - 1].webp

	return (
		// display:contents 让 <picture> 不参与布局，img 仍然直接受父容器约束
		<picture className='contents'>
			<source type='image/avif' srcSet={avifSet} sizes={sizes} />
			<source type='image/webp' srcSet={webpSet} sizes={sizes} />
			<img
				src={fallback}
				alt={alt}
				title={title}
				width={width ?? entry.w}
				height={height ?? entry.h}
				className={className}
				loading={loading}
				decoding='async'
				{...(fetchPriority ? { fetchPriority } : {})}
				onClick={onClick}
				style={style}
			/>
		</picture>
	)
}

export default SmartImage
