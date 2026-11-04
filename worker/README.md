# 数字分身后端（Cloudflare Workers + DeepSeek）

浏览器 → 我的 Worker → DeepSeek。API Key 只存在 Worker 的 Secret 里，前端拿不到。

```
worker/
├── src/index.js        Worker 入口：路由、限流、CORS、SSE 转换
├── src/knowledge.js    知识库 + 系统提示词（改这里就能改分身的人设）
├── wrangler.toml       部署配置
├── .dev.vars.example   本地密钥模板
├── dev-server.mjs      本地跑 Worker 的 Node 适配器（顺便托管静态站点）
├── mock-deepseek.mjs   假的上游模型，测试用
└── test/e2e.mjs        10 条端到端测试
```

---

## 一、拿 DeepSeek API Key

1. 打开 <https://platform.deepseek.com/>
2. 注册 / 登录 → 左侧「API keys」→ 创建
3. 复制 `sk-` 开头的 Key（只显示一次）
4. 账户里充一点点钱即可（`deepseek-chat` 很便宜，课程演示几块钱够用很久）

> 如果国内访问 `platform.deepseek.com` 有困难，报告里需要注明所用的网络环境。

## 二、本地跑起来

```bash
cd worker
cp .dev.vars.example .dev.vars    # 然后把你的 Key 填进去
npm install                        # 安装 wrangler（只在部署时用）
npm run dev                        # 启动本地服务
```

打开 <http://127.0.0.1:8787/>，页面和 `/api/chat` 同源，直接就能聊。

健康检查：<http://127.0.0.1:8787/api/health>

### 不花钱的联调方式

```bash
# 终端 1：假模型
npm run mock

# 终端 2：把上游指到假模型
DEEPSEEK_API_KEY=sk-test DEEPSEEK_BASE_URL=http://127.0.0.1:8790 npm run dev
```

### 跑测试

```bash
npm test        # 会自动起 mock + 三个 Worker 实例，跑完自己退出
```

## 三、部署到 Cloudflare Workers

```bash
cd worker
npx wrangler login                 # 浏览器授权一次
npx wrangler secret put DEEPSEEK_API_KEY   # 粘贴 Key，回车
npx wrangler deploy
```

部署成功后会打印一个地址，形如：

```
https://huajinyao-digital-twin.<你的子域>.workers.dev
```

验证：

```bash
curl https://huajinyao-digital-twin.<你的子域>.workers.dev/api/health
# {"ok":true,"model":"deepseek-chat","keyConfigured":true,...}
```

## 四、把地址告诉前端

打开根目录的 `twin-config.js`，填进去（结尾不要带斜杠）：

```js
window.TWIN_API_BASE = 'https://huajinyao-digital-twin.<你的子域>.workers.dev';
```

然后提交并推送：

```bash
cd ..
git add -A
git commit -m "Final: real LLM-powered digital twin"
git push
```

GitHub Pages 会自动重新发布，一两分钟后主页上的分身就能真的回答了。

## 五、常用维护

| 想做的事 | 怎么做 |
| --- | --- |
| 改分身的人设 / 知识库 | 改 `src/knowledge.js`，再 `npx wrangler deploy` |
| 换模型 | 改 `wrangler.toml` 里的 `DEEPSEEK_MODEL`（如 `deepseek-reasoner`） |
| 收紧限流 | 改 `wrangler.toml` 的 `RATE_LIMIT`（默认 20 次 / 10 分钟 / IP） |
| 看实时日志 | `npx wrangler tail` |
| 换 Key | 再执行一次 `npx wrangler secret put DEEPSEEK_API_KEY` |

## 六、注意事项

- **不要把 `.dev.vars` 提交到 Git。** 它已经在 `.gitignore` 里了。
- Workers 免费额度是每天 10 万次请求，个人主页完全够用；真正的成本在 DeepSeek 的 token 费。
- 限流计数存在 Worker 内存里，isolate 回收后会重置，属于「尽力而为」。
- `ALLOWED_ORIGINS` 里只放自己的域名，否则别人可以白嫖你的额度。
