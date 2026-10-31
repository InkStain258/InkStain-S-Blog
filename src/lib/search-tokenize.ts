/**
 * 搜索分词：构建索引与运行时查询必须用同一套规则。
 *
 * 规则（改这里要同步 scripts/build-search-index.mjs 里的同名函数）：
 * - 统一转小写
 * - 中文按 bigram 切（「比较文学」→ 比较 / 较文 / 文学），单字段落保留单字
 * - 拉丁字母与数字按连续串切，长度 ≥2 才要
 * - 标点、符号、空白一律当分隔符
 */
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/
const ALNUM = /[a-z0-9]/

export function tokenize(raw: string): string[] {
	const text = (raw || '').toLowerCase()
	const terms: string[] = []
	let buf = ''
	let bufIsCjk = false

	const flush = () => {
		if (!buf) return
		if (bufIsCjk) {
			if (buf.length === 1) terms.push(buf)
			else for (let i = 0; i < buf.length - 1; i++) terms.push(buf.slice(i, i + 2))
		} else if (buf.length >= 2) {
			terms.push(buf)
		}
		buf = ''
	}

	for (const ch of text) {
		if (CJK.test(ch)) {
			if (buf && !bufIsCjk) flush()
			bufIsCjk = true
			buf += ch
		} else if (ALNUM.test(ch)) {
			if (buf && bufIsCjk) flush()
			bufIsCjk = false
			buf += ch
		} else {
			flush()
		}
	}
	flush()
	return [...new Set(terms)]
}
