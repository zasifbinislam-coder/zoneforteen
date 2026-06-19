/* ============================================================
   ZONE14 — Landing-page interactions
   Requires data.js (loaded first in index.html)
   ============================================================ */

/* ---------- RENDER JERSEYS ---------- */
function renderJerseys() {
  const grid = document.getElementById('jerseyGrid');
  if (!grid) return;
  grid.innerHTML = JERSEYS.map(j => {
    const oos       = !j.inStock;
    const coming    = !!j.comingSoon;
    const stockBadge = coming
      ? `<span class="stock-badge soon">Coming Soon</span>`
      : oos
        ? `<span class="stock-badge oos">Restocking</span>`
        : (j.stockLeft <= 6
            ? `<span class="stock-badge low">Only ${j.stockLeft} left</span>`
            : `<span class="stock-badge ok">In Stock</span>`);
    // Prefer admin-uploaded photo first, then declared data.js path, else SVG.
    const adminMedia   = getJerseyMedia(j.id);
    const adminPhoto   = (adminMedia.images[0] && adminMedia.images[0].url) || '';
    const declaredPath = (j.images && j.images[0]) || '';
    const primaryPhoto = adminPhoto || declaredPath;
    // Always render the SVG as the base layer. If a photo source exists,
    // overlay it on top — and if that photo 404s, simply hide it so the SVG
    // underneath stays visible. No fragile parentNode lookups.
    const photoOverlay = primaryPhoto
      ? `<img class="jersey-photo" src="${primaryPhoto}" alt="${j.country} ${j.edition}" loading="lazy" decoding="async" onerror="this.style.display='none'" />`
      : '';

    return `
    <article class="jersey-card reveal${oos ? ' out-of-stock' : ''}${coming ? ' coming-soon' : ''}" data-tag="${j.tag}" data-id="${j.id}" data-country="${j.country.toLowerCase()}">
      <div class="jersey-img-wrap">
        <span class="jersey-tag ${j.tag}">${j.edition}</span>
        ${stockBadge}
        ${jerseyOnSale(j) ? `<span class="sale-flash">SALE −৳${(j.price - salePrice(j)).toLocaleString('en-IN')}</span>` : ''}
        <button type="button" class="wish-heart${inWishlist(j.id) ? ' active' : ''}" aria-label="Save to wishlist" data-wish>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
        <span class="jersey-shine"></span>
        ${jerseySVG(j)}
        ${photoOverlay}
        ${oos && !coming ? '<span class="oos-stamp">Out of Stock</span>' : ''}
      </div>
      <div class="jersey-body">
        <div class="jersey-head">
          <h3 class="jersey-country flag-text" style="background-image:${(COUNTRY[j.id.split('-')[0].toUpperCase()] || {}).gradient || 'linear-gradient(180deg,#fff,#b0b0b0)'}">${j.country}</h3>
          ${priceTagHTML(j)}
        </div>
        <div class="size-picker" role="group" aria-label="Select size for ${j.country}">
          ${['M','L','XL','XXL'].map(s =>
            `<button class="size-btn${s === 'M' ? ' active' : ''}" data-size="${s}"${oos ? ' disabled' : ''}>${s}</button>`
          ).join('')}
        </div>
        ${oos
          ? `<button class="jersey-order notify" type="button">
               <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 00-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z"/></svg>
               ${coming ? 'Pre-order · Reserve Now' : 'Notify Me When Available'}
             </button>`
          : `<button class="jersey-order" type="button">
               <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 4V2h10v2h5v2h-2v15a2 2 0 01-2 2H6a2 2 0 01-2-2V6H2V4h5zm2 4v11h2V8H9zm4 0v11h2V8h-2z" opacity="0"/><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.8 2.8A1 1 0 005 17h12M9 21a1 1 0 11-2 0 1 1 0 012 0zm10 0a1 1 0 11-2 0 1 1 0 012 0z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
               Order Now
             </button>`
        }
      </div>
    </article>
  `;}).join('');

  // Size selectors
  grid.querySelectorAll('.size-picker').forEach(picker => {
    picker.addEventListener('click', e => {
      const btn = e.target.closest('.size-btn');
      if (!btn || btn.disabled) return;
      picker.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Wishlist hearts on cards
  grid.querySelectorAll('[data-wish]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.jersey-card');
      const id = card.dataset.id;
      const nowIn = toggleWishlist(id);
      btn.classList.toggle('active', nowIn);
      // Visual pop
      btn.classList.add('pop');
      setTimeout(() => btn.classList.remove('pop'), 350);
    });
  });

  // Quick view buttons (and tapping anywhere on the product image)
  grid.querySelectorAll('[data-quickview]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.closest('.jersey-card').dataset.id;
      if (window.openQuickView) window.openQuickView(id);
    });
  });
  grid.querySelectorAll('.jersey-img-wrap').forEach(wrap => {
    wrap.style.cursor = 'pointer';
    wrap.addEventListener('click', e => {
      // Let the wishlist heart / quick-view button handle their own clicks
      if (e.target.closest('[data-wish], [data-quickview]')) return;
      const id = wrap.closest('.jersey-card').dataset.id;
      if (window.openQuickView) window.openQuickView(id);
    });
  });

  // Order / notify buttons
  grid.querySelectorAll('.jersey-card').forEach(card => {
    const orderBtn = card.querySelector('.jersey-order');
    if (!orderBtn) return;
    const id = card.dataset.id;
    const jersey = JERSEYS.find(x => x.id === id);

    orderBtn.addEventListener('click', () => {
      const size = card.querySelector('.size-btn.active')?.dataset.size || 'M';

      if (!jersey.inStock) {
        const isComing = !!jersey.comingSoon;
        const subj = isComing
          ? `Hi Zone14! I'd like to pre-order this kit:`
          : `Hi Zone14! Please notify me when this is back in stock:`;
        const msg = encodeURIComponent(
          `${subj}\n\n` +
          `👕 ${jersey.country} — ${jersey.edition}\n` +
          `📏 My size: ${size}\n` +
          `💰 Price: ৳${salePrice(jersey).toLocaleString('en-IN')}${jerseyOnSale(jersey) ? ` (was ৳${jersey.price.toLocaleString('en-IN')} — sale)` : ''}` +
          (isComing ? `\n\nPlease confirm expected delivery timeline.` : '')
        );
        window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank', 'noopener');
        return;
      }

      // In stock → add to cart and head to checkout
      addToCart(jersey.id, size, 1);
      window.location.href = 'order.html';
    });
  });

  // Hover slideshow — cycle a jersey's photos (3s each) while the mouse is over it
  grid.querySelectorAll('.jersey-card').forEach(card => {
    const j = getJersey(card.dataset.id);
    const photo = card.querySelector('.jersey-photo');
    if (!j || !photo) return;
    const imgs = getCardImages(j);
    if (imgs.length < 2) return;

    imgs.forEach(src => { const im = new Image(); im.src = src; });   // preload for smooth swaps

    // A top crossfade layer: the base photo always stays fully opaque, so the
    // 2D SVG jersey underneath never peeks through while the image changes.
    const top = photo.cloneNode(false);
    top.removeAttribute('id');
    top.classList.add('cycle-top');
    top.style.opacity = '0';
    photo.parentElement.appendChild(top);

    let idx = 0, timer = null;
    const swap = () => {
      idx = (idx + 1) % imgs.length;
      top.src = imgs[idx];
      requestAnimationFrame(() => { top.style.opacity = '1'; });   // fade next in over current
      setTimeout(() => {
        photo.src = imgs[idx];                 // commit to the (still opaque) base
        top.style.transition = 'none';
        top.style.opacity = '0';
        requestAnimationFrame(() => { top.style.transition = ''; });
      }, 420);
    };
    const start = () => { if (!timer) timer = setInterval(swap, 3000); };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
      idx = 0;
      top.style.transition = 'none'; top.style.opacity = '0';
      photo.src = imgs[0];
      requestAnimationFrame(() => { top.style.transition = ''; });
    };
    card.addEventListener('mouseenter', start);
    card.addEventListener('mouseleave', stop);
  });

  // Re-observe newly added reveal targets
  if (typeof revealObserver !== 'undefined') {
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
}

/* All photo URLs for a jersey (admin uploads first, else declared paths). */
function getCardImages(j) {
  const admin = (getJerseyMedia(j.id).images || []).map(a => a.url).filter(Boolean);
  if (admin.length) return admin;
  return (j.images || []).filter(Boolean);
}

/* ---------- FILTERS + SEARCH ---------- */
const filterState = { tag: 'all', query: '' };

function applyJerseyFilter() {
  const cards = document.querySelectorAll('.jersey-card');
  const empty = document.getElementById('jerseyEmpty');
  let visibleCount = 0;
  cards.forEach(card => {
    const tagOk   = filterState.tag === 'all' || card.dataset.tag === filterState.tag;
    const queryOk = !filterState.query || (card.dataset.country || '').includes(filterState.query);
    const show    = tagOk && queryOk;
    card.classList.toggle('hide', !show);
    if (show) visibleCount++;
  });
  if (empty) empty.hidden = visibleCount > 0;
}

function initFilters() {
  const chips = document.querySelectorAll('.jersey-filter .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterState.tag = chip.dataset.filter;
      applyJerseyFilter();
    });
  });

  const search = document.getElementById('jerseySearch');
  const clear  = document.getElementById('jerseySearchClear');
  if (search) {
    search.addEventListener('input', () => {
      filterState.query = search.value.trim().toLowerCase();
      clear.hidden = !filterState.query;
      applyJerseyFilter();
    });
  }
  if (clear) {
    clear.addEventListener('click', () => {
      search.value = '';
      filterState.query = '';
      clear.hidden = true;
      applyJerseyFilter();
      search.focus();
    });
  }
}

/* ---------- COUNTDOWN ---------- */
/* Next upcoming fixture from the REAL feed (falls back to static when offline) */
function nextUpcomingMatch() {
  const now = Date.now();
  return (typeof getDisplayMatches === 'function' ? getDisplayMatches() : [])
    .map(c => ({ ...c, ts: new Date(c.date).getTime() }))
    .filter(c => c.ts > now)
    .sort((a, b) => a.ts - b.ts)[0] || null;
}

