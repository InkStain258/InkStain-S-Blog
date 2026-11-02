#!/usr/bin/env node
/**
 * 清理 Vercel 历史部署，回收 Deployment Storage。
 *
 * 用法（先 dry-run 看要删什么，再真正删）：
 *   VERCEL_TOKEN=xxx node scripts/prune-vercel-deployments.mjs --keep 5
 *   VERCEL_TOKEN=xxx node scripts/prune-vercel-deployments.mjs --keep 5 --apply
 *
 * 参数：
 *   --keep N    保留最近 N 个部署（默认 5），外加当前生产别名指向的那个
 *   --apply     真正执行删除；不加只打印
 *   --days N    只删超过 N 天的（可选，双重保险）
 *
 * 说明：
 *   - 删掉的只是历史 deployment 的构建快照，生产域名不会断（它指向仍然保留的那个）
 *   - 副作用：旧 preview URL 失效、回滚可选的版本变少
 */

// 取 token：环境变量优先，其次项目根的 .env / .env.local（都在 .gitignore 里）
import fs from 'node:fs'
import path from 'node:path'

const readDotEnv = () => {
	for (const f of ['.env.local', '.env']) {
		const full = path.join(process.cwd(), f)
		if (!fs.existsSync(full)) continue
		const m = fs.readFileSync(full, 'utf8').match(/^VERCEL_TOKEN\s*=\s*['"]?([^'"\n]+)/m)
		if (m) return m[1].trim()
	}
	return undefined
}

const TOKEN = process.env.VERCEL_TOKEN || readDotEnv()
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_iQ9lIG7HOgcYrLNUUBxbtNQUtN4o'
const TEAM_ID = process.env.VERCEL_ORG_ID || 'team_b5IA7ZGeZt5MsKNo8JlPgVpK'

if (!TOKEN) {
	console.error('缺少 VERCEL_TOKEN。到 https://vercel.com/account/tokens 建一个，然后：VERCEL_TOKEN=xxx node scripts/prune-vercel-deployments.mjs')
	process.exit(1)
}

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
	const i = args.indexOf(`--${name}`)
	return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const KEEP = Number(getArg('keep', '5'))
const DAYS = Number(getArg('days', '0'))
const APPLY = args.includes('--apply')

const api = async (path, init = {}) => {
	const res = await fetch(`https://api.vercel.com${path}`, {
		...init,
		headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) }
	})
	const body = await res.json().catch(() => ({}))
	if (!res.ok) throw new Error(`${res.status} ${path}: ${body.error?.message || JSON.stringify(body).slice(0, 200)}`)
	return body
}

const main = async () => {
	// 1) 分页拉全部部署
	const all = []
	let until = null
	for (let page = 0; page < 50; page++) {
		const qs = new URLSearchParams({ projectId: PROJECT_ID, teamId: TEAM_ID, limit: '100' })
		if (until) qs.set('until', String(until))
		const data = await api(`/v6/deployments?${qs}`)
		const batch = data.deployments || []
		all.push(...batch)
		if (batch.length < 100) break
		until = batch[batch.length - 1].createdAt
	}

	all.sort((a, b) => b.createdAt - a.createdAt)
	// v6 API 的部署标识是 uid（v9 删除接口认 id/uid 都行，但列表里没有 id 字段）
	const idOf = d => d.uid || d.id
	const projects = await api(`/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`).catch(() => null)
	const prodId = projects?.targets?.production?.id

	const protectedIds = new Set(all.slice(0, KEEP).map(idOf))
	if (prodId) protectedIds.add(prodId)

	const now = Date.now()
	const candidates = all.filter(d => {
		if (protectedIds.has(idOf(d))) return false
		if (d.readyState === 'BUILDING' || d.readyState === 'QUEUED' || d.readyState === 'INITIALIZING') return false
		if (DAYS > 0 && now - d.createdAt < DAYS * 86400_000) return false
		return true
	})

	console.log(`部署总数 ${all.length}，保留 ${protectedIds.size} 个（最近 ${KEEP} + 生产别名），待删 ${candidates.length} 个`)
	console.log(`时间范围：${new Date(candidates.at(-1)?.createdAt ?? now).toISOString().slice(0, 10)} → ${new Date(candidates[0]?.createdAt ?? now).toISOString().slice(0, 10)}`)

	if (!APPLY) {
		console.log('\n--- 前 10 个待删（dry-run，加 --apply 才真删）---')
		for (const d of candidates.slice(0, 10)) {
			console.log(`  ${new Date(d.createdAt).toISOString().slice(0, 16).replace('T', ' ')}  ${d.url}  ${d.readyState}`)
		}
		return
	}

	let ok = 0
	let fail = 0
	for (const [i, d] of candidates.entries()) {
		try {
			await api(`/v13/deployments/${idOf(d)}?teamId=${TEAM_ID}`, { method: 'DELETE' })
			ok++
			if ((i + 1) % 20 === 0) console.log(`  已删 ${ok} 个…`)
		} catch (e) {
			fail++
			console.warn(`  删除失败 ${d.url}: ${e.message}`)
		}
		await new Promise(r => setTimeout(r, 120))
	}
	console.log(`\n完成：删除 ${ok} 个，失败 ${fail} 个`)
}

main().catch(e => {
	console.error('出错：', e.message)
	process.exit(1)
})
