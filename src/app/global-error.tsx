'use client'

/**
 * 根布局都挂了才会走到这里：此时站点 CSS 未必加载成功，
 * 所以样式全部内联，不依赖 class 与 CSS 变量。
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html lang='zh-CN'>
			<body
				style={{
					margin: 0,
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: '#0e1526',
					color: '#e8ecf4',
					fontFamily: 'system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif'
				}}>
				<div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 480 }}>
					<div style={{ fontSize: 30, marginBottom: 12 }}>🌧️</div>
					<h1 style={{ fontSize: 17, margin: '0 0 10px', fontWeight: 600 }}>站点没能启动</h1>
					<p style={{ fontSize: 12.5, lineHeight: 1.7, opacity: 0.72, margin: 0 }}>
						最外层出了严重错误。刷新通常能恢复；反复出现就把下面这串编号发我。
					</p>
					{error?.digest ? (
						<p style={{ fontSize: 11, opacity: 0.5, marginTop: 8, fontFamily: 'ui-monospace, monospace' }}>{error.digest}</p>
					) : null}
					<button
						type='button'
						onClick={reset}
						style={{
							marginTop: 22,
							border: 0,
							borderRadius: 999,
							padding: '9px 22px',
							fontSize: 12.5,
							cursor: 'pointer',
							background: 'linear-gradient(135deg,#fb7299,#4ea1ff)',
							color: '#fff'
						}}>
						重试
					</button>
				</div>
			</body>
		</html>
	)
}
