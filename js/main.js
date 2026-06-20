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

  // ── 製品モックのスクロール連動チルト（＋ホバー時はマウス追従チルトに切り替え） ──
  if (!prefersReducedMotion) {
    const tilts = document.querySelectorAll('.mock-tilt');
    if (tilts.length) {
      const hovering = new WeakSet();

      let tiltTicking = false;
      const onTilt = () => {
        const vh = window.innerHeight;
        tilts.forEach(el => {
          if (hovering.has(el)) return; // ホバー中はスクロール側で上書きしない
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

      // ホバー中はマウス位置に応じた2軸チルト（ホログラムカード演出）
      tilts.forEach(el => {
        if (!el.classList.contains('mock-hologram')) return;

        el.addEventListener('mouseenter', () => hovering.add(el));

        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -8;
          const rotateY = ((x - centerX) / centerX) * 8;
          el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        el.addEventListener('mouseleave', () => {
          hovering.delete(el);
          el.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
      });
    }
  }

  // ── ホログラム演出／カードグロー演出：スマホ（ホバー不可端末）では
  //    画面に入ったタイミングで一度だけ自動再生する ──
  if (!prefersReducedMotion) {
    const isTouchDevice = window.matchMedia('(hover: none)').matches;

    if (isTouchDevice && 'IntersectionObserver' in window) {
      // [対象セレクタ, 付与するクラス名] のペアでまとめて扱う
      const autoPlayTargets = [
        { selector: '.mock-hologram', playClass: 'holo-play', threshold: 0.5 },
        { selector: '.card-glow', playClass: 'glow-play', threshold: 0.4 },
      ];

      autoPlayTargets.forEach(({ selector, playClass, threshold }) => {
        const els = document.querySelectorAll(selector);
        if (!els.length) return;

        const io = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add(playClass);
              io.unobserve(entry.target); // 一度再生したら監視終了（再発火しない）
            }
          });
        }, { threshold });

        els.forEach(el => io.observe(el));
      });
    }
  }

  // ── 見出しのタイプライターアニメーション ──
  // [data-split-text] が付いた要素の中身を1文字ずつ <span class="ch"> に分解し、
  // 左から順番にタイプライターのように瞬間表示していく。
  // <br> はそのまま改行として残し、既存の <span class="accent-xxx"> も保持する。
  // 全文字を表示し終えたら、末尾にカーソルを置いて点滅させ続ける。
  document.querySelectorAll('[data-split-text]').forEach((el) => {
    const html = el.innerHTML;
    const TYPE_SPEED = 0.085; // 1文字あたりの間隔（秒）。さらにゆっくりに調整
    const parts = html.split(/(<br\s*\/?>)/i);
    let charIndex = 0;
    const built = parts.map(part => {
      if (/^<br/i.test(part)) return part;
      return part.replace(/(<span[^>]*>.*?<\/span>|[^<])/g, (match) => {
        // 既存の <span class="accent-xxx">語</span> はそのまま個別の塊として扱う
        if (/^<span/i.test(match)) {
          const inner = match.replace(/^<span([^>]*)>/i, '').replace(/<\/span>$/i, '');
          const wrappedInner = inner.split('').map(c => {
            const delay = (charIndex++ * TYPE_SPEED).toFixed(3);
            const safe = c === ' ' ? '&nbsp;' : c;
            const spClass = c === ' ' ? 'ch sp' : 'ch';
            return `<span class="${spClass}" style="--d:${delay}s">${safe}</span>`;
          }).join('');
          const attrMatch = match.match(/^<span([^>]*)>/i);
          const attrs = attrMatch ? attrMatch[1] : '';
          return `<span${attrs}>${wrappedInner}</span>`;
        }
        const delay = (charIndex++ * TYPE_SPEED).toFixed(3);
        const safe = match === ' ' ? '&nbsp;' : match;
        const spClass = match === ' ' ? 'ch sp' : 'ch';
        return `<span class="${spClass}" style="--d:${delay}s">${safe}</span>`;
      });
    }).join('');

    // 全文字表示完了のタイミングに合わせてカーソルを末尾に追加
    const cursorDelay = (charIndex * TYPE_SPEED).toFixed(3);
    const cursor = `<span class="type-cursor" style="--cursor-d:${cursorDelay}s"></span>`;

    el.innerHTML = `<span class="split-line">${built}${cursor}</span>`;
  });

  // ── ヒーロー：Canvasメッシュグラデーション ──
  const meshCanvas = document.querySelector('.hero-mesh-canvas');
  if (meshCanvas && meshCanvas.getContext && !prefersReducedMotion) {
    const ctx = meshCanvas.getContext('2d');
    let w, h, dpr;

    const resize = () => {
      const rect = meshCanvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      meshCanvas.width = w * dpr;
      meshCanvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // 3つの色ブロブがゆっくり周回しながら混ざり合う
    const blobs = [
      { color: '20,184,166', baseX: 0.25, baseY: 0.35, r: 0.55, speed: 0.00021, phase: 0 },
      { color: '107,95,255', baseX: 0.75, baseY: 0.25, r: 0.5, speed: 0.00017, phase: 2.1 },
      { color: '255,107,74', baseX: 0.5, baseY: 0.75, r: 0.5, speed: 0.00026, phase: 4.2 },
    ];

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      blobs.forEach(b => {
        const angle = t * b.speed + b.phase;
        const cx = (b.baseX + Math.cos(angle) * 0.12) * w;
        const cy = (b.baseY + Math.sin(angle) * 0.12) * h;
        const radius = b.r * Math.max(w, h);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(${b.color},0.22)`);
        grad.addColorStop(1, `rgba(${b.color},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ── ヒーロー：マウス追従グロー ──
  const heroEl = document.querySelector('.hero');
  if (heroEl && !prefersReducedMotion) {
    heroEl.addEventListener('mousemove', (e) => {
      const rect = heroEl.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      heroEl.style.setProperty('--mx', x + '%');
      heroEl.style.setProperty('--my', y + '%');
    });
  }

  // ── 系統図カード：マウス追従3Dティルト＋光沢 ──
  if (!prefersReducedMotion) {
    document.querySelectorAll('.lineage-branch').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 10;
        const rotateX = (0.5 - py) * 10;
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.setProperty('--cx', (px * 100) + '%');
        card.style.setProperty('--cy', (py * 100) + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    });
  }
});
