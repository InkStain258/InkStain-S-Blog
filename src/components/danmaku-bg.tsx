'use client'
import { useEffect, useState } from 'react'

const DEFAULT_TEXT = [
  '✨ 欢迎来到 InkStain 的技术杂谈', '🤖 AGI 正在改变世界',
  '📚 比较文学 / 数字人文', '🎬 ACG 永远的神', '🖥️ Next.js + React 全栈',
  '📦 GitHub Actions 自动部署', '🌊 星河图站 / 星瞳图站',
  '🔥 技术驱动创意', '🎵 在代码中寻找诗歌',
  '⚡ Vercel + Cloudflare 边缘加速', '🌈 开源让世界更美好',
]

export default function DanmakuBackground() {
  const [items, setItems] = useState<{ id: number; text: string; top: number; duration: number; delay: number }[]>([])

  useEffect(() => {
    setItems(Array.from({ length: 12 }).map((_, i) => ({
      id: i, text: DEFAULT_TEXT[Math.floor(Math.random() * DEFAULT_TEXT.length)],
      top: Math.random() * 70 + 10, duration: Math.random() * 18 + 22, delay: Math.random() * 18,
    })))
  }, [])

  return (
    <div className="fixed top-24 h-[25vh] left-0 right-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes dm-left { 0% { right:-100%; transform:translateX(100%) } 100% { right:100%; transform:translateX(-100%) } }
      `}</style>
      {items.map(item => (
        <div key={item.id} className="absolute whitespace-nowrap text-white/20 font-bold text-lg tracking-wider select-none"
          style={{ top: `${item.top}%`, right: '-100%',
            animation: `dm-left ${item.duration}s linear ${item.delay}s infinite` }}>
          {item.text}
        </div>
      ))}
    </div>
  )
}
