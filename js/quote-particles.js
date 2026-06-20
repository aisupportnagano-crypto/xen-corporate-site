// ============================================================
// 合同会社XEN — ミッション引用ブロック 背景パーティクルウェーブ
// 格子状の粒子が穏やかな波打ちで揺れ、マウスの動きにゆるく
// 視点が追従する。ブランドカラー(teal → indigo → terra)で着色。
// particle-hero.js と同じ作法（軽量Canvas2D / DPR対応 /
// prefers-reduced-motion対応）で実装。
// ============================================================

(function () {
  const canvas = document.getElementById('quote-particle-canvas');
  if (!canvas) return;

  const wrap = canvas.closest('.quote-block');
  if (!wrap) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');

  let width, height, dots, cols, rows;
  let camX = 0, camY = 0, targetX = 0, targetY = 0;

  // ── ブランドカラー（HSL）。x位置に応じてこの3色の間を補間する ──
  const STOPS = [
    { h: 173, s: 75, l: 55 }, // teal
    { h: 248, s: 90, l: 70 }, // indigo
    { h: 13,  s: 95, l: 68 }, // terra
  ];

  function colorAt(ratio) {
    const r = Math.max(0, Math.min(1, ratio));
    const segCount = STOPS.length - 1;
    const segPos = r * segCount;
    const segIndex = Math.min(Math.floor(segPos), segCount - 1);
    const localT = segPos - segIndex;
    const a = STOPS[segIndex];
    const b = STOPS[segIndex + 1];
    return {
      h: a.h + (b.h - a.h) * localT,
      s: a.s + (b.s - a.s) * localT,
      l: a.l + (b.l - a.l) * localT,
    };
  }

  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = wrap.offsetWidth;
    height = wrap.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 横幅に応じて格子の密度を調整（スマホは軽量に）
    const isSmall = width < 560;
    cols = isSmall ? 10 : 16;
    rows = isSmall ? 5 : 7;

    dots = [];
    for (let ix = 0; ix < cols; ix++) {
      for (let iz = 0; iz < rows; iz++) {
        dots.push({ ix, iz });
      }
    }
  }

  // 1粒子の座標・サイズ・色を計算する（静止フレーム描画とアニメ both で使用）
  function layout(d, t) {
    const depthRatio = d.iz / (rows - 1 || 1); // 0 = 手前, 1 = 奥
    const wave = Math.sin((d.ix + t * 14) * 0.45) * 9
               + Math.sin((d.iz + t * 18) * 0.6) * 7;
    const scale = 1.08 - depthRatio * 0.6;
    const spacingX = width / (cols - 1 || 1);
    const centerX = width / 2;
    const baseY = height * 0.58;

    const px = centerX + (d.ix - (cols - 1) / 2) * spacingX * scale
             + camX * (1 - depthRatio * 0.7);
    const py = baseY - depthRatio * height * 0.5 - wave * scale
             + camY * (1 - depthRatio * 0.7) * 0.4;

    const c = colorAt(d.ix / (cols - 1 || 1));
    const alpha = Math.max(0.5 - depthRatio * 0.42, 0.06);
    const pulse = (Math.sin((d.ix + t * 14) * 0.45) + 1) * 0.9
                + (Math.sin((d.iz + t * 18) * 0.6) + 1) * 0.9;
    const radius = Math.max((1.5 + pulse) * scale, 0.6);

    return { px, py, c, alpha, radius };
  }

  function step(now) {
    const rect = wrap.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.top < window.innerHeight;

    if (visible) {
      ctx.clearRect(0, 0, width, height);
      const t = now * 0.0009;

      camX += (targetX - camX) * 0.04;
      camY += (targetY - camY) * 0.04;

      for (const d of dots) {
        const { px, py, c, alpha, radius } = layout(d, t);
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, ${alpha})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(step);
  }

  function mouseMove(e) {
    const rect = wrap.getBoundingClientRect();
    targetX = (e.clientX - rect.left - width / 2) * 0.16;
    targetY = (e.clientY - rect.top - height / 2) * 0.16;
  }

  function resize() { init(); }

  // ── 初期化 ──
  init();

  if (prefersReducedMotion) {
    // 動きを抑えたい場合は1フレームだけ静かに描画して止める
    ctx.clearRect(0, 0, width, height);
    for (const d of dots) {
      const { px, py, c, radius } = layout(d, 0);
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.22)`;
      ctx.fill();
    }
  } else {
    requestAnimationFrame(step);
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('resize', resize);
  }
})();
