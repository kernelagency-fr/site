/* ============================================================
   KERNEL — SYMBOLES GÉNÉRATIFS (l'univers du noyau, après le hero)
   - Offre : LE NOYAU QUI SE RÉORGANISE — un seul nuage de particules
     sticky qui s'assemble à l'entrée de section (nuage -> wireframe)
     puis morphe entre 4 formations (wireframe de site, écrans d'app
     reliés, fenêtre de code ⁄03, pipeline de flux ⁄04), piloté par le scroll
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
var mouse = {x:-1e4, y:-1e4, r:1};
if(window.matchMedia('(hover:hover)').matches && !reduced){
  document.addEventListener('mousemove', function(e){
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.r = 1;
  }, {passive:true});
}
/* tactile : mêmes particules, rayon élargi (le doigt masque ce qu'il touche),
   écouteurs passifs — le défilement reste intact ; relâche douce au lever
   (les particules reviennent d'elles-mêmes par leur propre amortissement) */
if(!reduced){
  var onTouch = function(e){
    var t = e.touches[0]; if(!t) return;
    mouse.x = t.clientX; mouse.y = t.clientY; mouse.r = 1.45;
  };
  var offTouch = function(){ mouse.x = -1e4; mouse.y = -1e4; };
  document.addEventListener('touchstart',  onTouch,  {passive:true});
  document.addEventListener('touchmove',   onTouch,  {passive:true});
  document.addEventListener('touchend',    offTouch, {passive:true});
  document.addEventListener('touchcancel', offTouch, {passive:true});
}

/* versions de géométrie : les rects sont mis en cache hors boucle rAF.
   geomV (scroll + resize) invalide les rects en coordonnées viewport ;
   resizeV (resize + polices) invalide les positions en coordonnées
   document, invariantes au scroll — pas de layout forcé en scrollant. */
var geomV = 1, resizeV = 1;
if(!reduced){
  window.addEventListener('scroll', function(){ geomV++; }, {passive:true});
  window.addEventListener('resize', function(){ geomV++; resizeV++; }, {passive:true});
}

