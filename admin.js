/* ============================================================
   ZONE14 — Admin Dashboard
   Reads orders from localStorage (saved by order.js).
   Soft passcode gate — NOT real security. For real production
   you'd need a backend with proper auth.
   ============================================================ */

const ADMIN_PASS = 'Brazil2002@rz';
const AUTH_KEY   = 'zone14_admin_auth';

const STATUS_META = {
  pending:   { label: 'Pending',   color: '#ffb547' },
  confirmed: { label: 'Confirmed', color: '#5ee9e3' },
  packed:    { label: 'Packed',    color: '#00d4ff' },
  shipped:   { label: 'Shipped',   color: '#a78bfa' },
  delivered: { label: 'Delivered', color: '#51e0a4' },
  cancelled: { label: 'Cancelled', color: '#ff6b6b' },
};

const PAYMENT_LABEL = {
  cod:    'Cash on Delivery',
  bkash:  'bKash',
  nagad:  'Nagad',
  rocket: 'Rocket',
  bank:   'Bank Transfer',
};

const state = { search: '', status: '' };

/* ---------- Auth gate ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const gate = document.getElementById('adminGate');
  const app  = document.getElementById('adminApp');

  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    gate.style.display = 'none';
    app.hidden = false;
    bootDashboard();
  }

  document.getElementById('adminGateForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = document.getElementById('adminPass').value;
    if (v === ADMIN_PASS) {
      sessionStorage.setItem(AUTH_KEY, '1');
      gate.style.display = 'none';
      app.hidden = false;
      bootDashboard();
    } else {
      document.getElementById('adminPass').value = '';
      document.getElementById('adminPass').placeholder = 'Wrong passcode — try again';
      document.getElementById('adminPass').classList.add('shake');
      setTimeout(() => document.getElementById('adminPass').classList.remove('shake'), 400);
    }
  });
});

/* ---------- Dashboard boot ---------- */
function bootDashboard() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    location.reload();
  });

  document.getElementById('exportOrders').addEventListener('click', exportOrdersJson);
  document.getElementById('clearAll').addEventListener('click', clearAllOrders);

  document.getElementById('orderSearch').addEventListener('input', e => {
    state.search = e.target.value.toLowerCase();
    render();
  });
  document.getElementById('statusFilter').addEventListener('change', e => {
    state.status = e.target.value;
    render();
  });

  render();
  renderResults();
  initMediaLibrary();
  initReviewsAdmin();
  initShowcaseAdmin();
  initJerseysAdmin();
  initSettingsAdmin();
  window.addEventListener('storage', () => { render(); renderResults(); renderMediaGallery(); renderAdminReviewsList(); renderAdminShowcaseList(); renderAdminJerseysList(); });
  window.addEventListener('predictions:change', renderResults);
  window.addEventListener('results:change',     renderResults);
  window.addEventListener('media:change',       renderMediaGallery);
  window.addEventListener('reviews:change',     renderAdminReviewsList);
  window.addEventListener('showcase:change',    renderAdminShowcaseList);
  window.addEventListener('jerseys:change',     () => {
    renderAdminJerseysList();
    refreshJerseyDropdowns();
  });
  window.addEventListener('settings:change',    fillSettingsForms);
  window.addEventListener('settings:applied',   () => { fillSettingsForms(); renderOffersList(); renderPlayersList(); });

  // Pull latest shared predictions + results from Supabase, then subscribe
  // for realtime updates so admin sees customer activity live.
  syncFromSupabase().then(ok => { if (ok) renderResults(); });
  subscribeToSupabaseChanges();
}

/* ============================================================
   MEDIA LIBRARY — admin uploads
   ============================================================ */
const MAX_LOCAL_FILE_BYTES = 3 * 1024 * 1024;        // 3 MB per file in local mode
const MAX_LOCAL_TOTAL_BYTES = 4.5 * 1024 * 1024;     // ~5 MB localStorage budget

function initMediaLibrary() {
  // Mode banner — Supabase Storage is always on now
  const banner = document.getElementById('mediaModeBanner');
  if (banner) {
    banner.innerHTML = `☁️ <strong style="color:var(--neon)">Cloud mode (Supabase)</strong> · Uploads visible to every customer worldwide via CDN`;
  }
  const hint = document.getElementById('mediaCloudHint');
  if (hint) hint.style.display = 'none';

  // Populate jersey selector
  const sel = document.getElementById('mediaJerseySelect');
  sel.innerHTML = JERSEYS.map(j =>
    `<option value="${j.id}">${j.country} — ${j.edition}</option>`
  ).join('');

  // Drop zone + file picker
  const drop  = document.getElementById('mediaDrop');
  const input = document.getElementById('mediaFileInput');
  const pickBtn = document.getElementById('mediaPickBtn');
  const openPicker = (e) => { if (e) { e.stopPropagation(); e.preventDefault(); } input.click(); };
  drop.addEventListener('click', openPicker);
  if (pickBtn) pickBtn.addEventListener('click', openPicker);
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('drag-over');
    enqueueFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', () => {
    enqueueFiles(input.files);
    input.value = ''; // reset so re-selecting the same file re-fires change
  });

  // Queue panel actions
  document.getElementById('mediaQueueClear').addEventListener('click', () => {
    mediaQueue = [];
    renderQueue();
  });
  document.getElementById('mediaQueueUpload').addEventListener('click', startQueueUpload);

  renderMediaGallery();
}

/* ---------- Upload queue ---------- */
let mediaQueue = [];   // [{ file, status: 'queued'|'uploading'|'done'|'failed', error?: string }]
let queueRunning = false;

function enqueueFiles(fileList) {
  Array.from(fileList).forEach(file => {
    mediaQueue.push({ file, status: 'queued' });
  });
  renderQueue();
}

function renderQueue() {
  const wrap   = document.getElementById('mediaQueue');
  const list   = document.getElementById('mediaQueueList');
  const count  = document.getElementById('mediaQueueCount');
  const upBtn  = document.getElementById('mediaQueueUpload');
  const upLbl  = document.getElementById('mediaQueueUploadLabel');

  if (mediaQueue.length === 0) { wrap.hidden = true; return; }
  wrap.hidden = false;

  const pending = mediaQueue.filter(q => q.status === 'queued' || q.status === 'uploading').length;
  count.textContent = `${mediaQueue.length} file${mediaQueue.length === 1 ? '' : 's'} · ${pending} pending`;
  upBtn.disabled = pending === 0 || queueRunning;
  upLbl.textContent = queueRunning ? 'Uploading…' : (pending > 0 ? `Upload ${pending}` : 'All done');

  list.innerHTML = mediaQueue.map((q, i) => {
    const ico = q.status === 'done'      ? '✓'
              : q.status === 'failed'    ? '✗'
              : q.status === 'uploading' ? '⏳'
              : '•';
    const cls = `q-${q.status}`;
    return `
      <li class="media-queue-item ${cls}">
        <span class="qi-ico">${ico}</span>
        <span class="qi-name">${q.file.name}</span>
        <span class="qi-size">${formatBytes(q.file.size)}</span>
        <span class="qi-status">${q.status}${q.error ? ` — ${q.error}` : ''}</span>
        ${q.status === 'queued' ? `<button type="button" class="qi-remove" data-idx="${i}" aria-label="Remove">×</button>` : ''}
      </li>
    `;
  }).join('');

  list.querySelectorAll('.qi-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      mediaQueue.splice(Number(btn.dataset.idx), 1);
      renderQueue();
    });
  });
}

