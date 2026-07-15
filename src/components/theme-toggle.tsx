'use client'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 p-2 rounded-xl bg-card border backdrop-blur-sm hover:scale-110 transition-transform shadow-md"
      title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  )
}
