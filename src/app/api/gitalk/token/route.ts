import { NextResponse } from 'next/server'
import { GITALK_CLIENT_ID } from '@/config/gitalk'

export const dynamic = 'force-dynamic'

/**
 * 用 code 换 access_token。secret 只在服务端使用，
 * 不再随 Gitalk 的默认流程打进浏览器包。
 *
 * 线上请在 Vercel 配 GITALK_CLIENT_ID / GITALK_CLIENT_SECRET；
 * 未配置时退回历史凭据（该 secret 曾以明文出现在客户端，建议尽快在
 * GitHub OAuth App 里 Reset 后只放环境变量）。
 */
const FALLBACK_SECRET = '59c9013436b6f405749760cb85b8168201ec4f4d'

export async function POST(req: Request) {
	let code = ''
	try {
		const body = await req.json()
		code = String(body?.code || '')
	} catch {
		return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
	}
	if (!code) return NextResponse.json({ error: '缺少 code' }, { status: 400 })

	const clientId = process.env.GITALK_CLIENT_ID || GITALK_CLIENT_ID
	const clientSecret = process.env.GITALK_CLIENT_SECRET || FALLBACK_SECRET

	try {
		const res = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
			cache: 'no-store'
		})
		const data = await res.json()
		if (data?.error || !data?.access_token) {
			return NextResponse.json({ error: data?.error_description || data?.error || '换取令牌失败' }, { status: 400 })
		}
		return NextResponse.json({ access_token: data.access_token, scope: data.scope })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || '网络错误' }, { status: 500 })
	}
}