function updateCountdown() {
  // Count down to KICKOFF, but once it's passed roll over to the next upcoming
  // fixture so the hero clock stays live throughout the tournament.
  const nm = nextUpcomingMatch();
  let target = KICKOFF.getTime();
  if (target - Date.now() <= 0 && nm) target = nm.ts;

  // Caption under the countdown — show exactly who's playing next
  const cap = document.getElementById('cdCaption');
  if (cap) {
    if (nm) {
      const h = (nm.home && nm.home.name) || nm.home;
      const a = (nm.away && nm.away.name) || nm.away;
      cap.innerHTML = `Next up · <strong>${h}</strong> vs <strong>${a}</strong> · ${formatMatchDate(nm.date)}, ${formatBdLocalTime(nm.date)}`;
    } else {
      cap.textContent = 'World Cup 2026 · Group Stage underway';
    }
  }
  const diff = target - Date.now();
  if (diff <= 0) {
    ['cdDays', 'cdHours', 'cdMinutes', 'cdSeconds'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
    return;
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('cdDays').textContent = pad(days);
  document.getElementById('cdHours').textContent = pad(hours);
  document.getElementById('cdMinutes').textContent = pad(minutes);
  document.getElementById('cdSeconds').textContent = pad(seconds);
}

/* ---------- NAV ---------- */
function initNav() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
    document.getElementById('backToTop').classList.toggle('show', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('active');
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', open);
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- BACK TO TOP ---------- */
function initBackToTop() {
  document.getElementById('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------- REVEAL ON SCROLL ---------- */
let revealObserver;
function initReveal() {
  // Old browsers / jsdom don't have IntersectionObserver — fall back to
  // showing everything immediately. (Throwing here would kill every init
  // that runs after it in DOMContentLoaded.)
  if (typeof IntersectionObserver === 'undefined') {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    return;
  }
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/* ---------- REVIEWS CAROUSEL ---------- */
/* Reviews are presented as a continuous right-to-left marquee. We clone the
   card list once so the CSS animation can loop seamlessly (translateX(-50%)
   takes us exactly to the start of the duplicate). Arrows nudge manually
   and pause the float. Mouse hover also pauses for reading.
   Re-runs are idempotent — calling initReviews again after renderDynamicReviews
   replaces the cards resets the clones cleanly. */
function initReviews() {
  const track = document.getElementById('reviewsTrack');
  const prev  = document.getElementById('reviewPrev');
  const next  = document.getElementById('reviewNext');
  if (!track) return;

  // Strip any previous clones so we don't double up on re-init
  track.querySelectorAll('[data-clone]').forEach(el => el.remove());
  track.classList.remove('is-floating', 'is-paused');
  track.style.transform = '';
  track.style.animation = '';

  const originals = Array.from(track.children);
  const total = originals.length;
  if (total === 0) return;

  // Clone the entire set once so the marquee can loop seamlessly
  originals.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('data-clone', '1');
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  // Pick a duration based on card count — ~6s per card feels natural
  const seconds = Math.max(30, total * 6);
  track.style.setProperty('--marquee-duration', seconds + 's');
  track.classList.add('is-floating');

  // Manual arrows nudge by one card-width and pause the float briefly.
  // Touching the play state directly via class is cleaner than fighting CSS.
  let pauseTimer = null;
  const nudge = (dir) => {
    track.classList.add('is-paused');
    const cardW = originals[0].getBoundingClientRect().width + 24;
    const cur = parseFloat(track.dataset.nudge || '0');
    const nx  = cur + dir * cardW;
    track.style.transform = `translateX(${-nx}px)`;
    track.dataset.nudge = nx;
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => {
      track.classList.remove('is-paused');
      track.style.transform = '';
      track.dataset.nudge = '0';
    }, 5000);
  };
  if (prev) prev.addEventListener('click', () => nudge(-1));
  if (next) next.addEventListener('click', () => nudge(1));
}

/* ---------- CONFETTI (hero) ---------- */
function initConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf;

  const colors = ['#5ee9e3', '#1d6b3a', '#f5e9c8', '#7a1f2b', '#ffd700'];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(count) {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    for (let i = 0; i < count; i++) {
      const base = 0.55 + Math.random() * 0.45;
      particles.push({
        x: Math.random() * w,
        y: h + 10 + Math.random() * 60,             // spawn just below the hero floor
        vx: (Math.random() - 0.5) * 0.7,
        vy: -(0.6 + Math.random() * 1.4),           // float upward
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.12,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        baseOpacity: base,
        opacity: base,
      });
    }
  }

  function tick() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    // Confetti is confined to the lower band of the hero:
    //  fully visible below 65% of hero height, fades out by 25%, gone above 15%.
    const visibleFrom = h * 0.65;
    const fadeOut    = h * 0.25;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vx += (Math.random() - 0.5) * 0.02;        // gentle horizontal drift

      if (p.y < visibleFrom) {
        const t = (p.y - fadeOut) / (visibleFrom - fadeOut);
        p.opacity = Math.max(0, Math.min(1, t)) * p.baseOpacity;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    particles = particles.filter(p => p.y > -20 && p.opacity > 0.02);

    if (particles.length < 70) spawn(3);

    raf = requestAnimationFrame(tick);
  }

  resize();
  // Pre-seed: spawn at random heights so the band is populated from the first frame
  for (let i = 0; i < 90; i++) {
    spawn(1);
    const p = particles[particles.length - 1];
    p.y = canvas.offsetHeight * (0.3 + Math.random() * 0.7);
  }
  tick();

  window.addEventListener('resize', resize);

  // Pause when off-screen
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (!raf) tick();
      } else {
        cancelAnimationFrame(raf);
        raf = null;
      }
    });
  });
  io.observe(canvas);

  // Honor reduced motion
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cancelAnimationFrame(raf);
    canvas.style.display = 'none';
  }
}

/* ---------- FOOTER YEAR ---------- */
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- CART PILL + BOTTOM NAV COUNTER ---------- */
function initCartPill() {
  const pill   = document.getElementById('cartPill');
  const count  = document.getElementById('cartCount');
  const mbnCt  = document.getElementById('mbnCartCount');

  const sync = () => {
    const n = cartCount();
    if (count) count.textContent = n;
    if (pill)  pill.classList.toggle('show', n > 0);
    if (mbnCt) {
      mbnCt.textContent = n;
      mbnCt.hidden = n === 0;
    }
  };

  sync();
  window.addEventListener('cart:change', sync);
  window.addEventListener('storage', sync);
}

/* ============================================================
   DYNAMIC REVIEWS — replace static reviews with Supabase-backed
   admin-posted reviews when any exist.
   ============================================================ */
function renderDynamicReviews() {
  const reviews = readReviews();
  if (!reviews || reviews.length === 0) {
    // No admin reviews — make sure the static fallback marquee is initialized.
    // (Re-call is safe; initReviews strips clones first.)
    if (typeof initReviews === 'function') initReviews();
    return;
  }

  const track = document.getElementById('reviewsTrack');
  if (!track) return;

  track.innerHTML = reviews.map(r => {
    const initials = (r.name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const filled = '★'.repeat(r.rating || 5);
    const empty  = '<span style="color:#444">' + '★'.repeat(5 - (r.rating || 5)) + '</span>';
    const avatarColors = ['#5ee9e3','#fbe10d','#c60b1e','#75aadb','#1e3a8a','#ffd700','#7a1f2b','#1d6b3a'];
    const color = avatarColors[Math.abs(hashStr(r.name)) % avatarColors.length];
    const fg = ['#fbe10d','#c60b1e','#75aadb'].includes(color) ? '#0a1414' : '#052424';

    // Media — video wins if both are set (richer content)
    let mediaHtml = '';
    let mediaClass = '';
    if (r.videoUrl) {
      mediaHtml = `<div class="rv-media"><video src="${r.videoUrl}" controls muted playsinline preload="metadata" ${r.photoUrl ? `poster="${r.photoUrl}"` : ''}></video></div>`;
      mediaClass = ' has-media';
    } else if (r.photoUrl) {
      mediaHtml = `<div class="rv-media rv-photo"><img src="${r.photoUrl}" alt="" loading="lazy" /></div>`;
      mediaClass = ' has-photo has-media';
    }

    return `
      <article class="review-card${mediaClass}">
        ${mediaHtml}
        <header class="rv-head">
          <span class="rv-avatar" style="background:${color};color:${fg}">${escapeHtml(initials)}</span>
          <div class="rv-meta">
            <strong>${escapeHtml(r.name)}</strong>
            <span class="rv-sub"><span class="rv-verified">✓ Verified</span>${r.createdAt ? ' · ' + relTime(r.createdAt) : ''}</span>
          </div>
          <span class="stars">${filled}${empty}</span>
        </header>
        <p class="rv-body">"${escapeHtml(r.text || '')}"</p>
        ${(r.purchaseInfo || r.location) ? `<footer class="rv-foot">
          ${r.purchaseInfo ? `<span class="rv-buy">${escapeHtml(r.purchaseInfo)}</span>` : ''}
          ${r.location ? `<span class="rv-loc">📍 ${escapeHtml(r.location)}</span>` : ''}
        </footer>` : ''}
      </article>
    `;
  }).join('');

  // After replacing the cards, re-init so the marquee picks up the new set
  if (typeof initReviews === 'function') initReviews();
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
function relTime(ms) {
  const diff = Math.max(0, Date.now() - ms);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 7) return new Date(ms).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  if (d > 0) return d + ' day' + (d === 1 ? '' : 's') + ' ago';
  if (h > 0) return h + 'h ago';
  if (m > 0) return m + 'm ago';
  return 'just now';
}

/* ============================================================
   VIDEO SHOWCASE — landing-page grid + modal player
   ============================================================ */
/* ---------- HERO VIDEO BAND — single-video carousel ----------
   Shows ONE jersey video at a time (muted autoplay preview), auto-advances
   every few seconds, and lets the visitor swipe/drag or tap dots to change.
   Tapping the play button opens the big modal (with sound). Admin-driven
   (hero_videos table); hidden when empty. */
let _heroCarousel = null;
function renderHeroVideos() {
  const section  = document.getElementById('heroVideos');
  const track    = document.getElementById('heroVideoTrack');
  const dotsWrap = document.getElementById('heroVideoDots');
  const viewport = document.getElementById('heroVideoViewport');
  if (!section || !track) return;

  // Tear down any previous carousel timers/listeners
  if (_heroCarousel) { _heroCarousel.destroy(); _heroCarousel = null; }

  const vids = (typeof readHeroVideos === 'function' ? readHeroVideos() : []);
  if (!vids.length) {
    section.hidden = true;
    track.innerHTML = ''; if (dotsWrap) dotsWrap.innerHTML = '';
    return;
  }
  section.hidden = false;

  track.innerHTML = vids.map(v => `
    <div class="hero-video-slide">
      <button type="button" class="hero-video-tile" data-hero-vid="${v.id}" aria-label="Play video">
        <video src="${v.videoUrl}"${v.posterUrl ? ` poster="${v.posterUrl}"` : ''}
               muted loop playsinline preload="auto"></video>
      </button>
    </div>
  `).join('');

  if (dotsWrap) {
    dotsWrap.innerHTML = vids.length > 1
      ? vids.map((_, i) => `<button type="button" class="hvb-dot${i === 0 ? ' active' : ''}" data-dot="${i}" aria-label="Video ${i + 1}"></button>`).join('')
      : '';
  }

  const videoEls = [...track.querySelectorAll('video')];
  const dotEls   = dotsWrap ? [...dotsWrap.children] : [];
  const vp = viewport || track;
  let idx = 0, timer = null;

  const playOnly = (n) => videoEls.forEach((v, i) => {
    v.muted = true;                 // set the PROPERTY so muted autoplay is allowed
    v.playsInline = true;
    if (i === n) {
      try { if (v.readyState > 0) v.currentTime = 0; } catch (_) {}  // fresh start when ready
      const p = v.play(); if (p && p.catch) p.catch(() => {});
    } else { try { v.pause(); } catch (_) {} }
  });
  const show = (n) => {
    idx = (n + vids.length) % vids.length;
    track.style.transform = `translateX(${-idx * 100}%)`;
    dotEls.forEach((d, i) => d.classList.toggle('active', i === idx));
    playOnly(idx);
  };
  const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };
  const start = () => { if (!timer && vids.length > 1) timer = setInterval(() => show(idx + 1), 5000); };
  const restart = () => { stop(); start(); };

  // Tap a tile → open big modal (ignored if the gesture was a swipe)
  track.querySelectorAll('[data-hero-vid]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (vp && vp._heroMoved) return;
      const v = vids.find(x => x.id === btn.dataset.heroVid);
      if (v) openVideoModal({ url: v.videoUrl, poster: v.posterUrl || '', title: '', subtitle: '' });
    });
  });

  // Dots → jump
  dotEls.forEach(d => d.addEventListener('click', () => { show(+d.dataset.dot); restart(); }));

  // Pause cycling while the tab is hidden
  const onVis = () => { if (document.hidden) stop(); else { playOnly(idx); start(); } };
  document.addEventListener('visibilitychange', onVis);

  // Expose the current carousel so the once-bound gesture handlers drive it
  _heroCarousel = {
    show, restart, stop, getIdx: () => idx,
    destroy() { stop(); document.removeEventListener('visibilitychange', onVis); },
  };

  // Swipe / drag — bound ONCE to the viewport (never stacks across re-renders),
  // always controls whichever carousel is current.
  if (vp && !vp.dataset.heroWired) {
    vp.dataset.heroWired = '1';
    let sx = 0, dragging = false, moved = false;
    vp.addEventListener('pointerdown', e => { const c = _heroCarousel; if (!c) return; dragging = true; moved = false; sx = e.clientX; c.stop(); });
    vp.addEventListener('pointermove', e => { if (dragging && Math.abs(e.clientX - sx) > 8) moved = true; });
    vp.addEventListener('pointerup', e => {
      const c = _heroCarousel; if (!c || !dragging) return;
      dragging = false;
      const dx = e.clientX - sx;
      vp._heroMoved = moved;
      if (Math.abs(dx) > 40) c.show(c.getIdx() + (dx < 0 ? 1 : -1));
      c.restart();
      setTimeout(() => { vp._heroMoved = false; }, 60);
    });
    vp.addEventListener('pointercancel', () => { dragging = false; const c = _heroCarousel; if (c) c.restart(); });
    vp.addEventListener('pointerleave', () => { if (dragging) { dragging = false; const c = _heroCarousel; if (c) c.restart(); } });
  }

  show(0);
  start();
}

