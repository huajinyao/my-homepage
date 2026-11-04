// ========================================
// 全局错误兜底
// ========================================
function safeRun(name, fn) {
  try {
    fn();
  } catch (err) {
    console.warn('[模块出错] ' + name + ':', err);
  }
}

// ========================================
// 双校数据
// ========================================
const SCHOOL_DATA = {
  tju: { name: '天津大学', nameEn: 'Tianjin University', url: 'https://www.tju.edu.cn' },
  polyu: { name: '香港理工大学', nameEn: 'The Hong Kong Polytechnic University', url: 'https://www.polyu.edu.hk' }
};

// ========================================
// 移动端菜单
// ========================================
safeRun('menu', function () {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const siteHeader = document.querySelector('.site-header');
  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  window.addEventListener('scroll', () => {
    if (!siteHeader) return;
    if (window.scrollY > 50) siteHeader.classList.add('scrolled');
    else siteHeader.classList.remove('scrolled');
  }, { passive: true });
});

// ========================================
// 页脚年份
// ========================================
safeRun('year', function () {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
});

// ========================================
// 打字机
// ========================================
safeRun('typing', function () {
  let typingTaskId = 0;

  function runTyping() {
    const el = document.getElementById('typingText');
    if (!el) return;

    typingTaskId++;
    const myTaskId = typingTaskId;

    el.textContent = '';
    el.classList.add('typing');

    const dict = window.__i18n ? window.__i18n.dict() : null;
    const texts = dict && dict['hero.taglines']
      ? dict['hero.taglines']
      : ['一位热情、勇敢、从容的前行者'];

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const speed = 100;
    const deleteSpeed = 50;
    const pauseTime = 1800;

    function tick() {
      if (myTaskId !== typingTaskId) return;
      const currentText = texts[textIndex];

      if (!isDeleting) {
        el.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === currentText.length) {
          isDeleting = true;
          setTimeout(tick, pauseTime);
          return;
        }
        setTimeout(tick, speed);
      } else {
        el.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          textIndex = (textIndex + 1) % texts.length;
          setTimeout(tick, 400);
          return;
        }
        setTimeout(tick, deleteSpeed);
      }
    }
    setTimeout(tick, 500);
  }

  runTyping();
  window.__runTyping = runTyping;
});

// ========================================
// 滚动动画
// ========================================
safeRun('reveal', function () {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => observer.observe(el));
});

// ========================================
// 双城时钟
// ========================================
safeRun('clocks', function () {
  const szEl = document.getElementById('szTime');
  const hkEl = document.getElementById('hkTime');
  if (!szEl || !hkEl) return;

  function update() {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    szEl.textContent = time;
    hkEl.textContent = time;
  }
  update();
  setInterval(update, 1000);
});

// ========================================
// 留言平台（localStorage）
// ========================================
safeRun('guestbook', function () {
  const form = document.getElementById('guestbookForm');
  const list = document.getElementById('guestbookList');
  const nameInput = document.getElementById('guestName');
  const messageInput = document.getElementById('guestMessage');
  if (!form || !list || !nameInput || !messageInput) return;

  const STORAGE_KEY = 'huajinyao_guestbook';

  function getMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveMessages(messages) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); }
    catch (e) { console.warn('无法保存留言：', e); }
  }

  function formatTime(timestamp) {
    const d = new Date(timestamp);
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function render() {
    const messages = getMessages();
    if (messages.length === 0) {
      const emptyText = window.__i18n && window.__i18n.dict()['guestbook.empty']
        ? window.__i18n.dict()['guestbook.empty']
        : '还没有留言，来写下第一条吧。';
      list.innerHTML = `<div class="guestbook-empty">${emptyText}</div>`;
      return;
    }
    const sorted = messages.slice().sort((a, b) => b.time - a.time).slice(0, 20);
    list.innerHTML = sorted.map(m => `
      <div class="guestbook-item">
        <div class="guest-name">${escapeHtml(m.name)}</div>
        <div class="guest-message">${escapeHtml(m.message)}</div>
        <div class="guest-time">${formatTime(m.time)}</div>
      </div>
    `).join('');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    if (!name || !message) return;
    const messages = getMessages();
    messages.push({ name, message, time: Date.now() });
    saveMessages(messages);
    form.reset();
    render();
  });

  window.__guestbookRender = render;
  render();
});

// ========================================
// 返回顶部
// ========================================
safeRun('backToTop', function () {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});