async function startQueueUpload() {
  const sel = document.getElementById('mediaJerseySelect');
  const jerseyId = sel.value;
  if (!jerseyId) {
    alert('Pick a jersey first (top-left dropdown).');
    return;
  }
  if (queueRunning) return;

  queueRunning = true;
  const warn = document.getElementById('mediaSizeWarn');
  warn.hidden = true;

  for (const q of mediaQueue) {
    if (q.status !== 'queued') continue;
    q.status = 'uploading';
    renderQueue();
    try {
      await uploadOne(jerseyId, q.file, warn);
      q.status = 'done';
    } catch (err) {
      q.status = 'failed';
      q.error  = err.message || String(err);
      console.warn('Upload failed:', err);
    }
    renderQueue();
  }
  queueRunning = false;
  renderQueue();
  renderMediaGallery();
}

async function uploadOne(jerseyId, file, warnEl) {
  if (!isCloudConfigured()) {
    throw new Error('Supabase client not ready. Refresh and try again.');
  }
  // Size sanity check — Supabase free tier per-file limit is 50 MB by default,
  // and any single jersey photo really shouldn't exceed ~5 MB.
  if (file.size > 50 * 1024 * 1024) {
    throw new Error(`File too large (${formatBytes(file.size)}). Max 50 MB per file.`);
  }
  if (file.size > 5 * 1024 * 1024) {
    warnEl.hidden = false;
    warnEl.textContent = `⚠️ Large file (${formatBytes(file.size)}) — compress under 2 MB for faster customer loading.`;
  }
  // cloudUpload pushes to Storage + inserts the jersey_media row.
  // syncFromSupabase() will re-populate the localStorage cache via the
  // realtime subscription, so renderMediaGallery picks it up automatically.
  await cloudUpload(jerseyId, file);
}

function renderMediaGallery() {
  const wrap = document.getElementById('mediaGallery');
  if (!wrap) return;
  const stats = document.getElementById('mediaStats');

  const all = listAllAssets();
  const usedBytes = mediaStorageBytes();
  const pct = Math.round((usedBytes / MAX_LOCAL_TOTAL_BYTES) * 100);

  if (stats) {
    stats.innerHTML = `${all.length} file${all.length === 1 ? '' : 's'} uploaded · ☁️ Supabase Storage (1 GB free tier)`;
  }

  if (all.length === 0) {
    wrap.innerHTML = `
      <div class="media-empty">
        <div class="media-empty-ico">🖼️</div>
        <p>No uploads yet. Pick a jersey above and drop in some photos.</p>
      </div>`;
    return;
  }

  // Group by jersey for display
  const byJersey = {};
  all.forEach(a => {
    if (!byJersey[a.jerseyId]) byJersey[a.jerseyId] = [];
    byJersey[a.jerseyId].push(a);
  });

  wrap.innerHTML = Object.entries(byJersey).map(([jid, assets]) => {
    const j = getJersey(jid);
    return `
      <div class="media-group">
        <h4>${j ? `${j.country} · ${j.edition}` : jid} <span>${assets.length} file${assets.length === 1 ? '' : 's'}</span></h4>
        <div class="media-tiles">
          ${assets.map(a => `
            <div class="media-tile" data-jid="${jid}" data-aid="${a.id}">
              ${a.type === 'image'
                ? `<img src="${a.url}" alt="${a.name}" />`
                : `<video src="${a.url}" muted preload="metadata"></video><span class="media-tile-play">▶</span>`}
              <button type="button" class="media-tile-del" title="Delete">×</button>
              <span class="media-tile-name">${a.name}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('.media-tile-del').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const tile = btn.closest('.media-tile');
      if (!confirm('Delete this file? It will be removed from Supabase Storage and every customer\'s view.')) return;
      const assetId = tile.dataset.aid;
      const jerseyId = tile.dataset.jid;
      const bucket = getJerseyMedia(jerseyId);
      const asset = [...bucket.images, ...bucket.videos].find(a => a.id === assetId);
      if (asset) {
        await cloudDelete(asset);             // removes from Storage + DB
      }
      removeAsset(jerseyId, assetId);          // removes from local cache
      renderMediaGallery();
    });
  });

  // Click image/video to open in new tab
  wrap.querySelectorAll('.media-tile').forEach(tile => {
    const media = tile.querySelector('img, video');
    if (media) tile.addEventListener('click', () => window.open(media.src, '_blank'));
  });
}

function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

/* ============================================================
   CUSTOMER REVIEWS — admin form + list
   ============================================================ */
function initReviewsAdmin() {
  const form = document.getElementById('reviewForm');
  const msg  = document.getElementById('reviewFormMsg');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    const photoFile = fd.get('photo');
    const videoFile = fd.get('video');
    const review = {
      name:     (fd.get('name') || '').toString().trim(),
      location: (fd.get('location') || '').toString().trim(),
      rating:   parseInt(fd.get('rating'), 10),
      text:     (fd.get('text') || '').toString().trim(),
      purchase: (fd.get('purchase') || '').toString().trim(),
    };

    if (photoFile && photoFile.size > 5 * 1024 * 1024) {
      showReviewMsg('err', `Photo too large (${formatBytes(photoFile.size)}). Compress under 5 MB.`);
      return;
    }
    if (videoFile && videoFile.size > 25 * 1024 * 1024) {
      showReviewMsg('err', `Video too large (${formatBytes(videoFile.size)}). Compress under 25 MB.`);
      return;
    }

    const hasPhoto = photoFile && photoFile.size > 0;
    const hasVideo = videoFile && videoFile.size > 0;
    const submitBtn = form.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = hasVideo ? 'Uploading video…' : hasPhoto ? 'Uploading photo…' : 'Publishing…';

    try {
      await pushReview(review, hasPhoto ? photoFile : null, hasVideo ? videoFile : null);
      showReviewMsg('ok', '✓ Review published — live on the homepage now.');
      form.reset();
    } catch (err) {
      console.warn(err);
      showReviewMsg('err', '✗ Failed: ' + (err.message || err));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publish Review';
    }
  });

  renderAdminReviewsList();
  window.addEventListener('reviews:change', renderAdminReviewsList);
}

function showReviewMsg(kind, text) {
  const msg = document.getElementById('reviewFormMsg');
  if (!msg) return;
  msg.hidden = false;
  msg.className = 'review-form-msg ' + kind;
  msg.textContent = text;
  setTimeout(() => { msg.hidden = true; }, 6000);
}

