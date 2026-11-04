/**
 * 数字分身后端地址配置
 * ------------------------------------------------------------------
 * 部署完 Cloudflare Worker 后，把 Worker 地址填到下面（结尾不要加斜杠）：
 *
 *   window.TWIN_API_BASE = 'https://huajinyao-digital-twin.你的子域.workers.dev';
 *
 * 留空 = 走同源 /api/chat，只在本地用 `node worker/dev-server.mjs`
 * 调试时成立；直接部署到 GitHub Pages 时留空会提示「后端未接上」。
 *
 * 这个文件里只放公开地址，不要写任何 API Key。
 */
window.TWIN_API_BASE = 'https://huajinyao-digital-twin.netlify.app';
