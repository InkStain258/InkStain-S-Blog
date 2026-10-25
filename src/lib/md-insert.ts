/**
 * Markdown 快捷插入引擎。
 * 所有操作都基于 textarea 的当前选区计算新的文本与光标位置，
 * 由调用方统一写回 store（保证 React 受控组件状态一致）。
 */

export type MdAction =
	| 'bold'
	| 'italic'
	| 'strike'
	| 'code'
	| 'h1'
	| 'h2'
	| 'h3'
	| 'quote'
	| 'ul'
	| 'ol'
	| 'task'
	| 'divider'
	| 'link'
	| 'image'
	| 'table'
	| 'codeblock'
	| 'details'
	| 'callout'

export type ApplyFn = (next: string, selStart: number, selEnd: number) => void

const WRAP: Partial<Record<MdAction, { mark: string; placeholder: string }>> = {
	bold: { mark: '**', placeholder: '加粗文字' },
	italic: { mark: '*', placeholder: '斜体文字' },
	strike: { mark: '~~', placeholder: '删除线' },
	code: { mark: '`', placeholder: 'code' }
}

const BLOCKS: Partial<Record<MdAction, string>> = {
	divider: '\n\n---\n\n',
	codeblock: '\n\n```ts\n// 代码\n```\n\n',
	table: '\n\n| 列 1 | 列 2 | 列 3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n\n',
	details: '\n\n<details>\n<summary>点击展开</summary>\n\n这里写折叠内容\n\n</details>\n\n',
	callout: '\n\n> [!NOTE]\n> 这里写提示内容\n\n'
}

/** 取选区覆盖的完整行范围 */
function lineRange(value: string, start: number, end: number) {
	const lineStart = value.lastIndexOf('\n', start - 1) + 1
	let lineEnd = value.indexOf('\n', end)
	if (lineEnd === -1) lineEnd = value.length
	return { lineStart, lineEnd }
}

function applyLinePrefix(
	value: string,
	start: number,
	end: number,
	prefix: string,
	ordered = false
): { next: string; selStart: number; selEnd: number } {
	const { lineStart, lineEnd } = lineRange(value, start, end)
	const block = value.slice(lineStart, lineEnd)
	const lines = block.split('\n')

	// 去掉已有的同类前缀，避免叠加
	const strip = (line: string) =>
		line
			.replace(/^#{1,6}\s+/, '')
			.replace(/^>\s?/, '')
			.replace(/^[-*+]\s+\[[ xX]\]\s+/, '')
			.replace(/^[-*+]\s+/, '')
			.replace(/^\d+\.\s+/, '')

	const nonEmpty = lines.filter(l => l.trim().length > 0)
	const already = nonEmpty.length > 0 && nonEmpty.every(l => (ordered ? /^\d+\.\s/.test(l) : l.startsWith(prefix)))

	const rebuilt = lines
		.map((line, i) => {
			if (!line.trim()) return line
			if (already) {
				return strip(line)
			}
			const clean = ordered || prefix.includes('#') || prefix.includes('>') || prefix.includes('[ ]') || prefix.includes('- ') ? strip(line) : line
			const p = ordered ? `${i + 1}. ` : prefix
			return p + clean
		})
		.join('\n')

	const next = value.slice(0, lineStart) + rebuilt + value.slice(lineEnd)
	return { next, selStart: lineStart, selEnd: lineStart + rebuilt.length }
}

export function runMdAction(action: MdAction, ta: HTMLTextAreaElement, apply: ApplyFn): void {
	const value = ta.value
	const start = ta.selectionStart
	const end = ta.selectionEnd
	const selected = value.slice(start, end)

	// 行内包裹
	const wrap = WRAP[action]
	if (wrap) {
		const { mark, placeholder } = wrap
		const m = mark.length
		const isWrapped = selected.length > 0 && value.slice(start - m, start) === mark && value.slice(end, end + m) === mark

		if (isWrapped) {
			const next = value.slice(0, start - m) + selected + value.slice(end + m)
			apply(next, start - m, start - m + selected.length)
			return
		}

		if (selected.length > 0) {
			const next = value.slice(0, start) + mark + selected + mark + value.slice(end)
			apply(next, start + m, start + m + selected.length)
			return
		}

		const next = value.slice(0, start) + mark + placeholder + mark + value.slice(end)
		apply(next, start + m, start + m + placeholder.length)
		return
	}

	// 行前缀
	const prefixMap: Partial<Record<MdAction, string>> = {
		h1: '# ',
		h2: '## ',
		h3: '### ',
		quote: '> ',
		ul: '- ',
		task: '- [ ] '
	}
	if (prefixMap[action]) {
		const r = applyLinePrefix(value, start, end, prefixMap[action]!)
		apply(r.next, r.selStart, r.selEnd)
		return
	}
	if (action === 'ol') {
		const r = applyLinePrefix(value, start, end, '1. ', true)
		apply(r.next, r.selStart, r.selEnd)
		return
	}

	// 链接
	if (action === 'link') {
		const text = selected || '链接文字'
		const snippet = `[${text}](url)`
		const next = value.slice(0, start) + snippet + value.slice(end)
		const urlStart = start + text.length + 3
		apply(next, urlStart, urlStart + 3)
		return
	}

	// 图片
	if (action === 'image') {
		const alt = selected || '图片描述'
		const snippet = `![${alt}](url)`
		const next = value.slice(0, start) + snippet + value.slice(end)
		const urlStart = start + alt.length + 4
		apply(next, urlStart, urlStart + 3)
		return
	}

	// 块级
	const block = BLOCKS[action]
	if (block) {
		const next = value.slice(0, start) + block + value.slice(end)
		const caret = start + block.length
		apply(next, caret, caret)
		return
	}
}