function renderVideoShowcase() {
  const grid = document.getElementById('videoGrid');
  if (!grid) return;

  // Priority order:
  // 1. Admin-uploaded SHOWCASE videos (new dedicated table) — these are curated
  // 2. Admin-uploaded per-jersey videos (jersey_media)
  // 3. Hardcoded VIDEO_SHOWCASE fallback cards (only if both above are empty)
  const showcaseVideos = (typeof readShowcase === 'function' ? readShowcase() : []).map(v => ({
    id:       'showcase-' + v.id,
    jerseyId: v.jerseyId || null,
    title:    v.title,
    subtitle: v.subtitle || '',
    duration: v.duration || '',
    url:      v.videoUrl,
    poster:   v.posterUrl || '',
  }));

  const adminVideos = [];
  JERSEYS.forEach(j => {
    const media = getJerseyMedia(j.id);
    (media.videos || []).forEach(v => {
      adminVideos.push({
        id: 'admin-' + v.id,
        jerseyId: j.id,
        title: `${j.country} ${j.edition}`,
        subtitle: v.name,
        duration: '',
        url: v.url,
        poster: (media.images[0] && media.images[0].url) || '',
      });
    });
  });

  // Only show the hardcoded VIDEO_SHOWCASE cards when there's nothing real to show
  const hasReal = showcaseVideos.length > 0 || adminVideos.length > 0;
  const declared = hasReal ? [] : VIDEO_SHOWCASE.map(v => {
    const jersey = getJersey(v.jerseyId);
    const media = jersey ? getJerseyMedia(jersey.id) : null;
    const jerseyVid = media && media.videos[0];
    return {
      ...v,
      url: jerseyVid ? jerseyVid.url : '',
      poster: (media && media.images[0] && media.images[0].url) || '',
      jersey,
    };
  });

  const list = [...showcaseVideos, ...adminVideos, ...declared].slice(0, 8);

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="video-empty">
        <div class="video-empty-ico">🎬</div>
        <p>Videos coming soon — we're shooting product walkthroughs for every kit.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(v => {
    const hasVideo = !!v.url;
    const j = v.jersey || (v.jerseyId ? getJersey(v.jerseyId) : null);
    const posterHtml = v.poster
      ? `<img class="vc-poster" src="${v.poster}" alt="${v.title}" loading="lazy" />`
      : (j ? `<div class="vc-svg">${jerseySVG(j)}</div>` : '');
    return `
      <article class="video-card reveal${hasVideo ? '' : ' coming-soon'}" data-vid="${v.id}">
        <div class="vc-media">
          ${posterHtml}
          <div class="vc-overlay">
            ${hasVideo
              ? `<span class="vc-play"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>`
              : `<span class="vc-soon">Coming Soon</span>`}
            ${v.duration ? `<span class="vc-duration">${v.duration}</span>` : ''}
          </div>
        </div>
        <div class="vc-body">
          <h3 class="vc-title">${v.title}</h3>
          <p class="vc-sub">${v.subtitle || ''}</p>
        </div>
      </article>
    `;
  }).join('');

  // Wire clicks
  grid.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('click', () => {
      const v = list.find(x => x.id === card.dataset.vid);
      if (!v || !v.url) return;
      openVideoModal(v);
    });
  });

  if (typeof revealObserver !== 'undefined') {
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
}

function openVideoModal(video) {
  const modal = document.getElementById('videoModal');
  const player = document.getElementById('videoModalPlayer');
  const meta   = document.getElementById('videoModalMeta');
  if (!modal) return;

  player.innerHTML = `
    <video src="${video.url}" controls autoplay playsinline ${video.poster ? `poster="${video.poster}"` : ''}></video>
  `;
  meta.innerHTML = `
    ${video.title ? `<h3>${video.title}</h3>` : ''}
    ${video.subtitle ? `<p>${video.subtitle}</p>` : ''}
    ${video.jerseyId ? `<a class="btn btn-primary btn-sm" href="#jerseys">Shop this kit →</a>` : ''}
  `;

  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('show'));
  document.body.style.overflow = 'hidden';
}

