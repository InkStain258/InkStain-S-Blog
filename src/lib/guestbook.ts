import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 留言板存储层
 *
 * 线上：GitHub Issues 当队列（公开仓库匿名可读，写入需要一个带 Issues 权限的 PAT）
 *       - label `guestbook` + `pending` / `approved`
 *       - 提交内容存在 issue body 的 HTML 注释里，正文另外保留一份方便在 GitHub 上直接看
 * 本地：.data/guestbook.json（无 token 时自动降级，方便开发与自测）
 */

export type GuestStatus = 'pending' | 'approved'

export type GuestMessage = {
	id: string
	/** gb = 留言板，article = 文章评论 */
	kind?: 'gb' | 'article'
	/** 文章评论所属文章 slug */
	slug?: string
	name: string
	contact?: string
	content: string
	createdAt: string
	status: GuestStatus
	/** 站长的回复，回复后与留言一起展示 */
	reply?: { content: string; at: string }
}

export type SubmitInput = {
	kind?: 'gb' | 'article'
	slug?: string
	name: string
	contact?: string
	content: string
	ipHash: string
	ua?: string
}

/** 文件驱动额外记录的字段，绝不返回给前端 */
type LocalRecord = GuestMessage & { _ip?: string }

const REPO = process.env.GUESTBOOK_REPO || 'InkStain258/InkStain-S-Blog'
const TOKEN = process.env.GUESTBOOK_TOKEN || ''
const LOCAL_FILE = path.join(process.cwd(), '.data', 'guestbook.json')

const LABEL_ALL = 'guestbook'
const LABEL_PENDING = 'pending'
const LABEL_APPROVED = 'approved'

const META_RE = /<!--gb:([\s\S]*?)-->/

/** 线上是否已配置写入凭据 */
export function isConfigured(): boolean {
	if (TOKEN) return true
	// 本地/自建环境允许文件驱动
	return process.env.NODE_ENV !== 'production'
}

function useLocalDriver(): boolean {
	return !TOKEN && process.env.NODE_ENV !== 'production'
}

function ghHeaders(withAuth = true): Record<string, string> {
	const h: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': 'inkstain-guestbook'
	}
	if (withAuth && TOKEN) h.Authorization = `Bearer ${TOKEN}`
	return h
}

function encodeBody(input: SubmitInput): string {
	const meta = {
		kind: input.kind || 'gb',
		slug: input.slug || '',
		name: input.name,
		contact: input.contact || '',
		at: new Date().toISOString(),
		ip: input.ipHash,
		ua: (input.ua || '').slice(0, 160)
	}
	return `<!--gb:${JSON.stringify(meta)}-->\n\n${input.content}\n`
}

function decodeIssue(issue: any): GuestMessage | null {
	const body: string = issue?.body || ''
	const m = body.match(META_RE)
	let meta: any = {}
	if (m) {
		try {
			meta = JSON.parse(m[1])
		} catch {
			meta = {}
		}
	}
	const content = body.replace(META_RE, '').trim()
	if (!content) return null

	const labels: string[] = (issue.labels || []).map((l: any) => (typeof l === 'string' ? l : l.name))
	return {
		id: String(issue.number),
		kind: meta.kind === 'article' ? 'article' : 'gb',
		slug: meta.slug || undefined,
		name: meta.name || '匿名',
		contact: meta.contact || undefined,
		content,
		createdAt: meta.at || issue.created_at,
		status: labels.includes(LABEL_APPROVED) ? 'approved' : 'pending',
		reply: meta.reply?.content ? { content: String(meta.reply.content), at: String(meta.reply.at || '') } : undefined
	}
}

function decodeIp(issue: any): { ipHash: string; at: string } {
	const body: string = issue?.body || ''
	const m = body.match(META_RE)
	if (!m) return { ipHash: '', at: issue?.created_at || '' }
	try {
		const meta = JSON.parse(m[1])
		return { ipHash: meta.ip || '', at: meta.at || issue?.created_at || '' }
	} catch {
		return { ipHash: '', at: issue?.created_at || '' }
	}
}

/* ------------------------------ GitHub 驱动 ------------------------------ */

async function ghList(status: GuestStatus | 'all'): Promise<any[]> {
	const labels =
		status === 'approved'
			? `${LABEL_ALL},${LABEL_APPROVED}`
			: status === 'pending'
				? `${LABEL_ALL},${LABEL_PENDING}`
				: `${LABEL_ALL}`
	const qs = new URLSearchParams({ state: 'all', labels, per_page: '100', sort: 'created', direction: 'desc' })
	const res = await fetch(`https://api.github.com/repos/${REPO}/issues?${qs}`, {
		headers: ghHeaders(),
		cache: 'no-store'
	})
	if (!res.ok) throw new Error(`GitHub ${res.status}`)
	const data = await res.json()
	return Array.isArray(data) ? data : []
}

export type ListFilter = { kind?: 'gb' | 'article'; slug?: string }

export async function listMessages(status: GuestStatus | 'all' = 'approved', filter: ListFilter = {}): Promise<GuestMessage[]> {
	const match = (m: GuestMessage) => {
		if (filter.kind && (m.kind || 'gb') !== filter.kind) return false
		if (filter.slug && m.slug !== filter.slug) return false
		return true
	}
	if (useLocalDriver()) {
		return readLocal()
			.map(({ _ip, ...m }) => m)
			.filter(m => status === 'all' || m.status === status)
			.filter(match)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
	}
	const issues = await ghList(status)
	return (issues.map(decodeIssue).filter(Boolean) as GuestMessage[]).filter(match)
}

