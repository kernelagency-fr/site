/* ============================================================
   KERNEL — SYMBOLES GÉNÉRATIFS (l'univers du noyau, après le hero)
   - Offre : pictogrammes en points corail/lilas, assemblage au reveal
   - Méthode : filament de particules reliant les 4 étapes (nœuds ancrés)
   - Atmosphère : poussière du noyau en dérive lente sur les fonds clairs
   - Preuve : orbite elliptique esquissée autour du méta (écho glyphe IA)
   - Contact : nuée corail/lilas lumineuse dans la nuit, autour du halo
   Script classique, aucun module, aucune dépendance.
   Se branche sur la boucle rAF unique de main.js via
   window.KernelSymbols.tick(tMs). IntersectionObserver : rien ne se
   dessine hors écran. prefers-reduced-motion : états finaux statiques.
   ============================================================ */
(function(){
'use strict';

var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var mobile  = window.innerWidth < 700;
var DPR     = Math.min(window.devicePixelRatio || 1, 1.8);

var CORAL = '#FF7A59', LILAC = '#B79CFF';

var units = [];                 /* {tick:function(tSecondes)} */

/* souris partagée (pointeurs fins uniquement) */
var mouse = {x:-1e4, y:-1e4};
if(window.matchMedia('(hover:hover)').matches && !reduced){
  document.addEventListener('mousemove', function(e){
    mouse.x = e.clientX; mouse.y = e.clientY;
  }, {passive:true});
}

/* version de géométrie : les rects sont mis en cache hors boucle rAF
   et invalidés seulement quand le viewport bouge réellement */
var geomV = 1;
if(!reduced){
  window.addEventListener('scroll', function(){ geomV++; }, {passive:true});
  window.addEventListener('resize', function(){ geomV++; }, {passive:true});
}

/* mulberry32 : formes déterministes, identiques à chaque visite */
function rng(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function clamp01(u){ return u < 0 ? 0 : (u > 1 ? 1 : u); }
function easeOut(u){ u = clamp01(u); return 1 - Math.pow(1-u, 3); }
function makeCanvas(cls){
  var c = document.createElement('canvas');
  c.className = cls; c.setAttribute('aria-hidden', 'true');
  return c;
}
function setSize(c, w, h){
  c.width  = Math.max(1, Math.round(w*DPR));
  c.height = Math.max(1, Math.round(h*DPR));
  c.style.width = w + 'px'; c.style.height = h + 'px';
}

/* ============================================================
   1. PICTOGRAMMES D'OFFRE — signature en bas de carte (140px)
      Points : 2 rayons quantifiés, corail dominant + lilas ~15 %
   ============================================================ */
function initGlyph(card, kind, seed){
  var CS = 140;                 /* canvas : la signature de la carte */
  var O  = 32;                  /* décalage : formes définies en espace 0..76 */
  var C  = 38;                  /* centre des formes */
  var SC = 1.7;                 /* agrandissement autour du centre */
  var TILT = -0.5;              /* inclinaison des orbites du mini-noyau */
  var R_S = 1.5, R_L = 2.1;     /* les 2 seuls rayons de points */

  var canvas = makeCanvas('glyph');
  card.appendChild(canvas);
  setSize(canvas, CS, CS);
  var ctx = canvas.getContext('2d');
  var rand = rng(seed);

  function P(x, y, o){
    o = o || {};
    return {
      x:x, y:y,
      r: o.r || (rand() < 0.7 ? R_S : R_L),
      c: o.c || (rand() < 0.85 ? CORAL : LILAC),
      seed: rand(),
      ph: rand()*Math.PI*2,
      wf: 0.55 + rand()*0.85,
      sx: C + Math.cos(rand()*Math.PI*2)*(26 + rand()*30),
      sy: C + Math.sin(rand()*Math.PI*2)*(26 + rand()*30),
      orbit: o.orbit || null
    };
  }
  function rect(x0,y0,x1,y1,n,out){
    var per = 2*((x1-x0)+(y1-y0));
    for(var i=0;i<n;i++){
      var d = (i/n)*per, x, y;
      if(d < (x1-x0)){ x = x0+d; y = y0; }
      else if(d < (x1-x0)+(y1-y0)){ x = x1; y = y0 + (d-(x1-x0)); }
      else if(d < 2*(x1-x0)+(y1-y0)){ x = x1-(d-(x1-x0)-(y1-y0)); y = y1; }
      else { x = x0; y = y1-(d-2*(x1-x0)-(y1-y0)); }
      out.push(P(x,y));
    }
  }
  function row(x0,x1,y,n,out){
    for(var i=0;i<n;i++) out.push(P(x0+(x1-x0)*(n===1?0:i/(n-1)), y));
  }
  function build(){
    var o = [];
    if(kind === 'site'){
      /* cadre de navigateur / viewport */
      rect(10,16,66,60,30,o);
      row(14,62,27,8,o);                          /* barre d'outils */
      o.push(P(16,21.5,{c:CORAL, r:R_L}));        /* pastilles fenêtre */
      o.push(P(21.5,21.5,{c:LILAC, r:R_S}));
      o.push(P(27,21.5,{c:CORAL, r:R_S}));
      row(17,49,38,5,o); row(17,41,46,4,o);       /* contenu esquissé */
    } else if(kind === 'app'){
      /* blocs imbriqués */
      rect(12,12,46,46,22,o);
      rect(30,30,64,64,22,o);
      o.push(P(35,35)); o.push(P(41,35));          /* jonction des blocs */
      o.push(P(35,41)); o.push(P(41,41));
    } else {
      /* mini-noyau lisible : distance minimale entre points du cœur */
      var placed = [], tries = 0;
      while(placed.length < 12 && tries < 600){
        tries++;
        var a = rand()*Math.PI*2, rr = Math.pow(rand(),0.6)*5;
        var px = C + Math.cos(a)*rr, py = C + Math.sin(a)*rr, ok = true;
        for(var j=0;j<placed.length;j++){
          var ddx = px - placed[j].x, ddy = py - placed[j].y;
          if(ddx*ddx + ddy*ddy < 10.5){ ok = false; break; }
        }
        if(ok) placed.push({x:px, y:py});
      }
      placed.forEach(function(q){ o.push(P(q.x, q.y)); });
      /* points en orbite (rotation lente continue) */
      var rings = [{r:16,t:0.55,n:4,s:0.5},{r:26,t:0.42,n:7,s:-0.3}];
      rings.forEach(function(g, gi){
        for(var k=0;k<g.n;k++)
          o.push(P(C, C, {r: rand() < 0.7 ? R_S : R_L,
            orbit:{r:g.r, tilt:g.t, speed:g.s, a0:(k/g.n)*Math.PI*2 + gi}}));
      });
    }
    return o;
  }

  var pts = build();
  var revealAt = -1, visible = false;
  var mrect = null, mrectV = -1;

  function draw(t){
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,CS,CS);
    if(revealAt < 0) return;
    ctx.translate(O,O);
    var mr = null;
    if(mouse.x > -9000){
      if(mrectV !== geomV){ mrect = canvas.getBoundingClientRect(); mrectV = geomV; }
      mr = mrect;
    }
    if(kind === 'ia'){
      /* orbites esquissées, filet très pâle */
      ctx.strokeStyle = 'rgba(33,26,56,0.10)';
      ctx.lineWidth = 0.7;
      [{r:16,t:0.55},{r:26,t:0.42}].forEach(function(g){
        ctx.beginPath();
        ctx.ellipse(C, C, g.r*SC, g.r*g.t*SC, TILT, 0, Math.PI*2);
        ctx.stroke();
      });
    }
    for(var i=0;i<pts.length;i++){
      var p = pts[i];
      var u = reduced ? 1 : easeOut((t - revealAt - p.seed*0.55)/0.85);
      if(u <= 0) continue;
      var tx = p.x, ty = p.y;
      if(p.orbit){
        var a = p.orbit.a0 + (reduced ? 2.1 : t)*p.orbit.speed;
        var ex = Math.cos(a)*p.orbit.r, ey = Math.sin(a)*p.orbit.r*p.orbit.tilt;
        tx = C + ex*Math.cos(TILT) - ey*Math.sin(TILT);
        ty = C + ex*Math.sin(TILT) + ey*Math.cos(TILT);
      } else if(u >= 1 && !reduced){
        /* vie lente : dérive subtile autour de la position d'ancrage */
        tx += Math.sin(t*p.wf + p.ph)*0.38;
        ty += Math.cos(t*p.wf*0.9 + p.ph)*0.38;
      }
      var x = p.sx + (tx - p.sx)*u, y = p.sy + (ty - p.sy)*u;
      /* agrandissement centré sur la forme */
      x = C + (x - C)*SC; y = C + (y - C)*SC;
      if(mr){
        var dx = x + O - (mouse.x - mr.left), dy = y + O - (mouse.y - mr.top);
        var d2 = dx*dx + dy*dy;
        if(d2 < 4900 && d2 > 0.01){
          var d = Math.sqrt(d2), f = (1 - d/70)*5;
          x += dx/d*f; y += dy/d*f;
        }
      }
      ctx.globalAlpha = 0.92*u;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if(reduced){ revealAt = 0; draw(0); return; }

  var io = new IntersectionObserver(function(en){
    visible = en[0].isIntersecting;
    if(visible && revealAt < 0) revealAt = performance.now()/1000;
  }, {threshold:0.2});
  io.observe(card);
  units.push({tick:function(t){ if(visible) draw(t); }});
}

/* ============================================================
   2. FILAMENT DE MÉTHODE — le courant qui traverse le noyau
   ============================================================ */
function initFilament(){
  var method = document.getElementById('methode');
  if(!method) return;
  var steps = [].slice.call(method.querySelectorAll('.method-step'));
  if(!steps.length) return;

  var canvas = makeCanvas('method-canvas');
  method.insertBefore(canvas, method.firstChild);
  var ctx = canvas.getContext('2d');
  var rand = rng(77);
  var nodes = [], path = [], segs = [], total = 0, W = 0, H = 0;

  /* offsets cumulés jusqu'à la section (l'ol est lui-même positionné) */
  function offAcc(el){
    var x = 0, y = 0;
    while(el && el !== method){ x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return {x:x, y:y};
  }
  function layout(){
    W = method.clientWidth; H = method.clientHeight;
    setSize(canvas, W, H);
    nodes = steps.map(function(s){
      var o = offAcc(s);
      /* nœud ancré sur le filet (border-top) de l'étape */
      return {x: o.x + 2, y: o.y + 0.5, w: s.offsetWidth};
    });
    /* colonne unique : filament décalé dans la gouttière, hors du texte */
    var vertical = nodes.every(function(n){ return Math.abs(n.x - nodes[0].x) < 2; });
    if(vertical) nodes.forEach(function(n){ n.x = Math.max(10, n.x - 12); });
    /* chemin orthogonal : jamais de diagonale à travers le texte */
    path = [{x:nodes[0].x, y:nodes[0].y}];
    for(var i=1;i<nodes.length;i++){
      var a = path[path.length-1], b = nodes[i];
      if(Math.abs(b.y - a.y) > 2 && Math.abs(b.x - a.x) > 2){
        path.push({x:a.x - 14, y:a.y});
        path.push({x:a.x - 14, y:b.y});
      }
      path.push({x:b.x, y:b.y});
    }
    var last = nodes[nodes.length-1], prev = path[path.length-2];
    if(Math.abs(last.y - prev.y) < 2) path.push({x:last.x + last.w*0.94, y:last.y});
    else path.push({x:last.x, y:last.y + 90});

    segs = []; total = 0;
    for(var j=0;j<path.length-1;j++){
      var dx = path[j+1].x - path[j].x, dy = path[j+1].y - path[j].y;
      var len = Math.sqrt(dx*dx + dy*dy);
      if(len < 1) continue;
      segs.push({x:path[j].x, y:path[j].y, dx:dx/len, dy:dy/len, len:len, off:total});
      total += len;
    }
  }

  var N = mobile ? 22 : 46;
  var parts = [];
  for(var i=0;i<N;i++){
    parts.push({
      u: rand(), v: 14 + rand()*30,
      r: 0.9 + rand()*1.3,
      c: rand() < 0.72 ? CORAL : LILAC,
      a: 0.32 + rand()*0.5,
      ph: rand()*Math.PI*2, amp: 1 + rand()*2.2
    });
  }
  function posAt(d){
    for(var j=0;j<segs.length;j++){
      var s = segs[j];
      if(d <= s.off + s.len || j === segs.length-1){
        var k = d - s.off;
        return {x:s.x + s.dx*k, y:s.y + s.dy*k, nx:-s.dy, ny:s.dx};
      }
    }
    return {x:0, y:0, nx:0, ny:1};
  }

  var lit = steps.map(function(){ return -1; });
  var visible = false;

  function draw(t){
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,W,H);
    if(!segs.length) return;
    /* trace du courant */
    ctx.strokeStyle = 'rgba(194,68,32,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for(var j=1;j<path.length;j++) ctx.lineTo(path[j].x, path[j].y);
    ctx.stroke();
    /* particules en circulation */
    for(var i=0;i<parts.length;i++){
      var p = parts[i];
      var d = reduced ? (p.u*total) : ((p.u*total + t*p.v) % total);
      var q = posAt(d);
      var wob = reduced ? 0 : Math.sin(t*1.3 + p.ph)*p.amp;
      ctx.globalAlpha = reduced ? p.a : p.a*(0.7 + 0.3*Math.sin(t*0.9 + p.ph));
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(q.x + q.nx*wob, q.y + q.ny*wob, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    /* nœuds d'étape — même langage que les orbites du glyphe IA */
    for(var n=0;n<nodes.length;n++){
      var nd = nodes[n], lt = reduced ? 0 : lit[n];
      if(lt < 0){
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = 'rgba(33,26,56,1)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 3, 0, Math.PI*2); ctx.stroke();
        continue;
      }
      var age = reduced ? 9 : (t - lt);
      /* anneau net 1px */
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = CORAL;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, 7, 0, Math.PI*2); ctx.stroke();
      /* point plein */
      ctx.globalAlpha = 1;
      ctx.fillStyle = CORAL;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, 2.5 + (reduced ? 0 : 0.4*Math.sin(t*2 + n*1.7)), 0, Math.PI*2);
      ctx.fill();
      var pulse = Math.max(0, 1 - age/1.1);                    /* onde d'allumage */
      if(pulse > 0){
        ctx.globalAlpha = pulse*0.5;
        ctx.strokeStyle = CORAL;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 8 + (1-pulse)*16, 0, Math.PI*2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* recalage hors boucle rAF : resize + chargement des polices */
  function refresh(){ layout(); if(reduced) draw(0); }
  layout();
  window.addEventListener('resize', refresh);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

  if(reduced){ draw(0); return; }
  steps.forEach(function(s, i){
    var io = new IntersectionObserver(function(en){
      if(en[0].isIntersecting && lit[i] < 0){
        lit[i] = performance.now()/1000;
        io.unobserve(s);
      }
    }, {threshold:0.35});
    io.observe(s);
  });
  new IntersectionObserver(function(en){ visible = en[0].isIntersecting; })
    .observe(method);
  units.push({tick:function(t){ if(visible) draw(t); }});
}

/* ============================================================
   3. ATMOSPHÈRE — la poussière du noyau accompagne le scroll
      Positions normalisées : aucun resize ne régénère les points
   ============================================================ */
function initAtmos(){
  var canvas = makeCanvas('atmos');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var rand = rng(2026);
  var W = 0, H = 0;

  var N = mobile ? 16 : 42;
  var pts = [];
  for(var i=0;i<N;i++){
    pts.push({
      nx: rand(), ny: rand(),          /* position normalisée 0..1 */
      vx: (rand()-0.5)*5, vy: (rand()-0.5)*4,   /* dérive en px/s */
      r: 0.8 + rand()*1.6,
      c: rand() < 0.62 ? CORAL : LILAC,
      a: 0.06 + rand()*0.11,
      ph: rand()*Math.PI*2
    });
  }
  function layout(){
    W = window.innerWidth; H = window.innerHeight;
    setSize(canvas, W, H);
  }
  layout();
  window.addEventListener('resize', function(){ layout(); if(reduced) draw(0); });

  var lastT = 0, cleared = true;
  function draw(t){
    /* n'apparaît qu'une fois le hero quitté (son canvas a sa propre poussière) */
    var g = clamp01((window.scrollY - H*0.35)/(H*0.5));
    if(g <= 0){
      if(!cleared){
        ctx.setTransform(DPR,0,0,DPR,0,0);
        ctx.clearRect(0,0,W,H);
        cleared = true;
      }
      lastT = t; return;
    }
    cleared = false;
    var dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
    var par = window.scrollY*0.05;    /* parallaxe douce liée au scroll */
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<pts.length;i++){
      var p = pts[i];
      if(!reduced){ p.nx += p.vx*dt/W; p.ny += p.vy*dt/H; }
      var x = (((p.nx % 1) + 1) % 1) * W;
      var y = (((p.ny - par/H) % 1) + 1) % 1 * H;
      ctx.globalAlpha = g * p.a * (reduced ? 1 : (0.7 + 0.3*Math.sin(t*0.5 + p.ph)));
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if(reduced){
    var queued = false;
    var redraw = function(){ queued = false; draw(0); };
    window.addEventListener('scroll', function(){
      if(!queued){ queued = true; requestAnimationFrame(redraw); }
    }, {passive:true});
    draw(0);
    return;
  }
  units.push({tick:draw});
}

/* ============================================================
   4. PREUVE — orbite elliptique autour de « 1 client livré »
      Le méta devient le premier satellite du noyau (écho glyphe IA)
   ============================================================ */
function initConstellation(){
  var meta = document.querySelector('.proof-meta');
  if(!meta || !meta.parentNode) return;
  var wrap = document.createElement('div');
  wrap.className = 'proof-orbit';
  meta.parentNode.insertBefore(wrap, meta);
  wrap.appendChild(meta);
  var canvas = makeCanvas('constellation');
  wrap.insertBefore(canvas, meta);
  var ctx = canvas.getContext('2d');
  var rand = rng(303);
  var W = 0, H = 0;
  var ROT = -0.06;              /* même esquisse inclinée que le glyphe IA */

  /* 2 orbites, l'étoile corail au zénith de l'orbite externe,
     satellites en dérive très lente */
  var sats = [];
  for(var i=0;i<5;i++)
    sats.push({ring:1, a0:-Math.PI/2 + (i+1)/6*Math.PI*2 + (rand()-0.5)*0.3,
      r: rand() < 0.7 ? 1.25 : 1.7, lil: i % 3 === 0, sp: 0.04});
  for(var k=0;k<3;k++)
    sats.push({ring:0.62, a0: k/3*Math.PI*2 + 0.7 + (rand()-0.5)*0.3,
      r: rand() < 0.7 ? 1.25 : 1.7, lil: k === 1, sp: -0.05});

  var tw = 0, th = 14;          /* boîte du texte du méta (mesurée hors rAF) */
  function measure(){
    try{
      var r = document.createRange();
      r.selectNodeContents(meta);
      var b = r.getBoundingClientRect();
      tw = b.width; th = b.height;
    }catch(e){ tw = 0; }
  }
  function layout(){
    W = Math.min(520, Math.floor(window.innerWidth*0.92));
    H = 120;
    setSize(canvas, W, H);
    measure();
  }
  layout();
  if(document.fonts && document.fonts.ready)
    document.fonts.ready.then(function(){ measure(); if(reduced) draw(0); });

  var revealAt = -1, visible = false;

  function ptOn(ring, a){
    var rx = W*0.46*ring, ry = H*0.38*ring;
    var ex = Math.cos(a)*rx, ey = Math.sin(a)*ry;
    return {x: W/2 + ex*Math.cos(ROT) - ey*Math.sin(ROT),
            y: H/2 + ex*Math.sin(ROT) + ey*Math.cos(ROT)};
  }

  function draw(t){
    var u = reduced ? 1 : easeOut((t - revealAt)/1.2);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,W,H);
    if(revealAt < 0 || u <= 0) return;
    /* le méta masque l'orbite : rien ne se dessine sur le texte */
    ctx.save();
    if(tw > 0){
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.rect(W/2 - tw/2 - 10, H/2 - th/2 - 4, tw + 20, th + 8);
      ctx.clip('evenodd');
    }
    /* orbites esquissées — trait 0.7px, comme le glyphe IA */
    ctx.lineWidth = 0.7;
    [1, 0.62].forEach(function(ring, ri){
      ctx.globalAlpha = u*(ri === 0 ? 1 : 0.6);
      ctx.strokeStyle = 'rgba(33,26,56,0.15)';
      ctx.beginPath();
      ctx.ellipse(W/2, H/2, W*0.46*ring, H*0.38*ring, ROT, 0, Math.PI*2);
      ctx.stroke();
    });
    /* satellites (passent « derrière » le méta) */
    for(var i=0;i<sats.length;i++){
      var s = sats[i];
      var q = ptOn(s.ring, s.a0 + (reduced ? 0 : t*s.sp));
      ctx.globalAlpha = u*0.8;
      ctx.fillStyle = s.lil ? LILAC : 'rgba(33,26,56,0.55)';
      ctx.beginPath(); ctx.arc(q.x, q.y, s.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
    /* l'étoile corail : le client livré, au zénith */
    var m = ptOn(1, -Math.PI/2);
    var pu = reduced ? 0 : Math.sin(t*1.4);
    ctx.globalAlpha = u*(0.20 + 0.06*pu);
    ctx.fillStyle = CORAL;
    ctx.beginPath(); ctx.arc(m.x, m.y, 8.5 + pu, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = u;
    ctx.beginPath(); ctx.arc(m.x, m.y, 2.6 + 0.3*pu, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  window.addEventListener('resize', function(){ layout(); if(reduced) draw(0); });
  if(reduced){ revealAt = 0; draw(0); return; }

  new IntersectionObserver(function(en){
    visible = en[0].isIntersecting;
    if(visible && revealAt < 0) revealAt = performance.now()/1000;
  }, {threshold:0.4}).observe(wrap);
  units.push({tick:function(t){ if(visible) draw(t); }});
}

/* ============================================================
   5. CONTACT — la nuée : l'écho du noyau du hero, en négatif nuit
      Points corail/lilas lumineux orbitant autour du halo
   ============================================================ */
function initContact(){
  var contact = document.querySelector('.contact');
  if(!contact) return;
  var canvas = makeCanvas('contact-nuee');
  var halo = contact.querySelector('.contact-halo');
  contact.insertBefore(canvas, halo ? halo.nextSibling : contact.firstChild);
  var ctx = canvas.getContext('2d');
  var rand = rng(4242);
  var W = 0, H = 0;

  function layout(){
    W = contact.clientWidth; H = contact.clientHeight;
    setSize(canvas, W, H);
  }

  var N = mobile ? 22 : 56;
  var pts = [];
  for(var i=0;i<N;i++){
    pts.push({
      rr: 0.14 + Math.pow(rand(), 0.8)*0.76,     /* rayon d'orbite normalisé */
      a0: rand()*Math.PI*2,
      sp: (rand() < 0.5 ? -1 : 1)*(0.03 + rand()*0.06),
      r: rand() < 0.65 ? 1.2 : 1.9,
      c: rand() < 0.66 ? CORAL : LILAC,
      a: 0.15 + rand()*0.2,
      ph: rand()*Math.PI*2
    });
  }

  function draw(t){
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,W,H);
    var cx = W/2, cy = H/2;
    for(var i=0;i<pts.length;i++){
      var p = pts[i];
      var a = p.a0 + (reduced ? 0 : t*p.sp);
      var x = cx + Math.cos(a)*p.rr*W*0.55;
      var y = cy + Math.sin(a)*p.rr*H*0.60;
      ctx.globalAlpha = reduced ? p.a : p.a*(0.72 + 0.28*Math.sin(t*0.7 + p.ph));
      ctx.shadowColor = p.c;
      ctx.shadowBlur = 9;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  layout();
  window.addEventListener('resize', function(){ layout(); if(reduced) draw(0); });
  if(document.fonts && document.fonts.ready)
    document.fonts.ready.then(function(){ layout(); if(reduced) draw(0); });

  if(reduced){ draw(0); return; }
  var visible = false;
  new IntersectionObserver(function(en){ visible = en[0].isIntersecting; })
    .observe(contact);
  units.push({tick:function(t){ if(visible) draw(t); }});
}

/* ============================================================
   Initialisation + API pour la boucle rAF de main.js
   ============================================================ */
var cards = document.querySelectorAll('.offer-card');
var kinds = ['site', 'app', 'ia'];
Array.prototype.forEach.call(cards, function(card, i){
  initGlyph(card, kinds[i] || 'ia', 11 + i*17);
});
initFilament();
initConstellation();
initContact();
initAtmos();

window.KernelSymbols = {
  active: !reduced && units.length > 0,
  tick: function(tMs){
    var t = tMs/1000;
    for(var i=0;i<units.length;i++) units[i].tick(t);
  }
};
})();
