# 项目文档

给下一位接手的人（或下一轮对话的助手）看的入口。先读这一页，再按需点进具体记录。

## 接手须知（10 条）

1. 仓库在 `E:\Github\InkStain-S-Blog`，线上主域名 `https://inkstain.top`（Vercel）。
2. 构建统一 `npx --no-install next build`；`pnpm run build` 会报 `ERR_PNPM_IGNORED_BUILDS`。
3. **推送必须用** `python C:/Users/27563/AppData/Local/hermes/cache/scratch/push.py main`，本机 `git push` 会永久挂起（GCM 弹不可见窗口）。
4. 本机 `python3` 是坏的，脚本一律 `E:/Environment/Python3.12/python.exe`。
5. `.card` 在主题里是 `position: absolute`，内容页写 `card relative w-full`。
6. 站点配置就是 `src/config/site-content.json`，`SiteContent` 类型由它推导，加字段直接改 JSON。
7. 主题色是运行时写进 `:root` 的内联变量，CSS 类要覆盖必须 `!important`。
8. 导航卡位置由「拼贴中心」驱动，会随浏览器缩放漂移；杂志式首页与它共用同一套公式（见记录第三节第 4 条）。
9. 评论有两套：Gitalk（需 GitHub 登录）+ 匿名评论（GitHub Issues 当队列，`kind=article`）。
10. 保存即见：文章与配置都推 Git，前端走 GitHub raw，不等 Vercel 重新部署。
11. **玻璃材质统一走 `glass-1 / glass-2 / glass-overlay`**（定义在 `globals.css`，参数在 `theme.css` 与 `html.sepia`）。别再加 `bg-card + border + shadow-md` 的手写组合，那套在亮色主题里等于没有边界（`--ink-border` 就是 `#fff`）。
12. **卡片圆角走变量**：`.card` 用 `border-radius: var(--card-radius, 40px)`；内容页加 `.card-content`（20px），首页拼贴卡不加。在 `@utility` 里写死的圆角/内边距压不住 className。
13. 文章页不渲染全站顶部进度条（有目录进度），列表页才有；阅读位置存 `localStorage: inkstain:reading-anchor`，快捷键 `J` / `K` 切上下篇。

## 记录索引

- [2026-10-31 迭代记录](2026-10-31-迭代记录.md) —— v3 四批改动（信息架构 / 搜索阅读 / 视觉系统 / 写作运维）+ 匿名评论 + 缩放偏移与 Gitalk 多域名登录修复；含决策、坑、待办、文件地图。
- [2026-10-31 外观与易用性迭代记录](2026-10-31-外观与易用性迭代记录.md) —— 目录进度与相关文章、玻璃材质分级（渐变描边 + 内高光 + 双层投影）、骨架屏 / 空状态 / 阅读位置记忆 / J-K 快捷键；含「`inset 0 0 20` 缺单位」等 8 个坑。

## 速查

| 事项 | 位置 |
|---|---|
| 内容体检 | `/admin/health`（数据来自构建期生成的 `/search-index.json`） |
| 评论 / 留言审核 | 页脚「审核」 |
| 搜索索引生成 | `node scripts/build-search-index.mjs`（`prebuild` 自动跑） |
| 写作页 | `/write`（草稿 800ms 防抖存 localStorage：`ink-write-draft`） |
| 阅读偏好 | `localStorage: inkstain:reading-prefs` |
| 阅读位置 | `localStorage: inkstain:reading-anchor`（按 slug 存章节 id，目录里出现「上次读到」） |
| 材质参数 | `theme.css` 的 `--glass-*`（亮/暗）+ `globals.css` 的 `html.sepia`（纸色） |
| 主题 | `localStorage: ink-theme`（light / sepia / dark） |
| 部署状态 | GitHub API `deployments?per_page=3` → `/{id}/statuses` |

## 已知待办

- Gitalk 多域名登录：代码已完成；回调地址需在 GitHub OAuth App 里登记 `https://inkstain.top/gitalk-callback`（网页才能改，REST 一律 404），登记后在已登录状态下实机验证一次。
- `bjwx10` 缺本地图片（原图丢失），待决定删引用或补图——体检页唯一一项。
- `GITALK_CLIENT_SECRET` 尚未配到 Vercel，代码里有旧值回退。
- 站内约 40 处手写 `shadow-*`（按钮、输入框这类小元素）未收敛进材质表；`glass-gloss` 悬停光泽只做了目测验证。
- 移动端抽屉下滑关闭、图片灯箱 ←/→ 与捏合缩放：方案里列了，尚未实现。