export async function createMessage(input: SubmitInput): Promise<GuestMessage> {
	if (useLocalDriver()) {
		const all = readLocal()
		const msg: LocalRecord = {
			id: crypto.randomUUID(),
			kind: input.kind || 'gb',
			slug: input.slug,
			name: input.name,
			contact: input.contact,
			content: input.content,
			createdAt: new Date().toISOString(),
			status: 'pending',
			_ip: input.ipHash
		}
		all.push(msg)
		writeLocal(all)
		const { _ip, ...rest } = msg
		return rest
	}

	const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
		method: 'POST',
		headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
		body: JSON.stringify({
			title:
				input.kind === 'article'
					? `[评论] ${input.slug} · ${input.name} · ${new Date().toISOString().slice(0, 10)}`
					: `[留言] ${input.name} · ${new Date().toISOString().slice(0, 10)}`,
			body: encodeBody(input),
			labels: [LABEL_ALL, LABEL_PENDING]
		})
	})
	if (!res.ok) {
		const text = await res.text()
		throw new Error(`GitHub ${res.status}: ${text.slice(0, 200)}`)
	}
	const issue = await res.json()
	return decodeIssue(issue) as GuestMessage
}

/** 统计某 IP 在时间窗内的提交次数（含未审核），用于限流 */
export async function countRecentByIp(ipHash: string, sinceMs: number): Promise<{ total: number; lastAt: number }> {
	const since = Date.now() - sinceMs

	if (useLocalDriver()) {
		const all = readLocal()
		let total = 0
		let lastAt = 0
		for (const m of all) {
			if (m._ip !== ipHash) continue
			const t = Date.parse(m.createdAt)
			if (Number.isNaN(t) || t < since) continue
			total++
			if (t > lastAt) lastAt = t
		}
		return { total, lastAt }
	}

	const issues = await ghList('all')
	let total = 0
	let lastAt = 0
	for (const issue of issues) {
		const { ipHash: ip, at } = decodeIp(issue)
		if (ip !== ipHash) continue
		const t = Date.parse(at)
		if (Number.isNaN(t) || t < since) continue
		total++
		if (t > lastAt) lastAt = t
	}
	return { total, lastAt }
}

export async function setStatus(id: string, status: GuestStatus | 'rejected'): Promise<void> {
	if (useLocalDriver()) {
		const all = readLocal()
		const idx = all.findIndex(m => m.id === id)
		if (idx < 0) throw new Error('留言不存在')
		if (status === 'rejected') all.splice(idx, 1)
		else all[idx].status = status
		writeLocal(all)
		return
	}

	const labels = status === 'rejected' ? [LABEL_ALL] : [LABEL_ALL, status]
	const res = await fetch(`https://api.github.com/repos/${REPO}/issues/${id}`, {
		method: 'PATCH',
		headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
		body: JSON.stringify(status === 'rejected' ? { state: 'closed', labels } : { labels })
	})
	if (!res.ok) throw new Error(`GitHub ${res.status}`)
}

/* ------------------------------- 文件驱动 -------------------------------- */

function readLocal(): LocalRecord[] {
	try {
		const raw = fs.readFileSync(LOCAL_FILE, 'utf-8')
		const data = JSON.parse(raw)
		return Array.isArray(data) ? data : []
	} catch {
		return []
	}
}

function writeLocal(list: LocalRecord[]) {
	fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true })
	fs.writeFileSync(LOCAL_FILE, JSON.stringify(list, null, 2), 'utf-8')
}

/* --------------------------------- 工具 ---------------------------------- */

const SALT = process.env.GUESTBOOK_SALT || 'inkstain-guestbook'

export function hashIp(ip: string): string {
	return crypto.createHash('sha256').update(`${SALT}:${ip}`).digest('hex').slice(0, 24)
}

export function clientIp(headers: Headers): string {
	const fwd = headers.get('x-forwarded-for') || ''
	const first = fwd.split(',')[0]?.trim()
	return first || headers.get('x-real-ip') || 'unknown'
}

/** 写入/修改站长回复（空字符串表示删除回复） */
export async function setReply(id: string, content: string): Promise<void> {
	const text = content.trim().slice(0, 500)
	if (useLocalDriver()) {
		const all = readLocal()
		const idx = all.findIndex(m => m.id === id)
		if (idx < 0) throw new Error('留言不存在')
		if (text) all[idx].reply = { content: text, at: new Date().toISOString() }
		else delete all[idx].reply
		writeLocal(all)
		return
	}

	const url = `https://api.github.com/repos/${REPO}/issues/${id}`
	const res = await fetch(url, { headers: ghHeaders(), cache: 'no-store' })
	if (!res.ok) throw new Error(`GitHub ${res.status}`)
	const issue = await res.json()
	const body: string = issue?.body || ''
	const m = body.match(META_RE)
	let meta: any = {}
	if (m) {
		try {
			meta = JSON.parse(m[1])
		} catch {
			meta = {}
		}
	}
	if (text) meta.reply = { content: text, at: new Date().toISOString() }
	else delete meta.reply

	const plain = body.replace(META_RE, '').trim()
	const patch = await fetch(url, {
		method: 'PATCH',
		headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
		body: JSON.stringify({ body: `<!--gb:${JSON.stringify(meta)}-->

${plain}
` })
	})
	if (!patch.ok) throw new Error(`GitHub ${patch.status}`)
}
