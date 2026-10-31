#!/usr/bin/env node
/**
 * 生成多尺寸 AVIF/WebP 变体 + manifest。
 *
 * 为什么不用 next/image：Vercel 的图片优化按量计费，而这里明确要求零费用。
 * 所以改成构建前（本地/离线）用 ffmpeg 预生成，产物进仓库，运行时只是静态文件。
 *
 * 用法：node scripts/build-images.mjs [--force]
 * 产物：public/_img/<相对路径去掉扩展名>/<宽>.{webp,avif} + public/_img/manifest.json
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PUBLIC = path.join(ROOT, 'public')
const OUT = path.join(PUBLIC, '_img')
const MANIFEST = path.join(OUT, 'manifest.json')
// 同时给客户端组件用一份：public/ 不进 bundle，src/generated 才会被打进去
const CLIENT_MANIFEST = path.join(ROOT, 'src', 'generated', 'image-manifest.json')
const FORCE = process.argv.includes('--force')

const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg'
const FFPROBE = process.env.FFPROBE_BIN || 'ffprobe'

// 只处理「大图」：封面与正文图。图标、头像这类小图走原图更省事。
const TARGETS = [
	{ dir: 'blogs', minBytes: 24 * 1024 },
	{ dir: 'images/pictures', minBytes: 24 * 1024 }
]

// 卡片/正文实际显示宽度：手机 ~390 CSS px（@2x≈780），桌面卡片 ~720 CSS px。
// 再大的尺寸直接用原图，避免把仓库撑大、也避免「变体比原图还大」。
const WIDTHS = [480, 960]
const EXT_OK = new Set(['.webp', '.jpg', '.jpeg', '.png'])

function probe(file) {
	const out = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], {
		encoding: 'utf8'
	}).trim()
	const [w, h] = out.split(',').map(Number)
	return { w, h }
}

function encode(src, dest, width, format) {
	const args = ['-v', 'error', '-y', '-i', src, '-vf', `scale=${width}:-2`]
	if (format === 'webp') args.push('-c:v', 'libwebp', '-quality', '76', '-compression_level', '6')
	else args.push('-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '32', '-cpu-used', '6', '-b:v', '0', '-f', 'avif')
	args.push(dest)
	execFileSync(FFMPEG, args, { stdio: 'pipe' })
	return fs.statSync(dest).size
}

function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name)
		if (entry.isDirectory()) walk(p, out)
		else out.push(p)
	}
	return out
}

const manifest = {}
let made = 0
let bytes = 0

for (const target of TARGETS) {
	const base = path.join(PUBLIC, target.dir)
	for (const file of walk(base)) {
		const ext = path.extname(file).toLowerCase()
		if (!EXT_OK.has(ext)) continue
		const size = fs.statSync(file).size
		if (size < target.minBytes) continue

		const rel = path.relative(PUBLIC, file).split(path.sep).join('/')
		const key = '/' + rel
		const outDir = path.join(OUT, rel.replace(/\.[^.]+$/, ''))
		fs.mkdirSync(outDir, { recursive: true })

		let dim
		try {
			dim = probe(file)
		} catch {
			console.warn('跳过（无法读取尺寸）:', rel)
			continue
		}

		const widths = [...new Set(WIDTHS.filter(w => w < dim.w))].sort((a, b) => a - b)
		if (!widths.length) continue
		const variants = []
		for (const w of widths) {
			const webp = path.join(outDir, `${w}.webp`)
			const avif = path.join(outDir, `${w}.avif`)
			if (FORCE || !fs.existsSync(webp)) {
				encode(file, webp, w, 'webp')
				made++
			}
			if (FORCE || !fs.existsSync(avif)) {
				encode(file, avif, w, 'avif')
				made++
			}
			bytes += fs.statSync(webp).size + fs.statSync(avif).size
			variants.push({ w, webp: `/_img/${rel.replace(/\.[^.]+$/, '')}/${w}.webp`, avif: `/_img/${rel.replace(/\.[^.]+$/, '')}/${w}.avif` })
		}

		manifest[key] = { w: dim.w, h: dim.h, sizes: variants }
		console.log(`${rel}  ${dim.w}x${dim.h} → ${variants.map(v => v.w).join('/')}`)
	}
}

fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, '\t'))
fs.mkdirSync(path.dirname(CLIENT_MANIFEST), { recursive: true })
fs.writeFileSync(CLIENT_MANIFEST, JSON.stringify(manifest, null, '\t'))
console.log(`\n共 ${Object.keys(manifest).length} 张图、新编码 ${made} 个文件、产物体积 ${(bytes / 1048576).toFixed(1)}MB`)
console.log('manifest →', path.relative(ROOT, MANIFEST))
