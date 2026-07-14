import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let code = ''
    let clientId = ''
    let redirectUri = ''

    if (contentType.includes('application/json')) {
      const json = await req.json()
      code = json.code || ''
      clientId = json.client_id || ''
      redirectUri = json.redirect_uri || ''
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      code = params.get('code') || ''
      clientId = params.get('client_id') || ''
      redirectUri = params.get('redirect_uri') || ''
    }

    if (!code || !clientId) {
      return NextResponse.json({ error: 'Missing code or client_id' }, { status: 400 })
    }

    // Clean redirect_uri: strip query params, ensure it's the canonical domain
    if (redirectUri) {
      try {
        const u = new URL(redirectUri)
        redirectUri = u.origin + u.pathname
      } catch {}
    }
    if (!redirectUri) {
      redirectUri = 'https://ink-stain-s-blog.vercel.app/'
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: '59c9013436b6f405749760cb85b8168201ec4f4d',
      code: code,
      redirect_uri: redirectUri,
    })

    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    })

    const data = await githubRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('GitHub OAuth proxy error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
