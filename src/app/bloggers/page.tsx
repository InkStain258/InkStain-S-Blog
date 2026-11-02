import { redirect } from 'next/navigation'

// 「关注的博主」已经换成 GitHub star 项目，旧地址保留跳转，避免外链 404
export default function Page() {
	redirect('/starred')
}
