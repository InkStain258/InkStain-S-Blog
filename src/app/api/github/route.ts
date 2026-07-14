import { NextResponse } from 'next/server'

// Client Secret is only used server-side, not exposed to browser
const GITALK_CLIENT_SECRET = process.env.GITALK_CLIENT_SECRET || '59c9013436b6f405749760cb85b8168201ec4f4d'

export async function POST(req: Request) {
  try {
    const bodyText = await req.text()
    // Inject client_secret into the request body
    const body = new URLSearchParams(bodyText)
    body.set('client_secret', GITALK_CLIENT_SECRET)

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
