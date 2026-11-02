/**
 * 实验室清单。
 *
 * 首页磁贴和 /lab 页面共用这一份，避免两处各写一遍然后慢慢跑偏。
 * 图标用字符串键，让渲染端自己映射到具体的 icon 组件（这样这里不依赖 React）。
 */
export type LabTool = {
	href: string
	title: string
	desc: string
	tag: string
	icon: 'clock' | 'image' | 'images' | 'music' | 'shapes' | 'code' | 'sparkles' | 'gamepad'
}

export const LAB_TOOLS: LabTool[] = [
	{
		href: '/clock',
		title: '计时器',
		desc: '秒表与倒计时，随手开一个就能用，不记状态。',
		tag: '效率',
		icon: 'clock'
	},
	{
		href: '/image-toolbox',
		title: '图片工具箱',
		desc: 'PNG / JPG 转 WebP，纯浏览器内处理，图片不上传服务器。',
		tag: '图像',
		icon: 'image'
	},
	{
		href: '/pictures',
		title: '相册',
		desc: '按主题分组的图片墙，支持编辑与增删。',
		tag: '图像',
		icon: 'images'
	},
	{
		href: '/music',
		title: '背景音乐',
		desc: '站点播放器，收录自己常听的曲子。',
		tag: '声音',
		icon: 'music'
	},
	{
		href: '/svgs',
		title: 'SVG 素材库',
		desc: '自己画的与收集的矢量图标，可预览、可下载。',
		tag: '素材',
		icon: 'shapes'
	},
	{
		href: '/snippets',
		title: '代码片段',
		desc: '常用命令与短代码的备忘录，支持在线编辑。',
		tag: '效率',
		icon: 'code'
	},
	{
		href: '/live2d',
		title: 'Live2D 看板娘',
		desc: '模型查看器，试试拖动与换装。',
		tag: '玩具',
		icon: 'sparkles'
	},
	{
		href: '/wuthering-waves',
		title: '鸣潮抽卡分析',
		desc: '导入抽卡记录，看保底进度与出货曲线。',
		tag: '游戏',
		icon: 'gamepad'
	}
]