function renderAdminReviewsList() {
  const wrap = document.getElementById('adminReviewsList');
  if (!wrap) return;
  const reviews = readReviews();
  if (reviews.length === 0) {
    wrap.innerHTML = `
      <div class="admin-review-empty">
        <span class="icon">📝</span>
        <p>No customer reviews yet. Post your first one above — it'll appear on the homepage within a second.</p>
      </div>`;
    return;
  }
  wrap.innerHTML = reviews.map(r => {
    const stars = '★'.repeat(r.rating || 5);
    let mediaHtml = '';
    if (r.videoUrl) {
      mediaHtml = `<video class="admin-review-tile-img" src="${r.videoUrl}" muted playsinline preload="metadata"></video>`;
    } else if (r.photoUrl) {
      mediaHtml = `<img class="admin-review-tile-img" src="${r.photoUrl}" alt="${escapeAttr(r.name)}" loading="lazy" />`;
    }
    return `
      <div class="admin-review-tile" data-id="${r.id}" data-photo-path="${r.photoPath || ''}" data-video-path="${r.videoPath || ''}">
        ${mediaHtml}
        <div class="admin-review-tile-head">
          <strong>${escapeAttr(r.name)}</strong>
          <span class="art-stars">${stars}</span>
        </div>
        <p class="art-text">${escapeAttr(r.text)}</p>
        ${r.purchaseInfo ? `<p class="art-buy">${escapeAttr(r.purchaseInfo)}</p>` : ''}
        ${r.location ? `<p class="art-loc">📍 ${escapeAttr(r.location)}</p>` : ''}
        <button type="button" class="admin-review-tile-del" data-del title="Delete review">×</button>
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tile = btn.closest('.admin-review-tile');
      if (!confirm('Delete this review? This removes it from the homepage too.')) return;
      const id = tile.dataset.id;
      const photoPath = tile.dataset.photoPath || null;
      const videoPath = tile.dataset.videoPath || null;
      await deleteReviewRemote(id, photoPath, videoPath);
      writeReviews(readReviews().filter(r => r.id !== id));
    });
  });
}

function escapeAttr(s) {
  return String(s || '').replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

/* ---------- Jersey Videos showcase ---------- */
function initShowcaseAdmin() {
  const form = document.getElementById('showcaseForm');
  if (!form) return;

  // Populate the linked-jersey dropdown
  const sel = form.querySelector('select[name=jerseyId]');
  JERSEYS.forEach(j => {
    const opt = document.createElement('option');
    opt.value = j.id;
    opt.textContent = `${j.country} — ${j.edition}`;
    sel.appendChild(opt);
  });

  // Auto-fill duration from picked video metadata
  const videoInput = form.querySelector('input[name=video]');
  const durationInput = form.querySelector('input[name=duration]');
  videoInput.addEventListener('change', () => {
    const f = videoInput.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      if (!isFinite(v.duration)) return;
      const m = Math.floor(v.duration / 60);
      const s = Math.floor(v.duration % 60).toString().padStart(2, '0');
      if (!durationInput.value) durationInput.value = `${m}:${s}`;
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    const videoFile = fd.get('video');
    const posterFile = fd.get('poster');

    if (!videoFile || videoFile.size === 0) {
      showShowcaseMsg('err', 'Video file required.'); return;
    }
    if (videoFile.size > 50 * 1024 * 1024) {
      showShowcaseMsg('err', `Video too large (${formatBytes(videoFile.size)}). Max 50 MB.`); return;
    }
    if (posterFile && posterFile.size > 5 * 1024 * 1024) {
      showShowcaseMsg('err', `Poster too large (${formatBytes(posterFile.size)}). Max 5 MB.`); return;
    }

    const meta = {
      title:     (fd.get('title') || '').toString().trim(),
      subtitle:  (fd.get('subtitle') || '').toString().trim(),
      duration:  (fd.get('duration') || '').toString().trim(),
      jerseyId:  (fd.get('jerseyId') || '').toString().trim(),
      sortOrder: parseInt(fd.get('sortOrder'), 10) || 0,
    };

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Uploading video…';

    try {
      await pushShowcaseVideo(meta, videoFile, posterFile && posterFile.size > 0 ? posterFile : null);
      showShowcaseMsg('ok', '✓ Video published — live on homepage now.');
      form.reset();
    } catch (err) {
      console.warn(err);
      showShowcaseMsg('err', '✗ Failed: ' + (err.message || err));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publish Video';
    }
  });

  renderAdminShowcaseList();
  window.addEventListener('showcase:change', renderAdminShowcaseList);
}

function showShowcaseMsg(kind, text) {
  const msg = document.getElementById('showcaseFormMsg');
  if (!msg) return;
  msg.hidden = false;
  msg.className = 'review-form-msg ' + kind;
  msg.textContent = text;
  setTimeout(() => { msg.hidden = true; }, 6000);
}

function renderAdminShowcaseList() {
  const wrap = document.getElementById('adminShowcaseList');
  if (!wrap) return;
  const videos = readShowcase();
  if (videos.length === 0) {
    wrap.innerHTML = `
      <div class="admin-review-empty">
        <span class="icon">🎬</span>
        <p>No showcase videos yet. Upload one above — it'll appear in the "Jersey Videos" section on the homepage.</p>
      </div>`;
    return;
  }
  wrap.innerHTML = videos.map(v => `
    <div class="admin-review-tile" data-id="${v.id}" data-video-path="${v.videoPath || ''}" data-poster-path="${v.posterPath || ''}">
      <video class="admin-review-tile-img" src="${v.videoUrl}" muted playsinline preload="metadata" ${v.posterUrl ? `poster="${v.posterUrl}"` : ''}></video>
      <div class="admin-review-tile-head">
        <strong>${escapeAttr(v.title)}</strong>
        ${v.duration ? `<span class="art-stars">${escapeAttr(v.duration)}</span>` : ''}
      </div>
      ${v.subtitle ? `<p class="art-text">${escapeAttr(v.subtitle)}</p>` : ''}
      ${v.jerseyId ? `<p class="art-buy">↳ ${escapeAttr(v.jerseyId)}</p>` : ''}
      <button type="button" class="admin-review-tile-del" data-del title="Delete video">×</button>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tile = btn.closest('.admin-review-tile');
      if (!confirm('Delete this showcase video? It will disappear from the homepage too.')) return;
      const id = tile.dataset.id;
      const videoPath = tile.dataset.videoPath || null;
      const posterPath = tile.dataset.posterPath || null;
      await deleteShowcaseRemote(id, videoPath, posterPath);
      writeShowcase(readShowcase().filter(v => v.id !== id));
    });
  });
}

