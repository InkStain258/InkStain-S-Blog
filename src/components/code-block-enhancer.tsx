'use client'

import { useEffect } from 'react'

/**
 * 正文代码块增强：右上角语言标签 + 一键复制。
 * 内容来自 dangerouslySetInnerHTML，直接操作 DOM 即可（页面内容稳定，不会被 React 覆盖）。
 */
export default function CodeBlockEnhancer() {
	useEffect(() => {
		const LABEL: Record<string, string> = {
			js: 'JavaScript',
			jsx: 'JSX',
			ts: 'TypeScript',
			tsx: 'TSX',
			py: 'Python',
			python: 'Python',
			bash: 'Bash',
			sh: 'Shell',
			shell: 'Shell',
			zsh: 'Shell',
			json: 'JSON',
			yml: 'YAML',
			yaml: 'YAML',
			css: 'CSS',
			html: 'HTML',
			xml: 'XML',
			md: 'Markdown',
			markdown: 'Markdown',
			sql: 'SQL',
			go: 'Go',
			rs: 'Rust',
			rust: 'Rust',
			java: 'Java',
			kt: 'Kotlin',
			c: 'C',
			cpp: 'C++',
			cs: 'C#',
			php: 'PHP',
			rb: 'Ruby',
			swift: 'Swift',
			dockerfile: 'Dockerfile',
			ini: 'INI',
			toml: 'TOML'
		}

		const detectLang = (pre: HTMLElement): string => {
			const code = pre.querySelector('code')
			const cls = `${pre.className} ${code?.className || ''}`
			const m = cls.match(/language-([a-z0-9+#]+)/i) || cls.match(/lang-([a-z0-9+#]+)/i)
			if (m) {
				const key = m[1].toLowerCase()
				return LABEL[key] || key.toUpperCase()
			}
			if (pre.dataset.language) return LABEL[pre.dataset.language] || pre.dataset.language
			return 'CODE'
		}

		const enhance = () => {
			const blocks = Array.from(document.querySelectorAll<HTMLElement>('.prose pre'))
			for (const pre of blocks) {
				if (pre.dataset.enhanced === '1') continue
				pre.dataset.enhanced = '1'
				pre.classList.add('code-block')

				const bar = document.createElement('div')
				bar.className = 'code-bar'

				const lang = document.createElement('span')
				lang.className = 'code-lang'
				lang.textContent = detectLang(pre)

				const btn = document.createElement('button')
				btn.type = 'button'
				btn.className = 'code-copy'
				btn.setAttribute('aria-label', '复制代码')
				btn.innerHTML =
					'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>复制</span>'

				btn.addEventListener('click', async () => {
					const code = pre.querySelector('code')?.textContent ?? pre.textContent ?? ''
					try {
						await navigator.clipboard.writeText(code)
					} catch {
						const ta = document.createElement('textarea')
						ta.value = code
						document.body.appendChild(ta)
						ta.select()
						document.execCommand('copy')
						ta.remove()
					}
					btn.classList.add('copied')
					const span = btn.querySelector('span')
					if (span) span.textContent = '已复制'
					setTimeout(() => {
						btn.classList.remove('copied')
						if (span) span.textContent = '复制'
					}, 1600)
				})

				bar.appendChild(lang)
				bar.appendChild(btn)
				pre.appendChild(bar)
			}
		}

		enhance()
		const observer = new MutationObserver(() => enhance())
		observer.observe(document.body, { childList: true, subtree: true })
		const t = setTimeout(enhance, 1200)

		return () => {
			observer.disconnect()
			clearTimeout(t)
		}
	}, [])

	return null
}
