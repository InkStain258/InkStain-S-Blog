# InkStain's Blog

> 基于 [YYsuni/2025-blog-public](https://github.com/YYsuni/2025-blog-public) 二次开发

一个基于 GitHub 的无后端静态博客系统，所有内容通过 GitHub API 存储与管理。使用 GitHub App 进行权限控制，支持可视化 UI 编辑与发布。

## 博客定位

这里是 **InkStain** 的技术杂谈空间，关注但不限于以下领域：

- **AGI / AI** — 大语言模型、智能体、AI 应用开发与部署
- **ACG** — 动画、漫画、游戏文化与技术
- **文学文艺** — 古典文学数字化、数字人文、文本可视化
- **前端开发** — React、TypeScript、Web 交互与可视化

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI 库 | React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| 动画 | Motion (Framer Motion) |
| 部署 | Cloudflare Pages (via OpenNext) |
| 存储 | GitHub API (内容即仓库) |
| 代码高亮 | Shiki |
| 数学公式 | KaTeX |
| 状态管理 | Zustand |
| 数据请求 | SWR |
| Markdown 渲染 | marked |
| 图标 | Lucide React |

## 项目来源

本项目 Fork 自 [YYsuni](https://github.com/YYsuni) 的开源博客框架 [2025-blog-public](https://github.com/YYsuni/2025-blog-public)，感谢原作者的开源精神与精心设计。

原项目的核心理念是「博客网站、内容、仓库一定属于你」，通过 GitHub App + API 实现完全无后端的博客系统，让非程序员也能拥有自己的独立博客。

## 特性

- ✏️ 可视化 Markdown 编辑，支持拖拽上传图片
- 🔑 GitHub App 权限管理，Private Key 鉴权
- 🎨 可拖拽自定义首页布局，实时预览
- 🏷️ 文章分类与标签系统
- 💬 点赞系统
- 📱 响应式设计，移动端适配
- 🖼️ Live2D 头像交互
- 🎵 音乐卡片
- 📦 纯静态部署，无服务器成本

## 快速开始

```bash
pnpm install
pnpm dev
```

## License

MIT © 2025 YYsuni | © 2025 InkStain

---

*「游戏资产不一定属于你，你只有使用权，但这个博客网站、内容、仓库一定是属于你的」* — YYsuni
