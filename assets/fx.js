/* Herzaufschlag: kleine Effekte. Respektiert "Bewegung reduzieren". */
(function(){
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) Logo-Intro: Ball fliegt ins Herz, Herz schlägt einmal (einmal pro Sitzung)
  var logo = document.querySelector('.logo');
  if (logo && !calm) {
    var introKey = 'hza-intro:' + location.pathname.replace(/index\.html$/, '');
    var seen = false; try { seen = sessionStorage.getItem(introKey) === '1'; } catch(e) {}
    var sky = document.querySelector('.skyline');
    // Stadtseiten (mit Skyline) zeigen das Intro bei jedem Öffnen, die Startseite einmal pro Sitzung
    if (sky || !seen) {
      try { sessionStorage.setItem(introKey,'1'); } catch(e) {}
      if (sky) {
        // Erst zeichnet sich die Skyline, danach fliegt der Ball ins Herz
        var cn = document.querySelector('.city-name');
        logo.classList.add('pre'); sky.classList.add('draw');
        if (cn) { cn.classList.add('pre'); setTimeout(function(){ cn.classList.remove('pre'); cn.classList.add('show'); }, 1350); }
        setTimeout(function(){ logo.classList.remove('pre'); logo.classList.add('intro'); }, cn ? 1950 : 1500);
      } else logo.classList.add('intro');
    }
    logo.addEventListener('click', function(){ logo.classList.remove('intro'); void logo.offsetWidth; logo.classList.add('intro'); });
  }

  // 2) Spenden-Herz: füllt sich mit Welle; Vorschau füllt sich einmal, wenn der Ball trifft oder das Herz sichtbar wird
  document.querySelectorAll('.barometer').forEach(function(b){
    var liq = b.querySelector('.bm-liquid'), label = b.querySelector('.bm-pct');
    var preview = b.dataset.preview === 'true';
    var target = preview ? 72 : Math.max(0, Math.min(100, parseFloat(b.dataset.pct) || 0));
    var done = false;
    function set(p){ if (liq) liq.setAttribute('transform', 'translate(0,' + (112 - 112 * p / 100 - 6).toFixed(2) + ')'); }
    function show(p){ if (label) label.textContent = Math.round(p) + ' %'; }
    function fill(){
      if (done) return; done = true;
      if (calm) { set(target); show(target); return; }
      var t0 = performance.now(), dur = 2200;
      (function step(now){
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), p = target * e;
        set(p); show(p);
        if (k < 1) requestAnimationFrame(step); else { b.classList.remove('beat'); void b.offsetWidth; b.classList.add('beat'); }
      })(t0);
    }
    b.hzaFill = fill;
    set(0); if (label && !preview) show(0);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(en){ en.forEach(function(x){ if (x.isIntersecting && x.intersectionRatio > .9 && !document.querySelector('.fly-ball.on')) { fill(); io.disconnect(); } }); }, {threshold:[.9]});
      io.observe(b);
    } else fill();
  });

  // 3) Herz beim Antippen
  if (calm) return;
  var svg = '<svg viewBox="-4 -4 140 124" width="32" height="29" aria-hidden="true"><defs><mask id="tapm" maskUnits="userSpaceOnUse" x="-10" y="-10" width="160" height="140"><rect x="-10" y="-10" width="160" height="140" fill="white"/><circle cx="101" cy="27" r="26" fill="black"/></mask></defs><path d="M60 104 C 47 95, 10 70, 10 38 C 10 20, 23 9, 37 9 C 48 9, 56 16, 60 26 C 64 16, 72 9, 83 9 C 97 9, 110 20, 110 38 C 110 70, 73 95, 60 104 Z" fill="none" stroke="#C94E24" stroke-width="14" stroke-linejoin="round" mask="url(#tapm)"/><circle cx="101" cy="27" r="21" fill="#D9A62E"/></svg>';
  document.addEventListener('pointerdown', function(e){
    if (e.target.closest('input,textarea,select')) return;
    var h = document.createElement('span'); h.className = 'tap-heart'; h.innerHTML = svg;
    h.style.left = e.clientX + 'px'; h.style.top = e.clientY + 'px';
    document.body.appendChild(h); setTimeout(function(){ h.remove(); }, 750);
  }, { passive: true });
})();
/* Social-Symbole: Kanäle folgen noch */
(function(){
  var t=document.getElementById('toast'), timer;
  document.querySelectorAll('[data-soon]').forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault(); if(!t) return;
      t.textContent = a.getAttribute('data-soon') + ' folgt bald. Wir sind noch beim Aufwärmen 🎾';
      t.classList.add('show'); clearTimeout(timer); timer=setTimeout(function(){ t.classList.remove('show'); }, 2200);
    });
  });
})();

