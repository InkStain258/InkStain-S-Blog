'use client'

import { useEffect } from 'react'

/**
 * 任务列表的可访问名。
 *
 * 正文里的 `- [ ] 抄一遍《序志》` 会被 markdown 渲染成
 * `<li><input type="checkbox" disabled> 抄一遍《序志》</li>`。
 * 这个 input 是 disabled 的、没有 label，读屏只会念「复选框」，
 * 十几项连着念下来完全不知道是哪一条。
 *
 * 这里不碰渲染器，只在 DOM 上给每个 checkbox 补一个 aria-label，
 * 名字取同一行 li 的文字（去掉 checkbox 自己）。
 */
export default function TaskListLabels() {
	useEffect(() => {
		const apply = () => {
			document.querySelectorAll<HTMLInputElement>('.prose input[type="checkbox"]').forEach(box => {
				if (box.dataset.inkLabelled === '1') return
				const li = box.closest('li')
				const text = (li?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
				box.setAttribute('aria-label', text ? `任务项：${text}` : '任务项')
				box.dataset.inkLabelled = '1'
			})
		}

		apply()

		// 正文是客户端渲染后才进 DOM 的，首帧往往还没有，挂个观察器等它出现
		const mo = new MutationObserver(() => apply())
		mo.observe(document.body, { childList: true, subtree: true })
		return () => mo.disconnect()
	}, [])

	return null
}