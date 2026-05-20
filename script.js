/* ============================================================
   ZONE14 — Landing-page interactions
   Requires data.js (loaded first in index.html)
   ============================================================ */

/* ---------- RENDER JERSEYS ---------- */
function renderJerseys() {
  const grid = document.getElementById('jerseyGrid');
  if (!grid) return;
  grid.innerHTML = JERSEYS.map(j => {
    const oos = !j.inStock;
    const stockBadge = oos
      ? `<span class="stock-badge oos">Restocking</span>`
      : (j.stockLeft <= 6
          ? `<span class="stock-badge low">Only ${j.stockLeft} left</span>`
          : `<span class="stock-badge ok">In Stock</span>`);
    return `
    <article class="jersey-card reveal${oos ? ' out-of-stock' : ''}" data-tag="${j.tag}" data-id="${j.id}">
      <div class="jersey-img-wrap">
        <span class="jersey-tag ${j.tag}">${j.edition}</span>
        ${stockBadge}
        <button type="button" class="wish-heart${inWishlist(j.id) ? ' active' : ''}" aria-label="Save to wishlist" data-wish>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
        <button type="button" class="jersey-quickview" data-quickview aria-label="Quick view">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
          Quick View
        </button>
        <span class="jersey-shine"></span>
        ${jerseySVG(j)}
        ${oos ? '<span class="oos-stamp">Out of Stock</span>' : ''}
      </div>
      <div class="jersey-body">
        <div class="jersey-head">
          <h3 class="jersey-country">${j.country}</h3>
          <span class="jersey-price">৳${j.price.toLocaleString('en-IN')}</span>
        </div>
        <div class="size-picker" role="group" aria-label="Select size for ${j.country}">
          ${['XS','M','L','XL','XXL','3XL'].map(s =>
            `<button class="size-btn${s === 'M' ? ' active' : ''}" data-size="${s}"${oos ? ' disabled' : ''}>${s}</button>`
          ).join('')}
        </div>
        ${oos
          ? `<button class="jersey-order notify" type="button">
               <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 00-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z"/></svg>
               Notify Me When Available
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

  // Quick view buttons (and image-area click)
  grid.querySelectorAll('[data-quickview]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.closest('.jersey-card').dataset.id;
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
        // OOS → fire a WhatsApp "notify me" message
        const msg = encodeURIComponent(
          `Hi Zone14! Please notify me when this is back in stock:\n\n` +
          `👕 ${jersey.country} — ${jersey.edition}\n` +
          `📏 My size: ${size}\n` +
          `💰 Price: ৳${jersey.price.toLocaleString('en-IN')}`
        );
        window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank', 'noopener');
        return;
      }

      // In stock → add to cart and head to checkout
      addToCart(jersey.id, size, 1);
      window.location.href = 'order.html';
    });
  });

  // Re-observe newly added reveal targets
  if (typeof revealObserver !== 'undefined') {
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
}

/* ---------- FILTERS ---------- */
function initFilters() {
  const chips = document.querySelectorAll('.jersey-filter .chip');
  const cards = () => document.querySelectorAll('.jersey-card');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.filter;
      cards().forEach(card => {
        const show = f === 'all' || card.dataset.tag === f;
        card.classList.toggle('hide', !show);
      });
    });
  });
}

