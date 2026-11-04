# 数字分身 · 部署与维护手册

> 当前线上状态
> - 前端：<https://huajinyao.github.io/my-homepage/>（GitHub Pages）
> - 后端：<https://huajinyao-digital-twin.netlify.app>（Netlify Functions）
> - 模型：DeepSeek-V4.1-Flash（`deepseek-flash`）

---

## 一、架构

```
浏览器 (GitHub Pages)
   │  POST /api/chat   { messages, lang }
   ▼
Netlify Function  netlify/functions/chat.mjs
   │  ├─ 复用 worker/src/index.js 的全部逻辑
   │  ├─ 校验来源 / 限流 / 输入校验
   │  ├─ 拼装 system prompt（知识库 + 硬规则）
   ▼
DeepSeek API  deepseek-flash
   │  SSE 增量 token
   ▼
函数转成 data:{"d":"…"} → 浏览器逐字渲染
```

**Key 只存在 Netlify 的环境变量里**，前端代码、GitHub 仓库里都没有。

---

## 二、为什么不用 Cloudflare Workers

一开始部署在 Cloudflare Workers，代码和测试都通过了，但实测 `*.workers.dev`
在中国大陆网络下无法访问（DNS 被污染、TLS 握手超时），页面上的分身打不开。

于是把同一套逻辑接到了 Netlify Functions：`netlify/functions/chat.mjs`
只是把 Cloudflare 的 `fetch(request, env, ctx)` 包了一层，核心代码
`worker/src/index.js` 一行没改。`*.netlify.app` 实测可直连。

Cloudflare 那套配置仍然保留（`worker/` 目录），将来如果绑定了自己的域名，
`npx wrangler deploy` 就能切回去。

---

## 三、日常改动怎么做

| 想改什么 | 改哪里 | 怎么生效 |
| --- | --- | --- |
| 分身的人设、知识库、拒答边界 | `worker/src/knowledge.js` | 重新部署（见下） |
| 提示词 | `worker/src/knowledge.js` 的 `buildSystemPrompt` | 重新部署 |
| 限流次数、温度、模型 | `netlify/functions/chat.mjs` 顶部的 `DEFAULTS` | 重新部署 |
| 页面文案、样式 | `index.html` / `style.css` / `script.js` | push 到 GitHub 即可 |
| 换模型 | Netlify 环境变量 `DEEPSEEK_MODEL` | 重新部署 |

### 重新部署后端（一条命令）

```bash
cd /Users/huageorge/Desktop/my-homepage-v1
NETLIFY_AUTH_TOKEN=$(sed -n '2p' netlify/.netlify-token) \
HOME="$PWD/netlify/.home" \
./netlify/node_modules/.bin/netlify deploy --prod
```

> `HOME` 必须指到项目内，否则 Netlify CLI 会去写 `~/Library/Preferences`。

### 更新前端

```bash
git add -A && git commit -m "update" && git push
```

---

## 四、本地开发

```bash
cd worker
node dev-server.mjs          # http://127.0.0.1:8787
```

它会把整个项目当静态站托管，同时用 `worker/src/index.js` 处理 `/api/*`，
读取 `worker/.dev.vars` 里的 Key。

> 注意：此时前端 `twin-config.js` 指向的是线上 Netlify，本地页面会直接调线上后端。
> 想测本地逻辑，把 `twin-config.js` 里的地址临时改成空字符串（走同源 `/api`）即可。

### 跑测试

```bash
cd worker && node test/e2e.mjs                                    # 10 项自动化测试（假上游，不花钱）
node verify-live.mjs https://huajinyao-digital-twin.netlify.app   # 10 题真实测试
```

---

## 五、Key 与安全

- DeepSeek Key 存在 **Netlify 环境变量** `DEEPSEEK_API_KEY`（Site settings → Environment variables）
- 本地副本在 `worker/.dev.vars`，已被 `.gitignore` 排除
- Netlify Token 在 `netlify/.netlify-token`，同样已排除
- 换 Key：Netlify 后台改环境变量 → 重新部署

---

## 六、排障

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 页面显示「后端还没接上」 | `twin-config.js` 地址为空或写错 | 检查地址，别带结尾斜杠 |
| 返回「Key 无效」 | 环境变量没配对 | Netlify 后台检查 `DEEPSEEK_API_KEY`，重新部署 |
| 返回「问得有点快」 | 触发限流（30 次/10 分钟/IP） | 等一会儿，或调 `RATE_LIMIT` |
| 页面变成 Netlify 登录页 | 站点被设成 Private | Site settings → Access control 里关掉 SSO 保护 |
| 回答里提到旧平台 | 知识库没更新 | 改 `worker/src/knowledge.js` 后重新部署 |
