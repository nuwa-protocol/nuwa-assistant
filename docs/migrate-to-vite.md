# 从 Next.js 迁移到 Vite（纯客户端渲染版）

> 适用范围：`nuwa-assistant` 项目 **不再需要 SSR / RSC**，转为纯 CSR（Client-Side Rendering）。

---

## 1 总体路线

1. **移除 SSR 依赖**：不再使用 React Server Components、Server Actions 与 App Router 的服务器功能。
2. **脚手架切换**：采用 `vite + react`。
3. **路由重构**：使用 `react-router-dom` 取代 Next.js 文件路由。
4. **API 处理**：
   - 若仍部署在 Vercel，可保留现有 `api/` Serverless Functions；
   - 或者单独启动一个小型 Node/Express 服务并在前端通过 Fetch 调用。

## 2 依赖与构建

```bash
# 安装 Vite 及插件
pnpm add -D vite @vitejs/plugin-react vite-plugin-tailwindcss
# 移除 Next.js 及相关
pnpm remove next eslint-config-next
```

在 `package.json` 中更新脚本：

```jsonc
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "pnpm biome lint",
  "test": "pnpm exec playwright test"
}
```

新建 `vite.config.ts`：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src', // 对应 tsconfig 路径别名
    },
  },
  server: {
    port: 3000,
  },
});
```

## 3 目录与路由

```text
nuwa-assistant/
  ├─ src/
  │   ├─ pages/
  │   │   ├─ Login.tsx
  │   │   ├─ Chat.tsx
  │   │   └─ Callback.tsx
  │   ├─ router.tsx         # React Router 配置
  │   └─ main.tsx           # 应用入口
  └─ public/
      └─ …
```

### 3.1 入口 (`main.tsx`)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { IdentityKitProvider } from '@/lib/identity-kit/provider';
import AppRouter from './router';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IdentityKitProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </IdentityKitProvider>
  </React.StrictMode>,
);
```

### 3.2 路由 (`router.tsx`)

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/Login';
import ChatPage from '@/pages/Chat';
import CallbackPage from '@/pages/Callback';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/chat" element={<ChatPage />} />
      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}
```

### 3.3 替换 API

| Next.js 导入                     | Vite/React Router 替换 |
|---------------------------------|-------------------------|
| `next/navigation`               | `useNavigate` / `useLocation` |
| `next/link`                     | `<Link>`                |
| `next/image`                    | `<img>` 或其它图片组件    |
| `next/script`                   | `<script>` + `useEffect`|

## 4 Next.js 特性替换一览

| Next.js 特性                | 在 Vite 中的做法 |
|----------------------------|-------------|
| `Head` / `Metadata`        | React Helmet 或 `index.html` |
| App Router 动态路由段 `(group)` | 在 React Router 中手动配置路径 |
| `use client` / `use server` | 可以删除，无副作用 |
| `next-themes`              | 直接在 CSR 顶层 Provider 保持使用 |

## 5 样式 / Tailwind

1. 将 `app/globals.css` → `src/index.css`。
2. `tailwind.config.ts` 基本保持不变。
3. 若使用 `vite-plugin-tailwindcss` 自动处理 PostCSS 链，则无额外步骤。

## 6 Identity Kit SDK

- 该 SDK 仅浏览器运行。删除 `next/dynamic` 包装，直接：
  ```ts
  import { useNuwaIdentityKit } from '@nuwa-ai/identity-kit-web';
  ```
- `CallbackPage` 在 React Router 中保持同一路径；逻辑复用。

## 7 Playwright & CI

- `playwright.yml` 中的 `webServer` 命令改为 `pnpm dev`。
- 移除对 `next lint` / `next build` 的步骤。
- 如需同时启动后端 API，可用 `concurrently`：
  ```bash
  pnpm add -D concurrently
  concurrently "pnpm dev" "node server.js"
  ```

## 8 渐进迁移策略

1. **双仓模式**：在同一 repo 中新增 `vite-app/` 目录，边迁移边验证。
2. **组件抽取**：先把 `components/*` 做成纯 UI，不含 Next 专有依赖。
3. **功能对照测试**：完成登录、聊天主流程后，再逐步迁移次要页面。
4. **删除 Next.js 代码**：确认全部页面都已迁移并通过测试后进行。

---

### 备注

- 预估工作量：**2–4 人日**（仅限纯 CSR 功能，假设 API 层保持不变）。
- 如需后端渲染请参考 SSR 方案或选择 `vite-plugin-ssr`。 