/* ---------- Match results entry ---------- */
function renderResults() {
  const wrap = document.getElementById('resultsGrid');
  if (!wrap) return;
  const results = readResults();
  const sorted = [...MATCHES].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Quick stats line
  const totalPreds = readPredictions().length;
  const resolved   = Object.keys(results).length;

  wrap.innerHTML = `
    <div class="results-stats">
      <span><strong>${totalPreds}</strong> total predictions</span>
      <span><strong>${resolved}</strong> matches with results</span>
      <span><strong>${MATCHES.length - resolved}</strong> pending</span>
    </div>
    <div class="results-cards">
      ${sorted.map(m => {
        const home = COUNTRY[m.home] || { name: m.home };
        const away = COUNTRY[m.away] || { name: m.away };
        const r = results[m.id];
        const preds = readPredictions().filter(p => p.matchId === m.id);
        const correctCount = r ? preds.filter(p => p.choice === r.outcome).length : 0;
        return `
          <article class="result-card${r ? ' resolved' : ''}" data-mid="${m.id}">
            <div class="rc-head">
              <span class="rc-stage">${m.stage}</span>
              <span class="rc-date">${new Date(m.date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}</span>
            </div>
            <div class="rc-teams">
              <span class="rc-team">${flagImg(m.home)}<span>${home.name}</span></span>
              <span class="rc-vs">VS</span>
              <span class="rc-team">${flagImg(m.away)}<span>${away.name}</span></span>
            </div>
            <div class="rc-score">
              <input type="number" min="0" max="20" class="rc-input" data-side="home"
                     value="${r ? r.homeScore : ''}" placeholder="0" aria-label="${home.name} score" />
              <span class="rc-dash">–</span>
              <input type="number" min="0" max="20" class="rc-input" data-side="away"
                     value="${r ? r.awayScore : ''}" placeholder="0" aria-label="${away.name} score" />
            </div>
            <div class="rc-actions">
              ${r
                ? `<button type="button" class="btn btn-ghost" data-clear-result>Clear Result</button>
                   <span class="rc-meta">${preds.length} predictions · <strong>${correctCount} correct</strong></span>`
                : `<button type="button" class="btn btn-primary" data-save-result>Save Result</button>
                   <span class="rc-meta">${preds.length} prediction${preds.length === 1 ? '' : 's'} pending</span>`
              }
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;

  // Wire save/clear buttons
  wrap.querySelectorAll('[data-save-result]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.result-card');
      const mid = card.dataset.mid;
      const home = card.querySelector('[data-side=home]').value;
      const away = card.querySelector('[data-side=away]').value;
      if (home === '' || away === '') { alert('Enter both scores.'); return; }
      saveResult(mid, home, away);
      renderResults();
    });
  });
  wrap.querySelectorAll('[data-clear-result]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.result-card');
      if (!confirm('Clear this result? Predictions will go back to pending.')) return;
      clearResult(card.dataset.mid);
      renderResults();
    });
  });
}

/* ---------- Render ---------- */
function render() {
  const orders = readOrders();
  renderKpis(orders);
  renderOrders(orders);
}

function renderKpis(orders) {
  const total    = orders.length;
  const pending  = orders.filter(o => o.status === 'pending').length;
  const revenue  = orders.reduce((s, o) => s + (o.totals?.grand || 0), 0);

  // Top jersey by units sold
  const unitTally = {};
  orders.forEach(o => (o.items || []).forEach(i => {
    const key = `${i.country} ${i.edition}`;
    unitTally[key] = (unitTally[key] || 0) + i.qty;
  }));
  const top = Object.entries(unitTally).sort((a, b) => b[1] - a[1])[0];

  document.getElementById('kpiTotal').textContent       = total;
  document.getElementById('kpiTotalSub').textContent    = total === 0 ? 'no orders yet' : 'all time';
  document.getElementById('kpiPending').textContent     = pending;
  document.getElementById('kpiRevenue').textContent     = fmtBDT(revenue);
  document.getElementById('kpiTopJersey').textContent   = top ? top[0] : '—';
  document.getElementById('kpiTopJerseySub').textContent = top ? `${top[1]} units sold` : 'no data yet';
}

