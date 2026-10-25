import { NextResponse } from 'next/server'
import { listMessages, setReply, setStatus } from '@/lib/guestbook'

export const dynamic = 'force-dynamic'

const ADMIN_KEY = process.env.GUESTBOOK_ADMIN_KEY || (process.env.NODE_ENV !== 'production' ? 'dev' : '')

function authed(req: Request): boolean {
	if (!ADMIN_KEY) return false
	const key = req.headers.get('x-admin-key') || ''
	return key.length > 0 && key === ADMIN_KEY
}

export async function GET(req: Request) {
	if (!authed(req)) return NextResponse.json({ ok: false, error: '口令不正确' }, { status: 401 })
	try {
		const [pending, approved] = await Promise.all([listMessages('pending'), listMessages('approved')])
		return NextResponse.json({ ok: true, pending, approved }, { headers: { 'Cache-Control': 'no-store' } })
	} catch (e: any) {
		return NextResponse.json({ ok: false, error: e?.message || '读取失败' }, { status: 500 })
	}
}

export async function POST(req: Request) {
	if (!authed(req)) return NextResponse.json({ ok: false, error: '口令不正确' }, { status: 401 })

	let body: any
	try {
		body = await req.json()
	} catch {
		return NextResponse.json({ ok: false, error: '请求格式错误' }, { status: 400 })
	}

	const id = String(body?.id || '')
	const action = body?.action
	if (!id || !['approve', 'reject', 'pending', 'reply'].includes(action)) {
		return NextResponse.json({ ok: false, error: '参数不合法' }, { status: 400 })
	}

	try {
		if (action === 'reply') {
			const reply = typeof body?.reply === 'string' ? body.reply.trim().slice(0, 500) : ''
			await setReply(id, reply)
			// 有回复就意味着要展示出去
			if (reply) await setStatus(id, 'approved')
		} else if (action === 'approve') await setStatus(id, 'approved')
		else if (action === 'pending') await setStatus(id, 'pending')
		else await setStatus(id, 'rejected')
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ ok: false, error: e?.message || '操作失败' }, { status: 500 })
	}
}
