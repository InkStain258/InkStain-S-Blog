import { NextResponse } from 'next/server'
import { clientIp, hashIp, lastNameByIp } from '@/lib/guestbook'

export const dynamic = 'force-dynamic'

/** 同一 IP 上次用的昵称，用于表单预填（只返回昵称，不返回任何地址信息） */
export async function GET(req: Request) {
	try {
		const name = await lastNameByIp(hashIp(clientIp(req.headers)))
		return NextResponse.json({ ok: true, name }, { headers: { 'Cache-Control': 'no-store' } })
	} catch {
		return NextResponse.json({ ok: true, name: '' }, { headers: { 'Cache-Control': 'no-store' } })
	}
}