/* breakpoint partagé avec styles.css (bandeau mobile de l'Offre) */
var mqBanner = window.matchMedia('(max-width:860px)');

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
   1. LE NOYAU QUI SE RÉORGANISE — pièce maîtresse de l'Offre
      Un seul nuage (3000 pts desktop / 1200 mobile) qui morphe
      entre 4 formations selon le bloc de service actif :
      ⁄01 wireframe de page web  ⁄02 écrans d'app reliés
      ⁄03 fenêtre de code (dernière ligne « écrite » en boucle)  ⁄04 LE FLUX
      (pipeline gauche -> droite : entrées éparses, cœur dense, rails)
      Scroll -> cible continue f∈[0..4] (0 = nuage d'entrée), amortie,
      appariement des particules par proximité pour garder une
      silhouette pendant le morph, respiration au repos.
      reduced-motion : saut d'état, dessin statique de la formation active.
   ============================================================ */
function initOffer(){
  var section = document.getElementById('offre');
  var canvas  = document.getElementById('offerCanvas');
  var labelEl = document.getElementById('offerLabel');
  if(!section || !canvas || !labelEl) return;
  var blocks = [].slice.call(section.querySelectorAll('.offer-block'));
  if(blocks.length < 4) return;

  var ctx = canvas.getContext('2d');
  var rand = rng(9001);
  var N = mqBanner.matches ? 1200 : 3000;   /* même seuil que le CSS */
  var INK = '#211A38';
  var TAU = Math.PI*2;
  var LABELS = ['⁄01 — SITES WEB', '⁄02 — APPLICATIONS', '⁄03 — LOGICIELS', '⁄04 — AUTOMATISATIONS IA'];

  /* ---- identité fixe de chaque particule ---- */
  var colr = new Array(N);
  var radius = new Float32Array(N), alpha = new Float32Array(N),
      stag = new Float32Array(N), ph = new Float32Array(N),
      swA = new Float32Array(N), swD = new Float32Array(N);
  for(var i=0;i<N;i++){
    var u = rand();
    if(u < 0.10){ colr[i] = INK;   alpha[i] = 0.40 + rand()*0.18; }      /* profondeur */
    else if(u < 0.74){ colr[i] = CORAL; alpha[i] = 0.72 + rand()*0.28; } /* dominant */
    else { colr[i] = LILAC; alpha[i] = 0.68 + rand()*0.27; }             /* accent */
    radius[i] = rand() < 0.12 ? 1.7 + rand()*0.9 : 0.8 + rand()*1.0;
    stag[i] = rand(); ph[i] = rand()*TAU;
    swA[i] = 0.015 + rand()*0.055; swD[i] = rand() < 0.5 ? -1 : 1;
  }

  /* ---- constructeurs de formations (espace normalisé 0..1) ---- */
  function nn(fr){ return Math.max(1, Math.round(N*fr)); }
  function seg(p,x0,y0,x1,y1,n,j){
    for(var i=0;i<n;i++){
      var u = n === 1 ? 0.5 : i/(n-1);
      p.push({x:x0+(x1-x0)*u+(rand()-0.5)*j, y:y0+(y1-y0)*u+(rand()-0.5)*j});
    }
  }
  function cluster(p,cx,cy,r,n){
    for(var i=0;i<n;i++){
      var a = rand()*TAU, rr = Math.sqrt(rand())*r;
      p.push({x:cx+Math.cos(a)*rr, y:cy+Math.sin(a)*rr});
    }
  }
  function rectO(p,x0,y0,x1,y1,n,j){
    var w = x1-x0, h = y1-y0, per = 2*(w+h);
    for(var i=0;i<n;i++){
      var d = (i/n)*per, x, y;
      if(d < w){ x = x0+d; y = y0; }
      else if(d < w+h){ x = x1; y = y0+(d-w); }
      else if(d < 2*w+h){ x = x1-(d-w-h); y = y1; }
      else { x = x0; y = y1-(d-2*w-h); }
      p.push({x:x+(rand()-0.5)*j, y:y+(rand()-0.5)*j});
    }
  }
  /* périmètre d'un rectangle arrondi, échantillonné par longueur d'arc */
  function rrect(p,cx,cy,w,h,r,n,j){
    var sw = w-2*r, sh = h-2*r, q = Math.PI/2*r, per = 2*(sw+sh)+4*q;
    for(var i=0;i<n;i++){
      var d = (i/n)*per, x, y, a;
      if(d < sw){ x = -sw/2+d; y = -h/2; }
      else if((d -= sw) < q){ a = -Math.PI/2+d/r; x = sw/2+Math.cos(a)*r; y = -sh/2+Math.sin(a)*r; }
      else if((d -= q) < sh){ x = w/2; y = -sh/2+d; }
      else if((d -= sh) < q){ a = d/r; x = sw/2+Math.cos(a)*r; y = sh/2+Math.sin(a)*r; }
      else if((d -= q) < sw){ x = sw/2-d; y = h/2; }
      else if((d -= sw) < q){ a = Math.PI/2+d/r; x = -sw/2+Math.cos(a)*r; y = sh/2+Math.sin(a)*r; }
      else if((d -= q) < sh){ x = -w/2; y = sh/2-d; }
      else { a = Math.PI+(d-sh)/r; x = -sw/2+Math.cos(a)*r; y = -sh/2+Math.sin(a)*r; }
      p.push({x:cx+x+(rand()-0.5)*j, y:cy+y+(rand()-0.5)*j});
    }
  }
  function fit(p){
    /* complète jusqu'à N (densité en double des traits) */
    while(p.length < N){
      var s = p[(rand()*p.length)|0];
      if(s.fl){
        var q = {x0:s.fl.x0, y0:clamp01(s.fl.y0+(rand()-0.5)*0.06),
                 yc:s.fl.yc, yr:s.fl.yr, u0:(s.fl.u0+rand())%1,
                 sp:s.fl.sp, ph:rand()*TAU};
        var d = {fl:q, x:0, y:0};
        flowPos(q, q.u0, 0, d);
        p.push(d);
      } else if(s.cw){
        var qc = {u:clamp01(s.cw.u+(rand()-0.5)*0.08),
                  jx:(rand()-0.5)*0.004, jy:(rand()-0.5)*0.005,
                  bx:rand()*0.012, by:(rand()-0.5)*0.026};
        p.push({cw:qc,
                x:CLAST.x0+(CLAST.x1-CLAST.x0)*qc.u, y:CLAST.y});
      } else {
        p.push({x:s.x+(rand()-0.5)*0.008, y:s.y+(rand()-0.5)*0.008});
      }
    }
    p.length = N;
    /* appariement par proximité : tri par secteur angulaire puis rayon.
       Les indices se correspondent par rang spatial entre formations :
       chaque particule voyage vers une cible voisine et la silhouette
       persiste pendant tout le morph (fini le nuage informe). */
    for(var k=0;k<N;k++){
      var s2 = p[k], dx = s2.x-0.5, dy = s2.y-0.5;
      s2.sk = ((Math.atan2(dy,dx)+Math.PI)/TAU*24)|0;
      s2.sr = dx*dx+dy*dy;
    }
    p.sort(function(a,b){ return (a.sk-b.sk) || (a.sr-b.sr); });
    return p;
  }

  /* ⁄01 — wireframe de page web reconnaissable */
  function buildSite(){
    var p = [];
    rectO(p, 0.06,0.10, 0.94,0.90, nn(0.185), 0.004);          /* viewport */
    [[0.06,0.10],[0.94,0.10],[0.06,0.90],[0.94,0.90]].forEach(function(c){
      cluster(p, c[0], c[1], 0.013, nn(0.012));                /* prise aux angles */
    });
    seg(p, 0.06,0.21, 0.94,0.21, nn(0.055), 0.004);            /* barre d'en-tête */
    cluster(p, 0.105,0.155, 0.009, nn(0.012));                 /* 3 pastilles */
    cluster(p, 0.145,0.155, 0.009, nn(0.012));
    cluster(p, 0.185,0.155, 0.009, nn(0.012));
    rectO(p, 0.12,0.28, 0.88,0.50, nn(0.125), 0.004);          /* bloc hero */
    [[0.12,0.28],[0.88,0.28],[0.12,0.50],[0.88,0.50]].forEach(function(c){
      cluster(p, c[0], c[1], 0.011, nn(0.008));
    });
    seg(p, 0.18,0.365, 0.62,0.365, nn(0.035), 0.006);          /* titre esquissé */
    seg(p, 0.18,0.415, 0.50,0.415, nn(0.025), 0.006);
    var rows = [0.58,0.645,0.71,0.775,0.84];                   /* 2 colonnes de contenu */
    for(var r=0;r<rows.length;r++){
      seg(p, 0.12,rows[r], 0.46,rows[r], nn(0.030), 0.005);
      seg(p, 0.54,rows[r], 0.88,rows[r], nn(0.030), 0.005);
    }
    return fit(p);
  }

  /* ⁄02 — 3 écrans d'app reliés : codes UI (barre de titre + pastilles,
     rangées de liste) pour une lecture immédiate « application » */
  function buildApp(){
    var p = [];
    rrect(p, 0.28,0.24, 0.36,0.22, 0.05, nn(0.14), 0.004);
    rrect(p, 0.74,0.40, 0.32,0.20, 0.05, nn(0.12), 0.004);
    rrect(p, 0.46,0.75, 0.40,0.24, 0.06, nn(0.15), 0.004);
    seg(p, 0.46,0.28,  0.585,0.355, nn(0.045), 0.006);         /* liens */
    seg(p, 0.685,0.50, 0.565,0.655, nn(0.045), 0.006);
    seg(p, 0.295,0.35, 0.42,0.645,  nn(0.045), 0.006);
    [[0.46,0.28],[0.585,0.355],[0.685,0.50],[0.565,0.655],[0.295,0.35],[0.42,0.645]]
      .forEach(function(c){ cluster(p, c[0], c[1], 0.015, nn(0.016)); }); /* jonctions */
    seg(p, 0.10,0.185, 0.46,0.185, nn(0.030), 0.004);          /* barre de titre */
    cluster(p, 0.125,0.158, 0.0075, nn(0.008));                /* 3 pastilles (écho ⁄01) */
    cluster(p, 0.152,0.158, 0.0075, nn(0.008));
    cluster(p, 0.179,0.158, 0.0075, nn(0.008));
    seg(p, 0.14,0.23, 0.40,0.23, nn(0.011), 0.005);            /* contenu esquissé */
    seg(p, 0.14,0.28, 0.32,0.28, nn(0.009), 0.005);
    seg(p, 0.63,0.38, 0.83,0.38, nn(0.010), 0.005);
    var rows = [0.675,0.72,0.765,0.81];                        /* rangées de liste */
    for(var r=0;r<rows.length;r++){
      cluster(p, 0.295, rows[r], 0.006, nn(0.004));            /* puce de rangée */
      seg(p, 0.325,rows[r], 0.615-(r%2)*0.06, rows[r], nn(0.013), 0.004);
    }
    return fit(p);
  }

  /* ⁄03 — FENÊTRE DE CODE : cadre + barre de titre à 3 pastilles (écho
     ⁄01/⁄02), corps = 7 lignes indentées en escalier (0/1/2), tokens
     séparés par des espaces. Signature : la dernière ligne « s'écrit »
     en boucle lente — ses points se déposent derrière un curseur-bloc
     corail qui clignote, puis la ligne se réinitialise. Comme le flux,
     la formation vit en continu au repos. */
  var CIND  = [0.13, 0.205, 0.28];               /* colonnes d'indentation */
  var CLAST = {x0:0.205, x1:0.60, y:0.80};       /* la ligne qui s'écrit */
  var CCYCLE = 6.5;                              /* s par boucle d'écriture */
  function codeWrite(t){
    /* progression 0..1 : écriture sur ~4,4 s, tenue, reset au bouclage */
    var c = t/CCYCLE; c -= Math.floor(c);
    return Math.min(1, c/0.68);
  }
  function buildCode(){
    var p = [];
    rrect(p, 0.5,0.5, 0.86,0.74, 0.045, nn(0.16), 0.004);    /* cadre fenêtre */
    seg(p, 0.07,0.245, 0.93,0.245, nn(0.05), 0.004);         /* barre de titre */
    cluster(p, 0.115,0.19, 0.0085, nn(0.010));               /* 3 pastilles */
    cluster(p, 0.15, 0.19, 0.0085, nn(0.010));
    cluster(p, 0.185,0.19, 0.0085, nn(0.010));
    /* lignes de code : [indent, [x fin de chaque token]] — l'escalier
       d'indentation 0/1/2 et les espaces entre tokens font « code » */
    var lines = [
      [0, 0.335, [0.30, 0.58]],
      [1, 0.412, [0.38, 0.72]],
      [2, 0.489, [0.62]],
      [2, 0.566, [0.46, 0.78]],
      [1, 0.643, [0.55]],
      [0, 0.720, [0.44]]
    ];
    for(var l=0;l<lines.length;l++){
      var x0 = CIND[lines[l][0]], y = lines[l][1], tk = lines[l][2];
      for(var m=0;m<tk.length;m++){
        seg(p, x0, y, tk[m], y, nn(0.019*(tk[m]-x0)/0.35), 0.005);
        x0 = tk[m] + 0.035;                                  /* espace token */
      }
    }
    var nw = nn(0.05);                           /* la ligne vivante */
    for(var i=0;i<nw;i++){
      var q = {u: nw === 1 ? 0.5 : i/(nw-1),
               jx:(rand()-0.5)*0.004, jy:(rand()-0.5)*0.005,
               bx:rand()*0.012, by:(rand()-0.5)*0.026};
      p.push({cw:q,
              x:CLAST.x0+(CLAST.x1-CLAST.x0)*q.u, y:CLAST.y});
    }
    return fit(p);
  }

  /* ⁄0 — nuage d'entrée : l'écho du hero, avant que le noyau s'organise */
  function buildCloud(){
    var p = [], i, a, rr;
    for(i=0;i<N;i++){
      a = rand()*TAU; rr = Math.pow(rand(), 0.52)*0.46;
      p.push({x:0.5+Math.cos(a)*rr, y:0.5+Math.sin(a)*rr*0.94});
    }
    return fit(p);
  }

  /* ⁄04 — LE FLUX : pipeline gauche -> droite, lisible au premier regard.
     À gauche des entrées éparses en désordre qui convergent, au centre
     le cœur corail dense qu'elles traversent, à droite 4 rails de sortie
     réguliers (registre machine). Circulation permanente, même au repos. */
  var RAILS = [0.335, 0.445, 0.555, 0.665];
  var CORE_L = 0.435, CORE_R = 0.565;
  function flowPos(q, u, t, out){
    var x, y, v;
    if(u < 0.42){                       /* convergence : désordre -> cœur */
      v = u/0.42;
      var sv = v*v*(3-2*v);
      x = q.x0 + (CORE_L - q.x0)*v;
      y = q.y0 + (q.yc - q.y0)*sv;
      var dis = (1-v)*(1-v);            /* agitation qui s'éteint en approche */
      x += Math.sin(t*1.3 + q.ph)*0.018*dis;
      y += Math.cos(t*1.7 + q.ph*1.4)*0.030*dis;
    } else if(u < 0.58){                /* traversée du cœur */
      v = (u-0.42)/0.16;
      x = CORE_L + (CORE_R-CORE_L)*v;
      y = 0.5 + (q.yc-0.5)*(1 - 0.55*Math.sin(v*Math.PI));
    } else {                            /* rails de sortie : propres, droits */
      v = (u-0.58)/0.42;
      x = CORE_R + (0.97-CORE_R)*v;
      var av = Math.min(1, v/0.32);
      av = av*av*(3-2*av);
      y = q.yc + (q.yr - q.yc)*av;
    }
    out.x = x; out.y = y;
  }
  function buildFlux(){
    var p = [], i, n, a, rr;
    n = nn(0.30);                       /* cœur corail dense */
    for(i=0;i<n;i++){
      a = rand()*TAU; rr = Math.pow(rand(), 0.65)*0.085;
      p.push({x:0.5+Math.cos(a)*rr, y:0.5+Math.sin(a)*rr*0.92});
    }
    n = nn(0.64);                       /* particules en circulation */
    for(i=0;i<n;i++){
      var q = {
        x0: 0.02 + rand()*0.15,         /* entrées dispersées à gauche */
        y0: 0.08 + rand()*0.84,
        yc: 0.5 + (rand()-0.5)*0.11,    /* couloir de traversée du cœur */
        yr: RAILS[(rand()*RAILS.length)|0] + (rand()-0.5)*0.006,
        u0: rand(),
        sp: 0.06 + rand()*0.05,         /* 9 à 18 s par traversée */
        ph: rand()*TAU
      };
      var s = {fl:q, x:0, y:0};
      flowPos(q, q.u0, 0, s);           /* position de référence pour le tri */
      p.push(s);
    }
    n = nn(0.05);                       /* fine poussière autour du cœur */
    for(i=0;i<n;i++){
      a = rand()*TAU; rr = 0.10 + rand()*0.10;
      p.push({x:0.5+Math.cos(a)*rr, y:0.5+Math.sin(a)*rr*0.9});
    }
    return fit(p);
  }

  var F = [buildCloud(), buildSite(), buildApp(), buildCode(), buildFlux()];

  /* position d'un slot (le flux ⁄04 circule, la ligne de code ⁄03 s'écrit) */
  var A = {x:0, y:0}, B = {x:0, y:0};
  function slotPos(k, i, t, out){
    var s = F[k][i];
    if(s.fl){
      var u = (s.fl.u0 + t*s.fl.sp) % 1;
      if(u < 0) u += 1;
      flowPos(s.fl, u, t, out);
    } else if(s.cw){
      var w = codeWrite(t);
      if(s.cw.u <= w){
        /* point déjà « écrit » : posé sur la ligne */
        out.x = CLAST.x0 + (CLAST.x1-CLAST.x0)*s.cw.u + s.cw.jx;
        out.y = CLAST.y + s.cw.jy;
      } else {
        /* pas encore écrit : massé dans le curseur-bloc, tête d'écriture */
        out.x = CLAST.x0 + (CLAST.x1-CLAST.x0)*w + 0.004 + s.cw.bx;
        out.y = CLAST.y + s.cw.by;
      }
    } else { out.x = s.x; out.y = s.y; }
  }

  /* ---- canvas carré (letterbox si le conteneur ne l'est pas) ---- */
  var W = 0, H = 0, S = 1, offX = 0, offY = 0;
  function layout(){
    canvas.style.width = ''; canvas.style.height = '';
    W = canvas.clientWidth || 300;
    H = canvas.clientHeight || W;
    setSize(canvas, W, H);
    S = Math.min(W, H); offX = (W-S)/2; offY = (H-S)/2;
  }
  function X(x){ return offX + x*S; }
  function Y(y){ return offY + y*S; }

  /* ---- cible de formation liée au scroll ----
     f ∈ [0..4] : 0 nuage -> 1 site -> 2 app -> 3 code -> 4 flux.
     Le nuage s'assemble en wireframe sur les premiers ~40vh de la
     section (raccord narratif hero -> offre), puis plateaux aux centres
     de blocs avec des transitions resserrées (30 % du parcours). */
  var centers = [0,0,0,0], secTop = 0, cV = -1, anchor = 0.5;
  function computeTarget(){
    if(cV !== resizeV){
      anchor = mqBanner.matches ? 0.66 : 0.5;  /* mobile : texte sous le bandeau */
      secTop = section.getBoundingClientRect().top + window.scrollY;
      for(var k=0;k<4;k++){
        var r = blocks[k].getBoundingClientRect();
        centers[k] = r.top + window.scrollY + r.height*0.5;
      }
      cV = resizeV;
    }
    var vc = window.scrollY + window.innerHeight*anchor;
    var az = Math.max(1, Math.min(window.innerHeight*0.4, centers[0]-secTop));
    var f = clamp01((vc - secTop)/az);
    for(var k2=1;k2<4;k2++){
      var u = (vc - centers[k2-1]) / Math.max(1, centers[k2]-centers[k2-1]);
      f += clamp01((u-0.35)/0.30);
    }
    return f;
  }

  /* ---- filets hairline structurels (l'assise de la lisibilité) ----
     k = indice de formation : 0 nuage (rien), 1 site, 2 app, 3 code, 4 flux */
  function scaffold(k, aVis, tt, statik){
    if(k === 0 || aVis <= 0.02) return;
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(33,26,56,' + (0.14*aVis).toFixed(3) + ')';
    ctx.beginPath();
    if(k === 1){
      ctx.rect(X(0.06), Y(0.10), 0.88*S, 0.80*S);
      ctx.moveTo(X(0.06), Y(0.21)); ctx.lineTo(X(0.94), Y(0.21));
      ctx.rect(X(0.12), Y(0.28), 0.76*S, 0.22*S);
    } else if(k === 2){
      if(ctx.roundRect){                /* contours des 3 écrans */
        ctx.roundRect(X(0.10), Y(0.13), 0.36*S, 0.22*S, 0.05*S);
        ctx.roundRect(X(0.58), Y(0.30), 0.32*S, 0.20*S, 0.05*S);
        ctx.roundRect(X(0.26), Y(0.63), 0.40*S, 0.24*S, 0.06*S);
      }
      ctx.moveTo(X(0.10), Y(0.185));  ctx.lineTo(X(0.46), Y(0.185));
      ctx.moveTo(X(0.46), Y(0.28));  ctx.lineTo(X(0.585), Y(0.355));
      ctx.moveTo(X(0.685), Y(0.50)); ctx.lineTo(X(0.565), Y(0.655));
      ctx.moveTo(X(0.295), Y(0.35)); ctx.lineTo(X(0.42), Y(0.645));
    } else if(k === 3){
      if(ctx.roundRect)                /* cadre de la fenêtre */
        ctx.roundRect(X(0.07), Y(0.13), 0.86*S, 0.74*S, 0.045*S);
      else ctx.rect(X(0.07), Y(0.13), 0.86*S, 0.74*S);
      ctx.moveTo(X(0.07), Y(0.245)); ctx.lineTo(X(0.93), Y(0.245));
      /* guides d'indentation verticaux — signature d'éditeur de code */
      ctx.moveTo(X(CIND[1]-0.02), Y(0.30)); ctx.lineTo(X(CIND[1]-0.02), Y(0.83));
      ctx.moveTo(X(CIND[2]-0.02), Y(0.455)); ctx.lineTo(X(CIND[2]-0.02), Y(0.60));
    } else {
      /* lignes d'entrée esquissées, convergentes vers le cœur */
      [[0.03,0.14,0.475],[0.02,0.40,0.49],[0.05,0.63,0.51],[0.03,0.87,0.53]]
        .forEach(function(e2){
          ctx.moveTo(X(e2[0]), Y(e2[1])); ctx.lineTo(X(0.425), Y(e2[2]));
        });
      ctx.moveTo(X(0.5) + 0.105*S, Y(0.5));                    /* le cœur */
      ctx.ellipse(X(0.5), Y(0.5), 0.105*S, 0.10*S, 0, 0, TAU);
      for(var ri=0;ri<RAILS.length;ri++){                      /* rails de sortie */
        ctx.moveTo(X(0.60), Y(RAILS[ri])); ctx.lineTo(X(0.965), Y(RAILS[ri]));
      }
    }
    ctx.stroke();
    if(k === 3){
      /* LE CURSEUR-BLOC corail au bout de la ligne qui s'écrit.
         Clignotement carré (rythme terminal) — plein et fixe en statique */
      var w = codeWrite(tt);
      if(statik || (tt % 1.1) < 0.66){
        ctx.globalAlpha = 0.92*aVis;
        ctx.fillStyle = CORAL;
        ctx.fillRect(X(CLAST.x0 + (CLAST.x1-CLAST.x0)*w + 0.004),
                     Y(CLAST.y - 0.017), 0.014*S, 0.034*S);
        ctx.globalAlpha = 1;
      }
    }
  }

  /* ---- dessin ---- */
  var f = 0, lastT = -1, curLabel = -1;
  var mrect = null, mrectV = -1;
  function draw(t, statik){
    var dt = lastT < 0 ? 0.016 : Math.min(0.05, Math.max(0.001, t-lastT));
    lastT = t;
    var tf = computeTarget();
    if(statik) f = Math.max(1, Math.round(tf));  /* jamais le nuage en statique */
    else f += (tf - f)*Math.min(1, dt*3.8);      /* ~1s de voyage */
    if(f < 0) f = 0; if(f > 4) f = 4;
    var k0 = Math.min(3, Math.floor(f));
    var e = clamp01(f - k0);

    /* étiquette : pluriels alignés sur les h3, crossfade court au lieu
       du dimming long — lisible pendant l'essentiel de la transition */
    var near = Math.round(f);
    var li = Math.max(0, near-1);
    if(li !== curLabel){ curLabel = li; labelEl.textContent = LABELS[li]; }
    var dn = Math.abs(f - near);
    var lop = dn < 0.35 ? 1 : Math.max(0, 1 - (dn-0.35)/0.13);
    labelEl.style.opacity = (lop*clamp01((f-0.15)/0.7)).toFixed(3);

    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,W,H);
    /* statique : 5.2 s tombe dans la phase « ligne complète » du cycle
       d'écriture ⁄03 (fenêtre entière, curseur plein sans clignotement) */
    var tt = statik ? 5.2 : t;
    scaffold(k0, 1-e, tt, statik);
    /* plancher d'alpha (0.35) + rampe : la forme cible se devine dès le
       départ et reste lisible au cœur du transit, sans saut au plateau */
    if(e > 0.02) scaffold(k0+1, Math.min(1, 0.35 + e), tt, statik);

    var breath = statik ? 0 : Math.sin(t*0.55)*0.011;
    var mr = null;
    if(!statik && mouse.x > -9000){
      if(mrectV !== geomV){ mrect = canvas.getBoundingClientRect(); mrectV = geomV; }
      mr = mrect;
    }
    for(var i=0;i<N;i++){
      slotPos(k0, i, tt, A);
      var x, y;
      if(e <= 0.0001){ x = A.x; y = A.y; }
      else {
        slotPos(k0+1, i, tt, B);
        /* départ par vagues : à mi-transition une partie des points est déjà
           arrivée, une partie n'est pas partie — la silhouette persiste */
        var ei = clamp01((e - stag[i]*0.55)/0.45);
        ei = ei*ei*(3-2*ei);
        x = A.x + (B.x-A.x)*ei; y = A.y + (B.y-A.y)*ei;
        var s = Math.sin(ei*Math.PI);
        if(s > 0.001 && !statik){
          /* tourbillon : arc perpendiculaire + bruit pendant le transit */
          var dx = B.x-A.x, dy = B.y-A.y;
          var len = Math.sqrt(dx*dx+dy*dy) + 1e-4;
          var pxn = -dy/len, pyn = dx/len;
          var wob = Math.sin(tt*2.1 + ph[i])*0.010;
          var k = (swA[i]*swD[i] + wob)*s*(0.4+len);
          x += pxn*k; y += pyn*k;
        }
      }
      if(!statik){
        /* respiration lente + vie subtile au repos */
        x += Math.sin(tt*(0.6+stag[i]) + ph[i])*0.0022;
        y += Math.cos(tt*(0.5+stag[i]*0.7) + ph[i])*0.0022;
        x = 0.5 + (x-0.5)*(1+breath);
        y = 0.5 + (y-0.5)*(1+breath);
      }
      var px = offX + x*S, py = offY + y*S;
      if(mr){
        var mdx = px - (mouse.x - mr.left), mdy = py - (mouse.y - mr.top);
        var d2 = mdx*mdx + mdy*mdy, R = 80*mouse.r;
        if(d2 < R*R && d2 > 0.01){
          var d = Math.sqrt(d2), fo = (1 - d/R)*9;
          px += mdx/d*fo; py += mdy/d*fo;
        }
      }
      ctx.globalAlpha = alpha[i];
      ctx.fillStyle = colr[i];
      ctx.beginPath(); ctx.arc(px, py, radius[i], 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  layout();
  window.addEventListener('resize', function(){
    layout();
    if(reduced){ geomV++; resizeV++; draw(2.1, true); }
  });
  if(document.fonts && document.fonts.ready)
    document.fonts.ready.then(function(){ geomV++; resizeV++; layout(); if(reduced) draw(2.1, true); });

  if(reduced){
    /* saut d'état : formation du bloc visible, dessinée statiquement */
    draw(2.1, true);
    var queued = false;
    var redraw = function(){ queued = false; draw(2.1, true); };
    window.addEventListener('scroll', function(){
      if(!queued){ queued = true; requestAnimationFrame(redraw); }
    }, {passive:true});
    return;
  }

  var visible = false;
  new IntersectionObserver(function(en){ visible = en[0].isIntersecting; })
    .observe(section);
  units.push({tick:function(t){ if(visible) draw(t, false); }});
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
initOffer();
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
