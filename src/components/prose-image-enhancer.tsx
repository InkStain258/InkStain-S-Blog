'use client'

import { useEffect } from 'react'

/**
 * 正文图片增强：
 * 1. 自动加 loading="lazy" / decoding="async"，长文不再一次性拉全部图
 * 2. 加载完成前显示模糊占位，完成后淡入，避免图片"啪"地弹出来
 */
export default function ProseImageEnhancer() {
	useEffect(() => {
		const enhance = () => {
			const images = Array.from(document.querySelectorAll<HTMLImageElement>('.prose img'))
			for (const img of images) {
				if (img.dataset.enhanced === '1') continue
				img.dataset.enhanced = '1'
				img.loading = 'lazy'
				img.decoding = 'async'

				if (img.complete && img.naturalWidth > 0) {
					img.dataset.loaded = '1'
					continue
				}
				img.dataset.loaded = '0'
				const done = () => {
					img.dataset.loaded = '1'
				}
				img.addEventListener('load', done, { once: true })
				img.addEventListener('error', done, { once: true })
			}
		}

		enhance()
		// 文章内容是异步渲染进来的，用 MutationObserver 兜底
		const observer = new MutationObserver(() => enhance())
		observer.observe(document.body, { childList: true, subtree: true })
		const timer = setTimeout(enhance, 1500)

		return () => {
			observer.disconnect()
			clearTimeout(timer)
		}
	}, [])

	return null
}
