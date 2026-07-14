import { NextResponse } from 'next/server'

const CANONICAL_REDIRECT_URI = 'https://ink-stain-s-blog.vercel.app/'
const CLIENT_SECRET = process.env.GITALK_CLIENT_SECRET || '59c9013436b6f405749760cb85b8168201ec4f4d'

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let code = ''
    let clientId = ''

    if (contentType.includes('application/json')) {
      const json = await req.json()
      code = json.code || ''
      clientId = json.client_id || ''
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      code = params.get('code') || ''
      clientId = params.get('client_id') || ''
    }

    if (!code || !clientId) {
      return NextResponse.json({ error: 'Missing code or client_id' }, { status: 400 })
    }

    // Always use the canonical redirect URI - ignores whatever Gitalk sends
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: CLIENT_SECRET,
      code: code,
      redirect_uri: CANONICAL_REDIRECT_URI,
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
