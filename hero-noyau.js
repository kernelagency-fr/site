/* ============================================================
   HERO « NOYAU » — sphère de 16k particules corail/lilas (univers E)
   API commune : window.KernelHeroes.noyau.init(canvas, opts)
   -> { ok, resize(), setMouse(nx,ny), setIntro(v), tick(t), renderStatic(), dispose() }
   Script classique, aucun module — fonctionne en file:// et statique.
   ============================================================ */
(function(){
  'use strict';
  window.KernelHeroes = window.KernelHeroes || {};

  window.KernelHeroes.noyau = { init: function(canvas, opts){
    opts = opts || {};
    var renderer;
    try{
      renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:false, alpha:true, powerPreference:'high-performance'});
    }catch(e){ renderer = null; }
    if(!renderer || !renderer.getContext()) return null;

    var PR = Math.min(window.devicePixelRatio || 1, opts.mobile ? 2.6 : 1.8);   /* net sur écrans 3x */
    renderer.setPixelRatio(PR);
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, window.innerWidth/window.innerHeight, 0.1, 60);
    /* recul compensé en portrait : la sphère (r~1.55 + bruit) doit tenir dans le frustum */
    function fitCamera(){
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.position.z = 6.5 / Math.min(1, camera.aspect/0.75);
      camera.updateProjectionMatrix();
    }
    fitCamera();

    var uniforms = {
      uTime:  {value: 0},
      uMouse: {value: new THREE.Vector3(0,0,1)},
      uIntro: {value: 0},
      uPR:    {value: PR},
      uMob:   {value: opts.mobile ? 1.18 : 1.0}
    };

    /* --- noyau : particules adaptées à l'appareil --- */
    var COUNT = opts.mobile ? 6000 : 16000;
    var pos = new Float32Array(COUNT*3);
    var seed = new Float32Array(COUNT);
    for(var i=0;i<COUNT;i++){
      var t = i/COUNT;
      var phi = Math.acos(1 - 2*t);
      var theta = Math.PI * (1 + Math.sqrt(5)) * i;
      var r = 1.55 + (Math.random()-0.5)*0.06;
      pos[i*3]   = r*Math.sin(phi)*Math.cos(theta);
      pos[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
      pos[i*3+2] = r*Math.cos(phi);
      seed[i] = Math.random();
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed,1));

    var vert = [
      'uniform float uTime; uniform vec3 uMouse; uniform float uIntro; uniform float uPR; uniform float uMob;',
      'attribute float aSeed; varying float vGlow; varying float vSeed;',
      'vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}',
      'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
      'float snoise(vec3 v){',
      ' const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);',
      ' vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);',
      ' vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);',
      ' vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;',
      ' i=mod(i,289.0);',
      ' vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
      ' float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx;',
      ' vec4 j=p-49.0*floor(p*ns.z*ns.z);',
      ' vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);',
      ' vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);',
      ' vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);',
      ' vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));',
      ' vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
      ' vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);',
      ' vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
      ' p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;',
      ' vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;',
      ' return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}',
      'void main(){',
      '  vSeed=aSeed;',
      '  vec3 dir=normalize(position);',
      '  float breath=0.5+0.5*sin(uTime*0.55);',
      '  float n1=snoise(dir*2.2+uTime*0.12);',
      '  float n2=snoise(dir*5.5-uTime*0.08);',
      '  float amp=(0.22+0.16*breath)*n1+0.08*n2;',
      '  float mdot=max(dot(dir,normalize(uMouse)),0.0);',
      '  float push=pow(mdot,6.0)*0.45;',
      '  vec3 p=dir*(length(position)+amp+push);',
      '  vec3 scatter=dir*(3.5+aSeed*4.0);',
      '  p=mix(scatter,p,uIntro);',
      '  vGlow=smoothstep(-0.4,0.9,n1)+push*2.2;',
      '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
      '  gl_Position=projectionMatrix*mv;',
      '  gl_PointSize=(2.0+aSeed*2.4+vGlow*1.8)*uPR*uMob*(4.6/-mv.z);',
      '}'
    ].join('\n');

    var frag = [
      'varying float vGlow; varying float vSeed;',
      'void main(){',
      '  vec2 uv=gl_PointCoord-0.5; float d=length(uv);',
      '  if(d>0.5) discard;',
      '  float a=smoothstep(0.5,0.05,d);',
      '  vec3 deep=vec3(0.718,0.612,1.0);',   /* lilas */
      '  vec3 bio=vec3(1.0,0.478,0.349);',    /* corail #FF7A59 */
      '  vec3 col=mix(deep,bio,clamp(vGlow,0.0,1.0));',
      '  gl_FragColor=vec4(col,a*(0.78+0.22*vSeed));',
      '}'
    ].join('\n');

    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms, vertexShader: vert, fragmentShader: frag,
      transparent: true, depthWrite: false, blending: THREE.NormalBlending
    });
    var core = new THREE.Points(geo, mat);
    scene.add(core);

    /* --- poussière ambiante --- */
    var DCOUNT = opts.mobile ? 300 : 900;
    var dpos = new Float32Array(DCOUNT*3);
    for(var j=0;j<DCOUNT;j++){
      dpos[j*3]   = (Math.random()-0.5)*16;
      dpos[j*3+1] = (Math.random()-0.5)*10;
      dpos[j*3+2] = (Math.random()-0.5)*8 - 1;
    }
    var dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute('position', new THREE.BufferAttribute(dpos,3));
    var dmat = new THREE.PointsMaterial({
      color: 0xFF7A59, size: 0.018, transparent: true, opacity: 0.28,
      depthWrite:false, blending: THREE.NormalBlending
    });
    var dust = new THREE.Points(dgeo, dmat);
    scene.add(dust);

    var mouse = {x:0, y:0};

    var api = {
      ok: true,
      resize: function(){
        fitCamera();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      setMouse: function(nx, ny){
        mouse.x = nx; mouse.y = ny;
        uniforms.uMouse.value.set(nx*1.4, ny*1.0, 0.9).normalize();
      },
      setIntro: function(v){ uniforms.uIntro.value = v; },
      tick: function(t){
        /* auto-guérison : onglet chargé caché -> resynchroniser le canvas */
        if(canvas.width !== Math.floor(window.innerWidth*PR) && window.innerWidth > 0) api.resize();
        uniforms.uTime.value = t;
        core.rotation.y = t*0.06 + mouse.x*0.25;
        core.rotation.x = -mouse.y*0.18;
        dust.rotation.y = t*0.012;
        renderer.render(scene, camera);
      },
      renderStatic: function(){
        /* état figé esthétique pour prefers-reduced-motion */
        uniforms.uIntro.value = 1;
        uniforms.uTime.value = 3.2;
        renderer.render(scene, camera);
      },
      dispose: function(){
        geo.dispose(); dgeo.dispose(); mat.dispose(); dmat.dispose();
        renderer.dispose();
      }
    };
    return api;
  }};
})();
