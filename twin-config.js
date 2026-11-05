/**
 * 数字分身后端地址配置
 * ------------------------------------------------------------------
 * 可以填多个地址，前端会按顺序探测，自动选第一个能连通的；
 * 对话中途某个节点断了，也会自动切到下一个。
 *
 * 只放公开地址，不要写任何 API Key。
 */
window.TWIN_API_BASES = [
  'https://huajinyao-digital-twin.netlify.app',   // 主节点
  'https://huajinyao-twin-backup.netlify.app'     // 备用节点（同代码，不同站点）
];

// 兼容旧引用
window.TWIN_API_BASE = window.TWIN_API_BASES[0];