function renderOrders(orders) {
  const wrap = document.getElementById('ordersWrap');

  // Apply filters
  let list = orders;
  if (state.status) list = list.filter(o => o.status === state.status);
  if (state.search) {
    const q = state.search;
    list = list.filter(o =>
      (o.ref || '').toLowerCase().includes(q) ||
      (o.customer?.name || '').toLowerCase().includes(q) ||
      (o.customer?.phone || '').toLowerCase().includes(q) ||
      (o.customer?.district || '').toLowerCase().includes(q) ||
      (o.customer?.division || '').toLowerCase().includes(q) ||
      (o.customer?.thana || '').toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    wrap.innerHTML = `
      <div class="admin-empty">
        <div class="admin-empty-ico">📦</div>
        <h3>${orders.length === 0 ? 'No orders yet' : 'No matches for your filter'}</h3>
        <p>${orders.length === 0
          ? 'Place an order on the store to see it appear here, or click "Seed Demo Data" to test the dashboard.'
          : 'Try a different search term or status.'}</p>
      </div>
    `;
    return;
  }

  wrap.innerHTML = list.map(o => orderCard(o)).join('');

  // Wire status updates
  wrap.querySelectorAll('[data-status-select]').forEach(sel => {
    sel.addEventListener('change', () => {
      updateOrderStatus(sel.dataset.statusSelect, sel.value);
      render();
    });
  });

  // Wire delete
  wrap.querySelectorAll('[data-delete-ref]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(`Delete order ${btn.dataset.deleteRef}? This can't be undone.`)) return;
      deleteOrder(btn.dataset.deleteRef);
      render();
    });
  });

  // Wire expand/collapse
  wrap.querySelectorAll('.order-card-head').forEach(head => {
    head.addEventListener('click', e => {
      if (e.target.closest('select, button, a')) return;
      head.parentElement.classList.toggle('expanded');
    });
  });
}

function orderCard(o) {
  const meta = STATUS_META[o.status] || STATUS_META.pending;
  const c = o.customer || {};
  const items = o.items || [];
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const itemsText = items.map(i => `${i.country} ${i.edition} (${i.size}) × ${i.qty}`).join(' · ');
  const customNote = (o.custom?.name || o.custom?.number)
    ? `<span class="custom-pill">Custom: ${o.custom.name || ''}${o.custom.number ? ' ' + o.custom.number : ''}</span>`
    : '';
  const promoNote = o.promo ? `<span class="promo-pill">Promo: ${o.promo}</span>` : '';

  return `
    <article class="order-card status-${o.status}" data-ref="${o.ref}">
      <header class="order-card-head">
        <div class="oc-left">
          <span class="oc-ref">#${o.ref}</span>
          <span class="oc-date">${formatDate(o.date)}</span>
        </div>
        <div class="oc-mid">
          <strong>${c.name || 'Unknown'}</strong>
          <span>${c.phone || ''} · ${c.thana ? c.thana + ', ' : ''}${c.district || ''}</span>
        </div>
        <div class="oc-right">
          <span class="oc-items">${totalQty} item${totalQty === 1 ? '' : 's'}</span>
          <span class="oc-total">${fmtBDT(o.totals?.grand || 0)}</span>
          <select class="status-select" data-status-select="${o.ref}" style="--c:${meta.color}">
            ${ORDER_STATUSES.map(s =>
              `<option value="${s}"${s === o.status ? ' selected' : ''}>${STATUS_META[s].label}</option>`
            ).join('')}
          </select>
          <span class="oc-chevron">▾</span>
        </div>
      </header>

      <div class="order-card-body">
        <div class="ocb-grid">
          <section>
            <h4>Customer</h4>
            <p><strong>${c.name || '—'}</strong></p>
            <p>📞 <a href="tel:${c.phone || ''}">${c.phone || '—'}</a></p>
            ${c.email ? `<p>✉️ <a href="mailto:${c.email}">${c.email}</a></p>` : ''}
            <p>📍 ${c.address || '—'}</p>
            <p class="muted">${[c.thana, c.district, c.division].filter(Boolean).join(', ')} ${c.postcode ? '· ' + c.postcode : ''}</p>
            <p class="muted">Zone: ${c.zone === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</p>
          </section>

          <section>
            <h4>Items (${totalQty})</h4>
            <ul class="ocb-items">
              ${items.map(i => `
                <li>
                  <strong>${i.country} ${i.edition}</strong>
                  <span>Size ${i.size} × ${i.qty}</span>
                  <span class="ocb-line-price">${fmtBDT(i.price * i.qty)}</span>
                </li>
              `).join('')}
            </ul>
            <div class="ocb-tags">${customNote} ${promoNote}</div>
          </section>

          <section>
            <h4>Bill</h4>
            <div class="bill-row"><span>Subtotal</span><span>${fmtBDT(o.totals?.subtotal || 0)}</span></div>
            <div class="bill-row"><span>Delivery</span><span>${o.totals?.shipping ? fmtBDT(o.totals.shipping) : 'FREE'}</span></div>
            ${o.totals?.discount > 0 ? `<div class="bill-row" style="color:#51e0a4"><span>Discount${o.promo ? ' (' + o.promo + ')' : ''}</span><span>−${fmtBDT(o.totals.discount)}</span></div>` : ''}
            <div class="bill-row grand"><span>Total</span><span>${fmtBDT(o.totals?.grand || 0)}</span></div>
            <p class="muted" style="margin-top:8px">Payment: <strong>${PAYMENT_LABEL[o.payment] || o.payment || '—'}</strong></p>
          </section>
        </div>

        ${o.notes ? `<div class="ocb-notes"><strong>Order notes:</strong> ${o.notes}</div>` : ''}

        <div class="ocb-actions">
          <a href="${buildConfirmationUrl(o)}" target="_blank" rel="noopener" class="btn btn-primary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            Send Confirmation
          </a>
          <a href="https://wa.me/${(c.phone || '').replace(/^0/, '880')}" target="_blank" rel="noopener" class="btn btn-whatsapp">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20.52 3.48A11.86 11.86 0 0012.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 005.77 1.47h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.17-3.45-8.43z"/></svg>
            Open Chat
          </a>
          <button type="button" class="btn btn-ghost" data-delete-ref="${o.ref}" style="color:#ff6b6b">Delete</button>
        </div>
      </div>
    </article>
  `;
}

/* Build a one-click WhatsApp confirmation URL the merchant can send to a customer */
function buildConfirmationUrl(o) {
  const c = o.customer || {};
  const phone = (c.phone || '').replace(/\D/g, '');
  const wa = phone.startsWith('0') ? '880' + phone.slice(1) : phone;
  const lines = [
    `✓ *ORDER CONFIRMED · ZONE14*`,
    `Order #${o.ref}`,
    ``,
    `Hi ${c.name || ''}!`,
    `Your order is confirmed.`,
    ``,
    `👕 *Items*`,
    ...(o.items || []).map(i => `• ${i.country} ${i.edition} — Size ${i.size} × ${i.qty}`),
  ];
  if (o.custom?.name || o.custom?.number) {
    lines.push(`✨ Custom print: ${o.custom.name || ''} ${o.custom.number || ''}`.trim());
  }
  lines.push(``);
  lines.push(`💰 *Total: ${fmtBDT(o.totals?.grand || 0)}*`);
  lines.push(`Payment: ${PAYMENT_LABEL[o.payment] || o.payment || '—'}`);
  lines.push(`Delivery: ${c.zone === 'dhaka' ? 'Inside Dhaka · 24h' : 'Outside Dhaka · 2–3 days'}`);
  lines.push(`Address: ${c.address || ''}, ${c.thana ? c.thana + ', ' : ''}${c.district || ''}`);
  lines.push(``);
  lines.push(`We'll update you when shipped.`);
  lines.push(`— Zone14 Team`);
  return `https://wa.me/${wa}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/* ---------- Helpers ---------- */
function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function exportOrdersJson() {
  const orders = readOrders();
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zone14-orders-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearAllOrders() {
  if (!confirm('Delete ALL orders permanently? This cannot be undone.')) return;
  if (!confirm('Really delete everything? Last chance.')) return;
  localStorage.removeItem(ORDERS_KEY);
  render();
}

function seedDemoOrders() {
  const demos = [
    {
      ref: 'Z14-DEMO01', date: Date.now() - 7200000, status: 'pending',
      customer: { name:'Rakib Hossain', phone:'01712345678', email:'rakib@example.com',
                  address:'House 42, Road 7, Block B', thana:'Dhanmondi', district:'Dhaka', division:'Dhaka', postcode:'1209', zone:'dhaka' },
      items: [{ id:'arg-home', country:'Argentina', edition:'Home Kit', size:'L', qty:1, price:1499 }],
      custom: { name:'MESSI', number:'10' }, payment:'cod', notes:'Call before delivery please.',
      promo:'WC2026', totals: { subtotal:1499, shipping:70, discount:150, grand:1419 },
    },
    {
      ref: 'Z14-DEMO02', date: Date.now() - 86400000, status: 'confirmed',
      customer: { name:'Tahmid Rahman', phone:'01987654321', email:'',
                  address:'Building 12, Flat 5A', thana:'Khulshi', district:'Chattogram', division:'Chattogram', postcode:'4225', zone:'outside' },
      items: [
        { id:'bra-home', country:'Brazil', edition:'Home Kit', size:'M', qty:1, price:1499 },
        { id:'fra-home', country:'France', edition:'Home Kit', size:'L', qty:1, price:1499 },
      ],
      custom: { name:'', number:'' }, payment:'bkash', notes:'',
      promo:'', totals: { subtotal:2998, shipping:0, discount:0, grand:2998 },
    },
    {
      ref: 'Z14-DEMO03', date: Date.now() - 172800000, status: 'shipped',
      customer: { name:'Sadia Islam', phone:'01555512345', email:'sadia@example.com',
                  address:'7 Zindabazar Main Road', thana:'Sylhet Sadar', district:'Sylhet', division:'Sylhet', postcode:'3100', zone:'outside' },
      items: [{ id:'esp-home', country:'Spain', edition:'Home Kit', size:'S', qty:2, price:1499 }],
      custom: { name:'PEDRI', number:'8' }, payment:'nagad', notes:'',
      promo:'TEAMSET', totals: { subtotal:2998, shipping:0, discount:750, grand:2248 },
    },
    {
      ref: 'Z14-DEMO04', date: Date.now() - 259200000, status: 'delivered',
      customer: { name:'Mahir Chowdhury', phone:'01711122233', email:'',
                  address:'House 9, Sector 4', thana:'Uttara', district:'Dhaka', division:'Dhaka', postcode:'1230', zone:'dhaka' },
      items: [{ id:'arg-home', country:'Argentina', edition:'Home Kit', size:'XL', qty:1, price:1499 }],
      custom: { name:'', number:'' }, payment:'cod', notes:'',
      promo:'', totals: { subtotal:1499, shipping:70, discount:0, grand:1569 },
    },
  ];
  demos.forEach(o => saveOrder(o));
  render();
}

/* ============================================================
   JERSEYS CATALOG — admin CRUD
   ============================================================ */
function initJerseysAdmin() {
  const list = document.getElementById('adminJerseysList');
  if (!list) return;

  document.getElementById('addJerseyBtn').addEventListener('click', () => openJerseyEditor(null));
  document.getElementById('seedJerseysBtn').addEventListener('click', handleSeedJerseys);
  document.getElementById('jerseyEditorClose').addEventListener('click', closeJerseyEditor);
  document.getElementById('jerseyFormCancel').addEventListener('click', closeJerseyEditor);

  // Backdrop click closes
  document.getElementById('jerseyEditor').addEventListener('click', e => {
    if (e.target.id === 'jerseyEditor') closeJerseyEditor();
  });

  document.getElementById('jerseyForm').addEventListener('submit', handleJerseySubmit);

  renderAdminJerseysList();
}

async function handleSeedJerseys() {
  if (!confirm('Copy the 12 default jerseys into your database? You\'ll then be able to edit any of them. Existing rows will be overwritten with the static defaults.')) return;
  const btn = document.getElementById('seedJerseysBtn');
  btn.disabled = true; btn.textContent = 'Seeding…';
  try {
    await seedJerseysFromStatic();
    alert('✓ Catalog seeded. Refresh to see changes if needed.');
  } catch (err) {
    alert('✗ Seed failed: ' + (err.message || err));
  } finally {
    btn.disabled = false; btn.textContent = 'Seed Catalog from Defaults';
  }
}

function renderAdminJerseysList() {
  const wrap  = document.getElementById('adminJerseysList');
  const count = document.getElementById('jerseysCount');
  if (!wrap) return;

  count.textContent = `${JERSEYS.length} jersey${JERSEYS.length === 1 ? '' : 's'}`;

  if (JERSEYS.length === 0) {
    wrap.innerHTML = `
      <div class="admin-review-empty">
        <span class="icon">🎽</span>
        <p>No jerseys yet. Click "Add New Jersey" or "Seed Catalog from Defaults" to start.</p>
      </div>`;
    return;
  }

  wrap.innerHTML = JERSEYS.map(j => {
    const stock  = j.inStock ? `${j.stockLeft} in stock` : (j.comingSoon ? 'Coming Soon' : 'Out of stock');
    const stockCls = j.inStock ? 'ok' : (j.comingSoon ? 'warn' : 'bad');
    return `
      <div class="admin-jersey-row" data-id="${j.id}">
        <div class="ajr-swatch" style="background:${j.palette.primary};border-color:${j.palette.accent}">
          <span style="color:${j.palette.secondary}">${escapeAttr(j.number || '10')}</span>
        </div>
        <div class="ajr-info">
          <strong>${escapeAttr(j.country)} <span style="color:var(--text-mute);font-weight:400">— ${escapeAttr(j.edition)}</span></strong>
          <span class="ajr-meta">
            ৳${j.price}
            · <span class="ajr-tag tag-${j.tag}">${escapeAttr(j.tag)}</span>
            · <span class="ajr-stock ajr-stock-${stockCls}">${stock}</span>
          </span>
        </div>
        <div class="ajr-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit>Edit</button>
          <button type="button" class="btn btn-ghost btn-sm" data-del style="color:#ff6b6b">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.admin-jersey-row');
      const j = JERSEYS.find(x => x.id === row.dataset.id);
      if (j) openJerseyEditor(j);
    });
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.admin-jersey-row');
      const id = row.dataset.id;
      const j = JERSEYS.find(x => x.id === id);
      if (!j) return;
      if (!confirm(`Delete "${j.country} ${j.edition}"? This removes it from the homepage too.`)) return;
      await deleteJerseyRemote(id);
      // Optimistic local removal — realtime sync will confirm
      setJerseys(JERSEYS.filter(x => x.id !== id));
    });
  });
}

