// ============================================================
// XEN合同会社 — ヒーロー パーティクルネットワーク演出
// マウス追従の星座風パーティクル。位置に応じてブランドカラーが
// グラデーション的に変化する（teal → indigo → terra）。
// ============================================================

(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');

  let width, height, points, target, animating = true;
  let autoAngle = 0; // マウスが無い環境用の自動視点移動

  const hero = canvas.closest('.hero');

  // ── ブランドカラー（HSL）。x位置に応じてこの3色の間を補間する ──
  // teal #14B8A6 ≈ hsl(173, 80%, 40%)
  // indigo #6B5FFF ≈ hsl(248, 100%, 69%)
  // terra #FF6B4A ≈ hsl(13, 100%, 66%)
  const STOPS = [
    { h: 173, s: 75, l: 55 },
    { h: 248, s: 90, l: 70 },
    { h: 13,  s: 95, l: 68 },
  ];

  function colorAt(ratio) {
    // ratio: 0〜1 の範囲。STOPS間を線形補間する
    const r = Math.max(0, Math.min(1, ratio));
    const segCount = STOPS.length - 1;
    const segPos = r * segCount;
    const segIndex = Math.min(Math.floor(segPos), segCount - 1);
    const localT = segPos - segIndex;
    const a = STOPS[segIndex];
    const b = STOPS[segIndex + 1];
    const h = a.h + (b.h - a.h) * localT;
    const s = a.s + (b.s - a.s) * localT;
    const l = a.l + (b.l - a.l) * localT;
    return { h, s, l };
  }

  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.offsetWidth;
    height = hero.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    target = { x: width / 2, y: height / 2 };

    // 画面幅に応じて密度を調整（スマホは軽量に）
    const isSmall = width < 760;
    const cols = isSmall ? 10 : 18;
    const rows = isSmall ? 8 : 11;
    const cellW = width / cols;
    const cellH = height / rows;

    points = [];
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const px = x * cellW + Math.random() * cellW;
        const py = y * cellH + Math.random() * cellH;
        const c = colorAt(px / width);
        points.push({
          x: px, y: py,
          originX: px, originY: py,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.4,
          radius: 1.3 + Math.random() * 1.7,
          color: c,
          active: 0,
        });
      }
    }

    // 各点について、最も近い4点を事前計算（線を引く相手）
    const NEIGHBORS = isSmall ? 3 : 4;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const dists = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) continue;
        const p2 = points[j];
        const d = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
        dists.push({ p: p2, d });
      }
      dists.sort((a, b) => a.d - b.d);
      p1.closest = dists.slice(0, NEIGHBORS).map(o => o.p);
    }
  }

  function distSq(p1, p2) {
    return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
  }

  function step(now) {
    if (animating && hero) {
      const rect = hero.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;

      if (visible) {
        ctx.clearRect(0, 0, width, height);

        const t = now * 0.001;

        for (const p of points) {
          // ゆらぎ（サイン波で原点周辺をふわふわ漂う）
          p.x = p.originX + Math.sin(t * p.speed + p.phaseX) * 22;
          p.y = p.originY + Math.cos(t * p.speed * 0.8 + p.phaseY) * 22;

          const dSq = distSq(target, p);
          if (dSq < 4200) p.active = 0.55;
          else if (dSq < 22000) p.active = 0.28;
          else if (dSq < 45000) p.active = 0.12;
          else p.active = 0.04;
        }

        for (const p of points) {
          if (p.active <= 0.04) continue;
          for (const q of p.closest) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            const c = p.color;
            ctx.strokeStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, ${p.active * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        for (const p of points) {
          const c = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, ${Math.max(p.active, 0.18)})`;
          ctx.fill();
        }
      }
    }
    requestAnimationFrame(step);
  }

  function mouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    target.x = e.clientX - rect.left;
    target.y = e.clientY - rect.top;
  }

  function autoDrift(now) {
    // タッチ端末など、マウスが無い場合に視点をゆっくり自動で漂わせる
    if (!hero) return;
    autoAngle = now * 0.00012;
    target.x = width / 2 + Math.cos(autoAngle) * width * 0.32;
    target.y = height / 2 + Math.sin(autoAngle * 1.3) * height * 0.32;
    requestAnimationFrame(autoDrift);
  }

  function resize() {
    init();
  }

  function scrollCheck() {
    animating = window.scrollY < height + 200;
  }

  // ── 初期化 ──
  init();

  if (prefersReducedMotion) {
    // 動きを抑えたい場合は1フレームだけ描画して静止
    ctx.clearRect(0, 0, width, height);
    for (const p of points) {
      const c = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.25)`;
      ctx.fill();
    }
  } else {
    requestAnimationFrame(step);
    if ('ontouchstart' in window) {
      requestAnimationFrame(autoDrift);
    } else {
      window.addEventListener('mousemove', mouseMove);
    }
    window.addEventListener('scroll', scrollCheck, { passive: true });
    window.addEventListener('resize', resize);
  }
})();
