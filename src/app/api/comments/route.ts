import { NextResponse } from 'next/server'
import { createMessage, countRecentByIp, clientIp, hashIp, isConfigured, listMessages } from '@/lib/guestbook'

export const dynamic = 'force-dynamic'

const MIN_INTERVAL_MS = 30 * 1000
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const MAX_PER_HOUR = 5
const MAX_PER_DAY = 15

function clean(input: unknown, max: number): string {
	if (typeof input !== 'string') return ''
	return input
		.replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\ufeff]/g, '')
		.trim()
		.slice(0, max)
}

const SLUG_RE = /^[a-zA-Z0-9_-]{1,64}$/

export async function GET(req: Request) {
	const slug = new URL(req.url).searchParams.get('slug') || ''
	if (!SLUG_RE.test(slug)) {
		return NextResponse.json({ items: [], configured: isConfigured() })
	}
	try {
		const items = await listMessages('approved', { kind: 'article', slug })
		return NextResponse.json({ items, configured: isConfigured() }, { headers: { 'Cache-Control': 'no-store' } })
	} catch (e: any) {
		return NextResponse.json(
			{ items: [], configured: isConfigured(), error: e?.message || '读取失败' },
			{ status: 200, headers: { 'Cache-Control': 'no-store' } }
		)
	}
}

export async function POST(req: Request) {
	if (!isConfigured()) {
		return NextResponse.json({ ok: false, error: '评论功能尚未配置写入凭据' }, { status: 503 })
	}

	let body: any
	try {
		body = await req.json()
	} catch {
		return NextResponse.json({ ok: false, error: '请求格式错误' }, { status: 400 })
	}

	const slug = clean(body?.slug, 64)
	if (!SLUG_RE.test(slug)) {
		return NextResponse.json({ ok: false, error: '缺少文章标识' }, { status: 400 })
	}

	// 蜜罐
	if (clean(body?.website, 64)) {
		return NextResponse.json({ ok: true, message: '已收到，等待审核' })
	}

	const content = clean(body?.content, 800)
	const name = clean(body?.name, 24) || '匿名'
	const contact = clean(body?.contact, 64)

	if (content.length < 2) return NextResponse.json({ ok: false, error: '内容太短了' }, { status: 400 })
	if ((content.match(/https?:\/\//g) || []).length > 3) {
		return NextResponse.json({ ok: false, error: '链接太多了，请精简后再提交' }, { status: 400 })
	}

	const ipHash = hashIp(clientIp(req.headers))

	try {
		const hour = await countRecentByIp(ipHash, HOUR_MS)
		if (hour.total >= MAX_PER_HOUR) {
			return NextResponse.json({ ok: false, error: `一小时最多 ${MAX_PER_HOUR} 条，稍后再来` }, { status: 429 })
		}
		const day = await countRecentByIp(ipHash, DAY_MS)
		if (day.total >= MAX_PER_DAY) {
			return NextResponse.json({ ok: false, error: '今天评论得有点多了，明天再来吧' }, { status: 429 })
		}
		if (day.lastAt && Date.now() - day.lastAt < MIN_INTERVAL_MS) {
			const wait = Math.ceil((MIN_INTERVAL_MS - (Date.now() - day.lastAt)) / 1000)
			return NextResponse.json({ ok: false, error: `提交太快了，${wait} 秒后再试` }, { status: 429 })
		}

		await createMessage({
			kind: 'article',
			slug,
			name,
			contact,
			content,
			ipHash,
			ua: req.headers.get('user-agent') || ''
		})
		return NextResponse.json({ ok: true, message: '评论已提交，审核通过后会显示在这里' })
	} catch (e: any) {
		return NextResponse.json({ ok: false, error: `提交失败：${e?.message || '未知错误'}` }, { status: 500 })
	}
}