function initVideoModal() {
  const modal = document.getElementById('videoModal');
  if (!modal) return;
  const close = () => {
    modal.classList.remove('show');
    // stop the video on close
    const v = modal.querySelector('video');
    if (v) v.pause();
    setTimeout(() => {
      modal.hidden = true;
      document.body.style.overflow = '';
      document.getElementById('videoModalPlayer').innerHTML = '';
    }, 250);
  };
  modal.querySelectorAll('[data-vid-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
}

/* ============================================================
   IMAGE LIGHTBOX — fullscreen zoom + swipe (window.openImageLightbox)
   ============================================================ */
let _lb = null;   // { srcs, idx, zoom, panX, panY }
function initImageLightbox() {
  const lb = document.getElementById('imgLightbox');
  if (!lb || lb._wired) return;
  lb._wired = true;

  const imgEl = lb.querySelector('.lb-img');
  const dots  = lb.querySelector('.lb-dots');
  const stage = lb.querySelector('.lb-stage');

  const apply = () => {
    imgEl.style.transform = `translate(${_lb.panX}px, ${_lb.panY}px) scale(${_lb.zoom})`;
    imgEl.classList.toggle('zoomed', _lb.zoom > 1);
  };
  const render = () => {
    imgEl.src = _lb.srcs[_lb.idx];
    _lb.zoom = 1; _lb.panX = 0; _lb.panY = 0; apply();
    dots.innerHTML = _lb.srcs.length > 1
      ? _lb.srcs.map((_, i) => `<span class="lb-dot${i === _lb.idx ? ' active' : ''}"></span>`).join('')
      : '';
  };
  const show = (n) => { _lb.idx = (n + _lb.srcs.length) % _lb.srcs.length; render(); };
  const close = () => { lb.classList.remove('show'); document.body.style.overflow = ''; _lb = null; };
  lb._render = render;

  lb.querySelectorAll('[data-lb-close]').forEach(b => b.addEventListener('click', close));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('show')) close(); });

  let downX = 0, downY = 0, moved = false, sPanX = 0, sPanY = 0;
  stage.addEventListener('pointerdown', e => {
    if (!_lb) return;
    downX = e.clientX; downY = e.clientY; moved = false;
    sPanX = _lb.panX; sPanY = _lb.panY;
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener('pointermove', e => {
    if (!_lb || e.buttons === 0) return;
    const dx = e.clientX - downX, dy = e.clientY - downY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
    if (_lb.zoom > 1) { _lb.panX = sPanX + dx; _lb.panY = sPanY + dy; apply(); }
  });
  stage.addEventListener('pointerup', e => {
    if (!_lb) return;
    const dx = e.clientX - downX, dy = e.clientY - downY;
    if (!moved) {
      // tap toggles zoom
      _lb.zoom = _lb.zoom > 1 ? 1 : 2.5;
      _lb.panX = 0; _lb.panY = 0; apply();
    } else if (_lb.zoom === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      show(_lb.idx + (dx < 0 ? 1 : -1));   // swipe to change (only when not zoomed)
    }
  });
}
window.openImageLightbox = function (srcs, start) {
  const lb = document.getElementById('imgLightbox');
  if (!lb || !srcs || !srcs.length) return;
  initImageLightbox();
  _lb = { srcs, idx: Math.max(0, Math.min(start || 0, srcs.length - 1)), zoom: 1, panX: 0, panY: 0 };
  lb.classList.add('show');
  document.body.style.overflow = 'hidden';
  lb._render();
};

/* ============================================================
   STAR PLAYERS — customization upsell
   ============================================================ */
function renderPlayers() {
  const grid = document.getElementById('playersGrid');
  if (!grid) return;
  grid.innerHTML = PLAYERS.map(p => {
    const c = COUNTRY[p.country] || { name: p.country, bg:'#222', fg:'#fff' };
    return `
      <article class="player-card reveal" data-player="${p.id}">
        <div class="player-back" style="--bg:${c.bg};--fg:${c.fg}">
          <span class="player-num">${p.number}</span>
          <span class="player-flag">${flagImg(p.country)} ${p.country}</span>
        </div>
        <div class="player-info">
          <div class="player-meta">
            <span class="player-pos">${p.position}</span>
            <span class="player-country">${c.name}</span>
          </div>
          <h3 class="player-name">${p.name}</h3>
          <p class="player-blurb">${p.blurb}</p>
          <button class="player-cta" type="button">
            Get this kit · <span class="cyan">FREE print</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13 5l7 7-7 7-1.4-1.4L16.2 13H4v-2h12.2l-4.6-4.6z"/></svg>
          </button>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.player-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = PLAYERS.find(x => x.id === card.dataset.player);
      if (!p) return;
      addToCart(p.jersey, 'M', 1);
      const params = new URLSearchParams({ customName: p.name, customNumber: p.number });
      window.location.href = `order.html?${params.toString()}`;
    });
  });

  if (typeof revealObserver !== 'undefined') {
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
}

/* ============================================================
   WISHLIST
   ============================================================ */
function initWishlist() {
  const pill  = document.getElementById('wishlistPill');
  const count = document.getElementById('wishlistCount');
  if (!pill || !count) return;

  const sync = () => {
    const n = wishlistCount();
    count.textContent = n;
    pill.classList.toggle('show', n > 0);

    // Refresh heart icons on cards
    document.querySelectorAll('.jersey-card').forEach(card => {
      const heart = card.querySelector('.wish-heart');
      if (heart) heart.classList.toggle('active', inWishlist(card.dataset.id));
    });
    // Refresh quick view heart
    const qvHeart = document.getElementById('qvWishlist');
    if (qvHeart && qvHeart.dataset.id) {
      qvHeart.classList.toggle('active', inWishlist(qvHeart.dataset.id));
    }
  };

  sync();
  window.addEventListener('wishlist:change', sync);

  pill.addEventListener('click', openWishlistModal);
}

/* Lightweight wishlist viewer — re-uses the quick view modal style */
function openWishlistModal() {
  const list = readWishlist();
  if (list.length === 0) return;
  // For v1: open a WhatsApp message listing the wishlist with restock-alert request
  const lines = ['Hi Zone14! My wishlist — please notify me when these are back in stock or on offer:\n'];
  list.forEach(id => {
    const j = getJersey(id);
    if (j) lines.push(`👕 ${j.country} ${j.edition} — ${fmtBDT(salePrice(j))}${jerseyOnSale(j) ? ' (sale)' : ''}${j.inStock ? '' : ' (currently OOS)'}`);
  });
  const msg = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank', 'noopener');
}

/* ============================================================
   SOCIAL PROOF TOAST
   ============================================================ */
function initSocialProof() {
  const toast = document.getElementById('socialToast');
  if (!toast || typeof SOCIAL_PROOF === 'undefined' || SOCIAL_PROOF.length === 0) return;

  const stName   = document.getElementById('stName');
  const stCity   = document.getElementById('stCity');
  const stAction = document.getElementById('stAction');
  const stTime   = document.getElementById('stTime');
  const stAvatar = document.getElementById('stAvatar');
  const stClose  = toast.querySelector('.st-close');

  let i = 0;
  let dismissed = false;

  function show() {
    if (dismissed) return;
    const item = SOCIAL_PROOF[i % SOCIAL_PROOF.length];
    i++;
    stName.textContent   = item.name;
    stCity.textContent   = item.city;
    stAction.textContent = item.action;
    const offsetMins = (i * 3) + item.minsAgo;
    stTime.textContent   = offsetMins < 60 ? `${offsetMins} min ago` : `${Math.floor(offsetMins/60)}h ago`;
    // Initials avatar with random pleasant background
    const initials = item.name[0];
    const hues = ['#5ee9e3', '#1d6b3a', '#7a1f2b', '#ffd700', '#00d4ff'];
    stAvatar.textContent = initials;
    stAvatar.style.background = hues[i % hues.length];
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5500);
  }

  stClose.addEventListener('click', () => {
    dismissed = true;
    toast.classList.remove('show');
  });

  // First toast after 8s of page load, then every 18s
  setTimeout(() => {
    show();
    setInterval(show, 18000);
  }, 8000);
}

/* ============================================================
   QUICK VIEW MODAL
   ============================================================ */
function initQuickView() {
  const modal = document.getElementById('quickView');
  if (!modal) return;
  let state = { jersey: null, size: 'M', qty: 1 };

  const qvMain    = document.getElementById('qvMediaMain');
  const qvThumbs  = document.getElementById('qvThumbs');
  const qvTag     = document.getElementById('qvTag');
  const qvTitle   = document.getElementById('qvTitle');
  const qvEdition = document.getElementById('qvEdition');
  const qvPrice   = document.getElementById('qvPrice');
  const qvStock   = document.getElementById('qvStock');
  const qvSizes   = document.getElementById('qvSizes');
  const qvQty     = document.getElementById('qvQty');
  const qvAdd     = document.getElementById('qvAdd');
  const qvWish    = document.getElementById('qvWishlist');
  const qvDetails = document.getElementById('qvDetails');

  /* Build gallery — admin-uploaded media first, then declared paths, then SVG.
     Only shows images that successfully load. */
  function loadGallery(jersey, onReady) {
    // Admin uploads win
    const adminMedia = getJerseyMedia(jersey.id);
    const adminImgs  = adminMedia.images.map(a => a.url);
    const adminVid   = adminMedia.videos[0] && adminMedia.videos[0].url;

    if (adminImgs.length > 0 || adminVid) {
      // Skip the probe — admin uploads are trusted to be valid
      onReady(adminImgs, adminVid || null);
      return;
    }

    // Fallback: probe declared paths in data.js
    const candidates = jersey.images || [];
    if (candidates.length === 0) { onReady([], null); return; }

    let pending = candidates.length;
    const results = new Array(candidates.length).fill(null);
    candidates.forEach((src, i) => {
      const img = new Image();
      img.onload  = () => { results[i] = src; if (--pending === 0) finish(); };
      img.onerror = () => { if (--pending === 0) finish(); };
      img.src = src;
    });

    function finish() {
      const validImages = results.filter(Boolean);
      if (!jersey.video) { onReady(validImages, null); return; }
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => onReady(validImages, jersey.video);
      probe.onerror          = () => onReady(validImages, null);
      probe.src = jersey.video;
    }
  }

  // Tapping the big image opens the fullscreen zoom/swipe lightbox
  function openImgLightbox(srcs, start) {
    if (window.openImageLightbox) window.openImageLightbox(srcs, start);
  }

  function renderMedia(jersey, images, video) {
    /* Build the list of media items: photos first, video last (if present),
       SVG fallback if no real photos exist. */
    const items = [];
    images.forEach(src => items.push({ type: 'img', src }));
    if (video) items.push({ type: 'video', src: video });
    if (items.length === 0) items.push({ type: 'svg', html: jerseySVG(jersey) });

    let active = 0;
    const setActive = (i) => {
      active = i;
      const it = items[i];
      qvMain.innerHTML = it.type === 'img'
        ? `<img src="${it.src}" alt="${jersey.country} ${jersey.edition}" />`
        : it.type === 'video'
          ? `<video src="${it.src}" controls muted autoplay loop playsinline></video>`
          : it.html;
      qvThumbs.querySelectorAll('.qv-thumb').forEach((t, idx) =>
        t.classList.toggle('active', idx === i)
      );
    };

    qvThumbs.innerHTML = items.map((it, i) => {
      if (it.type === 'img') {
        return `<button type="button" class="qv-thumb" data-i="${i}"><img src="${it.src}" alt="" /></button>`;
      }
      if (it.type === 'video') {
        return `<button type="button" class="qv-thumb qv-thumb-video" data-i="${i}" aria-label="Play video"></button>`;
      }
      return `<button type="button" class="qv-thumb" data-i="${i}">${it.html}</button>`;
    }).join('');

    // Hide the thumb strip entirely if there's only one item
    qvThumbs.style.display = items.length > 1 ? '' : 'none';

    qvThumbs.querySelectorAll('.qv-thumb').forEach(btn => {
      btn.addEventListener('click', () => setActive(parseInt(btn.dataset.i, 10)));
    });

    // Tap the main image → fullscreen zoom + swipe viewer (images only)
    const imgSrcs = items.filter(it => it.type === 'img').map(it => it.src);
    qvMain.onclick = () => {
      if (!imgSrcs.length) return;
      const cur = items[active];
      if (!cur || cur.type !== 'img') return;   // let video controls work
      const start = Math.max(0, imgSrcs.indexOf(cur.src));
      openImgLightbox(imgSrcs, start);
    };
    qvMain.style.cursor = imgSrcs.length ? 'zoom-in' : '';

    setActive(0);
  }

  function renderDetails(jersey) {
    const d = jersey.details || {};
    const rows = [
      { lbl: 'Fabric', val: d.fabric },
      { lbl: 'Fit',    val: d.fit    },
      { lbl: 'Care',   val: d.care   },
      { lbl: 'Origin', val: d.origin },
    ].filter(r => r.val);
    if (rows.length === 0) { qvDetails.innerHTML = ''; return; }
    qvDetails.innerHTML = `
      <p class="qv-label">Product Details</p>
      <ul class="qv-detail-list">
        ${rows.map(r => `<li><span>${r.lbl}</span><strong>${r.val}</strong></li>`).join('')}
      </ul>
    `;
  }

  function open(jerseyId) {
    const j = getJersey(jerseyId);
    if (!j) return;
    state = { jersey: j, size: 'M', qty: 1 };

    // Show SVG immediately as a fast first paint, then upgrade to real photos when they load
    qvMain.innerHTML = jerseySVG(j);
    qvThumbs.innerHTML = '';
    qvThumbs.style.display = 'none';
    loadGallery(j, (images, video) => {
      if (state.jersey?.id === j.id) renderMedia(j, images, video);
    });

    qvTag.textContent = j.edition;
    qvTag.className = 'qv-tag ' + j.tag;
    qvTitle.textContent = j.country;
    qvEdition.textContent = j.edition;
    qvPrice.innerHTML = jerseyOnSale(j)
      ? `<span class="price-was">${fmtBDT(j.price)}</span> <span class="price-now">${fmtBDT(salePrice(j))}</span>`
      : fmtBDT(j.price);
    qvStock.innerHTML = j.inStock
      ? `<span class="qv-stock-ok">${j.stockLeft <= 6 ? `🔥 Only ${j.stockLeft} left in stock` : '✓ In stock — ships within 24 h'}</span>`
      : `<span class="qv-stock-oos">⏳ Currently restocking — get a WhatsApp alert</span>`;

    qvSizes.innerHTML = ['M','L','XL','XXL']
      .map(s => `<button class="size-btn${s === 'M' ? ' active' : ''}" data-size="${s}"${j.inStock ? '' : ' disabled'}>${s}</button>`)
      .join('');

    // Apply country flag gradient to the Quick View title text
    const code = j.id.split('-')[0].toUpperCase();
    const grad = (COUNTRY[code] || {}).gradient;
    if (grad) {
      qvTitle.classList.add('flag-text');
      qvTitle.style.backgroundImage = grad;
    } else {
      qvTitle.classList.remove('flag-text');
      qvTitle.style.backgroundImage = '';
    }
    qvQty.textContent = '1';

    qvAdd.disabled = !j.inStock;
    qvAdd.textContent = j.inStock ? 'Add to Cart' : 'Notify Me on WhatsApp';
    qvWish.dataset.id = j.id;
    qvWish.classList.toggle('active', inWishlist(j.id));

    renderDetails(j);

    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('show'));
    document.body.style.overflow = 'hidden';
  }

  function close() {
    modal.classList.remove('show');
    setTimeout(() => { modal.hidden = true; document.body.style.overflow = ''; }, 250);
  }

  // Close handlers
  modal.querySelectorAll('[data-qv-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });

  // Size selection
  qvSizes.addEventListener('click', e => {
    const btn = e.target.closest('.size-btn');
    if (!btn || btn.disabled) return;
    qvSizes.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.size = btn.dataset.size;
  });

  // Qty stepper
  modal.querySelectorAll('[data-qv-qty]').forEach(b => {
    b.addEventListener('click', () => {
      state.qty = Math.max(1, Math.min(20, state.qty + (b.dataset.qvQty === 'inc' ? 1 : -1)));
      qvQty.textContent = state.qty;
    });
  });

  // Add to cart
  qvAdd.addEventListener('click', () => {
    if (!state.jersey) return;
    if (!state.jersey.inStock) {
      const msg = encodeURIComponent(`Hi Zone14! Please notify me when this is back in stock:\n\n👕 ${state.jersey.country} — ${state.jersey.edition}\n📏 ${state.size}`);
      window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank', 'noopener');
      return;
    }
    addToCart(state.jersey.id, state.size, state.qty);
    // Brief in-modal confirmation, then close
    qvAdd.textContent = '✓ Added to cart';
    qvAdd.classList.add('added');
    setTimeout(() => {
      qvAdd.classList.remove('added');
      qvAdd.textContent = 'Add to Cart';
      close();
    }, 1100);
  });

  // Wishlist toggle inside modal
  qvWish.addEventListener('click', () => {
    if (!state.jersey) return;
    toggleWishlist(state.jersey.id);
  });

  // Expose globally so render code can call it
  window.openQuickView = open;
}

/* ============================================================
   MATCH HUB
   ============================================================ */

function formatMatchDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  }).toUpperCase();
}
function formatMatchTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function formatBdLocalTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' }) + ' BST';
}

function flag(code, size = 'mc') {
  const c = COUNTRY[code] || { name: code, bg: '#222', fg: '#fff' };
  return `<span class="${size}-flag" style="background:${c.bg};color:${c.fg}">${code}</span>`;
}

function compactCountdown(ms) {
  if (ms <= 0) return 'LIVE';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor(ms / 3600000) % 24;
  const m = Math.floor(ms /   60000) % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function setReminderHref(match) {
  const c1 = COUNTRY[match.home]?.name || match.home;
  const c2 = COUNTRY[match.away]?.name || match.away;
  const time = formatMatchTime(match.date);
  const date = formatMatchDate(match.date);
  const text = encodeURIComponent(
    `Hi Zone14! Please remind me before this match kicks off:\n\n` +
    `🏟 ${c1} vs ${c2}\n` +
    `📅 ${date} · ${time}\n` +
    `📍 ${match.venue}, ${match.city}\n\n` +
    `Send me a WhatsApp ping 30 minutes before kick-off.`
  );
  return `https://wa.me/${WHATSAPP}?text=${text}`;
}

function getKitHref(code) {
  const jerseyId = COUNTRY_TO_JERSEY[code];
  if (!jerseyId) return null;
  return `#jerseys`;
}

/* ---------- Render featured (next) match ---------- */
function renderFeatured() {
  const wrap = document.getElementById('featuredMatch');
  if (!wrap) return;

  // Real fixtures (live feed). Prefer the next match involving a team we sell,
  // else the genuinely next match overall.
  const now = Date.now();
  const upcoming = getDisplayMatches()
    .map(c => ({ ...c, ts: new Date(c.date).getTime() }))
    .filter(c => c.ts > now)
    .sort((a, b) => a.ts - b.ts);
  const isOurs = c => COUNTRY_TO_JERSEY[c.home.code || c.home.tla] || COUNTRY_TO_JERSEY[c.away.code || c.away.tla];
  const next = upcoming.find(isOurs) || upcoming[0];
  if (!next) { wrap.innerHTML = ''; return; }

  const flag = t => t.crest
    ? `<img class="flag-img" src="${t.crest}" alt="${t.name}" loading="lazy" />`
    : flagImg(t.code || t.tla);

  wrap.innerHTML = `
    <div class="mf-team home">
      <div class="mf-flag">${flag(next.home)}</div>
      <div class="mf-name">${next.home.name}</div>
    </div>
    <div class="mf-center">
      <span class="mf-vs">VS</span>
      <div class="mf-countdown" id="mfCountdown" data-ts="${next.ts}">
        <div class="mf-cd-box"><span class="mf-cd-num" data-cd="d">--</span><span class="mf-cd-lbl">D</span></div>
        <span class="mf-cd-sep">:</span>
        <div class="mf-cd-box"><span class="mf-cd-num" data-cd="h">--</span><span class="mf-cd-lbl">H</span></div>
        <span class="mf-cd-sep">:</span>
        <div class="mf-cd-box"><span class="mf-cd-num" data-cd="m">--</span><span class="mf-cd-lbl">M</span></div>
        <span class="mf-cd-sep">:</span>
        <div class="mf-cd-box"><span class="mf-cd-num" data-cd="s">--</span><span class="mf-cd-lbl">S</span></div>
      </div>
      <p class="mf-meta">${next.group ? 'Group ' + next.group + ' · ' : ''}Kick-off · ${formatMatchDate(next.date)}, ${formatBdLocalTime(next.date)}</p>
      <div class="mf-actions">
        <a href="${cardReminderHref(next)}" target="_blank" rel="noopener" class="btn btn-ghost">⏰ Remind Me</a>
        ${isOurs(next) ? `<a href="#jerseys" class="btn btn-primary">Get a Kit</a>` : ''}
      </div>
    </div>
    <div class="mf-team away">
      <div class="mf-flag">${flag(next.away)}</div>
      <div class="mf-name">${next.away.name}</div>
    </div>
  `;
}

/* Tick the featured match countdown */
function tickFeaturedCountdown() {
  const cd = document.getElementById('mfCountdown');
  if (!cd) return;
  const ts = parseInt(cd.dataset.ts, 10);
  const diff = Math.max(0, ts - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2, '0');
  cd.querySelector('[data-cd=d]').textContent = pad(d);
  cd.querySelector('[data-cd=h]').textContent = pad(h);
  cd.querySelector('[data-cd=m]').textContent = pad(m);
  cd.querySelector('[data-cd=s]').textContent = pad(s);
}

/* ---------- LIVE AUTO-SCORES ----------
   Primary source: our own /api/wc proxy (football-data.org via a server-side
   key — reliable, fresh). Fallback: the free keyless SportSRC feed. Both share
   the same football-data.org JSON shape, so one set of parsers handles both.
   getWC() fetches once and caches ~25s so the 3 sync passes share a round-trip. */
const WC_SCORES_URL = 'https://api.sportsrc.org/?data=results&category=scores&league=WC';
const WC_TABLES_URL = 'https://api.sportsrc.org/?data=results&category=tables&league=WC';
const WC_UPCOMING_URL = 'https://api.sportsrc.org/?data=matches&category=football';

let _wc = null, _wcAt = 0, _wcPromise = null;
async function getWC(force) {
  if (!force && _wc && Date.now() - _wcAt < 25000) return _wc;
  if (_wcPromise) return _wcPromise;
  _wcPromise = (async () => {
    // 1) Our proxy (football-data.org with key) — preferred
    try {
      const r = await fetch('/api/wc', { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        if (j && j.success && j.data &&
            ((j.data.all && j.data.all.length) || (j.data.finished && j.data.finished.length))) {
          _wc = {
            live: j.data.live || [], finished: j.data.finished || [],
            all: j.data.all || [], standings: j.data.standings || [], upcoming: [],
            source: 'proxy',
          };
          _wcAt = Date.now(); _wcPromise = null; return _wc;
        }
      }
    } catch (_) {}
    // 2) Fallback: SportSRC (scores + tables + near-term fixtures)
    try {
      const [sc, tb, up] = await Promise.all([
        fetch(WC_SCORES_URL,   { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch(WC_TABLES_URL,   { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch(WC_UPCOMING_URL, { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      ]);
      _wc = {
        live:      (sc && sc.data && sc.data.live) || [],
        finished:  (sc && sc.data && sc.data.finished) || [],
        all:       [],
        standings: (tb && tb.data && tb.data.standings) || [],
        upcoming:  (up && up.data) || [],
        source: 'sportsrc',
      };
      _wcAt = Date.now();
    } catch (_) {
      _wc = _wc || { live: [], finished: [], all: [], standings: [], upcoming: [], source: 'none' };
    }
    _wcPromise = null;
    return _wc;
  })();
  return _wcPromise;
}

function _normTeam(s) {
  let t = (s || '').toString().toLowerCase();
  t = t.replace(/\b(islands?|republic of|the)\b/g, ' ').replace(/[^a-z]/g, '');
  const A = {
    unitedstates: 'usa', korearepublic: 'korea', southkorea: 'korea',
    czechrepublic: 'czechia', bosniaandherzegovina: 'bosnia', bosniaherzegovina: 'bosnia',
    cotedivoire: 'ivorycoast', turkiye: 'turkey', caboverde: 'capeverde',
    congodr: 'congo', drcongo: 'congo',
  };
  return A[t] || t;
}

/* Find the local MATCHES entry that corresponds to a feed match. */
function _feedToLocalMatch(fm) {
  const fh = _normTeam(fm.homeTeam && fm.homeTeam.name);
  const fa = _normTeam(fm.awayTeam && fm.awayTeam.name);
  return MATCHES.find(m => {
    const mh = _normTeam((COUNTRY[m.home] || {}).name || m.home);
    const ma = _normTeam((COUNTRY[m.away] || {}).name || m.away);
    return (mh === fh && ma === fa) || (mh === fa && ma === fh);
  });
}

async function syncLiveScores() {
  const wc = await getWC();
  const feed = [...(wc.live || []), ...(wc.finished || [])];
  if (!feed.length) return false;

  const live = readLiveScores();
  let changed = false;

  feed.forEach(fm => {
    const local = _feedToLocalMatch(fm);
    if (!local) return;
    const ft = (fm.score && fm.score.fullTime) || {};
    if (ft.home == null || ft.away == null) return;

    // Orient the feed's home/away to OUR home/away
    const feedHomeIsOurHome =
      _normTeam((COUNTRY[local.home] || {}).name || local.home) === _normTeam(fm.homeTeam.name);
    const homeScore = feedHomeIsOurHome ? ft.home : ft.away;
    const awayScore = feedHomeIsOurHome ? ft.away : ft.home;
    const outcome = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';
    const isLive = fm.status === 'IN_PLAY' || fm.status === 'PAUSED';

    const prev = live[local.id];
    if (!prev || prev.homeScore !== homeScore || prev.awayScore !== awayScore ||
        prev.live !== isLive || prev.outcome !== outcome) {
      live[local.id] = {
        homeScore, awayScore, outcome,
        finishedAt: Date.now(), live: isLive, auto: true, status: fm.status,
      };
      changed = true;
    }
  });

  if (changed) writeLiveScores(live);   // local overlay → fires results:change
  return changed;
}

/* Pull all 12 WC group standings (every team, live points). */
async function syncGroupStandings() {
  const wc = await getWC();
  if (!Array.isArray(wc.standings) || !wc.standings.length) return false;

  const groups = wc.standings.map(g => ({
    name: (g.group || '').replace(/^group\s+/i, '').trim(),
    teams: (g.table || []).map(t => ({
      name:  t.team.name,
      tla:   t.team.tla,
      crest: t.team.crest,
      P: t.playedGames, W: t.won, D: t.draw, L: t.lost,
      GF: t.goalsFor, GA: t.goalsAgainst, GD: t.goalDifference, Pts: t.points,
    })),
  })).filter(g => g.name && g.teams.length);

  if (!groups.length) return false;
  localStorage.setItem(GROUP_STANDINGS_KEY, JSON.stringify(groups));
  window.dispatchEvent(new CustomEvent('groups:change'));
  return true;
}

/* Teams we sell kits for — highlighted in the standings table. */
const OUR_TLAS = ['BRA', 'ARG', 'ESP', 'FRA'];

/* Pull EVERY WC match (all 12 groups): finished + live from the scores feed,
   upcoming from the near-term fixtures feed, plus our own static fixtures —
   merged & deduped so the Matches grid shows the whole tournament, not just
   the four teams we sell. */
function _groupLetter(g) { return (g || '').toString().replace(/^group[_\s]*/i, '').trim(); }

async function syncAllMatches() {
  const wc = await getWC();
  // Name → group + name → TLA maps (from standings) so fixtures missing those
  // can be matched. Dedup keys on TLA/code (stable) — not display names, which
  // differ across feeds (e.g. "Cape Verde" vs "Cape Verde Islands").
  const standings = readGroupStandings() || [];
  const nameToGroup = {};
  const nameToTla = {};
  const wcNames = new Set();
  standings.forEach(g => g.teams.forEach(t => {
    const n = _normTeam(t.name);
    nameToGroup[n] = g.name;
    nameToTla[n] = t.tla;
    wcNames.add(n);
  }));

  // A team's stable id: its TLA/code if known, else resolved from name.
  const canonId = (team) =>
    team.tla || team.code || nameToTla[_normTeam(team.name)] || _normTeam(team.name);
  const canonKey = (card) => [canonId(card.home), canonId(card.away)].sort().join('|');

  const RANK = { FINISHED: 3, IN_PLAY: 3, PAUSED: 3, STATIC: 2, UPCOMING: 1 };
  const byPair = new Map();
  const add = (card, rank) => {
    const key = canonKey(card);
    const prev = byPair.get(key);
    if (!prev || rank > prev._rank) {
      // Carry venue/predict info forward so the winning card keeps them
      if (prev) {
        card.venue = card.venue || prev.venue;
        card.city = card.city || prev.city;
        card.localMatchId = card.localMatchId || prev.localMatchId;
      }
      card._rank = rank;
      byPair.set(key, card);
    } else {
      // Keep the higher-rank card but enrich it from this one
      prev.venue = prev.venue || card.venue;
      prev.city = prev.city || card.city;
      prev.localMatchId = prev.localMatchId || card.localMatchId;
    }
  };

  // Build a card from a football-data-shaped match (scores feed or full list)
  const liveSet = ['FINISHED', 'IN_PLAY', 'PAUSED'];
  const addFeedMatch = (fm) => {
    if (!fm || !fm.homeTeam || !fm.awayTeam) return;
    const ft = (fm.score && fm.score.fullTime) || {};
    const played = liveSet.includes(fm.status);
    add({
      id: 'wc-' + (fm.homeTeam.tla || _normTeam(fm.homeTeam.name)) + '-' + (fm.awayTeam.tla || _normTeam(fm.awayTeam.name)),
      group: _groupLetter(fm.group),
      date: fm.utcDate,
      home: { name: fm.homeTeam.name, tla: fm.homeTeam.tla, crest: fm.homeTeam.crest },
      away: { name: fm.awayTeam.name, tla: fm.awayTeam.tla, crest: fm.awayTeam.crest },
      status: fm.status,
      score: (played && ft.home != null) ? { home: ft.home, away: ft.away } : null,
    }, played ? 3 : RANK.UPCOMING);
  };

  // 1) Finished + live (real scores, every group)
  [...(wc.live || []), ...(wc.finished || [])].forEach(addFeedMatch);

  // 2a) Full real schedule (proxy mode): every not-yet-played fixture
  (wc.all || []).filter(x => !liveSet.includes(x.status)).forEach(addFeedMatch);

  // 2b) Fallback near-term fixtures (SportSRC, name-only)
  (wc.upcoming || []).forEach(m => {
    const hn = m.teams && m.teams.home && m.teams.home.name;
    const an = m.teams && m.teams.away && m.teams.away.name;
    if (!hn || !an) return;
    if (wcNames.size && (!wcNames.has(_normTeam(hn)) || !wcNames.has(_normTeam(an)))) return;
    add({
      id: 'wcup-' + _normTeam(hn) + '-' + _normTeam(an),
      group: nameToGroup[_normTeam(hn)] || nameToGroup[_normTeam(an)] || '',
      date: new Date(m.date).toISOString(),
      home: { name: hn, crest: (m.teams.home.badge || m.poster || '') },
      away: { name: an, crest: (m.teams.away.badge || '') },
      status: 'TIMED', score: null,
    }, RANK.UPCOMING);
  });

  // 3) Our own fixtures — keep predictions + correct flags for the 4 teams
  MATCHES.forEach(m => {
    add({
      id: m.id, localMatchId: m.id,
      group: m.group || '', date: m.date, venue: m.venue, city: m.city,
      home: { name: (COUNTRY[m.home] || {}).name || m.home, code: m.home },
      away: { name: (COUNTRY[m.away] || {}).name || m.away, code: m.away },
      status: 'SCHEDULED', score: null,
    }, RANK.STATIC);
  });

  const all = [...byPair.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
  all.forEach(c => { delete c._rank; });
  if (!all.length) return false;
  localStorage.setItem(ALL_MATCHES_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent('allmatches:change'));
  return true;
}

/* The list the Matches grid renders — the full tournament if we have it cached,
   otherwise our own static fixtures mapped to the same card shape. */
function getDisplayMatches() {
  const all = readAllMatches();
  if (all && all.length) return all;
  return MATCHES.map(m => ({
    id: m.id, localMatchId: m.id, group: m.group || '', date: m.date, venue: m.venue, city: m.city,
    home: { name: (COUNTRY[m.home] || {}).name || m.home, code: m.home },
    away: { name: (COUNTRY[m.away] || {}).name || m.away, code: m.away },
    status: 'SCHEDULED', score: null,
  }));
}

/* Compute live group standings from real results (merged: live + admin). */
function computeGroupStats(groupName) {
  const results = mergedResults();
  const stats = {};
  GROUPS.find(g => g.name === groupName)?.teams.forEach(t => {
    stats[t.code] = { code: t.code, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 };
  });
  MATCHES.filter(m => m.group === groupName).forEach(m => {
    const r = results[m.id];
    if (!r || r.live) return;                 // only count finished matches
    const h = stats[m.home], a = stats[m.away];
    if (!h || !a) return;
    h.P++; a.P++;
    h.GF += r.homeScore; h.GA += r.awayScore;
    a.GF += r.awayScore; a.GA += r.homeScore;
    if (r.outcome === 'home')      { h.W++; h.Pts += 3; a.L++; }
    else if (r.outcome === 'away') { a.W++; a.Pts += 3; h.L++; }
    else                           { h.D++; a.D++; h.Pts++; a.Pts++; }
  });
  return stats;
}

/* WhatsApp reminder link built from a unified match card. */
function cardReminderHref(card) {
  const time = formatMatchTime(card.date);
  const date = formatMatchDate(card.date);
  const loc  = card.venue ? `\n📍 ${card.venue}${card.city ? ', ' + card.city : ''}` : '';
  const text = encodeURIComponent(
    `Hi Zone14! Please remind me before this match kicks off:\n\n` +
    `🏟 ${card.home.name} vs ${card.away.name}\n` +
    `📅 ${date} · ${time}${loc}\n\n` +
    `Send me a WhatsApp ping 30 minutes before kick-off.`
  );
  return `https://wa.me/${WHATSAPP}?text=${text}`;
}

/* ---------- Render match grid (ALL WC matches: finished + live + upcoming) ---------- */
function renderMatchGrid() {
  const grid = document.getElementById('matchGrid');
  if (!grid) return;
  const cards = getDisplayMatches().slice().sort((a, b) => new Date(a.date) - new Date(b.date));

  const flag = t => t.crest
    ? `<img class="flag-img" src="${t.crest}" alt="${t.name}" loading="lazy" />`
    : (t.code ? flagImg(t.code) : '');

  // Admin-entered / live-overlay results — used to fill in scores the public
  // feed hasn't posted yet (it sometimes lags). Keyed by our MATCHES id.
  const results = mergedResults();

  grid.innerHTML = cards.map(m => {
    // If the feed has no score but we have one for this fixture (admin or live
    // overlay), apply it so the card shows the result instead of "pending".
    if (!m.score && m.localMatchId && results[m.localMatchId]) {
      const r = results[m.localMatchId];
      m = { ...m, score: { home: r.homeScore, away: r.awayScore },
            status: r.live ? 'IN_PLAY' : 'FINISHED' };
    }
    const hCode = m.home.code || m.home.tla;
    const aCode = m.away.code || m.away.tla;
    const hasOurJersey = !!(COUNTRY_TO_JERSEY[hCode] || COUNTRY_TO_JERSEY[aCode]);
    const ts = new Date(m.date).getTime();
    const ms = ts - Date.now();
    const isLive = m.status === 'IN_PLAY' || m.status === 'PAUSED';
    const isUpcoming = !m.score && !isLive && ms > 0;
    const myPred = m.localMatchId ? getMyPrediction(m.localMatchId) : null;
    const predMatch = { home: hCode, away: aCode };

    let bottom = '';
    if (m.score) {
      const winLabel = m.score.home > m.score.away ? m.home.name
        : m.score.away > m.score.home ? m.away.name : 'Draw';
      const myStatus = (myPred && !isLive)
        ? (myPred.choice === (m.score.home > m.score.away ? 'home' : m.score.away > m.score.home ? 'away' : 'draw')
            ? '<span class="my-pred correct">✓ You called it</span>'
            : '<span class="my-pred wrong">✗ You picked ' + outcomeLabel(myPred.choice, predMatch) + '</span>')
        : '';
      bottom = `
        <div class="mc-final${isLive ? ' live' : ''}">
          <span class="mc-final-score">${m.score.home} – ${m.score.away}</span>
          <span class="mc-final-label">${isLive
            ? '<span class="live-dot"></span> LIVE'
            : `FT · Winner: <strong>${winLabel}</strong>`}</span>
          ${myStatus}
        </div>`;
    } else if (isUpcoming && m.localMatchId) {
      const myMark = myPred ? `<span class="mc-mypred">Your pick: ${outcomeLabel(myPred.choice, predMatch)}</span>` : '';
      bottom = `
        <button class="mc-predict-btn" type="button" data-predict="${m.localMatchId}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.4h7.6z"/></svg>
          ${myPred ? 'Change your prediction' : 'Predict the winner'}
        </button>
        ${myMark}`;
    } else if (!isUpcoming) {
      bottom = `<div class="mc-final"><span class="mc-final-label">⏳ In progress · result pending</span></div>`;
    }

    return `
      <article class="match-card reveal ${hasOurJersey ? 'has-jersey' : ''}" data-id="${m.id}" data-ts="${ts}">
        <div class="mc-head">
          <span class="mc-stage">${m.group ? 'Group ' + m.group : 'World Cup 2026'}</span>
          <span class="mc-date">${formatMatchDate(m.date)}</span>
        </div>
        <div class="mc-teams">
          <div class="mc-team">
            <div class="mc-flag">${flag(m.home)}</div>
            <span class="mc-team-name">${m.home.name}</span>
          </div>
          <span class="mc-vs">VS</span>
          <div class="mc-team">
            <div class="mc-flag">${flag(m.away)}</div>
            <span class="mc-team-name">${m.away.name}</span>
          </div>
        </div>
        <div class="mc-foot">
          <div class="mc-venue">
            ${m.group ? `<strong>Group ${m.group}</strong> · ` : ''}${formatBdLocalTime(m.date)}
          </div>
          <div class="mc-actions">
            ${isUpcoming ? `<span class="mc-countdown-pill" data-mc-cd="${ts}">${compactCountdown(ms)}</span>` : ''}
            ${isUpcoming ? `<a class="mc-ico-btn" href="${cardReminderHref(m)}" target="_blank" rel="noopener" title="Set reminder on WhatsApp">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 00-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            </a>` : ''}
            ${hasOurJersey ? `
              <a class="mc-ico-btn" href="#jerseys" title="Shop kits">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 4l-4 2-4-2-6 4 2 6 4-2v8h8v-8l4 2 2-6z"/></svg>
              </a>` : ''}
          </div>
        </div>
        ${bottom}
      </article>
    `;
  }).join('');

  // Wire predict buttons
  grid.querySelectorAll('[data-predict]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.openPredictModal) window.openPredictModal(btn.dataset.predict);
    });
  });

  if (typeof revealObserver !== 'undefined') {
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
}

function outcomeLabel(choice, match) {
  if (choice === 'draw') return 'Draw';
  if (choice === 'home') return (COUNTRY[match.home] || {}).name || match.home;
  return (COUNTRY[match.away] || {}).name || match.away;
}

/* ---------- Render leaderboard ---------- */
function renderLeaderboard() {
  const list = document.getElementById('lbList');
  const totalEl = document.getElementById('lbTotalPreds');
  const resolvedEl = document.getElementById('lbResolved');
  if (!list) return;

  const board   = computeLeaderboard();
  const preds   = readPredictions();
  const results = mergedResults();

  totalEl.textContent    = `${preds.length} prediction${preds.length === 1 ? '' : 's'}`;
  resolvedEl.textContent = `${Object.keys(results).length} match${Object.keys(results).length === 1 ? '' : 'es'} resolved`;

  if (board.length === 0) {
    list.innerHTML = `
      <li class="lb-empty">
        <div class="lb-empty-ico">🎯</div>
        <h4>No predictions yet</h4>
        <p>Be the first — pick a winner on any upcoming match above.</p>
      </li>`;
    return;
  }

  const myName = (getPredictorName() || '').toLowerCase();
  const medal  = ['🥇','🥈','🥉'];

  list.innerHTML = board.slice(0, 50).map((row, i) => {
    const accuracy = row.scored ? Math.round((row.correct / row.scored) * 100) : 0;
    const isMe = row.name.toLowerCase() === myName;
    return `
      <li class="lb-row${i < 3 ? ' lb-top' : ''}${isMe ? ' lb-me' : ''}">
        <span class="lb-rank">${i < 3 ? medal[i] : '#' + (i + 1)}</span>
        <span class="lb-name">${escapeHtml(row.name)}${isMe ? '<span class="lb-you">YOU</span>' : ''}</span>
        <span class="lb-stats">
          <span class="lb-correct">${row.correct}</span>
          <span class="lb-divider">/</span>
          <span class="lb-scored">${row.scored}</span>
          ${row.scored > 0 ? `<span class="lb-acc">${accuracy}%</span>` : `<span class="lb-pending">${row.pending} pending</span>`}
        </span>
      </li>
    `;
  }).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
}

/* ---------- Prediction modal ---------- */
function initPredictionModal() {
  const modal = document.getElementById('predictModal');
  if (!modal) return;

  const headline = document.getElementById('predictHeadline');
  const meta     = document.getElementById('predictMeta');
  const opts     = document.getElementById('predictOptions');
  const nameIn   = document.getElementById('predictName');
  const submit   = document.getElementById('predictSubmit');
  const success  = document.getElementById('predictSuccess');
  const form     = document.getElementById('predictForm');

  let current = { matchId: null, choice: null };

  function open(matchId) {
    const m = MATCHES.find(x => x.id === matchId);
    if (!m) return;

    const home = COUNTRY[m.home] || { name: m.home };
    const away = COUNTRY[m.away] || { name: m.away };

    headline.innerHTML = `
      ${flagImg(m.home)}
      <span>${home.name}</span>
      <span class="predict-vs">vs</span>
      <span>${away.name}</span>
      ${flagImg(m.away)}
    `;
    meta.textContent = `${m.stage} · ${formatMatchDate(m.date)} · ${formatBdLocalTime(m.date)}`;

    const myPred = getMyPrediction(m.id);
    current = { matchId: m.id, choice: myPred ? myPred.choice : null };

    opts.innerHTML = `
      <button type="button" class="predict-opt${current.choice === 'home' ? ' active' : ''}" data-choice="home">
        ${flagImg(m.home)}
        <span class="po-team">${home.name}</span>
        <span class="po-result">WIN</span>
      </button>
      <button type="button" class="predict-opt${current.choice === 'draw' ? ' active' : ''}" data-choice="draw">
        <span class="po-draw-ico">⚖</span>
        <span class="po-team">Draw</span>
        <span class="po-result">−</span>
      </button>
      <button type="button" class="predict-opt${current.choice === 'away' ? ' active' : ''}" data-choice="away">
        ${flagImg(m.away)}
        <span class="po-team">${away.name}</span>
        <span class="po-result">WIN</span>
      </button>
    `;

    opts.querySelectorAll('.predict-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        opts.querySelectorAll('.predict-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        current.choice = btn.dataset.choice;
        updateSubmit();
      });
    });

    nameIn.value = getPredictorName();
    success.hidden = true;
    form.style.display = '';
    updateSubmit();

    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('show'));
    document.body.style.overflow = 'hidden';
    setTimeout(() => nameIn.focus(), 100);
  }

  function close() {
    modal.classList.remove('show');
    setTimeout(() => { modal.hidden = true; document.body.style.overflow = ''; }, 250);
  }

  function updateSubmit() {
    submit.disabled = !current.choice || !nameIn.value.trim();
  }

  nameIn.addEventListener('input', updateSubmit);
  modal.querySelectorAll('[data-predict-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (submit.disabled) return;
    const ok = savePrediction(current.matchId, nameIn.value, current.choice);
    if (!ok) return;
    form.style.display = 'none';
    success.hidden = false;
    renderMatchGrid();
    renderLeaderboard();
  });

  window.openPredictModal = open;
}

/* Re-render predictions UI when results change in admin */
function initPredictionListeners() {
  window.addEventListener('predictions:change', () => {
    renderMatchGrid();
    renderLeaderboard();
  });
  window.addEventListener('results:change', () => {
    renderMatchGrid();
    renderLeaderboard();
  });
  // Cross-tab sync — when admin enters a result, the landing page updates
  window.addEventListener('storage', e => {
    if (e.key === RESULTS_KEY || e.key === PREDICTIONS_KEY) {
      renderMatchGrid();
      renderLeaderboard();
    }
  });
}

/* Update small countdown pills on every match card */
function tickMatchPills() {
  document.querySelectorAll('[data-mc-cd]').forEach(el => {
    const ts = parseInt(el.dataset.mcCd, 10);
    el.textContent = compactCountdown(ts - Date.now());
  });
}

/* ---------- Render group standings ----------
   Prefers the live feed (all 12 WC groups, every team). Falls back to the
   static four-group view computed from our own results if the feed is offline. */
function renderGroups() {
  const wrap = document.getElementById('groupsGrid');
  if (!wrap) return;

  const live = readGroupStandings();

  // Build a normalized [{ name, rows:[{name,P,W,D,L,GD,Pts, crest?, code?, ours}] }]
  let groups;
  if (live && live.length) {
    groups = live.map(g => ({
      name: g.name,
      rows: g.teams
        .map(t => ({
          name: t.name, crest: t.crest, code: t.tla,
          P: t.P, W: t.W, D: t.D, L: t.L, GD: t.GD, Pts: t.Pts,
          ours: OUR_TLAS.includes(t.tla),
        }))
        .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.P - a.P),
    }));
  } else {
    groups = GROUPS.map(g => {
      const stats = computeGroupStats(g.name);
      return {
        name: g.name,
        rows: g.teams
          .map(t => {
            const s = stats[t.code] || { P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 };
            const c = COUNTRY[t.code] || { name: t.code };
            return { name: c.name, code: t.code, crest: null,
                     P: s.P, W: s.W, D: s.D, L: s.L, GD: s.GF - s.GA, Pts: s.Pts,
                     ours: !!COUNTRY_TO_JERSEY[t.code] };
          })
          .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.P - a.P),
      };
    });
  }

  wrap.innerHTML = groups.map(g => `
    <article class="group-card reveal">
      <h3><span class="grp-badge">${g.name}</span> Group ${g.name}</h3>
      <table class="group-table">
        <thead>
          <tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
        </thead>
        <tbody>
          ${g.rows.map(t => {
            const flag = t.crest
              ? `<img class="flag-img" src="${t.crest}" alt="${t.name}" loading="lazy" />`
              : (t.code ? flagImg(t.code) : '');
            return `
              <tr class="${t.ours ? 'team-highlight' : ''}">
                <td>
                  <div class="team-cell">
                    <span class="team-mini-flag">${flag}</span>
                    <span class="team-name">${t.name}</span>
                  </div>
                </td>
                <td>${t.P}</td><td>${t.W}</td><td>${t.D}</td><td>${t.L}</td>
                <td>${t.GD > 0 ? '+' + t.GD : t.GD}</td>
                <td class="pts">${t.Pts}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </article>
  `).join('');

  if (typeof revealObserver !== 'undefined') {
    wrap.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
}

/* ---------- Render venues ---------- */
function renderVenues() {
  const wrap = document.getElementById('venuesGrid');
  if (!wrap) return;
  wrap.innerHTML = VENUES.map(v => {
    const c = COUNTRY[v.country] || { name: v.country };
    return `
      <article class="venue-card reveal">
        <span class="venue-host-pill">
          <span class="vp-flag">${flagImg(v.country)}</span>
          ${c.name}
        </span>
        <h3>${v.stadium}</h3>
        <p class="v-city">${v.city}</p>
        <p class="v-cap">Capacity · <strong>${v.cap.toLocaleString('en-US')}</strong></p>
      </article>
    `;
  }).join('');
  if (typeof revealObserver !== 'undefined') {
    wrap.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
}

/* ---------- Match Hub collapse (mobile) ---------- */
function initMatchHubCollapse() {
  const section = document.getElementById('matches');
  const toggle  = document.getElementById('matchHubToggle');
  if (!section || !toggle) return;
  const MOBILE = () => window.matchMedia('(max-width: 768px)').matches;

  // Start collapsed on phones, open on desktop — but hideable on both.
  const setCollapsed = (c) => {
    section.classList.toggle('collapsed', c);
    toggle.setAttribute('aria-expanded', String(!c));
    toggle.querySelector('span').textContent = c ? 'View fixtures' : 'Hide fixtures';
  };
  setCollapsed(MOBILE());

  toggle.addEventListener('click', () => setCollapsed(!section.classList.contains('collapsed')));
}

/* ---------- Match tabs ---------- */
function initMatchTabs() {
  const tabs = document.querySelectorAll('.match-tab');
  const panels = document.querySelectorAll('.match-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      panels.forEach(p => {
        const isMatch = p.dataset.panel === tab.dataset.tab;
        p.classList.toggle('active', isMatch);
        p.hidden = !isMatch;
      });
    });
  });
}

/* ---------- Match-day flash strip ---------- */
function initMatchDayStrip() {
  const strip = document.getElementById('matchDayStrip');
  if (!strip) return;
  const now = new Date();
  const today = now.toDateString();

  // Find a match today that involves our jerseys
  const todaysMatch = MATCHES.find(m => {
    const md = new Date(m.date);
    if (md.toDateString() !== today) return false;
    return COUNTRY_TO_JERSEY[m.home] || COUNTRY_TO_JERSEY[m.away];
  });

  if (!todaysMatch) return;

  const ourTeam = COUNTRY_TO_JERSEY[todaysMatch.home] ? todaysMatch.home : todaysMatch.away;
  const teamName = COUNTRY[ourTeam].name;
  strip.innerHTML = `
    🔥 <strong>${teamName} plays today!</strong> Use code <strong>MATCHDAY</strong> for 15% off all ${teamName} kits.
    <a href="#jerseys">Shop now →</a>
  `;
  strip.hidden = false;
}

/* ---------- NEWSLETTER ---------- */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.querySelector('input[type=email]').value.trim();
    if (!email) return;
    const msg = encodeURIComponent(
      `Hi Zone14! I'd like to subscribe with this email: ${email}\n` +
      `Please send me my 10% off welcome code.`
    );
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank', 'noopener');
    form.querySelector('.nl-success').classList.add('show');
    form.reset();
  });
}

