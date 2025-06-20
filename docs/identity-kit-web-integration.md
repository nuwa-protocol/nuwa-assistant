# 在 Nuwa Assistant 中集成 **@nuwa-ai/identity-kit-web**

> Status: Draft · 2025-06-20

本文档说明如何将去中心化身份 SDK **identity-kit-web** 集成到 Nuwa Assistant（下称 *Assistant*）的登录、签名与验证流程中。其结构、示例代码和迁移指引大体参考了 _packages/login-demo_ 中的 `identity-kit-web-integration.md`。

---

## 1  安装依赖

SDK 已发布到 npm（版本 `0.1.0-beta.10`），直接通过包管理器安装即可。

```bash
pnpm add @nuwa-ai/identity-kit@^0.1.0-beta.10 \
        @nuwa-ai/identity-kit-web@^0.1.0-beta.10
```

或在 `nuwa-assistant/package.json` 中声明：

```jsonc
{
  "dependencies": {
    "@nuwa-ai/identity-kit": "^0.1.0-beta.10",
    "@nuwa-ai/identity-kit-web": "^0.1.0-beta.10"
  }
}
```

然后执行 `pnpm install`（或 `npm/yarn install`）即可。

---

## 2  全局 SDK 初始化（推荐做法）

在 *Assistant* 中任何组件都可能需要访问当前 DID 或执行签名操作，因此建议在 **根布局** 或 **全局 Provider** 中初始化 SDK，并通过 React Context 传递。

```tsx
// lib/identity-kit/useIdentityKit.ts
import {
  useNuwaIdentityKit,
  UseIdentityKitOptions,
} from '@nuwa-ai/identity-kit-web/react';

export const useIdentityKit = (options: UseIdentityKitOptions = {}) =>
  useNuwaIdentityKit({
    appName: 'Nuwa Assistant',
    cadopDomain:
      typeof window !== 'undefined'
        ? localStorage.getItem('cadop-domain') ?? 'https://test-id.nuwa.dev'
        : 'https://test-id.nuwa.dev',
    storage: 'indexeddb',
    autoConnect: false, 
    ...options,
  });
```

在 `app/layout.tsx` 中包裹 Provider：

```tsx
// app/layout.tsx（片段）
import { IdentityKitProvider } from '@/lib/identity-kit/provider';
...
<body>
  <IdentityKitProvider>
    {children}
  </IdentityKitProvider>
</body>
```

`IdentityKitProvider` 只是调用 `useIdentityKit` 并把返回值写入 React Context，供整个应用消费。

### Hook 暴露能力

```ts
const {
  state,        // { isConnected, isConnecting, agentDid, keyId, error }
  connect,      // 触发 Deep-Link，新增密钥并登陆
  sign,         // 对 NIP-1 Payload 进行签名
  verify,       // 对签名结果做客户端校验
  logout,       // 删除本地密钥并断开会话
  sdk,          // NuwaIdentityKitWeb 实例（必要时可直接调用底层方法）
} = useIdentityKit();
```

---

## 3  组件改造及路由调整

| 现有文件 | 处理方式 | 说明 |
|-----------|----------|------|
| `components/DIDLoginForm.tsx` | **删除** | 使用新的 `ConnectButton` 替代；不再手动输入 DID |
| `lib/stores/did-store.ts` | **保留 / 精简** | 由 SDK 写入 DID 后调用 `setDid()`；`validateDidFormat` 等逻辑可移除 |
| `hooks/use-auth-guard.ts` | **修改** | 判断条件改为 `identityKit.state.isConnected` |
| `app/(auth)/login/page.tsx` | **改写** | 展示一个 `ConnectButton` 而非输入框 |
| `app/(auth)/callback/page.tsx` | **新增** | 处理 `/callback` 深链重定向（见下节） |

### 示例：ConnectButton 组件

```tsx
import { useIdentityKit } from '@/lib/identity-kit/useIdentityKit';
import { Button } from '@/components/ui/button';

export function ConnectButton() {
  const { state, connect } = useIdentityKit();

  if (state.isConnected) return null;

  return (
    <Button onClick={connect} disabled={state.isConnecting}>
      {state.isConnecting ? 'Connecting…' : 'Sign-in with DID'}
    </Button>
  );
}
```

### 新增 Callback 页面

```tsx
// app/(auth)/callback/page.tsx
'use client';
import { useEffect } from 'react';
import { NuwaIdentityKitWeb } from '@nuwa-ai/identity-kit-web';

export default function Callback() {
  useEffect(() => {
    (async () => {
      const sdk = await NuwaIdentityKitWeb.init();
      await sdk.handleCallback(location.search);
      window.close();
    })();
  }, []);
  return <p className="p-4">Processing …</p>;
}
```

---

## 4  签名与验证 Helper 更新

示例：调用 AI Gateway 时需要 HTTP `Authorization` 头：

```ts
import { DIDAuth } from '@nuwa-ai/identity-kit';
import { useIdentityKit } from '@/lib/identity-kit/useIdentityKit';

const { sign } = useIdentityKit();
...
const sigObj = await sign({
  domain: 'chat.nuwa.dev',
  aud: 'https://api.nuwa.dev',
  statement: 'POST /v1/chat',
  resources: ['urn:chat:messages'],
});
const authHeader = DIDAuth.v1.toAuthorizationHeader(sigObj);
fetch('/v1/chat', { headers: { Authorization: authHeader } });
```
