// ============================================================
// 合同会社XEN — ヒーロー見出し インタラクション（雷・焦げ・煙）
// アップロードされた xen-hero-background.html の実装をそのまま移植。
// 数値パラメータ（反発半径・押し出し量・雷の分岐確率/本数/寿命・
// 焦げの3段階キーフレーム・煙のフェード曲線・自動演出の間隔など）は
// 一切変更していません。変更したのは以下の3点のみです:
//   1. 要素参照を実サイトのDOM構造(id="hero" / id="xenHeading" /
//      id="xenSpark")に合わせた
//   2. スパークの配色をサイトのブランドカラー(--teal #14B8A6 /
//      --indigo #6B5FFF)に合わせた
//   3. フォント指定はサイト本体の --f-jp / --f-mono を使う前提とし、
//      Google Fontsの重複読み込みはしていない
//      （Noto Sans JP・JetBrains Mono は元々サイト側で読み込み済み）
// ============================================================

(function () {
  var hero = document.getElementById('hero');
  var heading = document.getElementById('xenHeading');
  var sparkCanvas = document.getElementById('xenSpark');
  if (!hero || !heading || !sparkCanvas) return;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (prefersReduced) return; /* 見出しはプレーンな静止テキストのまま */

  /* ---- 見出しを1文字ずつ <span class="ch"> に分割 ---- */
  var lines = heading.innerHTML.split(/<br\s*\/?>/i);
  var idx = 0;
  var wrapped = lines.map(function (line) {
    return Array.from(line).map(function (ch) {
      var cls = 'ch' + (idx++ % 5 === 0 ? ' alt' : '');
      return '<span class="' + cls + '">' + ch + '</span>';
    }).join('');
  }).join('<br>');
  heading.innerHTML = wrapped;
  var chars = Array.prototype.slice.call(heading.querySelectorAll('.ch'));

  function cacheRects() {
    var heroRect = hero.getBoundingClientRect();
    chars.forEach(function (c) {
      var r = c.getBoundingClientRect();
      c._cx = r.left - heroRect.left + r.width / 2;
      c._cy = r.top - heroRect.top + r.height / 2;
    });
  }
  cacheRects();
  window.addEventListener('resize', cacheRects);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(cacheRects); }

  var radius = 70, maxPush = 22;

  /* ---- 電撃スパーク: フラクタル(中点変位法)の雷をカーソル/ターゲットから飛び散らせる ---- */
  var sctx = sparkCanvas.getContext('2d');
  var cw = 0, chH = 0;
  function resizeCanvas() {
    var r = hero.getBoundingClientRect();
    cw = r.width; chH = r.height;
    var dpr = window.devicePixelRatio || 1;
    sparkCanvas.width = cw * dpr;
    sparkCanvas.height = chH * dpr;
    sparkCanvas.style.width = cw + 'px';
    sparkCanvas.style.height = chH + 'px';
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function createLightning(x1, y1, x2, y2, displace) {
    var pts = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    function subdivide(p, d) {
      if (d < 2) return p;
      var out = [p[0]];
      for (var i = 0; i < p.length - 1; i++) {
        var a = p[i], b = p[i + 1];
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var px = -dy / len, py = dx / len;
        var off = (Math.random() - 0.5) * d;
        out.push({ x: mx + px * off, y: my + py * off });
        out.push(b);
      }
      return subdivide(out, d * 0.55);
    }
    return subdivide(pts, displace);
  }

  var sparks = [];
  function makeSpark(x, y) {
    var angle = Math.random() * Math.PI * 2;
    var len = 22 + Math.random() * 34;
    var ex = x + Math.cos(angle) * len, ey = y + Math.sin(angle) * len;
    var main = createLightning(x, y, ex, ey, len * 0.45);

    var branches = [];
    for (var i = 2; i < main.length - 2 && branches.length < 2; i++) {
      if (Math.random() < 0.16) {
        var bStart = main[i];
        var bAngle = angle + (Math.random() - 0.5) * 1.7;
        var bLen = len * (0.3 + Math.random() * 0.3);
        var bx = bStart.x + Math.cos(bAngle) * bLen, by = bStart.y + Math.sin(bAngle) * bLen;
        branches.push(createLightning(bStart.x, bStart.y, bx, by, bLen * 0.5));
      }
    }

    /* ブランドカラー: teal(#14B8A6) / indigo(#6B5FFF) */
    var palette = Math.random() < 0.5
      ? { glow: '20,184,166', core: '214,255,241' }
      : { glow: '107,95,255', core: '226,221,255' };

    return { main: main, branches: branches, birth: performance.now(), life: 130 + Math.random() * 110, color: palette };
  }
  function spawnBurst(x, y) {
    var count = 2 + Math.floor(Math.random() * 3);
    for (var i = 0; i < count; i++) sparks.push(makeSpark(x, y));
  }

  /* ---- 煙: 焦げた文字からゆっくり立ちのぼる、薄い煙 ---- */
  var smokes = [];
  function spawnSmoke(x, y) {
    var count = 1 + Math.floor(Math.random() * 2);
    for (var i = 0; i < count; i++) {
      smokes.push({
        x: x + (Math.random() - 0.5) * 5,
        y: y + (Math.random() - 0.5) * 3,
        seed: Math.random() * Math.PI * 2,
        sway: 2.5 + Math.random() * 2.5,
        vy: -(0.014 + Math.random() * 0.014),
        r0: 1.6 + Math.random() * 1.6,
        r1: 7 + Math.random() * 5,
        birth: performance.now(),
        life: 1100 + Math.random() * 700,
        a0: 0.16 + Math.random() * 0.1
      });
    }
  }
  function drawSmoke(now) {
    smokes = smokes.filter(function (s) { return now - s.birth < s.life; });
    smokes.forEach(function (s) {
      var elapsed = now - s.birth;
      var age = elapsed / s.life;
      var ease = 1 - Math.pow(1 - age, 2);
      var x = s.x + Math.sin(elapsed * 0.0022 + s.seed) * s.sway * age;
      var y = s.y + s.vy * elapsed;
      var rad = s.r0 + (s.r1 - s.r0) * ease;
      var alpha = s.a0 * Math.sin(Math.min(age, 1) * Math.PI);
      var grad = sctx.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, 'rgba(178,175,186,' + alpha + ')');
      grad.addColorStop(1, 'rgba(178,175,186,0)');
      sctx.fillStyle = grad;
      sctx.beginPath();
      sctx.arc(x, y, rad, 0, Math.PI * 2);
      sctx.fill();
    });
  }
  function burnFlash(targets) {
    targets.forEach(function (c) {
      var dur = 200 + Math.random() * 160;
      c.classList.remove('scorched');
      void c.offsetWidth;
      c.style.animationDuration = dur + 'ms';
      c.classList.add('scorched');
      spawnSmoke(c._cx, c._cy);
      clearTimeout(c._burnTimer);
      c._burnTimer = setTimeout(function () {
        c.classList.remove('scorched');
      }, dur);
    });
  }
  function strokePath(pts) {
    if (pts.length < 2) return;
    sctx.beginPath();
    sctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) sctx.lineTo(pts[i].x, pts[i].y);
    sctx.stroke();
  }
  function drawSparks() {
    sctx.clearRect(0, 0, cw, chH);
    var now = performance.now();
    drawSmoke(now);
    sparks = sparks.filter(function (s) { return now - s.birth < s.life; });
    sparks.forEach(function (s) {
      var t = (now - s.birth) / s.life;
      var fade = 1 - t;
      var flicker = 0.62 + Math.random() * 0.5;
      var a = Math.max(0, fade * flicker);

      sctx.lineWidth = 2.6;
      sctx.shadowBlur = 9;
      sctx.shadowColor = 'rgba(' + s.color.glow + ',0.9)';
      sctx.strokeStyle = 'rgba(' + s.color.glow + ',' + (a * 0.65) + ')';
      strokePath(s.main);
      s.branches.forEach(strokePath);

      sctx.lineWidth = 0.9;
      sctx.shadowBlur = 4;
      sctx.shadowColor = 'rgba(' + s.color.core + ',1)';
      sctx.strokeStyle = 'rgba(' + s.color.core + ',' + a + ')';
      strokePath(s.main);
      sctx.lineWidth = 0.7;
      s.branches.forEach(strokePath);
    });
    requestAnimationFrame(drawSparks);
  }
  requestAnimationFrame(drawSparks);

  if (canHover) {
    /* ---- PC/マウス操作: 近くの文字が反発し、逃げている間スパークする ---- */
    var lastSpark = 0;
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      var anyActive = false;
      var activeChars = [];
      chars.forEach(function (c) {
        var dx = c._cx - mx, dy = c._cy - my;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
          anyActive = true;
          activeChars.push(c);
          var push = (1 - dist / radius) * maxPush;
          var nx = dist === 0 ? 0 : (dx / dist) * push;
          var ny = dist === 0 ? 0 : (dy / dist) * push;
          c.style.transform = 'translate(' + nx.toFixed(1) + 'px,' + ny.toFixed(1) + 'px)';
          c.classList.add('active');
        } else if (c.classList.contains('active')) {
          c.style.transform = '';
          c.classList.remove('active');
        }
      });
      if (anyActive) {
        var now = performance.now();
        if (now - lastSpark > 55) {
          spawnBurst(mx, my);
          burnFlash(activeChars);
          lastSpark = now;
        }
      }
    });

    hero.addEventListener('mouseleave', function () {
      chars.forEach(function (c) {
        c.style.transform = '';
        c.classList.remove('active');
        c.classList.remove('scorched');
        clearTimeout(c._burnTimer);
      });
    });

  } else {
    /* ---- タッチ/ホバー不可端末: 一定間隔でランダムな文字に自動発生 ---- */
    var heroVisible = true;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) { heroVisible = entries[0].isIntersecting; }, { threshold: 0 });
      io.observe(hero);
    }

    function autoStrike() {
      if (heroVisible && chars.length) {
        var target = chars[Math.floor(Math.random() * chars.length)];
        var tx = target._cx, ty = target._cy;
        var activeChars = [];
        chars.forEach(function (c) {
          var dx = c._cx - tx, dy = c._cy - ty;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius) {
            activeChars.push(c);
            var push = (1 - dist / radius) * maxPush;
            var nx = dist === 0 ? 0 : (dx / dist) * push;
            var ny = dist === 0 ? 0 : (dy / dist) * push;
            c.style.transform = 'translate(' + nx.toFixed(1) + 'px,' + ny.toFixed(1) + 'px)';
            c.classList.add('active');
          }
        });
        spawnBurst(tx, ty);
        burnFlash(activeChars);
        setTimeout(function () { spawnBurst(tx, ty); }, 90);
        setTimeout(function () {
          activeChars.forEach(function (c) {
            c.style.transform = '';
            c.classList.remove('active');
          });
        }, 420);
      }
      setTimeout(autoStrike, 2400 + Math.random() * 2800);
    }
    setTimeout(autoStrike, 1800 + Math.random() * 1400);
  }
})();
