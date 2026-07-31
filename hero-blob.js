/* ============================================================
   HERO « BLOB » — chrome fondu corail/lilas/pêche (univers C)
   Variante commutable : ?hero=blob
   API commune : window.KernelHeroes.blob.init(canvas, opts)
   -> { ok, resize(), setMouse(nx,ny), setIntro(v), tick(t), renderStatic(), dispose() }
   ============================================================ */
(function(){
  'use strict';
  window.KernelHeroes = window.KernelHeroes || {};

  window.KernelHeroes.blob = { init: function(canvas, opts){
    opts = opts || {};
    var renderer;
    try{
      renderer = new THREE.WebGLRenderer({canvas:canvas, alpha:true, antialias:true});
    }catch(e){ renderer = null; }
    if(!renderer || !renderer.getContext()) return null;

    var PR = Math.min(window.devicePixelRatio || 1, opts.mobile ? 2.6 : 1.8);   /* net sur écrans 3x */
    renderer.setPixelRatio(PR);
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, window.innerWidth/window.innerHeight, 0.1, 20);
    camera.position.z = 4.2;

    var uni = {
      uTime:{value:0},
      uAmp:{value:.16},
      uMouse:{value:new THREE.Vector3(0,0,1)},
      uBulge:{value:.12},
      uColA:{value:new THREE.Color('#FF7A59')},
      uColB:{value:new THREE.Color('#B79CFF')},
      uColC:{value:new THREE.Color('#FFC9A8')},
      uCreme:{value:new THREE.Color('#FDF8F2')}
    };

    var noise = [
      'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
      'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
      'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
      'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
      'float snoise(vec3 v){',
      ' const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);',
      ' vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);',
      ' vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);',
      ' vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;',
      ' i=mod289(i);',
      ' vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
      ' float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;',
      ' vec4 j=p-49.0*floor(p*ns.z*ns.z);',
      ' vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);',
      ' vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);',
      ' vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);',
      ' vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));',
      ' vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
      ' vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);',
      ' vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
      ' p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
      ' vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;',
      ' return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}'
    ].join('\n');

    var vsh = noise + '\n' + [
      'uniform float uTime;uniform float uAmp;uniform vec3 uMouse;uniform float uBulge;',
      'varying vec3 vN;varying vec3 vP;varying float vD;',
      'float disp(vec3 n){',
      ' float d=snoise(n*1.5+uTime*0.22)*1.0+snoise(n*3.6-uTime*0.35)*0.32;',
      ' float m=max(0.0,dot(n,normalize(uMouse)));',
      ' return d*uAmp + pow(m,4.0)*uBulge;}',
      'void main(){',
      ' vec3 n=normalize(position);',
      ' float d=disp(n);',
      ' vec3 p=position+n*d;',
      ' float e=0.12;',
      ' vec3 t=normalize(cross(n,abs(n.y)<0.99?vec3(0.,1.,0.):vec3(1.,0.,0.)));',
      ' vec3 b=normalize(cross(n,t));',
      ' vec3 n1=normalize(n+t*e);vec3 n2=normalize(n+b*e);',
      ' vec3 p1=n1*(1.0+disp(n1));vec3 p2=n2*(1.0+disp(n2));',
      ' vec3 newN=normalize(cross(p1-n*(1.0+d),p2-n*(1.0+d)));',
      ' if(dot(newN,n)<0.0)newN=-newN;',
      ' vN=normalMatrix*newN;vD=d;',
      ' vec4 mv=modelViewMatrix*vec4(p,1.0);vP=mv.xyz;',
      ' gl_Position=projectionMatrix*mv;}'
    ].join('\n');

    var fsh = [
      'precision highp float;',
      'uniform vec3 uColA;uniform vec3 uColB;uniform vec3 uColC;uniform vec3 uCreme;',
      'varying vec3 vN;varying vec3 vP;varying float vD;',
      'void main(){',
      ' vec3 N=normalize(vN);vec3 V=normalize(-vP);',
      ' float fr=pow(1.0-abs(dot(N,V)),2.0);',
      ' float t=clamp(N.y*0.5+0.5,0.0,1.0);',
      ' vec3 base=mix(uColB,uColC,smoothstep(0.05,0.95,t));',
      ' base=mix(base,uColA,clamp(vD*2.2+0.18,0.0,1.0)*0.55);',
      ' base=mix(base,uCreme,fr*0.75);',
      ' vec3 L=normalize(vec3(0.45,0.85,0.55));',
      ' float diff=dot(N,L)*0.5+0.5;',
      ' vec3 col=base*(0.74+diff*0.36);',
      ' vec3 H=normalize(L+V);',
      ' col+=vec3(1.0)*pow(max(dot(N,H),0.0),70.0)*0.9;',
      ' col+=vec3(1.0)*pow(max(N.y,0.0),3.0)*0.12;',
      ' vec3 L2=normalize(vec3(-0.6,-0.3,0.5));',
      ' col+=uColB*pow(max(dot(N,L2),0.0),3.0)*0.25;',
      ' gl_FragColor=vec4(col,1.0);}'
    ].join('\n');

    var geo = new THREE.IcosahedronGeometry(1, opts.mobile ? 32 : 48);
    var mat = new THREE.ShaderMaterial({uniforms:uni, vertexShader:vsh, fragmentShader:fsh});
    var mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    /* échelle du blob adaptée au viewport (mobile étroit compris) */
    var baseScale = 1.18, intro = opts.reduced ? 1 : 0;
    function fitScale(){
      var hh = Math.tan(camera.fov*Math.PI/360) * camera.position.z; /* demi-hauteur visible */
      var hw = hh * camera.aspect;
      baseScale = Math.min(1.12, 0.72*Math.min(hh, hw));
      applyScale();
    }
    function applyScale(){
      var s = Math.max(0.001, baseScale*intro);
      mesh.scale.setScalar(s);
    }
    fitScale();

    var mouse = {x:0, y:0}, speed = 0, lastX = null, lastY = null, bulgeTarget = .12;

    var api = {
      ok: true,
      resize: function(){
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        fitScale();
      },
      setMouse: function(nx, ny){
        if(lastX !== null){
          speed = Math.min(1, Math.hypot(nx-lastX, ny-lastY)*6);
        }
        lastX = nx; lastY = ny;
        mouse.x = nx; mouse.y = ny;
        uni.uMouse.value.set(nx, ny, .85).normalize();
      },
      setIntro: function(v){ intro = v; applyScale(); },
      tick: function(t){
        if(canvas.width !== Math.floor(window.innerWidth*PR) && window.innerWidth > 0) api.resize();
        uni.uTime.value = t;
        bulgeTarget = .12 + speed*.22;
        uni.uBulge.value += (bulgeTarget - uni.uBulge.value)*.06;
        speed *= .96;
        mesh.rotation.y = mouse.x*.45 + t*.05;
        mesh.rotation.x = -mouse.y*.35;
        renderer.render(scene, camera);
      },
      renderStatic: function(){
        intro = 1; applyScale();
        uni.uTime.value = 2.5;
        renderer.render(scene, camera);
      },
      dispose: function(){
        geo.dispose(); mat.dispose(); renderer.dispose();
      }
    };
    return api;
  }};
})();
