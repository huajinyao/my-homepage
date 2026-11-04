/**
 * Netlify Functions 适配层
 * ------------------------------------------------------------------
 * 复用 worker/src/index.js 的全部逻辑，只是把运行环境从 Cloudflare
 * 换成 Netlify Functions v2（同样是 Web 标准的 Request / Response，
 * 因此流式响应可以原样透传）。
 *
 * 对外路径：/api/chat 与 /api/health
 */

import worker from '../../worker/src/index.js';

const DEFAULTS = {
  DEEPSEEK_MODEL: 'deepseek-flash',
  DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
  TEMPERATURE: '0.6',
  MAX_TOKENS: '700',
  HISTORY_TURNS: '8',
  UPSTREAM_TIMEOUT_MS: '25000',
  RATE_LIMIT: '30',
  RATE_WINDOW_MS: '600000',
  ALLOWED_ORIGINS:
    'https://huajinyao.github.io,http://localhost:8787,http://127.0.0.1:8787,http://localhost:8888,http://127.0.0.1:8888',
};

function buildEnv() {
  const get = (k) => {
    const v =
      (typeof Netlify !== 'undefined' && Netlify.env?.get?.(k)) || process.env[k];
    return v === undefined || v === '' ? DEFAULTS[k] : v;
  };
  return {
    DEEPSEEK_API_KEY: get('DEEPSEEK_API_KEY'),
    DEEPSEEK_MODEL: get('DEEPSEEK_MODEL'),
    DEEPSEEK_BASE_URL: get('DEEPSEEK_BASE_URL'),
    TEMPERATURE: get('TEMPERATURE'),
    MAX_TOKENS: get('MAX_TOKENS'),
    HISTORY_TURNS: get('HISTORY_TURNS'),
    RATE_LIMIT: get('RATE_LIMIT'),
    RATE_WINDOW_MS: get('RATE_WINDOW_MS'),
    ALLOWED_ORIGINS: get('ALLOWED_ORIGINS'),
    NETLIFY: '1',
  };
}

export default async function handler(request, context) {
  const env = buildEnv();

  // Cloudflare 用 CF-Connecting-IP，Netlify 用 x-nf-client-connection-ip
  const headers = new Headers(request.headers);
  if (!headers.get('CF-Connecting-IP')) {
    const ip =
      headers.get('x-nf-client-connection-ip') ||
      headers.get('x-forwarded-for') ||
      'unknown';
    headers.set('CF-Connecting-IP', ip);
  }

  const req = new Request(request.url, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
  });

  try {
    return await worker.fetch(req, env, {
      waitUntil: (p) => (context?.waitUntil ? context.waitUntil(p) : Promise.resolve()),
      passThroughOnException: () => {},
    });
  } catch (err) {
    // 兜底：任何未捕获异常也返回带 CORS 的 JSON，避免浏览器把它当成"网络错误"
    const origin = request.headers.get('origin') || '';
    return new Response(
      JSON.stringify({ error: 'function_crash', message: '服务出错了，请稍后再试' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': origin || '*',
          'Vary': 'Origin',
        },
      }
    );
  }
}

export const config = {
  path: ['/api/chat', '/api/health'],
};
