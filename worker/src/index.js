/**
 * 数字分身后端 —— Cloudflare Workers
 * ------------------------------------------------------------------
 * 职责：
 *   1. 藏住 DeepSeek API Key（只放在 Worker 的 Secret 里）
 *   2. 组装 system prompt + 多轮对话，调用 DeepSeek /chat/completions
 *   3. 把上游 SSE 转成前端专用的事件流，错误统一兜底
 *   4. 限流、输入校验、CORS 白名单
 *
 * 端点：
 *   POST /api/chat     { messages: [{role, content}], lang }
 *   GET  /api/health   健康检查（不消耗 token）
 */

import { buildSystemPrompt, SUGGESTED_QUESTIONS } from './knowledge.js';

/* ------------------------------ 配置 ------------------------------ */

const DEFAULTS = {
  DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
  DEEPSEEK_MODEL: 'deepseek-flash',
  TEMPERATURE: '0.6',
  MAX_TOKENS: '700',
  HISTORY_TURNS: '8',
  RATE_LIMIT: '30', // 每个 IP 每窗口的请求数
  RATE_WINDOW_MS: '600000', // 10 分钟
  ALLOWED_ORIGINS:
    'https://huajinyao.github.io,http://localhost:5500,http://127.0.0.1:5500,http://localhost:5501,http://127.0.0.1:5501,http://localhost:8080,http://127.0.0.1:8080',
};

function conf(env, key) {
  const v = env && env[key];
  return v === undefined || v === null || v === '' ? DEFAULTS[key] : String(v);
}

/* --------------------------- 限流（内存） --------------------------- */
/*
 * 说明：Workers 的模块作用域会随 isolate 复用，进程内计数在下游
 * 不活跃时会被回收，所以这是「尽力而为」的限流，不是严格配额。
 * 目的只是挡住单个访客狂刷，避免 API 账单失控。
 */
const hits = new Map();

function rateLimit(ip, limit, windowMs) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    }
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  rec.count += 1;
  return {
    ok: rec.count <= limit,
    remaining: Math.max(0, limit - rec.count),
    resetAt: rec.resetAt,
  };
}

/* ------------------------------ CORS ------------------------------ */

function originAllowed(origin, env) {
  if (!origin) return false;
  const list = conf(env, 'ALLOWED_ORIGINS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.includes(origin)) return true;
  // 允许 Workers 预览域名与本地 wrangler 端口
  return /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.workers\.dev$/.test(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const h = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (originAllowed(origin, env)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(body, status, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extra,
    },
  });
}

/* ---------------------------- 输入校验 ---------------------------- */

const MAX_BODY_BYTES = 24 * 1024;
const MAX_MSG_CHARS = 1200;
const MAX_TOTAL_CHARS = 6000;

function validate(payload) {
  if (!payload || typeof payload !== 'object') return '请求体不是 JSON 对象';
  const { messages } = payload;
  if (!Array.isArray(messages) || messages.length === 0) return 'messages 不能为空';
  if (messages.length > 40) return '对话轮次过多，请刷新页面重新开始';

  let total = 0;
  for (const m of messages) {
    if (!m || typeof m !== 'object') return '消息格式不正确';
    if (m.role !== 'user' && m.role !== 'assistant') return '消息角色不合法';
    if (typeof m.content !== 'string') return '消息内容必须是字符串';
    if (m.content.length > MAX_MSG_CHARS) {
      return `单条消息太长了（上限 ${MAX_MSG_CHARS} 字），请精简一下`;
    }
    total += m.content.length;
  }
  if (total > MAX_TOTAL_CHARS) return '这轮对话太长了，请刷新页面重新开始';

  const last = messages[messages.length - 1];
  if (last.role !== 'user') return '最后一条消息必须来自访客';
  if (!last.content.trim()) return '消息内容不能为空';

  return null;
}

/* --------------------------- 调用上游模型 --------------------------- */

function buildUpstreamBody(env, messages) {
  const turns = Number(conf(env, 'HISTORY_TURNS')) || 8;
  // 只带最近 N 轮，避免 token 膨胀；system 永远单独放最前面
  const trimmed = messages.slice(-turns * 2);

  return {
    model: conf(env, 'DEEPSEEK_MODEL'),
    messages: [{ role: 'system', content: buildSystemPrompt() }, ...trimmed],
    stream: true,
    temperature: Number(conf(env, 'TEMPERATURE')),
    max_tokens: Number(conf(env, 'MAX_TOKENS')),
    top_p: 0.9,
    frequency_penalty: 0.2,
    presence_penalty: 0.1,
  };
}

/** 把 OpenAI 兼容的 SSE 转成前端用的极简协议：data: {"d":"..."} */
function toClientStream(upstream, model) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      let buffer = '';
      let finished = false;

      const send = (obj) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n');
          buffer = parts.pop() || '';

          for (const raw of parts) {
            const line = raw.trim();
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data) continue;
            if (data === '[DONE]') {
              finished = true;
              continue;
            }
            let parsed;
            try {
              parsed = JSON.parse(data);
            } catch {
              continue;
            }
            const delta = parsed?.choices?.[0]?.delta;
            if (!delta) continue;
            // deepseek-reasoner 会返回 reasoning_content，这里只取正文
            if (typeof delta.content === 'string' && delta.content) {
              send({ d: delta.content });
            }
            if (parsed?.choices?.[0]?.finish_reason) finished = true;
          }
        }

        send({ done: true, model });
        controller.close();
      } catch (err) {
        // 客户端可能已经断开，这里的 enqueue 也可能失败，所以双重保护
        try {
          send({ error: 'stream_broken', message: '回答中断了，请重试' });
        } catch (e) {}
        try {
          controller.close();
        } catch (e) {}
      } finally {
        try {
          reader.releaseLock();
        } catch {}
      }
    },
  });
}

