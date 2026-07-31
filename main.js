/* ============================================================
   KERNEL AGENCY — orchestration
   - curseur custom + boutons magnétiques + reveal au scroll
   - hero commutable : ?hero=blob -> blob chrome, défaut -> noyau
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

  /* ============ Hero commutable : noyau (défaut) / blob ============ */
  var canvas = document.getElementById('gl');
  var variant = 'noyau';
  try{
    if(new URLSearchParams(location.search).get('hero') === 'blob') variant = 'blob';
  }catch(e){}

  document.body.classList.add('hero-' + variant);

  var hero = null;
  if(window.THREE && window.KernelHeroes && window.KernelHeroes[variant]){
    hero = window.KernelHeroes[variant].init(canvas, {
      mobile: innerWidth < 700,
      reduced: prefersReduced
    });
  }
  if(!hero){
    document.getElementById('glFallback').classList.add('show');
    canvas.style.display = 'none';
  }

  /* souris normalisée -1..1, amortie, transmise au hero */
  var mouseN = {x:0, y:0}, mouseTarget = {x:0, y:0};
  document.addEventListener('mousemove', function(e){
    mouseTarget.x = (e.clientX/innerWidth)*2 - 1;
    mouseTarget.y = -((e.clientY/innerHeight)*2 - 1);
  }, {passive:true});

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
    mouseN.x += (mouseTarget.x - mouseN.x)*0.05;
    mouseN.y += (mouseTarget.y - mouseN.y)*0.05;
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
    var tl = gsap.timeline({defaults:{ease:'power3.out'}});
    if(hero){
      var introObj = {v:0};
      tl.to(introObj, {v:1, duration:2.4, ease:'power2.inOut',
        onUpdate:function(){ hero.setIntro(introObj.v); }}, 0);
    }
    tl.to('#heroOverline', {opacity:1, duration:1}, 0.9)
      .to('.hero-title .ch', {y:0, duration:1.1, stagger:0.06, ease:'power4.out'}, 1.1)
      .to('#heroTagline', {opacity:1, duration:1.1}, 1.9)
      .to('#heroCtas', {opacity:1, duration:1}, 2.2)
      .to('#nav', {opacity:1, duration:1}, 2.4)
      .to(['#heroScroll','#metaL','#metaR'], {opacity:1, duration:1}, 2.6);
  }
})();
