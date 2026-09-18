// ========================================
// 双校数据（备用）
// ========================================
const SCHOOL_DATA = {
  tju: {
    name: '天津大学',
    nameEn: 'Tianjin University',
    url: 'https://www.tju.edu.cn'
  },
  polyu: {
    name: '香港理工大学',
    nameEn: 'The Hong Kong Polytechnic University',
    url: 'https://www.polyu.edu.hk'
  }
};

// ========================================
// 移动端菜单切换
// ========================================
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const siteHeader = document.querySelector('.site-header');

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

// ========================================
// 滚动时导航栏加深
// ========================================
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    siteHeader.classList.add('scrolled');
  } else {
    siteHeader.classList.remove('scrolled');
  }
}, { passive: true });

// ========================================
// 页脚年份自动更新
// ========================================
document.getElementById('year').textContent = new Date().getFullYear();

// ========================================
// 打字机效果
// ========================================
(function initTyping() {
  const el = document.getElementById('typingText');
  if (!el) return;

  const text = '一位热情、勇敢、从容的前行者';
  let i = 0;
  const speed = 100;

  function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      setTimeout(() => el.classList.remove('typing'), 1500);
    }
  }

  setTimeout(type, 500);
})();

// ========================================
// 滚动动画（Intersection Observer）
// ========================================
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();

// ========================================
// 双城时钟
// ========================================
(function initCityClocks() {
  const szEl = document.getElementById('szTime');
  const hkEl = document.getElementById('hkTime');
  if (!szEl || !hkEl) return;

  function update() {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    szEl.textContent = time;
    hkEl.textContent = time;
  }

  update();
  setInterval(update, 1000);
})();

// ========================================
// 留言平台（localStorage）
// ========================================
(function initGuestbook() {
  const form = document.getElementById('guestbookForm');
  const list = document.getElementById('guestbookList');
  const nameInput = document.getElementById('guestName');
  const messageInput = document.getElementById('guestMessage');

  if (!form || !list) return;

  const STORAGE_KEY = 'huajinyao_guestbook';

  function getMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveMessages(messages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('无法保存留言：', e);
    }
  }

  function formatTime(timestamp) {
    const d = new Date(timestamp);
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function render() {
    const messages = getMessages();

    if (messages.length === 0) {
      list.innerHTML = '<div class="guestbook-empty">还没有留言，来写下第一条吧。</div>';
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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) return;

    const messages = getMessages();
    messages.push({
      name: name,
      message: message,
      time: Date.now()
    });

    saveMessages(messages);
    form.reset();
    render();
  });

  render();
})();

// ========================================
// 返回顶部
// ========================================
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ========================================
// 音乐播放器
// ========================================
(function initMusicPlayer() {
  const toggle = document.getElementById('musicToggle');
  const audio = document.getElementById('bgMusic');
  if (!toggle || !audio) return;

  let playing = false;

  toggle.addEventListener('click', () => {
    if (playing) {
      audio.pause();
      toggle.textContent = '▶';
    } else {
      audio.play().catch(() => {});
      toggle.textContent = '❚❚';
    }
    playing = !playing;
  });
})();

// ========================================
// Canvas 粒子网络
// ========================================
(function initParticleNetwork() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function getParticleCount() {
    const w = window.innerWidth;
    if (w < 480) return 20;
    if (w < 768) return 40;
    if (w < 1024) return 70;
    return 100;
  }

  function getLinkDistance() {
    const w = window.innerWidth;
    if (w < 480) return 80;
    if (w < 768) return 100;
    if (w < 1024) return 120;
    return 150;
  }

  function getFrameRate() {
    return window.innerWidth < 768 ? 30 : 60;
  }

  const dpr = window.devicePixelRatio || 1;

  let width = 0;
  let height = 0;
  let particles = [];
  let animationId = null;
  let lastFrameTime = 0;
  let frameInterval = 1000 / getFrameRate();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 1.5 + 0.8;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = getParticleCount();
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
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
    const linkDistance = getLinkDistance();
    const maxDistSq = linkDistance * linkDistance;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const opacity = (1 - dist / linkDistance) * 0.35;

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
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
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      lastFrameTime = 0;
      animationId = requestAnimationFrame(animate);
    }
  });

  start();
})();