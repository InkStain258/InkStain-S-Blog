/**
 * 浏览器端图片压缩：上传前把大图缩到合理尺寸并转 WebP。
 * 目的：减小 Git 仓库体积、加快文章首屏加载。
 */

export type CompressOptions = {
	/** 最长边像素上限，默认 1600 */
	maxSize?: number
	/** 质量 0-1，默认 0.82 */
	quality?: number
	/** 小于该字节数且尺寸达标时原样返回，默认 350KB */
	maxBytes?: number
}

const SKIP_TYPES = ['image/gif', 'image/svg+xml', 'image/avif']

function loadBitmap(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void }> {
	return new Promise((resolve, reject) => {
		if (typeof createImageBitmap === 'function') {
			createImageBitmap(file)
				.then(bmp => {
					resolve({
						width: bmp.width,
						height: bmp.height,
						draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
						close: () => bmp.close()
					})
				})
				.catch(reject)
			return
		}
		const url = URL.createObjectURL(file)
		const img = new Image()
		img.onload = () => {
			resolve({
				width: img.naturalWidth,
				height: img.naturalHeight,
				draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
				close: () => URL.revokeObjectURL(url)
			})
		}
		img.onerror = () => {
			URL.revokeObjectURL(url)
			reject(new Error('图片解码失败'))
		}
		img.src = url
	})
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
	return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

/**
 * 压缩单张图片。失败或无需压缩时返回原文件。
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
	const { maxSize = 1600, quality = 0.82, maxBytes = 350 * 1024 } = opts

	if (!file.type.startsWith('image/') || SKIP_TYPES.includes(file.type)) return file

	try {
		const bmp = await loadBitmap(file)
		const longest = Math.max(bmp.width, bmp.height)
		const scale = Math.min(1, maxSize / longest)

		// 本来就小且够小，直接放行
		if (scale === 1 && file.size <= maxBytes) {
			bmp.close()
			return file
		}

		const w = Math.max(1, Math.round(bmp.width * scale))
		const h = Math.max(1, Math.round(bmp.height * scale))

		const canvas = document.createElement('canvas')
		canvas.width = w
		canvas.height = h
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			bmp.close()
			return file
		}
		ctx.imageSmoothingEnabled = true
		ctx.imageSmoothingQuality = 'high'
		bmp.draw(ctx, w, h)
		bmp.close()

		// 优先 WebP，不支持则回退 JPEG
		let blob = await canvasToBlob(canvas, 'image/webp', quality)
		let ext = 'webp'
		if (!blob || blob.type !== 'image/webp') {
			blob = await canvasToBlob(canvas, 'image/jpeg', quality)
			ext = 'jpg'
		}
		if (!blob) return file

		// 压完反而更大，保留原图
		if (blob.size >= file.size) return file

		const base = file.name.replace(/\.[^.]+$/, '')
		return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() })
	} catch {
		return file
	}
}

/** 批量压缩 */
export async function compressImages(files: File[], opts?: CompressOptions): Promise<File[]> {
	return Promise.all(files.map(f => compressImage(f, opts)))
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
