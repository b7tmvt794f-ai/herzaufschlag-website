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

/* Roter Faden: wächst beim Scrollen. Orte und Zusagen wechseln sich ab.
   Neue Zusage oder neuer Partner = ein Eintrag in <script id="faden-data"> (hannover/index.html). */
(function(){
  var fig = document.querySelector('.faden[data-live]');
  var dataEl = document.getElementById('faden-data');
  if (!fig || !dataEl) return;
  var items; try { items = JSON.parse(dataEl.textContent); } catch(e) { return; }
  var svg = fig.querySelector('svg'), NS = 'http://www.w3.org/2000/svg';
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Strich-Icons (viewBox 300 x 200), Stil wie Logo und Skyline
  var ICON = {
    rathaus: 'M20 190H280M40 190V122H260V190M40 122V100H72V122M228 122V100H260V122M112 122V96H188V122M112 96Q150 28 188 96M142 52V40H158V52M150 40V16M138 190V164Q150 148 162 164V190',
    maschsee: 'M150 30V142M156 44L206 138H156M104 150H224L206 170H124ZM30 186q20 -14 40 0t40 0t40 0t40 0t40 0t40 0',
    eilenriede: 'M20 190H280M100 190V128M160 190V118M222 190V132M62 92a38 38 0 1 0 76 0a38 38 0 1 0 -76 0M112 70a48 48 0 1 0 96 0a48 48 0 1 0 -96 0M186 98a36 36 0 1 0 72 0a36 36 0 1 0 -72 0',
    herrenhausen: 'M150 172V26M150 30Q128 58 118 112M150 30Q172 58 182 112M150 48Q116 84 102 146M150 48Q184 84 198 146M28 192L44 132L60 192M240 192L256 132L272 192M72 180a78 12 0 1 0 156 0a78 12 0 1 0 -156 0',
    marktkirche: 'M20 190H280M118 190V64H178V190M118 64L148 12L178 64M118 64L133 48L148 64L163 48L178 64M178 190V112H268V190M178 112L223 78L268 112M140 190V166Q148 154 156 166V190',
    skyline: 'M10 180H40V60M34 60H46M40 60V28M40 180V150H70V160H86V140H100M100 140Q122 98 144 140M122 112V96M144 140H160V150H178V130M172 130H184M178 130V104M170 112H186M178 180V150H200V160H216V140H232V180M232 180q8 -6 16 0t16 0t16 0t16 0'
  };
  var HEART = 'M60 104 C 47 95, 10 70, 10 38 C 10 20, 23 9, 37 9 C 48 9, 56 16, 60 26 C 64 16, 72 9, 83 9 C 97 9, 110 20, 110 38 C 110 70, 73 95, 60 104 Z';

  var W = 640, Y0 = 190, ROW = 210, XS = [170, 470];
  var all = items.concat([{ typ: 'herz', name: 'Für die Kinder' }]);
  var rows = Math.ceil(all.length / 2), H = Y0 + (rows - 1) * ROW + 40;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('aria-label', 'Ein roter Faden durch Hannover: ' + all.map(function(i){ return i.name; }).join(', '));
  svg.innerHTML = '';

  function el(tag, attrs, parent){ var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; }
  function label(g, x, y, t){ var tx = el('text', { x: x, y: y }, g); tx.textContent = t; }

  // Faden: Schlangenlinie, Zeile für Zeile, abwechselnd nach rechts und links
  var d = 'M0 ' + Y0, pos = [];
  all.forEach(function(it, i){
    var r = Math.floor(i / 2), ltr = r % 2 === 0, slot = i % 2;
    var x = ltr ? XS[slot] : XS[1 - slot], y = Y0 + r * ROW;
    pos.push({ x: x, y: y });
  });
  for (var r = 0; r < rows; r++) {
    var y = Y0 + r * ROW, ltr = r % 2 === 0, last = r === rows - 1;
    if (!last) {
      d += ltr ? ' H600 C640 ' + y + ' 640 ' + (y + ROW) + ' 600 ' + (y + ROW)
               : ' H40 C0 ' + y + ' 0 ' + (y + ROW) + ' 40 ' + (y + ROW);
    } else {
      var hp = pos[pos.length - 1], dir = ltr ? 1 : -1;
      d += ' H' + (hp.x - dir * 70) + ' C' + (hp.x - dir * 20) + ' ' + y + ' ' + hp.x + ' ' + (y - 20) + ' ' + hp.x + ' ' + (y - 62);
    }
  }
  var thread = el('path', { 'class': 'thread', d: d });

  // Stationen
  var nodes = all.map(function(it, i){
    var p = pos[i], cy = p.y - 96, g;
    var wrap = (it.href || it.video) ? el('a', { href: it.video || it.href, 'class': 'st-link' + (it.video ? ' has-video' : '') }) : svg;
    g = el('g', { 'class': 'st st-' + it.typ }, wrap);
    if (it.typ === 'ort') {
      el('path', { d: ICON[it.icon] || ICON.skyline, transform: 'translate(' + (p.x - 75) + ' ' + (cy - 50) + ') scale(.5)' }, g);
    } else if (it.typ === 'anlage' || it.typ === 'partner') {
      var cid = 'fc' + i;
      var cp = el('clipPath', { id: cid }, el('defs', {}, g)); el('circle', { cx: p.x, cy: cy, r: 44 }, cp);
      el('circle', { 'class': 'disc' + (it.dark ? ' dark' : ''), cx: p.x, cy: cy, r: 44 }, g);
      if (it.logo) el('image', { href: it.logo, x: p.x - 44, y: cy - 44, width: 88, height: 88, 'clip-path': 'url(#' + cid + ')', preserveAspectRatio: 'xMidYMid slice' }, g);
      else { var t = el('text', { 'class': 'in', x: p.x, y: cy - 4 }, g); (it.text || it.name).split('|').forEach(function(w, k){ var s = el('tspan', { x: p.x, dy: k ? 24 : 0 }, t); s.textContent = w; }); }
      el('circle', { 'class': 'rim', cx: p.x, cy: cy, r: 48 }, g);
      if (it.zugesagt !== false) { el('circle', { 'class': 'ok', cx: p.x + 36, cy: cy + 36, r: 14 }, g); el('path', { 'class': 'okv', d: 'M' + (p.x + 30) + ' ' + (cy + 36) + 'l4 4 l8 -8' }, g); }
      if (it.video) el('path', { 'class': 'play', d: 'M' + (p.x - 7) + ' ' + (cy - 10) + 'v20l17 -10z' }, g);
    } else if (it.typ === 'offen') {
      el('circle', { 'class': 'dash', cx: p.x, cy: cy, r: 46 }, g);
      el('path', { d: 'M' + p.x + ' ' + (cy - 14) + 'v28M' + (p.x - 14) + ' ' + cy + 'h28' }, g);
    } else {
      var hg = el('g', { transform: 'translate(' + (p.x - 42) + ' ' + (cy - 30) + ') scale(.7)' }, g);
      el('path', { d: HEART }, hg); el('circle', { 'class': 'ball', cx: 101, cy: 27, r: 15 }, hg);
      g.classList.add('heart');
    }
    label(g, p.x, it.typ === 'herz' ? p.y + 34 : p.y - 22, it.name);   // Herz: Text unter den Faden, der von unten ins Herz läuft
    return g;
  });

  // Länge des Fadens bis zu jeder Station (für das Aufdecken beim Scrollen)
  var total = thread.getTotalLength(), N = 240, samples = [];
  for (var k = 0; k <= N; k++) { var L = total * k / N, pt = thread.getPointAtLength(L); samples.push({ L: L, x: pt.x, y: pt.y }); }
  var at = pos.map(function(p, i){
    var best = 0, bd = 1e9;
    samples.forEach(function(s){ var dd = Math.abs(s.x - p.x) + Math.abs(s.y - p.y) * 3; if (dd < bd) { bd = dd; best = s.L; } });
    return i === pos.length - 1 ? total : best;
  });
  thread.style.strokeDasharray = total; 

  function show(len){
    thread.style.strokeDashoffset = Math.max(0, total - len);
    nodes.forEach(function(n, i){ if (len >= at[i] - 4) n.classList.add('on'); });
  }
  if (calm || !('IntersectionObserver' in window)) { show(total); return; }

  var drawn = 0, ticking = false;
  function update(){
    ticking = false;
    var rect = svg.getBoundingClientRect(), vh = window.innerHeight || 800;
    var yView = (vh * 0.72 - rect.top) * (H / rect.height);       // Faden folgt dem Blick, etwas unter Bildschirmmitte
    var len = 0; for (var i = 0; i < samples.length; i++) { if (samples[i].y <= yView) len = samples[i].L; else if (samples[i].y > yView + ROW) break; }
    if (len > drawn) { drawn = len; show(drawn); }
    if (drawn >= total) window.removeEventListener('scroll', onScroll);
  }
  function onScroll(){ if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  show(0);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('click', function(){ setTimeout(update, 50); });   // Wechsel zwischen den Bereichen der App
  update();

  // Kurzvideo einer Anlage (sobald vorhanden) groß abspielen
  svg.addEventListener('click', function(e){
    var a = e.target.closest('a.has-video'); if (!a) return;
    e.preventDefault();
    var dlg = document.createElement('dialog'); dlg.className = 'faden-video';
    dlg.innerHTML = '<video src="' + a.getAttribute('href') + '" autoplay playsinline controls></video><button type="button" aria-label="Schließen">×</button>';
    document.body.appendChild(dlg); dlg.showModal();
    dlg.addEventListener('close', function(){ dlg.remove(); });
    dlg.querySelector('button').onclick = function(){ dlg.close(); };
  });
})();