let jerseyEditorMode = 'add'; // 'add' | 'edit'

function openJerseyEditor(jersey) {
  const modal = document.getElementById('jerseyEditor');
  const form  = document.getElementById('jerseyForm');
  const title = document.getElementById('jerseyEditorTitle');

  jerseyEditorMode = jersey ? 'edit' : 'add';
  title.textContent = jersey ? `Edit Jersey · ${jersey.country} ${jersey.edition}` : 'Add New Jersey';

  form.reset();
  if (jersey) {
    form.id.value           = jersey.id;
    form.country.value      = jersey.country;
    form.edition.value      = jersey.edition;
    form.tag.value          = jersey.tag || 'home';
    form.price.value        = jersey.price;
    form.stockLeft.value    = jersey.stockLeft || 0;
    form.inStock.checked    = !!jersey.inStock;
    form.primary.value      = (jersey.palette || {}).primary   || '#cccccc';
    form.secondary.value    = (jersey.palette || {}).secondary || '#ffffff';
    form.accent.value       = (jersey.palette || {}).accent    || '#000000';
    form.stripes.checked    = !!(jersey.palette || {}).stripes;
    form.crest.value        = jersey.crest || '';
    form.shirtNumber.value  = jersey.number || '';
    form.sortOrder.value    = jersey.sortOrder || 0;
    form.hidden.checked     = !!jersey.hidden;
  }

  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('show'));
  document.body.style.overflow = 'hidden';
}

function closeJerseyEditor() {
  const modal = document.getElementById('jerseyEditor');
  modal.classList.remove('show');
  setTimeout(() => { modal.hidden = true; }, 250);
  document.body.style.overflow = '';
}

