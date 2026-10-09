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
// Canvas 粒子网络
// ========================================
safeRun('particles', function () {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return;

  const ctx = canvas.getContext('2d');

  function getParticleCount() {
    const w = window.innerWidth;
    if (w < 480) return 40;
    if (w < 768) return 70;
    if (w < 1024) return 100;
    return 130;
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
      'nav.twin': '对话', 'nav.guestbook': '留言', 'nav.contact': '联系',
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
      'timeline.item2.title': 'Vibe Coding 课程个人主页项目', 'timeline.item2.desc': '从 V1 到 V3，用 AI 辅助开发完成深色科技风个人主页。',
      'timeline.item3.date': '进行中', 'timeline.item3.title': '数学建模课题', 'timeline.item3.desc': '《基于实际场景需求的个性化背景音乐歌单推荐模型的研究》。',
      'interests.title': '兴趣与技能',
      'interests.art.title': '艺术', 'interests.art.desc': '软笔书法、钢琴、二胡、架子鼓。',
      'interests.sport.title': '运动', 'interests.sport.desc': '喜爱跑步，享受在运动中保持节奏与耐力。',
      'interests.other.title': '其他', 'interests.other.desc': '热爱音乐与舞蹈艺术。',
      'radar.title': '技能分布',
      'projects.title': '项目与作品',
      'projects.p1.title': '数学建模课题', 'projects.p1.desc': '《基于实际场景需求的个性化背景音乐歌单推荐模型的研究》',
      'projects.p1.chip1': '数学建模', 'projects.p1.chip2': '推荐模型',
      'projects.p2.title': '个人主页 V3', 'projects.p2.desc': '深色科技风 + 双校身份 + Digital Twin。',
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
      'music.title': '我喜欢的音乐', 'music.desc': '共 20 首，点击卡片切换播放，可横向滑动浏览。',
      'player.now': '正在播放', 'player.none': '未选择',
      'twin.title': '和我聊聊',
      'twin.desc': '这是基于我的个人知识库的对话入口，你可以问我关于我的专业、项目、兴趣等问题。',
      'twin.intro': '你好，我是滑锦尧的数字分身。你可以问我：<br>· 你的专业是什么？<br>· 你在做什么项目？<br>· 你的兴趣爱好有哪些？<br>· 怎么联系你？',
      'twin.chip1': '你的专业是什么？', 'twin.chip2': '你在做什么项目？',
      'twin.chip3': '你的兴趣爱好？', 'twin.chip4': '怎么联系你？',
      'twin.send': '发送',
      'guestbook.title': '留言给我',
      'guestbook.desc': '欢迎留下你的想法、建议或鼓励。你的留言会保存在本地浏览器中，并展示在下方。',
      'guestbook.submit': '提交留言', 'guestbook.empty': '还没有留言，来写下第一条吧。',
      'contact.title': '联系我',
      'contact.desc': '如果你对我的项目感兴趣，或者想交流学习心得，欢迎联系我。',
      'contact.email': '发送邮件',
      'footer.name': '滑锦尧', 'footer.built': 'Built with Vibe Coding.', 'footer.visits': '本站访问量：',
      'feedback.title': '留言反馈',
      'feedback.hint': '反馈不会公开，只有我能看到。请告诉我你在哪里遇到了问题。',
      'feedback.name': '昵称（可选）',
      'feedback.relation': '与我的关系',
      'feedback.device': '反馈针对的设备',
      'feedback.message': '反馈内容',
      'feedback.submit': '提交反馈'
    },
    en: {
      'nav.identity': 'Identity', 'nav.about': 'About', 'nav.timeline': 'Timeline',
      'nav.projects': 'Projects', 'nav.campus': 'Campus', 'nav.music': 'Music',
      'nav.twin': 'Chat', 'nav.guestbook': 'Guestbook', 'nav.contact': 'Contact',
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
      'timeline.item2.title': 'Vibe Coding Course Personal Homepage Project', 'timeline.item2.desc': 'From V1 to V3, building a dark tech-style personal homepage with AI.',
      'timeline.item3.date': 'In Progress', 'timeline.item3.title': 'Mathematical Modeling Project', 'timeline.item3.desc': '"Research on Personalized Background Music Playlist Recommendation Model Based on Real-world Needs".',
      'interests.title': 'Interests & Skills',
      'interests.art.title': 'Arts', 'interests.art.desc': 'Chinese calligraphy, piano, erhu, drums.',
      'interests.sport.title': 'Sports', 'interests.sport.desc': 'Love running, enjoying rhythm and endurance.',
      'interests.other.title': 'Others', 'interests.other.desc': 'Love music and dance.',
      'radar.title': 'Skill Distribution',
      'projects.title': 'Projects & Works',
      'projects.p1.title': 'Mathematical Modeling Project', 'projects.p1.desc': '"Research on Personalized Background Music Playlist Recommendation Model Based on Real-world Needs"',
      'projects.p1.chip1': 'Modeling', 'projects.p1.chip2': 'Recommendation',
      'projects.p2.title': 'Personal Homepage V3', 'projects.p2.desc': 'Dark tech style + dual identity + Digital Twin.',
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
      'music.title': 'My Favorite Music', 'music.desc': '20 tracks, click to play, scroll horizontally to browse.',
      'player.now': 'Now Playing', 'player.none': 'Not Selected',
      'twin.title': 'Chat with Me',
      'twin.desc': 'This is a chat entry based on my personal knowledge base. You can ask me about my major, projects, and interests.',
      'twin.intro': "Hi, I'm Hua Jinyao's digital twin. You can ask me:<br>· What's your major?<br>· What projects are you working on?<br>· What are your hobbies?<br>· How can I contact you?",
      'twin.chip1': "What's your major?", 'twin.chip2': 'What projects are you working on?',
      'twin.chip3': 'What are your hobbies?', 'twin.chip4': 'How can I contact you?',
      'twin.send': 'Send',
      'guestbook.title': 'Leave a Message',
      'guestbook.desc': 'Feel free to leave your thoughts, suggestions, or encouragement. Messages are stored in your browser.',
      'guestbook.submit': 'Submit', 'guestbook.empty': 'No messages yet. Be the first to write one.',
      'contact.title': 'Contact Me',
      'contact.desc': "If you're interested in my projects or want to share ideas, feel free to reach out.",
      'contact.email': 'Send Email',
      'footer.name': 'Hua Jinyao', 'footer.built': 'Built with Vibe Coding.', 'footer.visits': 'Visits: ',
      'feedback.title': 'Feedback',
      'feedback.hint': 'Your feedback is private and only visible to me. Please tell me where you had trouble.',
      'feedback.name': 'Nickname (optional)',
      'feedback.relation': 'Relation to me',
      'feedback.device': 'Device you used',
      'feedback.message': 'Your feedback',
      'feedback.submit': 'Submit'
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
    const fbName = document.getElementById('fbName');
    const fbMessage = document.getElementById('fbMessage');

    if (lang === 'zh') {
      if (guestNameInput) guestNameInput.placeholder = '你的名字';
      if (guestMsgInput) guestMsgInput.placeholder = '写下你的留言...';
      if (twinInput) twinInput.placeholder = '输入你的问题...';
      if (fbName) fbName.placeholder = '你的昵称';
      if (fbMessage) fbMessage.placeholder = '请描述具体位置、体验和问题';
      btn.textContent = 'EN';
      document.documentElement.lang = 'zh-CN';
    } else {
      if (guestNameInput) guestNameInput.placeholder = 'Your name';
      if (guestMsgInput) guestMsgInput.placeholder = 'Write your message...';
      if (twinInput) twinInput.placeholder = 'Type your question...';
      if (fbName) fbName.placeholder = 'Your nickname';
      if (fbMessage) fbMessage.placeholder = 'Please describe the location, experience and problem';
      btn.textContent = '中';
      document.documentElement.lang = 'en';
    }

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
// Digital Twin
// ========================================
safeRun('twin', function () {
  const form = document.getElementById('twinForm');
  const input = document.getElementById('twinInput');
  const messages = document.getElementById('twinMessages');
  const suggestions = document.getElementById('twinSuggestions');
  if (!form || !input || !messages) return;

  const KNOWLEDGE = [
    { keywords: ['专业', '学什么', 'major', 'study'], answer: '我是智能医学工程（脑机接口）专业的大一本科生，同时在天津大学和香港理工大学注册学籍。这个专业结合了医学、工程和人工智能，主要研究脑机接口、神经工程和智能医疗设备。' },
    { keywords: ['项目', '在做什么', 'project', '课题'], answer: '我目前在做两个项目：一是数学建模课题《基于实际场景需求的个性化背景音乐歌单推荐模型的研究》；二是这个个人主页本身，用 Vibe Coding 方式从 V1 迭代到 V3。' },
    { keywords: ['兴趣', '爱好', 'hobby', '喜欢'], answer: '我喜欢软笔书法、钢琴、二胡、架子鼓，也喜欢跑步、音乐和舞蹈艺术。' },
    { keywords: ['联系', '邮箱', 'email', 'contact', 'github'], answer: '你可以通过以下方式联系我：\n· 邮箱：2761163826@qq.com\n· GitHub：github.com/huajinyao' },
    { keywords: ['学校', '大学', '天大', '港理工', 'polyu', 'tju'], answer: '我就读于天津大学香港理工大学深圳未来技术学院，同时注册天大和港理工双校学籍。约50%课程由港理工授课。' },
    { keywords: ['主页', '这个网站', 'website'], answer: '这个个人主页是我在 Vibe Coding 课程中从 V1 迭代到 V3 完成的，包含双校身份、粒子网络、音乐篮筐、Digital Twin、中英切换、主题切换、反馈后台等功能。' },
    { keywords: ['音乐', '歌', 'music', 'song'], answer: '我在主页「我喜欢的音乐」区域放了 20 首喜欢的歌曲，包括 Five hundred miles、Fly me to the moon、月亮代表我的心、稻香等。' },
    { keywords: ['你好', 'hi', 'hello', '嗨'], answer: '你好！我是滑锦尧的数字分身。你可以问我关于我的专业、项目、兴趣、学校、联系方式等问题。' },
    { keywords: ['谢谢', 'thanks'], answer: '不客气！如果还有其他问题，随时问我。' }
  ];

  const FALLBACK = '抱歉，我暂时没有关于这个问题的答案。你可以换个方式问，或者直接在下方留言区给我留言。';

  function addBubble(text, type) {
    const div = document.createElement('div');
    div.className = 'twin-bubble twin-' + type;
    div.innerHTML = String(text).replace(/\n/g, '<br>');
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function findAnswer(question) {
    const q = question.toLowerCase().trim();
    let bestMatch = null, bestScore = 0;
    KNOWLEDGE.forEach(item => {
      let score = 0;
      item.keywords.forEach(kw => { if (q.includes(kw.toLowerCase())) score++; });
      if (score > bestScore) { bestScore = score; bestMatch = item; }
    });
    return bestScore > 0 ? bestMatch.answer : FALLBACK;
  }

  function handleQuestion(question) {
    if (!question.trim()) return;
    addBubble(question, 'user');
    setTimeout(() => addBubble(findAnswer(question), 'bot'), 400);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    handleQuestion(q);
    input.value = '';
  });

  if (suggestions) {
    suggestions.addEventListener('click', (e) => {
      const chip = e.target.closest('.twin-chip');
      if (!chip) return;
      handleQuestion(chip.dataset.q);
    });
  }
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
// 反馈后台（Supabase）
// ========================================
safeRun('feedback', function () {
  // ⚠️ 把下面两个值替换成你自己的
  const SUPABASE_URL = 'https://kreadpajypvspodsjjdc.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BGloJ8t3BS-rHXwso1T1dA__ScAAXtr';

  const btn = document.getElementById('feedbackBtn');
  const modal = document.getElementById('feedbackModal');
  const closeBtn = document.getElementById('feedbackClose');
  const form = document.getElementById('feedbackForm');
  const statusEl = document.getElementById('fbStatus');
  const submitBtn = document.getElementById('fbSubmit');

  if (!btn || !modal || !form) return;

  btn.addEventListener('click', () => modal.classList.add('open'));
  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  let client = null;
  if (window.supabase && SUPABASE_PUBLISHABLE_KEY.indexOf('sb_publishable_BGloJ8t3BS-rHXwso1T1dA__ScAAXtr') === -1) {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!client) {
      statusEl.textContent = '反馈功能尚未配置，请联系主页主人。';
      statusEl.className = 'feedback-status error';
      return;
    }

    const name = document.getElementById('fbName').value.trim();
    const relation = document.getElementById('fbRelation').value;
    const device = document.getElementById('fbDevice').value;
    const message = document.getElementById('fbMessage').value.trim();

    if (!message) {
      statusEl.textContent = '请填写反馈内容。';
      statusEl.className = 'feedback-status error';
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = '提交中…';
    statusEl.className = 'feedback-status';

    try {
      const { error } = await client.from('feedback').insert({
        name: name || null,
        relation,
        device,
        message,
        version: 'V3'
      });

      if (error) throw error;

      statusEl.textContent = '提交成功，感谢你的反馈！';
      statusEl.className = 'feedback-status success';
      form.reset();

      setTimeout(() => {
        modal.classList.remove('open');
        statusEl.textContent = '';
      }, 3000);
    } catch (err) {
      console.error('反馈提交失败：', err);
      statusEl.textContent = '提交失败，请稍后重试。你的内容已保留。';
      statusEl.className = 'feedback-status error';
    } finally {
      submitBtn.disabled = false;
    }
  });
});

// ========================================
// 页面加载完成
// ========================================
safeRun('loaded', function () {
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });
});