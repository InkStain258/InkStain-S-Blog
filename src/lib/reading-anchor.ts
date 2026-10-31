'use client'

/**
 * 阅读位置记忆：按 slug 记住「上次读到哪一节」。
 * 只存 id + 文本 + 进度比例，不存滚动像素（版心宽度、字号都会让人改动，像素没有意义）。
 * 写入做了节流，滚动时不会每帧写 localStorage。
 */
const KEY = 'inkstain:reading-anchor'
const MAX_ENTRIES = 80
const WRITE_INTERVAL = 1200

export type ReadingAnchor = {
	/** 标题在正文里的 id */
	id: string
	/** 标题文本，用来在目录里显示「上次读到 · xxx」 */
	text: string
	/** 0–1，读到全文的比例 */
	ratio: number
	at: number
}

type Store = Record<string, ReadingAnchor>

let lastWrite = 0

function readStore(): Store {
	if (typeof window === 'undefined') return {}
	try {
		const raw = window.localStorage.getItem(KEY)
		const parsed = raw ? JSON.parse(raw) : null
		return parsed && typeof parsed === 'object' ? (parsed as Store) : {}
	} catch {
		return {}
	}
}

export function loadAnchor(slug: string): ReadingAnchor | null {
	if (!slug) return null
	const a = readStore()[slug]
	return a && typeof a.id === 'string' && a.id ? a : null
}

export function saveAnchor(slug: string, anchor: Omit<ReadingAnchor, 'at'>): void {
	if (typeof window === 'undefined' || !slug || !anchor.id) return
	const now = Date.now()
	if (now - lastWrite < WRITE_INTERVAL) return
	lastWrite = now
	try {
		const store = readStore()
		store[slug] = { ...anchor, at: now }
		const keys = Object.keys(store)
		if (keys.length > MAX_ENTRIES) {
			keys
				.sort((a, b) => (store[a]?.at || 0) - (store[b]?.at || 0))
				.slice(0, keys.length - MAX_ENTRIES)
				.forEach(k => delete store[k])
		}
		window.localStorage.setItem(KEY, JSON.stringify(store))
	} catch {
		// 隐私模式 / 配额满：记不住就算了，不影响阅读
	}
}

export function clearAnchor(slug: string): void {
	if (typeof window === 'undefined' || !slug) return
	try {
		const store = readStore()
		delete store[slug]
		window.localStorage.setItem(KEY, JSON.stringify(store))
	} catch {
		/* ignore */
	}
}
