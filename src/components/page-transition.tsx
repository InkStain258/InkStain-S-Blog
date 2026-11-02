'use client'
import { ReactNode } from 'react'

/**
 * 页面切换的入场位移。原来是 motion 的 initial/animate，
 * 改成 CSS keyframe：合成层动画，不需要下载动画库，也不需要水合后才知道初始态。
 */
export default function PageTransition({ children }: { children: ReactNode }) {
	return <div className='ink-fade-up'>{children}</div>
}
