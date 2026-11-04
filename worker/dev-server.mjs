/**
 * 本地开发服务器（不依赖 wrangler / workerd）
 * ------------------------------------------------------------------
 * 作用：用 Node 直接跑 Worker 的 fetch 处理函数，顺便把项目根目录
 * 当静态站点一起托管，这样前端和 /api 同源，方便本地联调和截图。
 *
 * 用法：
 *   node dev-server.mjs                 # 默认 8787，读 .dev.vars
 *   PORT=8787 node dev-server.mjs
 *   DEEPSEEK_BASE_URL=http://127.0.0.1:8790 node dev-server.mjs   # 指向 mock
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import worker from './src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8787);

/** 解析 .dev.vars（KEY=VALUE，忽略注释和空行） */
function loadDevVars() {
  const file = path.join(__dirname, '.dev.vars');
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...loadDevVars(), ...process.env };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.join(ROOT, rel);

  // 防目录穿越
  if (!full.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(full).pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (!url.pathname.startsWith('/api/')) {
    return serveStatic(req, res, url.pathname);
  }

  try {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(',') : String(v));
    }
    headers.set('CF-Connecting-IP', req.socket.remoteAddress || '127.0.0.1');

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody ? await readBody(req) : undefined;

    const request = new Request(url, { method: req.method, headers, body });

    const response = await worker.fetch(request, env, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    });

    res.writeHead(
      response.status,
      Object.fromEntries([...response.headers].map(([k, v]) => [k, v]))
    );

    if (response.body) {
      const reader = response.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
        // 流式响应必须及时 flush，否则浏览器拿不到增量
        if (typeof res.flush === 'function') res.flush();
      }
    }
    res.end();
  } catch (err) {
    console.error('[dev-server] 未捕获错误:', err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Error');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const hasKey = Boolean(env.DEEPSEEK_API_KEY && !env.DEEPSEEK_API_KEY.includes('在这里'));
  console.log(`\n  数字分身本地服务已启动`);
  console.log(`  站点   http://127.0.0.1:${PORT}/`);
  console.log(`  健康   http://127.0.0.1:${PORT}/api/health`);
  console.log(`  模型   ${env.DEEPSEEK_MODEL || 'deepseek-flash'}`);
  console.log(`  Key    ${hasKey ? '已配置 ✅' : '未配置 ❌（对话会返回 503）'}`);
  console.log(`  上游   ${env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'}\n`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