/* Scroll-Zoom fuer Fotos: Bild zoomt beim Reinscrollen sanft heraus */
(function(){
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = [].slice.call(document.querySelectorAll('.zoom-photo'));
  if (!els.length) return;
  var ticking = false;
  function update(){
    ticking = false;
    var vh = window.innerHeight;
    els.forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.height === 0) return;
      var p = (vh - r.top) / (vh + r.height);          /* 0 unten rein, 1 oben raus */
      p = Math.max(0, Math.min(1, p));
      var z = 1.22 - 0.22 * Math.min(1, p * 1.6) + 0.06 * Math.max(0, p - 0.62) / 0.38;
      el.style.setProperty('--z', z.toFixed(4));
    });
  }
  function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  window.addEventListener('hashchange', function(){ setTimeout(update, 60); });
  update(); setTimeout(update, 400);
})();

/* Fliegender Ball: fliegt beim Scrollen in Bögen über die Startseite und landet im Spenden-Herz */
(function(){
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var heart = document.getElementById('spendenherz'); if (!heart) return;
  var svgEl = heart.querySelector('svg');
  var ball = document.createElement('div'); ball.className = 'fly-ball'; ball.setAttribute('aria-hidden','true');
  ball.innerHTML = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#D9E021"/><circle cx="20" cy="20" r="18" fill="url(#fbg)"/><path d="M5 12 C 15 16, 15 24, 5 30 M35 10 C 25 15, 25 25, 35 30" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/><defs><radialGradient id="fbg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#7a7a00" stop-opacity=".35"/></radialGradient></defs></svg>';
  document.body.appendChild(ball);
  var landed = false, ticking = false, N = 5;
  function lerp(a,b,k){ return a + (b - a) * k; }
  function update(){
    ticking = false;
    var view = document.getElementById('view-start');
    if (!view || !view.classList.contains('active')) { ball.classList.remove('on'); return; }
    var vh = innerHeight, vw = document.documentElement.clientWidth;
    var r = svgEl.getBoundingClientRect();
    var hx = r.left + r.width / 2, hy = r.top + r.height * .45;
    var landY = vh * .55;
    var endScroll = Math.max(1, scrollY + (hy - landY));
    var t = Math.max(0, Math.min(1, scrollY / endScroll));
    if (t >= .985) {
      ball.classList.remove('on');
      if (!landed) { landed = true; if (heart.hzaFill) heart.hzaFill(); }
      return;
    }
    ball.classList.add('on');
    var seg = Math.min(N - 1, Math.floor(t * N)), u = t * N - seg;
    var xs = [], ys = [];
    for (var i = 0; i <= N; i++) { xs.push(i === N ? hx : (i % 2 ? vw * .14 : vw * .84)); ys.push(i === N ? hy : lerp(vh * .22, landY, i / N)); }
    var x = lerp(xs[seg], xs[seg + 1], u);
    var amp = vh * (seg === N - 1 ? .16 : .2);
    var y = lerp(ys[seg], ys[seg + 1], u) - Math.sin(Math.PI * u) * amp;
    var sq = (u < .06 || u > .94) && seg > 0 ? .82 : 1;
    var sc = seg === N - 1 ? lerp(1, .7, u) : 1;
    ball.style.transform = 'translate(' + (x - 13).toFixed(1) + 'px,' + (y - 13).toFixed(1) + 'px) rotate(' + (t * 900).toFixed(0) + 'deg) scale(' + (sc).toFixed(3) + ',' + (sc * sq).toFixed(3) + ')';
  }
  function req(){ if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', req, {passive:true}); addEventListener('resize', req);
  addEventListener('hashchange', function(){ setTimeout(update, 80); });
  setTimeout(update, 300); update();
})();