/* ---------- HERO VIDEO SMOOTH SWAP ----------
   Hero video starts at opacity 0 (set in CSS). We don't reveal it until the
   browser is actually playing frames — at that moment we briefly dim the
   logo poster so the eye reads a soft "lighting shift", then fade the video
   in over it. End effect: the load delay (~3-5s on slow links) is invisible. */
/* Render the homepage Offers grid from the OFFERS array (overridable by admin) */
function renderOffers() {
  const grid = document.getElementById('offersGrid');
  if (!grid || typeof OFFERS === 'undefined') return;
  if (!OFFERS.length) { grid.innerHTML = ''; return; }
  grid.innerHTML = OFFERS.map((o, i) => {
    const cls    = o.featured ? 'offer-card reveal offer-featured' : 'offer-card reveal';
    const btnCls = (i === 0 || o.featured) ? 'btn btn-primary' : 'btn btn-ghost';
    const isExt  = /^https?:\/\//.test(o.ctaUrl || '');
    const offerKey = _offerKeyFromUrl(o.ctaUrl);
    return `
      <article class="${cls}">
        <div class="offer-tag">${o.tag || ''}</div>
        <h3>${o.title || ''} ${o.accent ? `<span class="accent">${o.accent}</span>` : ''}</h3>
        <p>${o.description || ''}</p>
        <div class="offer-price">${o.priceLine || ''}</div>
        <a href="${o.ctaUrl || '#'}" ${isExt ? 'target="_blank" rel="noopener"' : ''}${offerKey ? ` data-offer="${offerKey}"` : ''} class="${btnCls}">${o.ctaText || 'Claim'}</a>
      </article>
    `;
  }).join('');

  // Bundle-builder offers open the picker instead of navigating
  grid.querySelectorAll('[data-offer]').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); openOfferBuilder(btn.dataset.offer); });
  });

  if (typeof revealObserver !== 'undefined') {
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
}

