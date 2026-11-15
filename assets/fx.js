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

  // 2) Spenden-Herz: füllt sich einmal, wenn das Herz sichtbar wird
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
      var io = new IntersectionObserver(function(en){ en.forEach(function(x){ if (x.isIntersecting && x.intersectionRatio > .9) { fill(); io.disconnect(); } }); }, {threshold:[.9]});
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
      t.textContent = a.getAttribute('data-soon') + ' folgt bald. Wir sind noch beim Aufwärmen';
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

/* Roter Faden: Linie zeichnet sich einmal, sobald die Grafik sichtbar ist */
(function(){
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  document.querySelectorAll('.faden').forEach(function(f){
    f.classList.add('pre');
    var io = new IntersectionObserver(function(en){ en.forEach(function(x){
      if (x.isIntersecting) { io.disconnect(); requestAnimationFrame(function(){ f.classList.remove('pre'); f.classList.add('draw'); }); }
    }); }, {threshold:.5});
    io.observe(f);
  });
})();
