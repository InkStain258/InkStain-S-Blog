/** 写作页草稿的本地持久化 */

export const DRAFT_KEY = 'ink-write-draft'

export type DraftPayload = {
	slug: string
	title: string
	md: string
	tags: string[]
	date: string
	summary: string
	hidden?: boolean
	category?: string
	_savedAt?: number
}

export function loadDraft(): DraftPayload | null {
	try {
		const raw = localStorage.getItem(DRAFT_KEY)
		if (!raw) return null
		const data = JSON.parse(raw) as DraftPayload
		if (!data || (!data.md && !data.title)) return null
		// 超过 7 天的草稿不再恢复
		if (data._savedAt && Date.now() - data._savedAt > 7 * 24 * 3600 * 1000) {
			localStorage.removeItem(DRAFT_KEY)
			return null
		}
		return data
	} catch {
		return null
	}
}

export function clearDraft(): void {
	try {
		localStorage.removeItem(DRAFT_KEY)
	} catch {
		/* ignore */
	}
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

/** 防抖写草稿：编辑器每敲一下都会调用，这里合并成 800ms 一次 */
export function saveDraft(payload: Omit<DraftPayload, '_savedAt'>): void {
	try {
		if (saveTimer) clearTimeout(saveTimer)
		saveTimer = setTimeout(() => {
			try {
				if (!payload.md && !payload.title) return
				localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...payload, _savedAt: Date.now() }))
			} catch {
				/* ignore */
			}
		}, 800)
	} catch {
		/* ignore */
	}
}
