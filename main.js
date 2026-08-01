/* ============================================================
   KERNEL AGENCY — orchestration
   - curseur custom + boutons magnétiques + reveal au scroll
   - hero unique : le noyau
   - une seule boucle rAF partagée (curseur + WebGL)
   - IntersectionObserver : pas de rendu WebGL hors écran
   - prefers-reduced-motion : intro sans déplacement, canvas statique
   ============================================================ */
(function(){
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasHover = window.matchMedia('(hover:hover)').matches;

  /* ============ Titre : redécoupe du texte du h1 en lettres ============ */
  var title = document.getElementById('heroTitle');
  var titleText = (title.textContent || '').trim() || 'KERNEL';
  title.textContent = '';
  titleText.split('').forEach(function(c){
    var s = document.createElement('span');
    s.className = 'ch'; s.textContent = c;
    title.appendChild(s);
  });

  /* ============ Curseur personnalisé ============ */
  var dot = document.getElementById('cursorDot');
  var ring = document.getElementById('cursorRing');
  var mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;
  /* invisible tant que la souris n'a pas réellement bougé */
  document.addEventListener('mousemove', function(){
    document.body.classList.add('has-mouse');
  }, {once:true, passive:true});
  document.addEventListener('mousemove', function(e){ mx = e.clientX; my = e.clientY; }, {passive:true});
  document.querySelectorAll('[data-hover]').forEach(function(el){
    el.addEventListener('mouseenter', function(){ ring.classList.add('is-active'); });
    el.addEventListener('mouseleave', function(){ ring.classList.remove('is-active'); });
  });

  /* ============ Boutons magnétiques ============ */
  if(hasHover && !prefersReduced){
    document.querySelectorAll('[data-magnetic]').forEach(function(btn){
      var strength = 0.35;
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width/2);
        var dy = e.clientY - (r.top + r.height/2);
        btn.style.transform = 'translate(' + dx*strength + 'px,' + dy*strength + 'px)';
      });
      btn.addEventListener('mouseleave', function(){
        btn.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
        btn.style.transform = 'translate(0,0)';
        setTimeout(function(){ btn.style.transition = ''; }, 500);
      });
    });
  }

  /* ============ Reveal au scroll ============ */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, {threshold: 0.15});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* ============ Hero : le noyau ============ */
  var canvas = document.getElementById('gl');
  document.body.classList.add('hero-noyau');

  var hero = null;
  if(window.THREE && window.KernelHeroes && window.KernelHeroes.noyau){
    hero = window.KernelHeroes.noyau.init(canvas, {
      mobile: innerWidth < 700,
      reduced: prefersReduced
    });
  }
  if(!hero){
    document.getElementById('glFallback').classList.add('show');
    canvas.style.display = 'none';
  }

  /* souris normalisée -1..1, amortie, transmise au hero */
  var mouseN = {x:0, y:0}, mouseTarget = {x:0, y:0}, touchDrive = false;
  document.addEventListener('mousemove', function(e){
    touchDrive = false;
    mouseTarget.x = (e.clientX/innerWidth)*2 - 1;
    mouseTarget.y = -((e.clientY/innerHeight)*2 - 1);
  }, {passive:true});
  /* tactile : le doigt alimente la même cible — passif, ne bloque jamais le scroll,
     et ne réactive ni curseur custom ni boutons magnétiques (réservés à la souris) */
  if(!prefersReduced){
    var heroTouch = function(e){
      var t = e.touches[0]; if(!t) return;
      touchDrive = true;
      mouseTarget.x = (t.clientX/innerWidth)*2 - 1;
      mouseTarget.y = -((t.clientY/innerHeight)*2 - 1);
    };
    document.addEventListener('touchstart', heroTouch, {passive:true});
    document.addEventListener('touchmove',  heroTouch, {passive:true});
    /* verrou d'axe : au premier mouvement, le geste choisit son camp —
       plutôt horizontal = jeu (l'écran ne bouge plus jusqu'au lever du doigt),
       plutôt vertical = défilement natif intact */
    var heroEl = document.getElementById('hero');
    if(heroEl){
      var tx0 = 0, ty0 = 0, axis = 0; /* 0 indécis · 1 jeu · 2 défilement */
      heroEl.addEventListener('touchstart', function(e){
        var t = e.touches[0]; if(!t) return;
        tx0 = t.clientX; ty0 = t.clientY; axis = 0;
      }, {passive:true});
      heroEl.addEventListener('touchmove', function(e){
        var t = e.touches[0]; if(!t) return;
        if(axis === 0){
          var dx = Math.abs(t.clientX - tx0), dy = Math.abs(t.clientY - ty0);
          /* décision rapide (6px) : moins l'indécision dure, moins iOS a le temps
             d'amorcer un défilement qu'on coupera — c'était la source des à-coups */
          if(dx*dx + dy*dy > 36) axis = dx > dy*1.25 ? 1 : 2;
        }
        if(axis === 1) e.preventDefault();
      }, {passive:false});
      heroEl.addEventListener('touchend',    function(){ axis = 0; }, {passive:true});
      heroEl.addEventListener('touchcancel', function(){ axis = 0; }, {passive:true});
    }
  }

  if(hero){
    /* écouteur unique : re-rendu statique inclus quand il n'y a pas d'animation */
    addEventListener('resize', function(){
      hero.resize();
      if(prefersReduced || !window.gsap) hero.renderStatic();
    });
  }

  /* visibilité du hero : pas d'animation hors écran */
  var heroVisible = true;
  new IntersectionObserver(function(en){ heroVisible = en[0].isIntersecting; })
    .observe(document.getElementById('hero'));

  /* ============ Boucle rAF unique ============ */
  var clock = (hero && window.THREE) ? new THREE.Clock() : null;
  var animateHero = hero && !prefersReduced;
  function loop(){
    requestAnimationFrame(loop);
    if(hasHover){
      rx += (mx-rx)*0.16; ry += (my-ry)*0.16;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
    }
    /* symboles génératifs (offre, méthode, preuve, atmosphère) — même rAF */
    if(window.KernelSymbols && !document.hidden) window.KernelSymbols.tick(performance.now());
    if(!animateHero || !heroVisible || document.hidden) return;
    var damp = touchDrive ? 0.16 : 0.05;   /* le doigt attend une réponse immédiate */
    mouseN.x += (mouseTarget.x - mouseN.x)*damp;
    mouseN.y += (mouseTarget.y - mouseN.y)*damp;
    hero.setMouse(mouseN.x, mouseN.y);
    hero.tick(clock.getElapsedTime());
  }
  /* ne pas faire tourner la boucle à vide (tactile + reduced-motion) */
  if(hasHover || animateHero || (window.KernelSymbols && window.KernelSymbols.active)) loop();

  /* ============ Séquence d'entrée ============ */
  var heroEls = ['#nav','#heroOverline','#heroTagline','#heroCtas','#heroScroll','#metaL','#metaR'];
  if(prefersReduced || !window.gsap){
    /* intro raccourcie, sans déplacements */
    heroEls.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){ el.style.opacity = 1; });
    });
    document.querySelectorAll('.hero-title .ch').forEach(function(el){ el.style.transform = 'none'; });
    if(hero) hero.renderStatic();
  } else {
    /* intro resserrée : le titre est visible dès ~0,3 s, la nav à ~1 s */
    var tl = gsap.timeline({defaults:{ease:'power3.out'}});
    if(hero){
      var introObj = {v:0};
      tl.to(introObj, {v:1, duration:1.8, ease:'power2.inOut',
        onUpdate:function(){ hero.setIntro(introObj.v); }}, 0);
    }
    tl.to('.hero-title .ch', {y:0, duration:0.9, stagger:0.045, ease:'power4.out'}, 0.3)
      .to('#heroOverline', {opacity:1, duration:0.8}, 0.55)
      .to('#heroTagline', {opacity:1, duration:0.9}, 0.75)
      .to('#heroCtas', {opacity:1, duration:0.8}, 0.95)
      .to('#nav', {opacity:1, duration:0.8}, 1.0)
      .to(['#heroScroll','#metaL','#metaR'], {opacity:1, duration:0.8}, 1.15);
  }

  /* ============ Contact : copier l'adresse ============ */
  var copyBtn = document.getElementById('copyBtn');
  var mailText = document.getElementById('mailText');
  if(copyBtn && mailText){
    var copyDone = function(){
      copyBtn.textContent = 'Copié';
      copyBtn.classList.add('is-done');
      setTimeout(function(){
        copyBtn.textContent = 'Copier';
        copyBtn.classList.remove('is-done');
      }, 1800);
    };
    /* repli : sélectionne l'adresse (l'utilisateur n'a plus qu'à copier) */
    var copyFallback = function(){
      var sel = window.getSelection(), r = document.createRange();
      r.selectNodeContents(mailText);
      sel.removeAllRanges(); sel.addRange(r);
      try{ if(document.execCommand('copy')) copyDone(); }catch(e){}
    };
    copyBtn.addEventListener('click', function(){
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(mailText.textContent).then(copyDone, copyFallback);
      } else copyFallback();
    });
  }

  /* ============ Footer : horloge locale (zéro requête) ============ */
  var clockEl = document.getElementById('footerClock');
  if(clockEl){
    var tickClock = function(){
      var hhmm;
      try{
        hhmm = new Date().toLocaleTimeString('fr-FR',
          {timeZone:'Europe/Paris', hour:'2-digit', minute:'2-digit'});
      }catch(e){
        var d = new Date();
        hhmm = ('0'+d.getHours()).slice(-2) + ':' + ('0'+d.getMinutes()).slice(-2);
      }
      clockEl.textContent = 'Toulouse — ' + hhmm;
      /* MàJ calée sur la minute suivante */
      setTimeout(tickClock, 60000 - (Date.now() % 60000) + 500);
    };
    tickClock();
  }
})();
