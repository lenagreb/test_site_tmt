/* Первый экран: афиша.
   1) при загрузке собирается из крупных пикселей в чёткую картинку;
   2) после этого медленно «дышит» (лёгкий наезд и отъезд);
   3) при прокрутке к «Нави» снова рассыпается на пиксели. */
(function () {
  var canvas = document.getElementById('hero-canvas');
  var stage = canvas && canvas.parentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Обратный отсчёт до показа
  var count = document.getElementById('countdown');
  if (count) {
    var show = new Date(2026, 9, 23, 14, 0, 0);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var day = new Date(2026, 9, 23, 0, 0, 0);
    var days = Math.round((day - today) / 86400000);
    var word = function (n) {
      var m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return 'день';
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
      return 'дней';
    };
    if (days > 1) count.textContent = 'До показа ' + days + ' ' + word(days);
    else if (days === 1) count.textContent = 'Показ уже завтра, в 14:00';
    else if (days === 0 && new Date() < show) count.textContent = 'Показ сегодня в 14:00';
    else if (days === 0) count.textContent = 'Показ идёт сегодня';
    else count.textContent = 'Сезон 2026 состоялся';
  }

  if (!canvas || !stage) return;

  var img = new Image();
  img.src = 'assets/poster.jpg';
  var ctx = canvas.getContext('2d');
  var small = document.createElement('canvas');
  var sctx = small.getContext('2d');
  var W = 0, H = 0, dpr = 1;
  var introPx = reduce ? 1 : 64;   // размер пикселя во время вступления
  var scrollPx = 1;                // добавка от прокрутки
  var zoom = 1;                    // «дыхание» афиши
  var visible = true;
  var introDone = reduce;
  var raf = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width * dpr));
    H = Math.max(1, Math.round(r.height * dpr));
    canvas.width = W; canvas.height = H;
    draw();
  }

  function draw() {
    raf = 0;
    if (!img.complete || !img.naturalWidth) return;
    var px = Math.max(1, Math.round((introPx + scrollPx - 1) * dpr));
    var w = Math.max(1, Math.ceil(W / px));
    var h = Math.max(1, Math.ceil(H / px));
    small.width = w; small.height = h;
    // object-fit: cover, плюс масштаб от центра
    var s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, w, h, 0, 0, w * px, h * px);
  }

  function schedule() { if (!raf) raf = requestAnimationFrame(draw); }

  function onScroll() {
    var r = stage.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.7)));
    scrollPx = 1 + Math.round(p * 40);
    schedule();
  }

  // Вступление: пиксель уменьшается ступенчато, как проявка
  function intro() {
    if (reduce) { introPx = 1; schedule(); return; }
    var start = null, dur = 2600;
    (function step(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      introPx = Math.max(1, Math.round(64 * (1 - e)));
      draw();
      if (k < 1) requestAnimationFrame(step);
      else { introDone = true; breathe(); }
    })(performance.now());
  }

  // Медленное дыхание: масштаб 1.00-1.045, период около 14 секунд
  function breathe() {
    if (reduce) return;
    var t0 = performance.now();
    (function tick(t) {
      if (visible && scrollPx === 1) {
        zoom = 1.0225 + 0.0225 * Math.sin(((t - t0) / 14000) * Math.PI * 2 - Math.PI / 2);
        draw();
      }
      requestAnimationFrame(tick);
    })(t0);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(stage);
  }

  img.onload = function () {
    document.documentElement.classList.add('has-canvas');
    resize();
    intro();
  };
  if (img.complete && img.naturalWidth) img.onload();
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', onScroll, { passive: true });
})();