/* ---------- COUNTDOWN ---------- */
function updateCountdown() {
  const diff = KICKOFF.getTime() - Date.now();
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
function initReviews() {
  const track = document.getElementById('reviewsTrack');
  const prev = document.getElementById('reviewPrev');
  const next = document.getElementById('reviewNext');
  if (!track) return;

  let index = 0;
  const cards = track.children;
  const total = cards.length;

  const perView = () => {
    if (window.innerWidth >= 968) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  const update = () => {
    const pv = perView();
    const maxIndex = Math.max(0, total - pv);
    if (index > maxIndex) index = maxIndex;
    if (index < 0) index = 0;
    const card = cards[0];
    if (!card) return;
    const cardWidth = card.getBoundingClientRect().width;
    const gap = 24;
    const offset = index * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
  };

  prev.addEventListener('click', () => { index--; update(); });
  next.addEventListener('click', () => { index++; update(); });

  let autoplay = setInterval(() => {
    const pv = perView();
    index = (index + 1) % Math.max(1, total - pv + 1);
    update();
  }, 5000);

  [prev, next].forEach(b => b.addEventListener('click', () => {
    clearInterval(autoplay);
    autoplay = setInterval(() => {
      const pv = perView();
      index = (index + 1) % Math.max(1, total - pv + 1);
      update();
    }, 7000);
  }));

  window.addEventListener('resize', update);
  update();
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

/* ---------- CART PILL ---------- */
function initCartPill() {
  const pill  = document.getElementById('cartPill');
  const count = document.getElementById('cartCount');
  if (!pill || !count) return;

  const sync = () => {
    const n = cartCount();
    count.textContent = n;
    pill.classList.toggle('show', n > 0);
  };

  sync();
  window.addEventListener('cart:change', sync);
  window.addEventListener('storage', sync); // sync across tabs
}

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
    if (j) lines.push(`👕 ${j.country} ${j.edition} — ${fmtBDT(j.price)}${j.inStock ? '' : ' (currently OOS)'}`);
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

  const qvImg     = document.getElementById('qvImg');
  const qvTag     = document.getElementById('qvTag');
  const qvTitle   = document.getElementById('qvTitle');
  const qvEdition = document.getElementById('qvEdition');
  const qvPrice   = document.getElementById('qvPrice');
  const qvStock   = document.getElementById('qvStock');
  const qvSizes   = document.getElementById('qvSizes');
  const qvQty     = document.getElementById('qvQty');
  const qvAdd     = document.getElementById('qvAdd');
  const qvWish    = document.getElementById('qvWishlist');

  function open(jerseyId) {
    const j = getJersey(jerseyId);
    if (!j) return;
    state = { jersey: j, size: 'M', qty: 1 };
    qvImg.innerHTML = jerseySVG(j);
    qvTag.textContent = j.edition;
    qvTag.className = 'qv-tag ' + j.tag;
    qvTitle.textContent = j.country;
    qvEdition.textContent = j.edition;
    qvPrice.textContent = fmtBDT(j.price);
    qvStock.innerHTML = j.inStock
      ? `<span class="qv-stock-ok">${j.stockLeft <= 6 ? `🔥 Only ${j.stockLeft} left in stock` : '✓ In stock — ships within 24 h'}</span>`
      : `<span class="qv-stock-oos">⏳ Currently restocking — get a WhatsApp alert</span>`;

    qvSizes.innerHTML = ['XS','M','L','XL','XXL','3XL']
      .map(s => `<button class="size-btn${s === 'M' ? ' active' : ''}" data-size="${s}"${j.inStock ? '' : ' disabled'}>${s}</button>`)
      .join('');
    qvQty.textContent = '1';

    qvAdd.disabled = !j.inStock;
    qvAdd.textContent = j.inStock ? 'Add to Cart' : 'Notify Me on WhatsApp';
    qvWish.dataset.id = j.id;
    qvWish.classList.toggle('active', inWishlist(j.id));

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
  const next = MATCHES
    .map(m => ({ ...m, ts: new Date(m.date).getTime() }))
    .sort((a, b) => a.ts - b.ts)
    .find(m => m.ts > Date.now()) || MATCHES[0];

  const home = COUNTRY[next.home] || {};
  const away = COUNTRY[next.away] || {};

  wrap.innerHTML = `
    <div class="mf-team home">
      <div class="mf-flag">${flagImg(next.home)}</div>
      <div class="mf-name">${home.name || next.home}</div>
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
      <p class="mf-meta">${next.stage} · <strong>${next.venue}</strong>, ${next.city}<br/>Kick-off · ${formatBdLocalTime(next.date)}</p>
      <div class="mf-actions">
        <a href="${setReminderHref(next)}" target="_blank" rel="noopener" class="btn btn-ghost">⏰ Remind Me</a>
        ${(getKitHref(next.home) || getKitHref(next.away))
          ? `<a href="#jerseys" class="btn btn-primary">Get a Kit</a>`
          : ''
        }
      </div>
    </div>
    <div class="mf-team away">
      <div class="mf-flag">${flagImg(next.away)}</div>
      <div class="mf-name">${away.name || next.away}</div>
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

/* ---------- Render match grid (upcoming fixtures) ---------- */
function renderMatchGrid() {
  const grid = document.getElementById('matchGrid');
  if (!grid) return;
  const sorted = [...MATCHES].sort((a, b) => new Date(a.date) - new Date(b.date));

  grid.innerHTML = sorted.map(m => {
    const home = COUNTRY[m.home] || { name: m.home, bg: '#222', fg: '#fff' };
    const away = COUNTRY[m.away] || { name: m.away, bg: '#222', fg: '#fff' };
    const hasOurJersey = COUNTRY_TO_JERSEY[m.home] || COUNTRY_TO_JERSEY[m.away];
    const ms = new Date(m.date).getTime() - Date.now();
    return `
      <article class="match-card reveal ${hasOurJersey ? 'has-jersey' : ''}" data-ts="${new Date(m.date).getTime()}">
        <div class="mc-head">
          <span class="mc-stage">${m.stage}</span>
          <span class="mc-date">${formatMatchDate(m.date)}</span>
        </div>
        <div class="mc-teams">
          <div class="mc-team">
            <div class="mc-flag">${flagImg(m.home)}</div>
            <span class="mc-team-name">${home.name}</span>
          </div>
          <span class="mc-vs">VS</span>
          <div class="mc-team">
            <div class="mc-flag">${flagImg(m.away)}</div>
            <span class="mc-team-name">${away.name}</span>
          </div>
        </div>
        <div class="mc-foot">
          <div class="mc-venue">
            <strong>${m.venue}</strong>
            ${m.city} · ${formatBdLocalTime(m.date)}
          </div>
          <div class="mc-actions">
            <span class="mc-countdown-pill" data-mc-cd="${new Date(m.date).getTime()}">${compactCountdown(ms)}</span>
            <a class="mc-ico-btn" href="${setReminderHref(m)}" target="_blank" rel="noopener" title="Set reminder on WhatsApp">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 00-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            </a>
            ${hasOurJersey ? `
              <a class="mc-ico-btn" href="#jerseys" title="Shop kits">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 4l-4 2-4-2-6 4 2 6 4-2v8h8v-8l4 2 2-6z"/></svg>
              </a>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');

  if (typeof revealObserver !== 'undefined') {
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
}

/* Update small countdown pills on every match card */
function tickMatchPills() {
  document.querySelectorAll('[data-mc-cd]').forEach(el => {
    const ts = parseInt(el.dataset.mcCd, 10);
    el.textContent = compactCountdown(ts - Date.now());
  });
}

/* ---------- Render group standings ---------- */
function renderGroups() {
  const wrap = document.getElementById('groupsGrid');
  if (!wrap) return;
  wrap.innerHTML = GROUPS.map(g => `
    <article class="group-card reveal">
      <h3><span class="grp-badge">${g.name}</span> Group ${g.name}</h3>
      <table class="group-table">
        <thead>
          <tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
        </thead>
        <tbody>
          ${g.teams.map(t => {
            const c = COUNTRY[t.code] || { name: t.code };
            const highlight = COUNTRY_TO_JERSEY[t.code] ? ' team-highlight' : '';
            const gd = t.GF - t.GA;
            return `
              <tr class="${highlight}">
                <td>
                  <div class="team-cell">
                    <span class="team-mini-flag">${flagImg(t.code)}</span>
                    <span class="team-name">${c.name}</span>
                  </div>
                </td>
                <td>${t.P}</td><td>${t.W}</td><td>${t.D}</td><td>${t.L}</td>
                <td>${gd > 0 ? '+' + gd : gd}</td>
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

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderJerseys();
  initFilters();
  initNav();
  initBackToTop();
  initReveal();
  initReviews();
  initYear();
  initCartPill();
  initNewsletter();

  // Star players + conversion features
  renderPlayers();
  initWishlist();
  initSocialProof();
  initQuickView();

  // Match Hub
  renderFeatured();
  renderMatchGrid();
  renderGroups();
  renderVenues();
  initMatchTabs();
  initMatchDayStrip();

  // Countdowns
  updateCountdown();
  tickFeaturedCountdown();
  tickMatchPills();
  setInterval(() => {
    updateCountdown();
    tickFeaturedCountdown();
  }, 1000);
  setInterval(tickMatchPills, 60000); // pills update every minute
});
