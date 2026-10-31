import { NextResponse } from 'next/server'

/**
 * Gitalk 的 OAuth 令牌交换代理。
 *
 * 浏览器端拿到的是短命 code，本来要连着 client_secret 一起 POST 给 GitHub。
 * 但 client_secret 绝不能进前端 bundle（NEXT_PUBLIC_ 等于公开）。
 * 所以这里由服务端补上 secret，前端只负责送 code。
 * Vercel 需要配 GITALK_CLIENT_SECRET；没配就原样转发（前端登录会失败，但不影响浏览）。
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || 'application/json'
    const bodyText = await req.text()
    const secret = process.env.GITALK_CLIENT_SECRET

    let payload: Record<string, unknown> = {}
    try {
      payload = contentType.includes('application/x-www-form-urlencoded')
        ? Object.fromEntries(new URLSearchParams(bodyText))
        : JSON.parse(bodyText || '{}')
    } catch {
      payload = {}
    }

    if (secret) payload.client_secret = secret
    // 统一转成 JSON：GitHub 在 Accept: application/json 时两种入参都认
    delete payload.clientSecret

    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = await githubRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('GitHub OAuth proxy error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