async function handleJerseySubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const fd = new FormData(form);
  const country = (fd.get('country') || '').toString().trim();
  const edition = (fd.get('edition') || '').toString().trim();

  // ID strategy: existing rows keep their id; new rows get a slug
  let id = (fd.get('id') || '').toString().trim();
  if (!id) {
    const slug = (country + '-' + edition).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    id = slug + '-' + Math.random().toString(36).slice(2, 6);
  }

  const jersey = {
    id,
    country,
    edition,
    tag:        fd.get('tag') || 'home',
    price:      parseInt(fd.get('price'), 10) || 0,
    inStock:    form.inStock.checked,
    stockLeft:  parseInt(fd.get('stockLeft'), 10) || 0,
    comingSoon: (fd.get('tag') === 'coming'),
    palette: {
      primary:   fd.get('primary'),
      secondary: fd.get('secondary'),
      accent:    fd.get('accent'),
      stripes:   form.stripes.checked,
    },
    crest:     (fd.get('crest') || '').toString().trim(),
    number:    (fd.get('shirtNumber') || '10').toString().trim(),
    sortOrder: parseInt(fd.get('sortOrder'), 10) || 0,
    hidden:    form.hidden.checked,
  };

  const msg = document.getElementById('jerseyFormMsg');
  const btn = document.getElementById('jerseyFormSave');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    await pushJersey(jersey);
    msg.hidden = false; msg.className = 'review-form-msg ok'; msg.textContent = '✓ Saved.';

    // Optimistic local update — replace or insert
    const existing = JERSEYS.findIndex(x => x.id === id);
    const next = [...JERSEYS];
    if (existing >= 0) next[existing] = { ...JERSEYS[existing], ...jersey };
    else next.push(jersey);
    setJerseys(next);

    setTimeout(closeJerseyEditor, 600);
  } catch (err) {
    console.warn(err);
    msg.hidden = false; msg.className = 'review-form-msg err'; msg.textContent = '✗ ' + (err.message || err);
  } finally {
    btn.disabled = false; btn.textContent = 'Save Jersey';
  }
}

/* ============================================================
   SITE SETTINGS ADMIN — payment numbers, delivery, promos, hero
   ============================================================ */
function initSettingsAdmin() {
  if (!document.getElementById('paymentSettingsForm')) return;

  fillSettingsForms();

  document.getElementById('paymentSettingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const value = {
      bkash:  { label: 'bKash Send Money number',  number: (fd.get('bkash')  || '').toString().trim() || PAY_NUMBERS.bkash.number },
      nagad:  { label: 'Nagad Send Money number',  number: (fd.get('nagad')  || '').toString().trim() || PAY_NUMBERS.nagad.number },
      rocket: { label: 'Rocket Send Money number', number: (fd.get('rocket') || '').toString().trim() || PAY_NUMBERS.rocket.number },
    };
    await saveSetting('payment_numbers', value, e.target);
  });

  document.getElementById('deliverySettingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const value = {
      dhaka:     parseInt(fd.get('dhaka'),     10) || 0,
      outside:   parseInt(fd.get('outside'),   10) || 0,
      freeAbove: parseInt(fd.get('freeAbove'), 10) || 0,
    };
    await saveSetting('delivery', value, e.target);
  });

  document.getElementById('brandSettingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const whatsapp = (fd.get('whatsapp') || '').toString().trim();
    const kickoff  = (fd.get('kickoff')  || '').toString().trim();
    const hero = {
      title:    (fd.get('title')    || '').toString().trim() || HERO.title,
      accent:   (fd.get('accent')   || '').toString().trim() || HERO.accent,
      subtitle: (fd.get('subtitle') || '').toString().trim() || HERO.subtitle,
    };
    try {
      if (whatsapp) await pushSetting('whatsapp', whatsapp);
      if (kickoff)  await pushSetting('kickoff', kickoff);
      await pushSetting('hero', hero);
      showSettingsMsg(e.target, 'ok', '✓ Saved');
    } catch (err) {
      showSettingsMsg(e.target, 'err', '✗ ' + (err.message || err));
    }
  });

  document.getElementById('promoAddForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const code = (fd.get('code') || '').toString().trim().toUpperCase();
    if (!code) return;
    const next = { ...PROMOS, [code]: {
      type:  fd.get('type'),
      value: parseInt(fd.get('value'), 10) || 0,
      label: (fd.get('label') || '').toString().trim(),
    }};
    try {
      await pushSetting('promos', next);
      PROMOS = next;
      writeSettings({ ...readSettings(), promos: next });
      e.target.reset();
      renderPromosList();
      document.getElementById('promoMsg').textContent = '✓ Added "' + code + '"';
      setTimeout(() => document.getElementById('promoMsg').textContent = '', 3000);
    } catch (err) {
      document.getElementById('promoMsg').textContent = '✗ ' + (err.message || err);
    }
  });

  renderPromosList();
  initOffersAdmin();
  initPlayersAdmin();
}

function initPlayersAdmin() {
  const form = document.getElementById('playerAddForm');
  if (!form) return;

  // Populate jersey dropdown
  const sel = document.getElementById('playerJerseySelect');
  const refreshOpts = () => {
    const current = sel.value;
    sel.innerHTML = '<option value="">— Pick jersey —</option>';
    JERSEYS.forEach(j => {
      const opt = document.createElement('option');
      opt.value = j.id; opt.textContent = `${j.country} — ${j.edition}`;
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  };
  refreshOpts();
  window.addEventListener('jerseys:change', refreshOpts);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    const player = {
      id:       (fd.get('name') || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) + '-' + Math.random().toString(36).slice(2, 5),
      name:     (fd.get('name') || '').toString().trim().toUpperCase(),
      number:   parseInt(fd.get('number'), 10) || 0,
      country:  (fd.get('country') || '').toString().trim().toUpperCase().slice(0, 3),
      jersey:   (fd.get('jersey') || '').toString().trim(),
      position: (fd.get('position') || '').toString().trim(),
      blurb:    (fd.get('blurb') || '').toString().trim(),
    };
    const next = [...PLAYERS, player];
    try {
      await pushSetting('players', next);
      PLAYERS = next;
      writeSettings({ ...readSettings(), players: next });
      form.reset();
      renderPlayersList();
      const msg = document.getElementById('playerMsg');
      msg.textContent = '✓ Added';
      msg.className = 'settings-msg ok';
      setTimeout(() => { msg.textContent = ''; msg.className = 'settings-msg'; }, 3000);
    } catch (err) {
      const msg = document.getElementById('playerMsg');
      msg.textContent = '✗ ' + (err.message || err);
      msg.className = 'settings-msg err';
    }
  });

  renderPlayersList();
}

