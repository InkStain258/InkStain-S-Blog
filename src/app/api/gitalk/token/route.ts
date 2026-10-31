import { NextResponse } from 'next/server'
import { GITALK_CLIENT_ID } from '@/config/gitalk'

export const dynamic = 'force-dynamic'

/**
 * 用 code 换 access_token。secret 只在服务端使用，绝不进前端 bundle。
 *
 * 只认环境变量 GITALK_CLIENT_SECRET。历史上那个写死在源码里的密钥
 * 已随 OAuth App 轮换作废，回退分支同步删除 —— 缺变量就明确失败，
 * 不再有「悄悄用旧密钥」的隐式行为。当前配置状态可 GET 本路由自检。
 */
function resolveSecret(): { secret: string | null; source: 'env' | 'none' } {
	const env = process.env.GITALK_CLIENT_SECRET?.trim()
	if (env) return { secret: env, source: 'env' }
	return { secret: null, source: 'none' }
}

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
	const { secret, source } = resolveSecret()
	if (!secret) {
		return NextResponse.json({ error: '服务端未配置 GITALK_CLIENT_SECRET', secretSource: source }, { status: 500 })
	}

	try {
		const res = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({ client_id: clientId, client_secret: secret, code }),
			cache: 'no-store'
		})
		const data = await res.json()
		if (data?.error || !data?.access_token) {
			return NextResponse.json(
				{ error: data?.error_description || data?.error || '换取令牌失败', secretSource: source },
				{ status: 400 }
			)
		}
		return NextResponse.json({ access_token: data.access_token, scope: data.scope, secretSource: source })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || '网络错误' }, { status: 500 })
	}
}

/** 自检：只报告密钥来源，不暴露密钥本身 */
export function GET() {
	const { source } = resolveSecret()
	return NextResponse.json({ secretSource: source, ok: source === 'env' })
}

