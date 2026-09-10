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
// Canvas 粒子网络
// ========================================
(function initParticleNetwork() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // 根据屏幕宽度决定粒子数量
  function getParticleCount() {
    const w = window.innerWidth;
    if (w < 480) return 20;
    if (w < 768) return 40;
    if (w < 1024) return 70;
    return 100;
  }

  // 根据屏幕宽度决定连线距离
  function getLinkDistance() {
    const w = window.innerWidth;
    if (w < 480) return 80;
    if (w < 768) return 100;
    if (w < 1024) return 120;
    return 150;
  }

  // 根据屏幕宽度决定帧率
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

  // 粒子类
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

  // 初始化粒子
  function initParticles() {
    particles = [];
    const count = getParticleCount();
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  // 调整 Canvas 尺寸
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

  // 绘制连线
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

  // 动画循环
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

  // 启动
  function start() {
    resize();
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(animate);
  }

  // 窗口大小变化时重新初始化（防抖）
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 200);
  }, { passive: true });

  // 页面不可见时暂停动画
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