function renderPlayersList() {
  const wrap = document.getElementById('playersAdminList');
  if (!wrap) return;
  if (PLAYERS.length === 0) {
    wrap.innerHTML = '<p style="color:var(--text-mute);font-size:13px">No players yet — add one below.</p>';
    return;
  }
  wrap.innerHTML = PLAYERS.map((p, i) => {
    const j = JERSEYS.find(x => x.id === p.jersey);
    const jerseyLabel = j ? `${j.country} ${j.edition}` : p.jersey;
    return `
      <div class="player-row" data-idx="${i}">
        <span class="player-row-number">${p.number}</span>
        <strong>${escapeAttr(p.name)}</strong>
        <span class="player-row-country">${escapeAttr(p.country)}</span>
        <span class="player-row-pos">${escapeAttr(p.position || '')}</span>
        <span class="player-row-jersey">↳ ${escapeAttr(jerseyLabel)}</span>
        <button type="button" class="qi-remove" data-del-player title="Remove">×</button>
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('[data-del-player]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.closest('.player-row').dataset.idx, 10);
      const p = PLAYERS[idx];
      if (!confirm(`Remove player "${p.name}"?`)) return;
      const next = PLAYERS.filter((_, i) => i !== idx);
      try {
        await pushSetting('players', next);
        PLAYERS = next;
        writeSettings({ ...readSettings(), players: next });
        renderPlayersList();
      } catch (err) {
        alert('Delete failed: ' + (err.message || err));
      }
    });
  });
}

function initOffersAdmin() {
  const form = document.getElementById('offerAddForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    const offer = {
      tag:         (fd.get('tag') || '').toString().trim(),
      title:       (fd.get('title') || '').toString().trim(),
      accent:      (fd.get('accent') || '').toString().trim(),
      description: (fd.get('description') || '').toString().trim(),
      priceLine:   (fd.get('priceLine') || '').toString().trim(),
      ctaText:     (fd.get('ctaText') || 'Claim').toString().trim(),
      ctaUrl:      (fd.get('ctaUrl') || '#').toString().trim(),
      featured:    form.featured.checked,
    };
    const next = [...OFFERS, offer];
    try {
      await pushSetting('offers', next);
      OFFERS = next;
      writeSettings({ ...readSettings(), offers: next });
      form.reset();
      renderOffersList();
      const msg = document.getElementById('offerMsg');
      msg.textContent = '✓ Added';
      msg.className = 'settings-msg ok';
      setTimeout(() => { msg.textContent = ''; msg.className = 'settings-msg'; }, 3000);
    } catch (err) {
      const msg = document.getElementById('offerMsg');
      msg.textContent = '✗ ' + (err.message || err);
      msg.className = 'settings-msg err';
    }
  });

  renderOffersList();
}

function renderOffersList() {
  const wrap = document.getElementById('offersAdminList');
  if (!wrap) return;
  if (OFFERS.length === 0) {
    wrap.innerHTML = '<p style="color:var(--text-mute);font-size:13px">No offers yet — add one below.</p>';
    return;
  }
  wrap.innerHTML = OFFERS.map((o, i) => `
    <div class="offer-row" data-idx="${i}">
      <span class="offer-row-tag">${escapeAttr(o.tag)}</span>
      <strong>${escapeAttr(o.title)} ${o.accent ? `<span style="color:var(--neon)">${escapeAttr(o.accent)}</span>` : ''}</strong>
      <span class="offer-row-desc">${escapeAttr(o.description)}</span>
      ${o.featured ? '<span class="offer-row-star">★</span>' : ''}
      <button type="button" class="qi-remove" data-del-offer title="Remove">×</button>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-del-offer]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.closest('.offer-row').dataset.idx, 10);
      const o = OFFERS[idx];
      if (!confirm(`Remove offer "${o.title}"?`)) return;
      const next = OFFERS.filter((_, i) => i !== idx);
      try {
        await pushSetting('offers', next);
        OFFERS = next;
        writeSettings({ ...readSettings(), offers: next });
        renderOffersList();
      } catch (err) {
        alert('Delete failed: ' + (err.message || err));
      }
    });
  });
}

async function saveSetting(key, value, formEl) {
  try {
    await pushSetting(key, value);
    // Apply locally too so the form reflects the saved state
    applySettings({ [key]: value });
    writeSettings({ ...readSettings(), [key]: value });
    showSettingsMsg(formEl, 'ok', '✓ Saved');
  } catch (err) {
    showSettingsMsg(formEl, 'err', '✗ ' + (err.message || err));
  }
}

function showSettingsMsg(formEl, kind, text) {
  const msg = formEl.querySelector('[data-msg]');
  if (!msg) return;
  msg.textContent = text;
  msg.className = 'settings-msg ' + kind;
  setTimeout(() => { msg.textContent = ''; msg.className = 'settings-msg'; }, 4000);
}

function fillSettingsForms() {
  const pay = document.getElementById('paymentSettingsForm');
  if (pay) {
    pay.bkash.value  = PAY_NUMBERS.bkash.number;
    pay.nagad.value  = PAY_NUMBERS.nagad.number;
    pay.rocket.value = PAY_NUMBERS.rocket.number;
  }
  const del = document.getElementById('deliverySettingsForm');
  if (del) {
    del.dhaka.value     = DELIVERY.dhaka;
    del.outside.value   = DELIVERY.outside;
    del.freeAbove.value = DELIVERY.freeAbove;
  }
  const brand = document.getElementById('brandSettingsForm');
  if (brand) {
    brand.whatsapp.value = WHATSAPP;
    brand.kickoff.value  = KICKOFF.toISOString();
    brand.title.value    = HERO.title;
    brand.accent.value   = HERO.accent;
    brand.subtitle.value = HERO.subtitle;
  }
  renderPromosList();
}

function renderPromosList() {
  const wrap = document.getElementById('promosList');
  if (!wrap) return;
  const codes = Object.keys(PROMOS);
  if (codes.length === 0) {
    wrap.innerHTML = '<p style="color:var(--text-mute);font-size:13px">No promo codes yet — add one below.</p>';
    return;
  }
  wrap.innerHTML = codes.map(code => {
    const p = PROMOS[code];
    const valueDisplay = p.type === 'pct' ? `${p.value}%` : `৳${p.value}`;
    return `
      <div class="promo-row" data-code="${code}">
        <code class="promo-code-tag">${code}</code>
        <span class="promo-value">${valueDisplay} off</span>
        <span class="promo-label">${escapeAttr(p.label)}</span>
        <button type="button" class="qi-remove" data-del-promo title="Remove promo">×</button>
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('[data-del-promo]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.closest('.promo-row').dataset.code;
      if (!confirm(`Remove promo code "${code}"?`)) return;
      const next = { ...PROMOS };
      delete next[code];
      try {
        await pushSetting('promos', next);
        PROMOS = next;
        writeSettings({ ...readSettings(), promos: next });
        renderPromosList();
      } catch (err) {
        alert('Delete failed: ' + (err.message || err));
      }
    });
  });
}

/* Refresh any dropdown that lists jerseys (Media Library, Showcase form, etc.) */
function refreshJerseyDropdowns() {
  ['mediaJerseySelect', 'showcaseForm'].forEach(sel => {
    if (sel === 'showcaseForm') {
      const select = document.querySelector('#showcaseForm select[name=jerseyId]');
      if (!select) return;
      const current = select.value;
      select.innerHTML = '<option value="">— None —</option>';
      JERSEYS.forEach(j => {
        const opt = document.createElement('option');
        opt.value = j.id; opt.textContent = `${j.country} — ${j.edition}`;
        select.appendChild(opt);
      });
      if (current) select.value = current;
    } else {
      const select = document.getElementById(sel);
      if (!select) return;
      const current = select.value;
      select.innerHTML = '';
      JERSEYS.forEach(j => {
        const opt = document.createElement('option');
        opt.value = j.id; opt.textContent = `${j.country} — ${j.edition}`;
        select.appendChild(opt);
      });
      if (current && JERSEYS.find(j => j.id === current)) select.value = current;
    }
  });
}