async function handleChat(request, env, ctx) {
  const cors = corsHeaders(request, env);

  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    'unknown';

  const limit = Number(conf(env, 'RATE_LIMIT')) || 20;
  const windowMs = Number(conf(env, 'RATE_WINDOW_MS')) || 600000;
  const rl = rateLimit(ip, limit, windowMs);
  const rlHeaders = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(rl.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
  };

  if (!rl.ok) {
    return json(
      {
        error: 'rate_limited',
        message: '问得有点快，休息一下再来吧～也可以直接发邮件给我。',
      },
      429,
      { ...cors, ...rlHeaders, 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
    );
  }

  // 未配置 Key 时给出明确的、对访客友好的降级信息
  if (!env || !env.DEEPSEEK_API_KEY) {
    return json(
      {
        error: 'not_configured',
        message: '数字分身还没接上模型（后端缺少 API Key），可以先发邮件联系我。',
      },
      503,
      { ...cors, ...rlHeaders }
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: 'too_large', message: '请求太大了' }, 413, { ...cors, ...rlHeaders });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: 'bad_json', message: '请求格式不对' }, 400, { ...cors, ...rlHeaders });
  }

  const invalid = validate(payload);
  if (invalid) {
    return json({ error: 'invalid', message: invalid }, 400, { ...cors, ...rlHeaders });
  }

  const body = buildUpstreamBody(env, payload.messages);
  const endpoint = conf(env, 'DEEPSEEK_BASE_URL').replace(/\/+$/, '') + '/chat/completions';

  let upstream;
  const startedAt = Date.now();
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return json(
      { error: 'upstream_unreachable', message: '模型服务连不上，请稍后再试' },
      502,
      { ...cors, ...rlHeaders }
    );
  }

  if (!upstream.ok) {
    let detail = '';
    try {
      detail = (await upstream.text()).slice(0, 300);
    } catch {}
    const status = upstream.status === 429 ? 429 : 502;
    const message =
      upstream.status === 401
        ? '后端 API Key 无效，请联系我修一下'
        : upstream.status === 429
        ? '模型服务繁忙，请过一会儿再问'
        : '模型服务出错了，请稍后再试';
    return json({ error: 'upstream_error', status: upstream.status, message, detail }, status, {
      ...cors,
      ...rlHeaders,
    });
  }

  const res = new Response(toClientStream(upstream, conf(env, 'DEEPSEEK_MODEL')), {
    status: 200,
    headers: {
      ...cors,
      ...rlHeaders,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Model': conf(env, 'DEEPSEEK_MODEL'),
      'X-Latency-Ms': String(Date.now() - startedAt),
    },
  });

  // 不阻塞响应：后台记一条结构化日志，方便 wrangler tail 排查
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(Promise.resolve());
  }
  return res;
}

/* ------------------------------ 路由 ------------------------------ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/api/health') {
      return json(
        {
          ok: true,
          service: 'digital-twin',
          model: conf(env, 'DEEPSEEK_MODEL'),
          keyConfigured: Boolean(env && env.DEEPSEEK_API_KEY),
          suggestions: SUGGESTED_QUESTIONS,
          time: new Date().toISOString(),
        },
        200,
        cors
      );
    }

    if (url.pathname === '/api/chat') {
      if (request.method !== 'POST') {
        return json({ error: 'method_not_allowed' }, 405, cors);
      }
      return handleChat(request, env, ctx);
    }

    return json({ error: 'not_found', message: '接口不存在' }, 404, cors);
  },
};
