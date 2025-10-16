# 跳绳教学工作台（Codex MVP）

本项目基于 React + Vite + TypeScript + Tailwind 构建，围绕教练日常教学的「排课 → 上课面板 → 测评 → 档案 → 报告 → 财务」闭环提供一体化前端演示。所有数据保存在浏览器 IndexedDB 中，可离线运行并支持后续无缝接入后端。

## ✨ 功能概览

- **班级管理**：创建班级、绑定学员、引用训练模板。
- **上课面板**：出勤记录、速度成绩、花样挑战、教练点评、亮点卡与课消同步。
- **学员档案**：速度曲线、勇士进阶积分、雷达图、课时钱包、课时记录、PDF 报告。
- **训练模板库**：周期化 Block 编辑器，可复用到班级。
- **测评与段位**：录入季度体测、段位考核并自动更新段位。
- **财务仪表盘**：购课包、扣课钱包、收入趋势、续费提醒。
- **报告导出**：一键导出学员成长报告（html2canvas + jsPDF）。

## 🗂️ 目录结构

```
src/
  components/      // 通用组件：上课面板、图表、PDF 导出等
  pages/           // 路由页面（classes / students / templates / assessments / finance / reports）
  seed/            // 种子数据与初始化逻辑
  store/           // Dexie 数据库与仓库层实现
  utils/           // 归一化算法、导入导出工具
```

## 🚀 本地运行

> 由于自动化环境无法访问 npm registry，此仓库只包含源代码与配置。若要本地运行，请在可联网环境中执行以下步骤：

```bash
npm install
npm run dev
```

默认开发端口：`5173`。

## 📦 生产构建与部署

项目已经将 Vite 的 `base` 配置为相对路径，构建出的资源可以直接部署在域名根目录或任意子目录而无需额外改写路径。

```bash
npm run build   # 生成 dist/ 目录
npm run preview # 本地验证生产包是否正常工作
```

部署时请将 `dist/` 整个目录上传到静态资源服务器或对象存储，访问 `index.html` 即可。如果站点已经上线却仍看到空白页面，请确认发布的版本为最新构建产物，并清理浏览器缓存后重新访问。

## 🌐 在 GitHub 发布与使用

1. **推送源码到 GitHub**
   - 在本地克隆后执行 `git init`（如有需要）并关联远程仓库：`git remote add origin <your-repo-url>`。
   - 提交并推送：`git add . && git commit -m "chore: initial import" && git push -u origin main`。
2. **启用 GitHub Pages（可选，便于直接访问演示站点）**
   - 在仓库的 *Settings → Pages* 中，将 *Source* 设为 `GitHub Actions` 或 `Deploy from a branch`。
   - 如果使用 Actions，添加官方模板 `Static HTML` 或 `Deploy to GitHub Pages` Workflow；若使用分支部署，先执行 `npm run build`，再将 `dist/` 目录推送到 `gh-pages` 分支。
3. **安装依赖并运行**
   - 在任意拉取了仓库的环境执行 `npm install` 安装依赖。
   - `npm run dev` 可进入开发调试模式；`npm run build && npm run preview` 可验证生产构建。

> 项目使用 IndexedDB 持久化数据，推送到 GitHub 后即可在任意浏览器中访问并独立使用，互不影响；若需多端同步，可在后续接入云端仓库实现。

## 🧪 种子数据

首次打开应用时会自动写入 `src/seed/seed.json` 中的演示数据：

- 勇士进阶班（含两名学员）
- 段位动作 / 勇士路径节点
- 训练模板、体能测评项与示例成绩
- 购课包与流水

## 🔧 技术栈

- **构建**：Vite + TypeScript
- **UI**：React 18、TailwindCSS、lucide-react 图标
- **状态与存储**：Zustand + Dexie(IndexedDB)
- **图表**：Recharts（折线图、雷达图）
- **导出**：html2canvas + jsPDF
- **数据导入导出**：PapaParse（CSV）

## 📌 后续扩展建议

- 接入后端（Supabase / REST）实现多端同步
- 引入权限体系（Owner / Coach / Parent）
- 丰富模板推荐算法、体测基准
- 增加自动化测试与部署流程

欢迎在此基础上继续扩展业务逻辑或接入真实数据源。