// ========================================
// 音乐系统
// ========================================
safeRun('music', function () {
  const shelf = document.getElementById('musicShelf');
  const audio = document.getElementById('bgMusic');
  const toggle = document.getElementById('musicToggle');
  const nowTitle = document.getElementById('musicNowTitle');
  if (!shelf || !audio || !toggle) return;

  const TRACKS = [
    { file: 'Five hundred miles.mp3', title: 'Five hundred miles', tag: '民谣' },
    { file: 'Fly me to the moon.mp3', title: 'Fly me to the moon', tag: '爵士' },
    { file: 'Hotel California.mp3', title: 'Hotel California', tag: '乡村' },
    { file: 'Yesterday once more.mp3', title: 'Yesterday once more', tag: '民谣' },
    { file: '一步之遥.mp3', title: '一步之遥', tag: '交响乐' },
    { file: '九月的故事.mp3', title: '九月的故事', tag: '流行' },
    { file: '克罗地亚狂想曲.mp3', title: '克罗地亚狂想曲', tag: '钢琴' },
    { file: '千与千寻.mp3', title: '千与千寻', tag: '轻音乐' },
    { file: '卡农.mp3', title: '卡农', tag: '钢琴' },
    { file: '城里的月光.mp3', title: '城里的月光', tag: '流行' },
    { file: '天空之城.mp3', title: '天空之城', tag: '轻音乐' },
    { file: '幻想即兴曲.mp3', title: '幻想即兴曲', tag: '钢琴' },
    { file: '月亮代表我的心.mp3', title: '月亮代表我的心', tag: '流行' },
    { file: '月光奏鸣曲.mp3', title: '月光奏鸣曲', tag: '钢琴' },
    { file: '柠檬树.mp3', title: '柠檬树', tag: '流行' },
    { file: '梁祝.mp3', title: '梁祝', tag: '钢琴' },
    { file: '稻香.mp3', title: '稻香', tag: '流行' },
    { file: '菊次郎的夏天.mp3', title: '菊次郎的夏天', tag: '钢琴' },
    { file: '蓝色多瑙河.mp3', title: '蓝色多瑙河', tag: '交响乐' },
    { file: '雪的梦幻.mp3', title: '雪的梦幻', tag: '轻音乐' }
  ];

  const MUSIC_DIR = 'music/';
  let currentIndex = -1;
  let isPlaying = false;
  let audioCtx = null, analyser = null, visualizerId = null;

  function initVisualizer() {
    const canvas = document.getElementById('audioVisualizer');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch (e) {
        console.warn('Web Audio API 不支持：', e);
        return;
      }
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function draw() {
      visualizerId = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      const width = rect.width, height = rect.height;
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);
      const barWidth = width / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        const x = i * barWidth;
        const y = height - barHeight;
        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(124, 58, 237, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      }
    }
    draw();
  }

  function renderCards() {
    shelf.innerHTML = TRACKS.map((track, i) => `
      <music-card data-title="${track.title}" data-tag="${track.tag}" data-index="${i}"></music-card>
    `).join('');
  }

  function updateUI() {
    const cards = shelf.querySelectorAll('.music-card');
    cards.forEach((card, i) => {
      card.classList.toggle('playing', i === currentIndex && isPlaying);
    });
    if (nowTitle) {
      if (currentIndex >= 0) {
        nowTitle.textContent = TRACKS[currentIndex].title;
      } else {
        const noneText = window.__i18n && window.__i18n.dict()['player.none']
          ? window.__i18n.dict()['player.none']
          : '未选择';
        nowTitle.textContent = noneText;
      }
    }
    toggle.textContent = isPlaying ? '❚❚' : '▶';
  }

  function playTrack(index, autoPlay = true) {
    if (index < 0 || index >= TRACKS.length) return;
    currentIndex = index;
    const track = TRACKS[index];
    audio.src = MUSIC_DIR + track.file;
    audio.load();

    if (autoPlay) {
      audio.play().then(() => {
        isPlaying = true;
        updateUI();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (!visualizerId) initVisualizer();
      }).catch(() => {
        isPlaying = false;
        updateUI();
      });
    } else {
      updateUI();
    }
  }

  shelf.addEventListener('click', (e) => {
    const card = e.target.closest('.music-card');
    if (!card) return;
    const index = parseInt(card.dataset.index, 10);
    if (index === currentIndex && isPlaying) {
      audio.pause();
      isPlaying = false;
      updateUI();
    } else {
      playTrack(index, true);
    }
  });

  toggle.addEventListener('click', () => {
    if (currentIndex < 0) { playTrack(0, true); return; }
    if (isPlaying) { audio.pause(); isPlaying = false; }
    else {
      audio.play().then(() => {
        isPlaying = true;
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (!visualizerId) initVisualizer();
      }).catch(() => { isPlaying = false; });
    }
    updateUI();
  });

  audio.addEventListener('ended', () => {
    const next = (currentIndex + 1) % TRACKS.length;
    playTrack(next, true);
  });

  window.__musicUpdateUI = updateUI;
  renderCards();
  updateUI();
});

// ========================================
// Web Component: Music Card
// ========================================
safeRun('musicCard', function () {
  class MusicCard extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('data-title');
      const tag = this.getAttribute('data-tag');
      const index = this.getAttribute('data-index');
      this.innerHTML = `
        <div class="music-cover">♪</div>
        <div class="music-title">${title}</div>
        <span class="music-tag">${tag}</span>
      `;
      this.classList.add('music-card');
      this.dataset.index = index;
    }
  }
  if (!customElements.get('music-card')) customElements.define('music-card', MusicCard);
});

