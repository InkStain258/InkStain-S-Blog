import { NextResponse } from 'next/server'
import { createMessage, countRecentByIp, clientIp, hashIp, isConfigured, listMessages } from '@/lib/guestbook'

export const dynamic = 'force-dynamic'

const MIN_INTERVAL_MS = 30 * 1000 // 两次提交最小间隔
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const MAX_PER_HOUR = 3
const MAX_PER_DAY = 8

function clean(input: unknown, max: number): string {
	if (typeof input !== 'string') return ''
	// 去掉控制字符与零宽字符，保留换行
	return input
		.replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\ufeff]/g, '')
		.trim()
		.slice(0, max)
}

export async function GET() {
	try {
		const items = await listMessages('approved', { kind: 'gb' })
		return NextResponse.json(
			{ items, configured: isConfigured() },
			{ headers: { 'Cache-Control': 'no-store' } }
		)
	} catch (e: any) {
		return NextResponse.json({ items: [], configured: isConfigured(), error: e?.message || '读取失败' }, { status: 200 })
	}
}

export async function POST(req: Request) {
	if (!isConfigured()) {
		return NextResponse.json(
			{ ok: false, error: '留言板尚未配置写入凭据（GUESTBOOK_TOKEN）' },
			{ status: 503 }
		)
	}

	let body: any
	try {
		body = await req.json()
	} catch {
		return NextResponse.json({ ok: false, error: '请求格式错误' }, { status: 400 })
	}

	// 蜜罐字段：真人看不到，机器人会填
	if (clean(body?.website, 64)) {
		return NextResponse.json({ ok: true, message: '已收到，等待审核' })
	}

	const content = clean(body?.content, 600)
	const name = clean(body?.name, 24) || '匿名'
	const contact = clean(body?.contact, 64)

	if (content.length < 2) return NextResponse.json({ ok: false, error: '留言内容太短了' }, { status: 400 })
	if (content.length > 600) return NextResponse.json({ ok: false, error: '留言最多 600 字' }, { status: 400 })
	// 简单反垃圾：满屏链接的直接拒
	if ((content.match(/https?:\/\//g) || []).length > 3) {
		return NextResponse.json({ ok: false, error: '链接太多了，请精简后再提交' }, { status: 400 })
	}

	const ip = clientIp(req.headers)
	const ipHash = hashIp(ip)

	try {
		const hour = await countRecentByIp(ipHash, HOUR_MS)
		if (hour.total >= MAX_PER_HOUR) {
			return NextResponse.json({ ok: false, error: `一小时最多 ${MAX_PER_HOUR} 条，稍后再来` }, { status: 429 })
		}
		const day = await countRecentByIp(ipHash, DAY_MS)
		if (day.total >= MAX_PER_DAY) {
			return NextResponse.json({ ok: false, error: `今天已经留了 ${MAX_PER_DAY} 条，明天再来吧` }, { status: 429 })
		}
		if (day.lastAt && Date.now() - day.lastAt < MIN_INTERVAL_MS) {
			const wait = Math.ceil((MIN_INTERVAL_MS - (Date.now() - day.lastAt)) / 1000)
			return NextResponse.json({ ok: false, error: `提交太快了，${wait} 秒后再试` }, { status: 429 })
		}

		await createMessage({ name, contact, content, ipHash, ua: req.headers.get('user-agent') || '' })
		return NextResponse.json({ ok: true, message: '留言已提交，审核通过后会出现在这里' })
	} catch (e: any) {
		return NextResponse.json({ ok: false, error: `提交失败：${e?.message || '未知错误'}` }, { status: 500 })
	}
}
