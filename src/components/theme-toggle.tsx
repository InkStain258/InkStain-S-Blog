'use client'
import { Sun, Moon, Coffee } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="glass-2 fixed top-4 right-4 z-50 grid h-11 w-11 place-items-center rounded-xl transition-transform hover:scale-110"
      title={theme === 'dark' ? '切换到亮色模式' : theme === 'sepia' ? '切换到暗色模式' : '切换到纸色模式'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : theme === 'sepia' ? (
        <Moon className="w-5 h-5 text-stone-500" />
      ) : (
        <Coffee className="w-5 h-5 text-slate-600" />
      )}
    </button>
  )
}