/* ctaUrl like "#offer:buy2get1" → "buy2get1" (a bundle builder), else null */
function _offerKeyFromUrl(url) {
  const m = /^#offer:(\w+)/.exec(url || '');
  return m && OFFER_CONFIGS[m[1]] ? m[1] : null;
}

/* ============================================================
   OFFER / BUNDLE BUILDER — pick jerseys, auto-apply the deal, go to checkout
   ============================================================ */
const OFFER_CONFIGS = {
  buy2get1: {
    title: 'Buy 3 Jerseys · ৳4,000', sub: 'Pick any 3 jerseys — flat ৳4,000.',
    need: 3, exact: true, kind: 'fixed', price: 4000,
    promo: { code: 'BUY3', type: 'flat', label: 'Buy 3 — flat ৳4,000' },
  },
  teamset: {
    title: 'Full Team Set · ৳6,500', sub: 'Pick exactly 5 jerseys — flat ৳6,500.',
    need: 5, exact: true, kind: 'fixed', price: 6500,
    promo: { code: 'TEAMSET5', type: 'flat', label: 'Full Team Set — ৳6,500 for 5' },
  },
};

let _obState = null;   // { key, cfg, picks: { [jerseyId]: { size, qty } } }

function openOfferBuilder(key) {
  const cfg = OFFER_CONFIGS[key];
  const modal = document.getElementById('offerBuilder');
  const gridEl = document.getElementById('obGrid');
  if (!cfg || !modal || !gridEl) return;

  _obState = { key, cfg, picks: {} };
  document.getElementById('obTitle').textContent = cfg.title;
  document.getElementById('obSub').textContent = cfg.sub;

  const stock = JERSEYS.filter(j => j.inStock);
  gridEl.innerHTML = stock.map(j => `
    <div class="ob-item" data-id="${j.id}">
      <div class="ob-thumb">${jerseySVG(j)}${getCardImages(j)[0] ? `<img src="${getCardImages(j)[0]}" alt="" loading="lazy" onerror="this.remove()"/>` : ''}</div>
      <div class="ob-info">
        <strong>${j.country}</strong>
        <span>${fmtBDT(salePrice(j))}</span>
      </div>
      <select class="ob-size" aria-label="Size">
        ${['M','L','XL','XXL'].map(s => `<option value="${s}">${s}</option>`).join('')}
      </select>
      <div class="ob-qty">
        <button type="button" data-q="dec" aria-label="Less">−</button>
        <span class="ob-q">0</span>
        <button type="button" data-q="inc" aria-label="More">+</button>
      </div>
    </div>
  `).join('');

  gridEl.querySelectorAll('.ob-item').forEach(row => {
    const id = row.dataset.id;
    const qEl = row.querySelector('.ob-q');
    const sizeEl = row.querySelector('.ob-size');
    row.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
      const cfg = _obState.cfg;
      const curTotal = Object.values(_obState.picks).reduce((s, p) => s + p.qty, 0);
      let q = parseInt(qEl.textContent, 10) || 0;
      if (b.dataset.q === 'inc') {
        if (cfg.exact && curTotal >= cfg.need) return;   // hard cap at the required count
        q = Math.min(cfg.need, q + 1);
      } else {
        q = Math.max(0, q - 1);
      }
      qEl.textContent = q;
      row.classList.toggle('picked', q > 0);
      if (q > 0) _obState.picks[id] = { size: sizeEl.value, qty: q };
      else delete _obState.picks[id];
      _obUpdate();
    }));
    sizeEl.addEventListener('change', () => { if (_obState.picks[id]) _obState.picks[id].size = sizeEl.value; });
  });

  _obUpdate();
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  modal.querySelectorAll('[data-ob-close]').forEach(b => b.onclick = closeOfferBuilder);
  modal.onclick = e => { if (e.target === modal) closeOfferBuilder(); };
  document.getElementById('obProceed').onclick = _obProceed;
}

