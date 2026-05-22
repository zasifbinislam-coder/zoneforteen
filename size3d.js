/* ============================================================
   ZONE14 — 3D jersey-on-mannequin size visualizer
   Uses Three.js (UMD global) + a custom drag handler.
   No ES module imports — runs under file:// too.
   ============================================================ */

(function () {
  const stage = document.getElementById('size3DStage');
  if (!stage) return;

  /* ---------- Size mapping (declared FIRST — build() reads these) ---------- */
  const SIZES = {
    XS:   { chest: '32–34 in', length: '26.5 in', sx: 0.86, sy: 0.92, ss: 0.88 },
    S:    { chest: '35–37 in', length: '27.5 in', sx: 0.93, sy: 0.96, ss: 0.94 },
    M:    { chest: '38–40 in', length: '28.5 in', sx: 1.00, sy: 1.00, ss: 1.00 },
    L:    { chest: '41–43 in', length: '29.5 in', sx: 1.08, sy: 1.04, ss: 1.06 },
    XL:   { chest: '44–46 in', length: '30.5 in', sx: 1.18, sy: 1.08, ss: 1.12 },
    XXL:  { chest: '47–49 in', length: '31.5 in', sx: 1.28, sy: 1.12, ss: 1.18 },
    '3XL':{ chest: '50–52 in', length: '32.5 in', sx: 1.40, sy: 1.16, ss: 1.24 },
  };
  const SIZE_KEYS = ['XS','S','M','L','XL','XXL','3XL'];

  // Three.js may load slightly after this script — wait if needed.
  if (typeof THREE === 'undefined') {
    return waitForThree(() => init());
  }
  init();

  function waitForThree(cb) {
    let tries = 0;
    const id = setInterval(() => {
      if (typeof THREE !== 'undefined') {
        clearInterval(id);
        cb();
      } else if (++tries > 80) {           // ~8 s
        clearInterval(id);
        stage.classList.add('fallback');
      }
    }, 100);
  }

  /* ---------- Init ---------- */
  function init() {
    if (!hasWebGL()) { stage.classList.add('fallback'); return; }
    try { build(); }
    catch (e) {
      console.warn('Zone14 3D init failed:', e);
      stage.classList.add('fallback');
    }
  }

  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (_) { return false; }
  }

  function build() {
    const COLOR = {
      skin:   0x2a2f38,
      jersey: 0x1d6b3a,  // heritage green from the Zone14 crest
      accent: 0xf5e9c8,  // cream from the "14"
      cyan:   0x5ee9e3,  // brand cyan
    };

    /* ---- Scene / camera / renderer ---- */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.4, 6.2);
    camera.lookAt(0, 1.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    stage.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    /* ---- Lights ---- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key  = new THREE.DirectionalLight(0xffffff, 1.00); key.position.set( 3, 4, 5);
    const rim  = new THREE.DirectionalLight(0x5ee9e3, 0.55); rim.position.set(-3, 2,-3);
    const fill = new THREE.DirectionalLight(0xfff0d4, 0.25); fill.position.set(-2,-1, 4);
    scene.add(key, rim, fill);

    /* ---- Materials ---- */
    const skinMat   = new THREE.MeshPhongMaterial({ color: COLOR.skin,   shininess: 20, specular: 0x111111 });
    const jerseyMat = new THREE.MeshPhongMaterial({ color: COLOR.jersey, shininess: 35, specular: 0x222222 });
    const accentMat = new THREE.MeshPhongMaterial({ color: COLOR.accent, shininess: 60, specular: 0x444444 });

    /* ---- Static body (always same size) ---- */
    const bodyGroup = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 32), skinMat);
    head.position.y = 2.92;
    head.scale.set(0.92, 1.05, 0.95);
    bodyGroup.add(head);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.32, 24), skinMat);
    neck.position.y = 2.48;
    bodyGroup.add(neck);
    scene.add(bodyGroup);

    /* ---- Jersey group (scales with size) ---- */
    const jerseyGroup = new THREE.Group();

    const shoulders = new THREE.Mesh(
      new THREE.CylinderGeometry(0.90, 0.74, 0.32, 32, 4),
      jerseyMat
    );
    shoulders.position.y = 2.20;
    shoulders.scale.z = 0.70;
    jerseyGroup.add(shoulders);

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.58, 1.55, 32, 12),
      jerseyMat
    );
    torso.position.y = 1.30;
    torso.scale.z = 0.70;
    jerseyGroup.add(torso);

    const hem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.59, 0.59, 0.04, 32),
      accentMat
    );
    hem.position.y = 0.55;
    hem.scale.z = 0.70;
    jerseyGroup.add(hem);

    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.04, 12, 28, Math.PI),
      accentMat
    );
    collar.position.set(0, 2.36, 0.12);
    collar.rotation.x = Math.PI;
    collar.scale.z = 0.6;
    jerseyGroup.add(collar);

    // Sleeves (scaled separately so thickness changes with size but length stays put)
    const sleeveGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.68, 20);
    const leftSleeve  = new THREE.Mesh(sleeveGeo, jerseyMat);
    const rightSleeve = new THREE.Mesh(sleeveGeo, jerseyMat);
    leftSleeve.position.set(-0.95, 2.00, 0);
    leftSleeve.rotation.z =  Math.PI / 4.5;
    rightSleeve.position.set(0.95, 2.00, 0);
    rightSleeve.rotation.z = -Math.PI / 4.5;
    jerseyGroup.add(leftSleeve, rightSleeve);

    // Cuffs
    const cuffGeo = new THREE.TorusGeometry(0.225, 0.025, 8, 20);
    const leftCuff  = new THREE.Mesh(cuffGeo, accentMat);
    const rightCuff = new THREE.Mesh(cuffGeo, accentMat);
    leftCuff.position.set(-1.23,  1.72, 0);
    leftCuff.rotation.set(Math.PI / 2, 0,  Math.PI / 4.5);
    rightCuff.position.set(1.23, 1.72, 0);
    rightCuff.rotation.set(Math.PI / 2, 0, -Math.PI / 4.5);
    jerseyGroup.add(leftCuff, rightCuff);

    // Front "14" + back "14"
    const numberTex = makeNumberTexture('14', COLOR.accent);
    const numberMat = new THREE.MeshBasicMaterial({ map: numberTex, transparent: true });
    const frontNum  = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.6), numberMat);
    frontNum.position.set(0, 1.45, 0.51);
    jerseyGroup.add(frontNum);
    const backNum = frontNum.clone();
    backNum.position.z = -0.51;
    backNum.rotation.y = Math.PI;
    jerseyGroup.add(backNum);

    // Small "Z14" chest mark
    const chestTex = makeNumberTexture('Z14', COLOR.cyan, 220);
    const chestMat = new THREE.MeshBasicMaterial({ map: chestTex, transparent: true });
    const chestBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.18), chestMat);
    chestBadge.position.set(0.32, 1.95, 0.51);
    jerseyGroup.add(chestBadge);

    scene.add(jerseyGroup);

    /* ---- Rotation root (everything rotates together with drag) ---- */
    const rotRoot = new THREE.Group();
    rotRoot.add(bodyGroup, jerseyGroup);
    scene.remove(bodyGroup, jerseyGroup);
    scene.add(rotRoot);

    /* ---- Custom drag-to-rotate + wheel-to-zoom ---- */
    const rot = { y: 0, x: 0, vy: 0, vx: 0 };
    let dragging = false;
    let lastX = 0, lastY = 0;
    let interacted = false;

    const onPointerDown = (e) => {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      stage.classList.add('dragging');
      if (!interacted) { interacted = true; stage.classList.add('interacted'); }
      try { renderer.domElement.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rot.vy = dx * 0.005;
      rot.vx = dy * 0.005;
      rot.y += rot.vy;
      rot.x += rot.vx;
      rot.x = Math.max(-0.5, Math.min(0.5, rot.x));  // clamp tilt
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = (e) => {
      dragging = false;
      stage.classList.remove('dragging');
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    renderer.domElement.addEventListener('pointerdown',  onPointerDown);
    window.addEventListener('pointermove',  onPointerMove);
    window.addEventListener('pointerup',    onPointerUp);
    window.addEventListener('pointercancel',onPointerUp);

    // Wheel = zoom (camera distance)
    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      camera.position.z = Math.max(4, Math.min(9, camera.position.z + e.deltaY * 0.004));
      if (!interacted) { interacted = true; stage.classList.add('interacted'); }
    }, { passive: false });

    /* ---- Size chip wiring + HUD + table-row sync ---- */
    const hudSize   = document.getElementById('hudSize');
    const hudChest  = document.getElementById('hudChest');
    const hudLength = document.getElementById('hudLength');
    const tableRows = document.querySelectorAll('.size-table tbody tr');

    function applySize(key) {
      const d = SIZES[key] || SIZES.M;
      animateScale(jerseyGroup, d.sx, d.sy, 1, 450);
      animateScale(leftSleeve,  d.ss, d.ss, leftSleeve.scale.z,  450);
      animateScale(rightSleeve, d.ss, d.ss, rightSleeve.scale.z, 450);
      hudSize.textContent   = key;
      hudChest.textContent  = d.chest;
      hudLength.textContent = d.length;
      tableRows.forEach(r => r.classList.remove('size-active'));
      const idx = SIZE_KEYS.indexOf(key);
      if (idx >= 0 && tableRows[idx]) tableRows[idx].classList.add('size-active');
    }

    const chips = document.querySelectorAll('.size-3d-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(x => x.classList.remove('active'));
        chip.classList.add('active');
        if (!interacted) { interacted = true; stage.classList.add('interacted'); }
        applySize(chip.dataset.size);
      });
    });
    applySize('M');

    /* ---- Resize ---- */
    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    window.addEventListener('resize', resize);

    /* ---- Render loop ---- */
    let visible = true;
    if (window.IntersectionObserver) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
    }

    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      // Auto-spin slowly until the user touches it
      if (!interacted) rot.y += 0.004;
      // Inertia decay when not actively dragging
      if (!dragging) {
        rot.vy *= 0.92;
        rot.vx *= 0.92;
        rot.y += rot.vy;
        rot.x += rot.vx;
        rot.x = Math.max(-0.5, Math.min(0.5, rot.x));
      }
      rotRoot.rotation.y = rot.y;
      rotRoot.rotation.x = rot.x;
      renderer.render(scene, camera);
    }
    tick();

    requestAnimationFrame(() => stage.classList.add('loaded'));
  }

  /* ---------- Helpers ---------- */
  function animateScale(obj, tx, ty, tz, ms) {
    const sx = obj.scale.x, sy = obj.scale.y, sz = obj.scale.z;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / ms);
      const k = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      obj.scale.x = sx + (tx - sx) * k;
      obj.scale.y = sy + (ty - sy) * k;
      obj.scale.z = sz + (tz - sz) * k;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function makeNumberTexture(text, colorHex, size) {
    size = size || 256;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#' + colorHex.toString(16).padStart(6, '0');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 ' + Math.round(size * 0.62) + 'px "Bebas Neue", Arial Black, sans-serif';
    ctx.fillText(text, size / 2, size / 2 + size * 0.03);
    const tex = new THREE.CanvasTexture(c);
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }
})();
