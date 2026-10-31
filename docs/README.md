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

## 记录索引

- [2026-10-31 迭代记录](2026-10-31-迭代记录.md) —— v3 四批改动（信息架构 / 搜索阅读 / 视觉系统 / 写作运维）+ 匿名评论 + 缩放偏移与 Gitalk 多域名登录修复；含决策、坑、待办、文件地图。

## 速查

| 事项 | 位置 |
|---|---|
| 内容体检 | `/admin/health`（数据来自构建期生成的 `/search-index.json`） |
| 评论 / 留言审核 | 页脚「审核」 |
| 搜索索引生成 | `node scripts/build-search-index.mjs`（`prebuild` 自动跑） |
| 写作页 | `/write`（草稿 800ms 防抖存 localStorage：`ink-write-draft`） |
| 阅读偏好 | `localStorage: inkstain:reading-prefs` |
| 主题 | `localStorage: ink-theme`（light / sepia / dark） |
| 部署状态 | GitHub API `deployments?per_page=3` → `/{id}/statuses` |

## 已知待办

- Gitalk 多域名登录：代码已完成，等 GitHub OAuth App 登记 `https://inkstain.top/gitalk-callback` 后在已登录状态下实机验证。
- `bjwx10` 缺本地图片（原图丢失），待决定删引用或补图。
- `GITALK_CLIENT_SECRET` 尚未配到 Vercel，代码里有旧值回退。
