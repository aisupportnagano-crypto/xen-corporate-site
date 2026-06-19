// XEN合同会社サイト 共通スクリプト

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── モバイルメニュー ──
  const toggle = document.querySelector('.gnav-toggle');
  const menu = document.querySelector('.mobile-menu');
  const close = document.querySelector('.mobile-menu-close');

  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.add('open'));
  }
  if (close && menu) {
    close.addEventListener('click', () => menu.classList.remove('open'));
  }
  if (menu) {
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => menu.classList.remove('open'));
    });
  }

  // ── スクロールリビール（通常＋段差つき） ──
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  // ── 数字カウントアップ ──
  // data-count-to="48" data-count-suffix="%" のように指定された要素を、
  // 画面に入ったタイミングで 0 からカウントアップさせる
  const counters = document.querySelectorAll('[data-count-to]');
  if ('IntersectionObserver' in window && counters.length) {
    const countIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        countIo.unobserve(el);

        const target = parseFloat(el.getAttribute('data-count-to'));
        const suffix = el.getAttribute('data-count-suffix') || '';
        const prefix = el.getAttribute('data-count-prefix') || '';
        const decimals = parseInt(el.getAttribute('data-count-decimals') || '0', 10);

        if (prefersReducedMotion || !isFinite(target)) {
          el.textContent = prefix + target.toFixed(decimals) + suffix;
          return;
        }

        const duration = 1200;
        const startTime = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3); // ease-out-cubic

        function tick(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const value = target * ease(progress);
          el.textContent = prefix + value.toFixed(decimals) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = prefix + target.toFixed(decimals) + suffix;
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => countIo.observe(el));
  }

  // ── ナビ背景（スクロール量で濃淡） ──
  const gnav = document.querySelector('.gnav');
  if (gnav) {
    const onNavScroll = () => {
      if (window.scrollY > 8) gnav.classList.add('scrolled');
      else gnav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();
  }

  // ── スクロール進行バー ──
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    const onProgress = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (scrollTop / max) * 100 : 0;
      progressBar.style.width = pct + '%';
    };
    window.addEventListener('scroll', onProgress, { passive: true });
    window.addEventListener('resize', onProgress);
    onProgress();
  }

  // ── ヒーローのパララックス（背景レイヤーを速度差で動かす） ──
  if (!prefersReducedMotion) {
    const heroGrid = document.querySelector('.hero-grid');
    const hero = document.querySelector('.hero');
    if (heroGrid && hero) {
      let ticking = false;
      const onParallax = () => {
        const rect = hero.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          const offset = window.scrollY * 0.25;
          heroGrid.style.transform = `translateY(${offset}px)`;
        }
        ticking = false;
      };
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(onParallax);
          ticking = true;
        }
      }, { passive: true });
      onParallax();
    }
  }

  // ── 製品モックのスクロール連動チルト ──
  if (!prefersReducedMotion) {
    const tilts = document.querySelectorAll('.mock-tilt');
    if (tilts.length) {
      let tiltTicking = false;
      const onTilt = () => {
        const vh = window.innerHeight;
        tilts.forEach(el => {
          const rect = el.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const ratio = Math.max(-1, Math.min(1, (center - vh / 2) / (vh / 2)));
          const rotateX = ratio * -6;
          el.style.transform = `rotateX(${rotateX}deg)`;
        });
        tiltTicking = false;
      };
      window.addEventListener('scroll', () => {
        if (!tiltTicking) {
          requestAnimationFrame(onTilt);
          tiltTicking = true;
        }
      }, { passive: true });
      onTilt();
    }
  }
});