function closeOfferBuilder() {
  const modal = document.getElementById('offerBuilder');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
  _obState = null;
}

/* Recompute count, total, discount + enable/disable Proceed */
function _obTotals() {
  const units = [];
  Object.entries(_obState.picks).forEach(([id, p]) => {
    const j = getJersey(id);
    for (let i = 0; i < p.qty; i++) units.push(salePrice(j));
  });
  const count = units.length;
  const subtotal = units.reduce((s, n) => s + n, 0);
  const cfg = _obState.cfg;
  let discount = 0;
  // Fixed bundle price: discount whatever it takes to land on cfg.price
  if (cfg.kind === 'fixed' && count === cfg.need) discount = Math.max(0, subtotal - cfg.price);
  return { count, subtotal, discount, total: subtotal - discount };
}

function _obUpdate() {
  const { count, total, discount } = _obTotals();
  const cfg = _obState.cfg;
  const need = cfg.need;
  const met = cfg.exact ? count === need : count >= need;

  const countEl = document.getElementById('obCount');
  const totalEl = document.getElementById('obTotal');
  const btn = document.getElementById('obProceed');

  countEl.textContent = `${count} / ${need} selected`;
  totalEl.innerHTML = count
    ? `Total: <strong>${fmtBDT(met ? total : total)}</strong>${discount > 0 ? ` <span class="ob-save">save ${fmtBDT(discount)}</span>` : ''}`
    : '';
  btn.disabled = !met;
  btn.textContent = met ? `Proceed to Checkout · ${fmtBDT(cfg.price)}`
    : `Pick ${Math.max(0, need - count)} more`;

  // Hard cap: once the required number is chosen, block adding more
  const atCap = count >= need;
  document.querySelectorAll('#obGrid [data-q="inc"]').forEach(b => { b.disabled = atCap; });
}