// ========================================
// Canvas 粒子网络（V4：粒子数量减半，优化加载）
// ========================================
safeRun('particles', function () {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return;

  const ctx = canvas.getContext('2d');

  function getParticleCount() {
    const w = window.innerWidth;
    if (w < 480) return 20;
    if (w < 768) return 35;
    if (w < 1024) return 50;
    return 65;
  }

  function getLinkDistance() {
    const w = window.innerWidth;
    if (w < 480) return 80;
    if (w < 768) return 100;
    if (w < 1024) return 120;
    return 140;
  }

  function getFrameRate() {
    return window.innerWidth < 768 ? 30 : 60;
  }

  const dpr = window.devicePixelRatio || 1;
  let width = 0, height = 0;
  let particles = [];
  let animationId = null, lastFrameTime = 0;
  let frameInterval = 1000 / getFrameRate();

  function getParticleColor() {
    const isLight = document.body.classList.contains('light-theme');
    return isLight ? '0, 112, 243' : '0, 229, 255';
  }

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 0.6 + 0.8;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      const color = getParticleColor();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, 0.85)`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, 0.1)`;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = getParticleCount();
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    frameInterval = 1000 / getFrameRate();
    initParticles();
  }

  function drawLinks() {
    const color = getParticleColor();
    const linkDistance = getLinkDistance();
    const maxDistSq = linkDistance * linkDistance;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let nearest = [];
      for (let j = 0; j < particles.length; j++) {
        if (i === j) continue;
        const dx = p.x - particles[j].x;
        const dy = p.y - particles[j].y;
        const distSq = dx * dx + dy * dy;
        if (distSq < maxDistSq) {
          nearest.push({ index: j, distSq });
        }
      }
      nearest.sort((a, b) => a.distSq - b.distSq);
      nearest = nearest.slice(0, 3);

      nearest.forEach(n => {
        const q = particles[n.index];
        const dist = Math.sqrt(n.distSq);
        const opacity = (1 - dist / linkDistance) * 0.25;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = `rgba(${color}, ${opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
    }
  }

  function animate(currentTime) {
    animationId = requestAnimationFrame(animate);
    if (currentTime - lastFrameTime < frameInterval) return;
    lastFrameTime = currentTime;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    drawLinks();
  }

  function start() {
    resize();
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(animate);
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 200);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    } else {
      lastFrameTime = 0;
      animationId = requestAnimationFrame(animate);
    }
  });

  const themeObserver = new MutationObserver(() => {
    ctx.clearRect(0, 0, width, height);
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  start();
});

// ========================================
// 滚动进度条
// ========================================
safeRun('scrollProgress', function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }, { passive: true });
});

// ========================================
// 鼠标跟随光晕
// ========================================
safeRun('cursorGlow', function () {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;
  if (window.innerWidth < 768) return;

  let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    glow.classList.add('active');
  });
  document.addEventListener('mouseleave', () => glow.classList.remove('active'));

  function animate() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';
    requestAnimationFrame(animate);
  }
  animate();
});

// ========================================
// 卡片 3D 倾斜
// ========================================
safeRun('cardTilt', function () {
  const cards = document.querySelectorAll('.card');
  if (!cards.length) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      card.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.25)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });
});

// ========================================
// 磁性按钮
// ========================================
safeRun('magnetic', function () {
  const buttons = document.querySelectorAll('.btn, .theme-toggle, .lang-toggle');
  if (!buttons.length) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  buttons.forEach(btn => {
    btn.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
  });
});

// ========================================
// 主题切换
// ========================================
safeRun('theme', function () {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const STORAGE_KEY = 'huajinyao_theme';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light') {
    document.body.classList.add('light-theme');
    btn.textContent = '☀️';
  }
  btn.addEventListener('click', () => {
    const apply = () => {
      const isLight = document.body.classList.toggle('light-theme');
      btn.textContent = isLight ? '☀️' : '🌙';
      localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark');
    };
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
  });
});

// ========================================
// 中英文切换
// ========================================
safeRun('lang', function () {
  const btn = document.getElementById('langToggle');
  if (!btn) return;
  const STORAGE_KEY = 'huajinyao_lang';

  const I18N = {
    zh: {
      'nav.identity': '身份', 'nav.about': '关于我', 'nav.timeline': '轨迹',
      'nav.projects': '项目', 'nav.campus': '校园', 'nav.music': '音乐',
      'nav.twin': '分身', 'nav.guestbook': '留言', 'nav.contact': '联系',
      'clock.sz': '深圳', 'clock.hk': '香港',
      'hero.avatar': '滑',
      'hero.greeting': '你好，我是', 'hero.name': '滑锦尧',
      'hero.taglines': ['一位热情、勇敢、从容的前行者', '天大-港理工双校本科生', '脑机接口专业探索者'],
      'hero.sub': '智能医学工程（脑机接口）· 天大-港理工双校本科生 · 深圳/香港',
      'hero.btn1': '查看我的项目', 'hero.btn2': '留言给我',
      'identity.title': '学术身份',
      'identity.tju': '天津大学', 'identity.tjuDesc': '双校学籍 · 双校证书',
      'identity.polyu': '香港理工大学', 'identity.polyuDesc': 'QS全球百强 · 约50%课程由PolyU授课',
      'identity.desc': '天津大学香港理工大学深圳未来技术学院 · 2026级本科生',
      'about.title': '关于我',
      'about.identity.title': '身份', 'about.identity.desc': '智能医学工程（脑机接口）专业大一本科生，同时在天津大学和香港理工大学注册学籍。',
      'about.direction.title': '方向', 'about.direction.desc': '对脑机接口、人工智能与医学工程的交叉领域感兴趣，希望用技术解决真实世界的健康问题。',
      'about.memory.title': '记忆点', 'about.memory.desc': '学风建设组成员，喜欢在学习和生活中保持热情与从容。',
      'timeline.title': '成长轨迹',
      'timeline.item1.title': '入学天大-港理工深圳未来技术学院', 'timeline.item1.desc': '智能医学工程（脑机接口）专业，开始双校学习旅程。',
      'timeline.item2.title': 'Vibe Coding 课程个人主页项目', 'timeline.item2.desc': '从 V1 到 V4，用 AI 辅助开发完成深色科技风个人主页。',
      'timeline.item3.date': '进行中', 'timeline.item3.title': '数学建模课题', 'timeline.item3.desc': '《基于实际场景需求的个性化背景音乐歌单推荐模型的研究》。',
      'interests.title': '兴趣与技能',
      'interests.art.title': '艺术', 'interests.art.desc': '软笔书法、钢琴、二胡、架子鼓。',
      'interests.sport.title': '运动', 'interests.sport.desc': '喜爱跑步，享受在运动中保持节奏与耐力。',
      'interests.other.title': '其他', 'interests.other.desc': '热爱音乐与舞蹈艺术。',
      'radar.title': '技能分布',
      'projects.title': '项目与作品',
      'projects.p1.title': '数学建模课题', 'projects.p1.desc': '《基于实际场景需求的个性化背景音乐歌单推荐模型的研究》',
      'projects.p1.role': '我的角色：负责用户画像建模 + 推荐算法设计',
      'projects.p1.method': '方法：协同过滤 + 情感分析 + 场景匹配',
      'projects.p1.hard': '难点：冷启动问题、场景标签稀疏',
      'projects.p1.chip1': '数学建模', 'projects.p1.chip2': '推荐模型',
      'projects.p1.cta': '阅读论文全文 →',
      'projects.p2.title': '个人主页 V5（期末版）', 'projects.p2.desc': '深色科技风 + 双校身份 + 接入 DeepSeek 的数字分身。',
      'projects.p2.role': '我的角色：独立完成从 V1 到 V5 的全部迭代',
      'projects.p2.stack': '技术栈：HTML/CSS/原生 JS + Canvas + Web Audio API',
      'projects.p2.twin': '数字分身：DeepSeek-V4.1-Flash + Netlify Functions 后端',
      'projects.p2.deploy': '发布：GitHub Pages 静态托管 + Netlify 后端接口',
      'campus.title': '校园资源',
      'campus.tju.title': '天津大学官网', 'campus.tju.desc': '母校主页',
      'campus.tjuLib.title': '天大图书馆', 'campus.tjuLib.desc': '文献资源',
      'campus.tjuOaa.title': '天大教务处', 'campus.tjuOaa.desc': '选课 · 成绩',
      'campus.sz.title': '深圳未来技术学院', 'campus.sz.desc': '所在学院',
      'campus.polyu.title': '港理工官网', 'campus.polyu.desc': '母校主页',
      'campus.polyuLib.title': '港理工图书馆', 'campus.polyuLib.desc': 'Pao Yue-kong Library',
      'campus.learn.title': 'Learn@PolyU', 'campus.learn.desc': '课程学习平台',
      'campus.eStudent.title': 'PolyU eStudent', 'campus.eStudent.desc': '学生信息系统',
      'notes.title': '学习笔记',
      'notes.n1.title': 'Vibe Coding 入门', 'notes.n1.desc': '2026-09 · 把 AI 当搭子：四步流程、提示词模板、三个反复踩的坑',
      'notes.n2.title': '脑机接口基础', 'notes.n2.desc': '2026-09 · 信号来源、侵入与非侵入、三类范式、处理链与关键指标',
      'notes.n3.title': '从 V1 到 V4：迭代复盘', 'notes.n3.desc': '2026-10 · 每版改了什么、为什么改、哪些 AI 建议被否决',
      'notes.n4.title': '数字分身是怎么做成的', 'notes.n4.desc': '2026-11 · 知识库、提示词、流式后端与测试',
      'music.title': '我喜欢的音乐', 'music.desc': '共 20 首，点击卡片切换播放，可横向滑动浏览。',
      'player.now': '正在播放', 'player.none': '未选择',
      'twin.title': '数字分身',
      'twin.desc': '这不是提前写好的关键词问答：它接入了 DeepSeek 大模型，会基于我的个人资料现场组织回答——资料里的任何细节都可以问，没预设过的问题也能答。',
      'twin.status': '数字分身 · DeepSeek',
      'twin.reset': '新对话',
      'twin.label': '你的问题',
      'twin.send': '发送',
      'twin.stop': '停止',
      'twin.note': '回答由 DeepSeek 模型基于我的个人资料实时生成，可能有误；重要事情请直接邮件联系我。',
      'twin.intro': '你好，我是滑锦尧的数字分身。我不是背答案的关键词机器人——这些话是 DeepSeek 大模型基于我的资料现场生成的。\n可以问我：专业课到底学什么、数学建模那个课题怎么做的、平时听什么歌，或者故意为难我一下。',
      'twin.thinking': '正在组织回答…',
      'twin.stopped': '已停止生成',
      'twin.retry': '重试',
      'twin.statusError': '连接异常',
      'twin.err.rate': '问得有点快，休息一下再来～也可以直接发邮件给我。',
      'twin.err.config': '数字分身后端还没接上，先发邮件给我吧。',
      'twin.err.server': '模型服务暂时不可用，稍后再试，或者直接邮件联系我。',
      'twin.err.network': '网络好像不太稳，检查一下连接再试。',
      'twin.err.empty': '这次没生成内容，再问一次试试。',
      'twin.chips': ['你的专业具体学什么？', '数学建模那个课题你负责哪部分？', '你为什么选脑机接口？', '这个数字分身是怎么做出来的？', '平时喜欢听什么音乐？'],
      'guestbook.title': '留言给我',
      'guestbook.desc': '欢迎留下你的想法、建议或鼓励。你的留言会保存在本地浏览器中，并展示在下方。',
      'guestbook.submit': '提交留言', 'guestbook.empty': '还没有留言，来写下第一条吧。',
      'contact.title': '联系我',
      'contact.desc': '如果你对我的项目感兴趣，或者想交流学习心得，欢迎联系我。',
      'contact.email': '发送邮件',
      'footer.name': '滑锦尧', 'footer.built': 'Built with Vibe Coding.', 'footer.visits': '本站访问量：'
    },
    en: {
      'nav.identity': 'Identity', 'nav.about': 'About', 'nav.timeline': 'Timeline',
      'nav.projects': 'Projects', 'nav.campus': 'Campus', 'nav.music': 'Music',
      'nav.twin': 'Twin', 'nav.guestbook': 'Guestbook', 'nav.contact': 'Contact',
      'clock.sz': 'Shenzhen', 'clock.hk': 'Hong Kong',
      'hero.avatar': 'Hua',
      'hero.greeting': "Hi, I'm", 'hero.name': 'Hua Jinyao',
      'hero.taglines': ['A passionate, brave, and composed forerunner', 'TJU-PolyU Dual Degree Student', 'Exploring Brain-Computer Interface'],
      'hero.sub': 'Intelligent Medical Engineering (BCI) · TJU-PolyU Dual Degree · Shenzhen/HK',
      'hero.btn1': 'View Projects', 'hero.btn2': 'Leave a Message',
      'identity.title': 'Academic Identity',
      'identity.tju': 'Tianjin University', 'identity.tjuDesc': 'Dual Registration · Dual Degree',
      'identity.polyu': 'The Hong Kong Polytechnic University', 'identity.polyuDesc': 'QS Top 100 · ~50% courses taught by PolyU',
      'identity.desc': 'TJU-PolyU Shenzhen Future Technology Institute · Class of 2026',
      'about.title': 'About Me',
      'about.identity.title': 'Identity', 'about.identity.desc': 'First-year undergraduate in Intelligent Medical Engineering (BCI), registered at both Tianjin University and PolyU.',
      'about.direction.title': 'Direction', 'about.direction.desc': 'Interested in the intersection of BCI, AI and medical engineering, hoping to solve real-world health problems with technology.',
      'about.memory.title': 'Memory Point', 'about.memory.desc': 'Member of the Study Style Committee, passionate and composed in study and life.',
      'timeline.title': 'Growth Timeline',
      'timeline.item1.title': 'Enrolled at TJU-PolyU Shenzhen Future Technology Institute', 'timeline.item1.desc': 'Intelligent Medical Engineering (BCI), starting the dual-degree journey.',
      'timeline.item2.title': 'Vibe Coding Course Personal Homepage Project', 'timeline.item2.desc': 'From V1 to V4, building a dark tech-style personal homepage with AI.',
      'timeline.item3.date': 'In Progress', 'timeline.item3.title': 'Mathematical Modeling Project', 'timeline.item3.desc': '"Research on Personalized Background Music Playlist Recommendation Model Based on Real-world Needs".',
      'interests.title': 'Interests & Skills',
      'interests.art.title': 'Arts', 'interests.art.desc': 'Chinese calligraphy, piano, erhu, drums.',
      'interests.sport.title': 'Sports', 'interests.sport.desc': 'Love running, enjoying rhythm and endurance.',
      'interests.other.title': 'Others', 'interests.other.desc': 'Love music and dance.',
      'radar.title': 'Skill Distribution',
      'projects.title': 'Projects & Works',
      'projects.p1.title': 'Mathematical Modeling Project', 'projects.p1.desc': '"Research on Personalized Background Music Playlist Recommendation Model Based on Real-world Needs"',
      'projects.p1.role': 'My role: user profiling + recommendation algorithm design',
      'projects.p1.method': 'Method: collaborative filtering + sentiment analysis + scenario matching',
      'projects.p1.hard': 'Challenges: cold start, sparse scenario tags',
      'projects.p1.chip1': 'Modeling', 'projects.p1.chip2': 'Recommendation',
      'projects.p1.cta': 'Read the full paper →',
      'projects.p2.title': 'Personal Homepage V5 (final)', 'projects.p2.desc': 'Dark tech style, dual identity, and a real LLM-powered digital twin.',
      'projects.p2.role': 'My role: independently built every iteration from V1 to V5',
      'projects.p2.stack': 'Stack: HTML/CSS/vanilla JS + Canvas + Web Audio API',
      'projects.p2.twin': 'Twin: DeepSeek-V4.1-Flash + a Netlify Functions backend',
      'projects.p2.deploy': 'Deployed on GitHub Pages with a Netlify API',
      'campus.title': 'Campus Resources',
      'campus.tju.title': 'Tianjin University', 'campus.tju.desc': 'Official Website',
      'campus.tjuLib.title': 'TJU Library', 'campus.tjuLib.desc': 'Resources',
      'campus.tjuOaa.title': 'TJU Academic Affairs', 'campus.tjuOaa.desc': 'Courses · Grades',
      'campus.sz.title': 'Shenzhen Future Tech Institute', 'campus.sz.desc': 'My Institute',
      'campus.polyu.title': 'PolyU', 'campus.polyu.desc': 'Official Website',
      'campus.polyuLib.title': 'PolyU Library', 'campus.polyuLib.desc': 'Pao Yue-kong Library',
      'campus.learn.title': 'Learn@PolyU', 'campus.learn.desc': 'Learning Platform',
      'campus.eStudent.title': 'PolyU eStudent', 'campus.eStudent.desc': 'Student Information System',
      'notes.title': 'Study Notes',
      'notes.n1.title': 'Vibe Coding 101', 'notes.n1.desc': 'Sep 2026 · treating AI as a pair, not a wish box: workflow, prompt template, three traps',
      'notes.n2.title': 'Brain-Computer Interfaces 101', 'notes.n2.desc': 'Sep 2026 · signal sources, invasive vs non-invasive, paradigms, pipeline, metrics',
      'notes.n3.title': 'From V1 to V4: an iteration log', 'notes.n3.desc': 'Oct 2026 · what changed each version, and which AI suggestions I rejected',
      'notes.n4.title': 'How the digital twin was built', 'notes.n4.desc': 'Nov 2026 · knowledge base, prompt, streaming backend and tests',
      'music.title': 'My Favorite Music', 'music.desc': '20 tracks, click to play, scroll horizontally to browse.',
      'player.now': 'Now Playing', 'player.none': 'Not Selected',
      'twin.title': 'Digital Twin',
      'twin.desc': "Not a scripted FAQ: it calls a real DeepSeek model and answers from my actual profile on the fly. Ask anything in the profile — including questions I never prepared for.",
      'twin.status': 'Digital Twin · DeepSeek',
      'twin.reset': 'New chat',
      'twin.label': 'Your question',
      'twin.send': 'Send',
      'twin.stop': 'Stop',
      'twin.note': 'Answers are generated live by DeepSeek from my profile and may be wrong. For anything important, please email me directly.',
      'twin.intro': "Hi, I'm Jinyao's digital twin. I'm not a keyword bot — these words are generated live by DeepSeek from his profile.\nTry asking what he actually studies, how the math-modeling project went, what music he listens to, or try to stump me.",
      'twin.thinking': 'Thinking…',
      'twin.stopped': 'stopped',
      'twin.retry': 'Retry',
      'twin.statusError': 'Connection issue',
      'twin.err.rate': 'A bit too fast — take a breath and try again, or just email me.',
      'twin.err.config': "The twin's backend isn't connected yet. Please email me instead.",
      'twin.err.server': 'The model service is unavailable right now. Try again later or email me.',
      'twin.err.network': 'Network looks unstable. Check your connection and retry.',
      'twin.err.empty': 'Nothing came back that time. Please ask again.',
      'twin.chips': ['What exactly do you study?', 'What was your role in the math-modeling project?', 'Why brain-computer interfaces?', 'How was this digital twin built?', 'What music do you listen to?'],
      'guestbook.title': 'Leave a Message',
      'guestbook.desc': 'Feel free to leave your thoughts, suggestions, or encouragement. Messages are stored in your browser.',
      'guestbook.submit': 'Submit', 'guestbook.empty': 'No messages yet. Be the first to write one.',
      'contact.title': 'Contact Me',
      'contact.desc': "If you're interested in my projects or want to share ideas, feel free to reach out.",
      'contact.email': 'Send Email',
      'footer.name': 'Hua Jinyao', 'footer.built': 'Built with Vibe Coding.', 'footer.visits': 'Visits: '
    }
  };

  let currentLang = localStorage.getItem(STORAGE_KEY) || 'zh';

  function applyLang(lang) {
    const dict = I18N[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) el.innerHTML = dict[key];
    });

    const guestNameInput = document.getElementById('guestName');
    const guestMsgInput = document.getElementById('guestMessage');
    const twinInput = document.getElementById('twinInput');

    if (lang === 'zh') {
      if (guestNameInput) guestNameInput.placeholder = '你的名字';
      if (guestMsgInput) guestMsgInput.placeholder = '写下你的留言...';
      if (twinInput) twinInput.placeholder = '输入你的问题...';
      btn.textContent = 'EN';
      document.documentElement.lang = 'zh-CN';
    } else {
      if (guestNameInput) guestNameInput.placeholder = 'Your name';
      if (guestMsgInput) guestMsgInput.placeholder = 'Write your message...';
      if (twinInput) twinInput.placeholder = 'Type your question...';
      btn.textContent = '中';
      document.documentElement.lang = 'en';
    }

    if (window.__twinLangChanged) window.__twinLangChanged();
    if (window.__guestbookRender) window.__guestbookRender();
    if (window.__musicUpdateUI) window.__musicUpdateUI();
    if (window.__runTyping) window.__runTyping();
  }

  window.__i18n = { currentLang: () => currentLang, dict: () => I18N[currentLang] };
  applyLang(currentLang);

  btn.addEventListener('click', () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem(STORAGE_KEY, currentLang);
    applyLang(currentLang);
  });
});

// ========================================
// 数字分身 v2：真实大模型对话（DeepSeek + Cloudflare Workers）
// ========================================
safeRun('twin', function () {
  const form = document.getElementById('twinForm');
  const input = document.getElementById('twinInput');
  const messagesEl = document.getElementById('twinMessages');
  const suggestionsEl = document.getElementById('twinSuggestions');
  const sendBtn = document.getElementById('twinSend');
  const stopBtn = document.getElementById('twinStop');
  const resetBtn = document.getElementById('twinReset');
  const statusEl = document.getElementById('twinStatus');
  const dotEl = document.getElementById('twinDot');
  if (!form || !input || !messagesEl) return;

  const API_BASE = (window.TWIN_API_BASE || '').replace(/\/+$/, '');
  const STORAGE_KEY = 'huajinyao_twin_v2';
  const MAX_SEND = 16;

  // 部署到 GitHub Pages 但还没填 Worker 地址时，给出明确提示而不是静默失败
  const NEEDS_CONFIG =
    !API_BASE && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  const state = { history: [], busy: false, controller: null, model: '' };

  function t(key, fallback) {
    const d = window.__i18n && window.__i18n.dict();
    const v = d && d[key];
    return v === undefined || v === null ? fallback || '' : v;
  }

  function curLang() {
    const l = window.__i18n ? window.__i18n.currentLang() : 'zh';
    return l === 'en' ? 'en' : 'zh';
  }

  /* ------------------------- 安全渲染 ------------------------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 只支持 **加粗**、`代码` 和换行，其余一律转义，避免 XSS
  function renderRich(s) {
    return escapeHtml(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function scrollToBottom(force) {
    const gap = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight;
    if (force || gap < 140) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addBubble(role, html, extra) {
    const div = document.createElement('div');
    div.className = 'twin-bubble twin-' + (role === 'user' ? 'user' : 'bot') + (extra ? ' ' + extra : '');
    div.innerHTML = html;
    messagesEl.appendChild(div);
    scrollToBottom(true);
    return div;
  }

  function renderIntro() {
    const intro = document.createElement('div');
    intro.className = 'twin-bubble twin-bot twin-intro';
    intro.innerHTML = renderRich(t('twin.intro', '你好，我是滑锦尧的数字分身。'));
    messagesEl.appendChild(intro);
  }

  function renderChips() {
    if (!suggestionsEl) return;
    const chips = t('twin.chips', []);
    suggestionsEl.innerHTML = '';
    (Array.isArray(chips) ? chips : []).forEach(function (q) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'twin-chip';
      b.textContent = q;
      b.addEventListener('click', function () { send(q); });
      suggestionsEl.appendChild(b);
    });
  }

  function setStatus(kind, text) {
    if (dotEl) dotEl.className = 'twin-dot' + (kind ? ' is-' + kind : '');
    if (statusEl && text) statusEl.textContent = text;
  }

  function statusReady() {
    setStatus('ready', (curLang() === 'en' ? 'Digital Twin · ' : '数字分身 · ') + (state.model || 'DeepSeek'));
  }

  function setBusy(busy) {
    state.busy = busy;
    if (sendBtn) sendBtn.disabled = busy;
    if (stopBtn) stopBtn.hidden = !busy;
    input.disabled = busy;
    if (!busy) input.focus({ preventScroll: true });
  }

  /* ------------------------- 持久化 ------------------------- */
  function persist() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.history.slice(-20))); } catch (e) {}
  }

  function restore() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return false;
      arr.forEach(function (m) {
        if (m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') {
          state.history.push({ role: m.role, content: m.content });
          addBubble(m.role, renderRich(m.content));
        }
      });
    } catch (e) {}
    return state.history.length > 0;
  }

  /* ------------------------- 错误文案 ------------------------- */
  function errorMessage(err) {
    const code = err && err.code;
    if (code === 'rate_limited') return t('twin.err.rate', '问得有点快，休息一下再来。');
    if (code === 'not_configured') return t('twin.err.config', '后端还没配置好，可以先邮件联系我。');
    if (code === 'upstream_unreachable' || code === 'upstream_error' || code === 'http_5') {
      return t('twin.err.server', '模型服务暂时不可用，稍后再试。');
    }
    if (code === 'invalid' && err.message) return err.message;
    if ((err && err.name === 'TypeError') || !navigator.onLine) {
      return t('twin.err.network', '网络好像不太稳，检查一下连接再试。');
    }
    return t('twin.err.server', '模型服务暂时不可用，稍后再试。');
  }

  /* ------------------------- 流式请求 ------------------------- */
  async function stream() {
    const bubble = addBubble('bot', '<span class="twin-typing"><i></i><i></i><i></i></span>', 'is-streaming');
    let text = '';
    let finished = false;

    if (NEEDS_CONFIG) {
      bubble.classList.remove('is-streaming');
      bubble.classList.add('is-error');
      bubble.innerHTML = escapeHtml(t('twin.err.config', '后端还没配置好'));
      setStatus('error', t('twin.err.config', '未配置'));
      setBusy(false);
      return;
    }

    const controller = new AbortController();
    state.controller = controller;

    try {
      const res = await fetch(API_BASE + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: state.history.slice(-MAX_SEND),
          lang: curLang()
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        let detail = null;
        try { detail = await res.json(); } catch (e) {}
        throw {
          code: (detail && detail.error) || 'http_' + res.status,
          status: res.status,
          message: detail && detail.message
        };
      }
      if (!res.body) throw { code: 'no_body' };

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let first = true;

      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (let i = 0; i < parts.length; i++) {
          const line = parts[i].split('\n').find(function (l) { return l.indexOf('data:') === 0; });
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          let obj;
          try { obj = JSON.parse(payload); } catch (e) { continue; }

          if (obj.error) throw { code: obj.error, message: obj.message };
          if (obj.d) {
            if (first) { bubble.innerHTML = ''; first = false; }
            text += obj.d;
            bubble.innerHTML = renderRich(text);
            scrollToBottom();
          }
          if (obj.done) finished = true;
        }
      }

      bubble.classList.remove('is-streaming');

      if (!text.trim()) {
        bubble.classList.add('is-error');
        bubble.innerHTML = escapeHtml(t('twin.err.empty', '这次没生成内容，再问一次试试。'));
        setStatus('error', t('twin.statusError', '连接异常'));
      } else {
        state.history.push({ role: 'assistant', content: text });
        persist();
        statusReady();
      }
    } catch (err) {
      bubble.classList.remove('is-streaming');

      if (err && err.name === 'AbortError') {
        if (text.trim()) {
          state.history.push({ role: 'assistant', content: text });
          persist();
          bubble.insertAdjacentHTML('beforeend', '<br><span class="twin-stopped">（' + escapeHtml(t('twin.stopped', '已停止生成')) + '）</span>');
        } else {
          bubble.remove();
        }
      } else {
        bubble.classList.add('is-error');
        bubble.innerHTML = escapeHtml(errorMessage(err));

        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'twin-retry';
        retry.textContent = t('twin.retry', '重试');
        retry.addEventListener('click', function () {
          bubble.remove();
          setBusy(true);
          stream();
        });
        bubble.appendChild(retry);
        setStatus('error', t('twin.statusError', '连接异常'));
      }
    } finally {
      state.controller = null;
      if (!finished && !state.busy) {
        // 出错或中止时也要恢复输入
      }
      if (state.busy) setBusy(false);
    }
  }

  /* ------------------------- 发送 ------------------------- */
  function send(raw) {
    const q = String(raw || '').trim();
    if (!q || state.busy) return;

    addBubble('user', renderRich(q));
    state.history.push({ role: 'user', content: q });
    persist();

    input.value = '';
    setBusy(true);
    setStatus('busy', t('twin.thinking', '正在组织回答…'));
    stream();
  }

  /* ------------------------- 事件绑定 ------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    send(input.value);
  });

  if (stopBtn) {
    stopBtn.addEventListener('click', function () {
      if (state.controller) state.controller.abort();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (state.controller) state.controller.abort();
      state.history = [];
      try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
      messagesEl.innerHTML = '';
      renderIntro();
      renderChips();
      statusReady();
      input.value = '';
      input.focus();
      setBusy(false);
    });
  }

  window.__twinLangChanged = function () {
    renderChips();
    if (!state.busy) statusReady();
  };

  /* ------------------------- 初始化 ------------------------- */
  renderChips();
  if (!restore()) renderIntro();
  statusReady();
  setBusy(false);

  // 探活：显示真实模型名，顺便让老师一眼看到后端已经接上
  fetch(API_BASE + '/api/health')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (j && j.ok) {
        state.model = j.model || 'DeepSeek';
        statusReady();
      } else {
        setStatus('error', t('twin.err.config', '后端未连接'));
      }
    })
    .catch(function () {
      if (NEEDS_CONFIG) setStatus('error', t('twin.err.config', '后端未连接'));
      else setStatus('error', t('twin.statusError', '连接异常'));
    });
});

// ========================================
// 时间线可展开
// ========================================
safeRun('timeline', function () {
  document.querySelectorAll('.timeline-content').forEach(item => {
    item.addEventListener('click', () => item.classList.toggle('expanded'));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.classList.toggle('expanded');
      }
    });
  });
});

// ========================================
// 技能条入场
// ========================================
safeRun('skillBars', function () {
  const bars = document.querySelectorAll('.skill-bar');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const level = bar.dataset.level;
        const fill = document.createElement('div');
        fill.className = 'skill-fill';
        bar.appendChild(fill);
        setTimeout(() => { fill.style.width = level + '%'; }, 100);
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => observer.observe(bar));
});

// ========================================
// 技能雷达图
// ========================================
safeRun('radar', function () {
  const canvas = document.getElementById('skillRadar');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 400;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  function getColor() {
    const isLight = document.body.classList.contains('light-theme');
    return isLight ? '26, 157, 255' : '0, 229, 255';
  }

  function getTextColor() {
    const v = getComputedStyle(document.body).getPropertyValue('--text-color').trim();
    return v || '#f0f0f0';
  }

  function draw() {
    const color = getColor();
    ctx.clearRect(0, 0, size, size);

    const skills = [
      { label: '编程', value: 0.75 }, { label: '数学', value: 0.7 },
      { label: '音乐', value: 0.8 }, { label: '书法', value: 0.85 },
      { label: '跑步', value: 0.7 }, { label: '英语', value: 0.65 }
    ];
    const cx = size / 2, cy = size / 2;
    const radius = size * 0.35;
    const N = skills.length;

    function point(i, r) {
      const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    }

    for (let level = 1; level <= 5; level++) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const [x, y] = point(i % N, (radius * level) / 5);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${color}, ${0.1 + level * 0.03})`;
      ctx.stroke();
    }
    for (let i = 0; i < N; i++) {
      const [x, y] = point(i, radius);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(${color}, 0.15)`; ctx.stroke();
    }

    ctx.beginPath();
    skills.forEach((s, i) => {
      const [x, y] = point(i, radius * s.value);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = `rgba(${color}, 0.2)`; ctx.fill();
    ctx.strokeStyle = `rgb(${color})`; ctx.lineWidth = 2; ctx.stroke();

    ctx.font = '12px Space Grotesk, sans-serif';
    ctx.fillStyle = getTextColor();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    skills.forEach((s, i) => {
      const [x, y] = point(i, radius + 25);
      ctx.fillText(s.label, x, y);
    });
  }

  draw();

  const themeObserver = new MutationObserver(draw);
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
});

// ========================================
// 页面加载完成
// ========================================
safeRun('loaded', function () {
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });
});