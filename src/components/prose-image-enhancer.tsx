'use client'

import { useEffect } from 'react'

/**
 * 正文图片增强：
 * 1. 自动加 loading="lazy" / decoding="async"，长文不再一次性拉全部图
 * 2. 加载完成前显示模糊占位，完成后淡入，避免图片"啪"地弹出来
 * 3. 图片真的挂了（文件缺失/链接失效）时换成虚线占位，而不是浏览器那个破图标
 */
export default function ProseImageEnhancer() {
	useEffect(() => {
		const swapFailed = (img: HTMLImageElement) => {
			if (img.dataset.failed === '1' || !img.parentNode) return
			img.dataset.failed = '1'
			img.dataset.loaded = '1'
			const alt = (img.getAttribute('alt') || '').trim()
			const box = document.createElement('div')
			box.className = 'prose-img-missing'
			box.setAttribute('role', 'img')
			box.setAttribute('aria-label', alt ? `图片缺失：${alt}` : '图片缺失')
			const label = document.createElement('span')
			label.textContent = '图片未能加载'
			box.appendChild(label)
			if (alt) {
				const small = document.createElement('small')
				small.textContent = alt
				box.appendChild(small)
			}
			img.replaceWith(box)
		}
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
				if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
					// 挂监听前 error 就已经发生过了
					swapFailed(img)
					continue
				}
				img.dataset.loaded = '0'
				const done = () => {
					img.dataset.loaded = '1'
				}
				img.addEventListener('load', done, { once: true })
				img.addEventListener('error', () => swapFailed(img), { once: true })
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