function _obProceed() {
  if (!_obState) return;
  const { count, discount } = _obTotals();
  const cfg = _obState.cfg;
  const met = cfg.exact ? count === cfg.need : count >= cfg.need;
  if (!met) return;

  // Replace cart with the picked jerseys
  clearCart();
  Object.entries(_obState.picks).forEach(([id, p]) => addToCart(id, p.size, p.qty));

  // Stash the offer so the checkout auto-applies the discount
  const promo = { ...cfg.promo };
  promo.value = discount;   // flat discount = (subtotal − fixed bundle price)
  try { sessionStorage.setItem('zone14_offer', JSON.stringify(promo)); } catch (_) {}

  window.location.href = 'order.html';
}

/* Sync footer Contact + Social link DOM with CONTACT/SOCIAL settings objects */
function applyContactToDOM() {
  if (typeof CONTACT !== 'undefined') {
    const setText = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
    const setHref = (id, val) => { const el = document.getElementById(id); if (el && val) el.href = val; };
    setText('footerBrandDesc', CONTACT.brandDesc);
    setText('footerAddress',   CONTACT.address);
    setText('footerHours',     CONTACT.hours);
    const phoneEl = document.getElementById('footerPhone');
    if (phoneEl && CONTACT.phone) {
      phoneEl.href = 'tel:' + CONTACT.phone.replace(/[^+\d]/g, '');
      phoneEl.textContent = CONTACT.phoneDisplay || CONTACT.phone;
    }
    const emailEl = document.getElementById('footerEmail');
    if (emailEl && CONTACT.email) {
      emailEl.href = 'mailto:' + CONTACT.email;
      emailEl.textContent = CONTACT.email;
    }
  }
  if (typeof SOCIAL !== 'undefined') {
    const setHref = (id, val) => { const el = document.getElementById(id); if (el && val) el.href = val; };
    setHref('socialFacebook',  SOCIAL.facebook);
    setHref('socialInstagram', SOCIAL.instagram);
    setHref('floatMessenger',  SOCIAL.messenger);
    setHref('floatInstagram',  SOCIAL.instagram);
  }
  // WhatsApp links use the WHATSAPP constant (also settings-driven)
  if (typeof WHATSAPP !== 'undefined') {
    const wa = `https://wa.me/${WHATSAPP}`;
    const sw = document.getElementById('socialWhatsapp'); if (sw) sw.href = wa;
    const fw = document.getElementById('floatWhatsapp');
    if (fw) fw.href = wa + '?text=Hi%20Zone14%2C%20I%20want%20to%20order%20a%20jersey.';
  }
}

/* Sync the hero title/accent/subtitle DOM with the HERO settings object.
   Fired on boot and whenever admin saves the brand settings form. */
function applyHeroToDOM() {
  if (typeof HERO === 'undefined') return;
  const t = document.getElementById('heroTitle');
  const a = document.getElementById('heroAccent');
  const s = document.getElementById('heroSubtitle');
  if (t && HERO.title)  t.textContent = HERO.title;
  if (a && HERO.accent) { a.textContent = HERO.accent; a.setAttribute('data-text', HERO.accent); }
  if (s && HERO.subtitle) {
    // Preserve the Bangla line if subtitle doesn't include one
    const bn = s.querySelector('.bn');
    s.innerHTML = '';
    s.appendChild(document.createTextNode(HERO.subtitle));
    if (bn) { s.appendChild(document.createElement('br')); s.appendChild(bn); }
  }
}

function initHeroVideo() {
  const video  = document.getElementById('heroVideo');
  const poster = document.getElementById('heroPoster');
  if (!video || !poster) return;

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    // Step 1: dim the poster slightly (300ms)
    poster.classList.add('dimming');
    // Step 2: cross-fade video in on top of it
    setTimeout(() => {
      video.classList.add('is-ready');
      // Step 3: once the video is fully visible, drop the poster from the paint
      // tree so it isn't quietly compositing forever.
      setTimeout(() => poster.classList.add('fade-out'), 1300);
    }, 300);
  };

  // 'playing' fires the moment a frame is rendered — most reliable cue
  video.addEventListener('playing', reveal, { once: true });
  // Safety nets: some browsers fire canplay/loadeddata before playing
  video.addEventListener('canplay', () => {
    // give the playback engine ~200ms to actually start, then reveal anyway
    setTimeout(reveal, 200);
  }, { once: true });

  // Nudge autoplay along — some browsers stall preload="auto" until interacted.
  // Wrap in Promise.resolve because old browsers had video.play() return void
  // instead of a Promise (which makes `.catch` throw).
  const tryPlay = () => {
    try {
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {}
  };
  tryPlay();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryPlay();
  });
}

/* ---------- PROMOTIONAL SALE POPUP ----------
   Shows once per calendar day while a sale is active. Content + countdown are
   driven entirely by the SALE config (data.js / admin Settings panel). */
let _salePopupReady = false;
function initSalePopup() {
  const pop = document.getElementById('salePopup');
  if (!pop) return;
  // Only run when a sale is genuinely live and the popup is enabled
  if (typeof saleActive !== 'function' || !saleActive()) return;
  if (!SALE.popup || SALE.popup.enabled === false) return;
  if (_salePopupReady) return;           // guard against double-binding
  _salePopupReady = true;

  // Show at most once per calendar day per visitor
  const SEEN_KEY = 'zone14_sale_popup_seen';
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(SEEN_KEY) === today) return;

  const p = SALE.popup;
  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt || ''; };
  set('salePopBadge', p.badge);
  set('salePopTitle', p.title);
  set('salePopSub',   p.sub);
  const cta = document.getElementById('salePopCta');
  if (cta) { cta.textContent = p.cta || 'Shop Now'; cta.setAttribute('href', p.ctaUrl || '#jerseys'); }

  // Live countdown to the sale end
  const timer = document.getElementById('salePopTimer');
  let tick = null;
  function renderTimer() {
    if (!timer || !SALE.endsAt) { if (timer) timer.style.display = 'none'; return; }
    const diff = new Date(SALE.endsAt).getTime() - Date.now();
    if (!isFinite(diff) || diff <= 0) { timer.style.display = 'none'; if (tick) clearInterval(tick); return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    timer.innerHTML =
      `<span class="sp-unit"><b>${d}</b>d</span>` +
      `<span class="sp-unit"><b>${String(h).padStart(2,'0')}</b>h</span>` +
      `<span class="sp-unit"><b>${String(m).padStart(2,'0')}</b>m</span>` +
      `<span class="sp-unit"><b>${String(s).padStart(2,'0')}</b>s</span>`;
  }

  const open = () => {
    renderTimer();
    tick = setInterval(renderTimer, 1000);
    pop.classList.add('show');
  };
  const close = () => {
    pop.classList.remove('show');
    localStorage.setItem(SEEN_KEY, today);
    if (tick) clearInterval(tick);
  };

  setTimeout(open, 1400);
  pop.querySelectorAll('[data-sale-close]').forEach(b => b.addEventListener('click', close));
  pop.addEventListener('click', e => { if (e.target === pop) close(); });
  if (cta) cta.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && pop.classList.contains('show')) close(); });
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  applyHeroToDOM();
  applyContactToDOM();
  renderOffers();
  initHeroVideo();
  renderJerseys();
  initFilters();
  initNav();
  initBackToTop();
  initReveal();
  initReviews();
  initYear();
  initCartPill();

  // Conversion features
  initWishlist();
  initQuickView();

  // Video showcase
  renderHeroVideos();
  renderVideoShowcase();
  initVideoModal();
  window.addEventListener('herovideos:change', renderHeroVideos);

  // Promotional sale popup (no-op when no sale is active)
  initSalePopup();

  // Re-render gallery + cards when admin uploads media (cross-tab sync)
  window.addEventListener('media:change', () => { renderJerseys(); renderVideoShowcase(); });
  window.addEventListener('showcase:change', renderVideoShowcase);
  window.addEventListener('jerseys:change', () => {
    renderJerseys();
    if (typeof renderFilters === 'function') renderFilters();
  });
  window.addEventListener('settings:applied', () => {
    applyHeroToDOM();
    applyContactToDOM();
    renderOffers();
    if (typeof renderPlayers === 'function') renderPlayers();
    updateCountdown();
    renderJerseys();      // re-render so sale prices/badges reflect synced config
    initSalePopup();      // sale may have just turned on from Supabase sync
  });
  window.addEventListener('storage', e => {
    if (e.key === MEDIA_KEY) { renderJerseys(); renderVideoShowcase(); }
    if (e.key === JERSEYS_KEY) { /* hydrate handled by data.js */ }
  });

  // Match Hub
  renderFeatured();
  renderMatchGrid();
  renderGroups();
  renderVenues();
  renderLeaderboard();
  initMatchTabs();
  initMatchHubCollapse();
  initMatchDayStrip();
  initPredictionModal();
  initPredictionListeners();

  // Auto-scores: whenever results change (live feed or admin), refresh everything
  window.addEventListener('results:change', () => {
    renderMatchGrid();
    renderLeaderboard();
    renderFeatured();
    renderGroups();          // keeps the static fallback live when the feed is down
  });
  // Live group standings (all 12 groups) re-render on their own feed
  window.addEventListener('groups:change', renderGroups);
  // Full match list (every group) re-renders on its own feed
  window.addEventListener('allmatches:change', () => { renderMatchGrid(); renderFeatured(); });

  // Live World Cup data — fetch now, then poll every 60s for auto-updates.
  // Standings first so the all-matches sync can map fixtures → groups.
  syncGroupStandings().then(() => syncAllMatches());
  syncLiveScores();
  setInterval(() => { syncLiveScores(); syncGroupStandings().then(() => syncAllMatches()); }, 60000);

  // Countdowns
  updateCountdown();
  tickFeaturedCountdown();
  tickMatchPills();
  setInterval(() => {
    updateCountdown();
    tickFeaturedCountdown();
  }, 1000);
  setInterval(tickMatchPills, 60000); // pills update every minute

  // Supabase: pull latest shared data on load, then subscribe for realtime updates.
  // Cache-first design means the UI shows localStorage instantly, then refreshes
  // when Supabase responds (typically <300ms).
  renderDynamicReviews();   // from cache immediately
  syncFromSupabase().then(ok => {
    if (ok) { renderMatchGrid(); renderLeaderboard(); renderFeatured(); renderDynamicReviews(); }
  });
  subscribeToSupabaseChanges();
  window.addEventListener('reviews:change', renderDynamicReviews);
});
