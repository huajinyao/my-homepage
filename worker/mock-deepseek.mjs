/**
 * DeepSeek 上游 mock
 * ------------------------------------------------------------------
 * 只在本地测试时用，模拟 DeepSeek /chat/completions 的 SSE 流式返回。
 * 它会把收到的请求体写到 MOCK_LOG 指定的文件里，方便断言：
 *   - system prompt 有没有带上知识库
 *   - 多轮历史有没有被正确裁剪
 *   - 防注入规则有没有出现在提示词里
 *
 * 用法：node mock-deepseek.mjs   （默认端口 8790）
 */

import http from 'node:http';
import fs from 'node:fs';

const PORT = Number(process.env.MOCK_PORT || 8790);
const LOG = process.env.MOCK_LOG || '/tmp/mock-deepseek-requests.jsonl';

const server = http.createServer((req, res) => {
  if (req.url === '/__requests') {
    const lines = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean) : [];
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(lines.map((l) => JSON.parse(l))));
    return;
  }
  if (req.url === '/__reset') {
    if (fs.existsSync(LOG)) fs.unlinkSync(LOG);
    res.writeHead(200).end('ok');
    return;
  }

  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    let body = {};
    try {
      body = JSON.parse(raw);
    } catch {}

    fs.appendFileSync(
      LOG,
      JSON.stringify({
        at: Date.now(),
        model: body.model,
        stream: body.stream,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        messages: body.messages,
      }) + '\n'
    );

    const messages = body.messages || [];
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const q = lastUser ? lastUser.content : '';

    if (q.includes('TRIGGER_500')) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'mock upstream failure' } }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
    });

    const reply = `我是模拟的滑锦尧分身。你问的是：${q}。这条回答由本地 mock 服务生成，用来验证流式渲染是否正常。`;

    // 先来一段 reasoning_content（模拟 deepseek-reasoner），前端应忽略
    res.write(
      'data: ' +
        JSON.stringify({ choices: [{ delta: { reasoning_content: '（思考过程，不应显示）' } }] }) +
        '\n\n'
    );

    let i = 0;
    const timer = setInterval(() => {
      if (i >= reply.length) {
        clearInterval(timer);
        res.write('data: ' + JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] }) + '\n\n');
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
      const piece = reply.slice(i, i + 3);
      i += 3;
      res.write('data: ' + JSON.stringify({ choices: [{ delta: { content: piece } }] }) + '\n\n');
    }, 8);

    // 注意：用 res 的 close，而不是 req 的 close。
    // Node 16+ 里请求体读完后 req 就会触发 close，会把定时器提前清掉。
    res.on('close', () => clearInterval(timer));
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-deepseek] listening on http://127.0.0.1:${PORT}  log=${LOG}`);
});
