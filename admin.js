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
  const clearBtn = document.getElementById('clearAll');
  clearBtn.addEventListener('click', confirmTwoClicks(clearBtn, () => {
    localStorage.removeItem(ORDERS_KEY);
    render();
  }, { confirmText: 'Click again to delete ALL' }));

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
  initHeroVideosAdmin();
  initJerseysAdmin();
  initSettingsAdmin();
  window.addEventListener('storage', () => { render(); renderResults(); renderMediaGallery(); renderAdminReviewsList(); renderAdminShowcaseList(); renderAdminHeroVideoList(); renderAdminJerseysList(); });
  window.addEventListener('predictions:change', renderResults);
  window.addEventListener('results:change',     renderResults);
  window.addEventListener('media:change',       renderMediaGallery);
  window.addEventListener('reviews:change',     renderAdminReviewsList);
  window.addEventListener('showcase:change',    renderAdminShowcaseList);
  window.addEventListener('herovideos:change',  renderAdminHeroVideoList);
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

/* Media Library — same UX as Customer Reviews form: pick jersey, attach
   photo(s) + video(s) via two separate file inputs, click Upload. Per-file
   progress shows in the list below. */
function initMediaLibrary() {
  const form = document.getElementById('mediaForm');
  if (!form) return;

  const banner = document.getElementById('mediaModeBanner');
  if (banner) {
    banner.innerHTML = `☁️ <strong style="color:var(--neon)">Cloud mode (Supabase)</strong> · Uploads visible to every customer worldwide via CDN`;
  }

  // Populate jersey dropdown (and re-populate on jerseys:change handled in boot)
  refreshMediaJerseyDropdown();

  form.addEventListener('submit', handleMediaSubmit);

  const optBtn = document.getElementById('optimizeMediaBtn');
  if (optBtn) optBtn.addEventListener('click', handleOptimizeMedia);

  renderMediaGallery();
}

async function handleOptimizeMedia() {
  const btn  = document.getElementById('optimizeMediaBtn');
  const box  = document.getElementById('optimizeProgress');
  const fill = document.getElementById('opBarFill');
  const stat = document.getElementById('opStatus');
  if (!confirm('পুরনো সব jersey ছবি compress করা হবে (quality ঠিক থাকবে)। চালিয়ে যাবেন?')) return;

  btn.disabled = true; btn.textContent = 'Optimizing…';
  box.hidden = false;
  const mb = b => (b / (1024 * 1024)).toFixed(1) + ' MB';
  try {
    const res = await recompressExistingMedia(({ done, total, optimized, saved }) => {
      const pct = total ? Math.round((done / total) * 100) : 100;
      fill.style.width = pct + '%';
      stat.textContent = `${done}/${total} checked · ${optimized} optimized · ${mb(saved)} saved`;
    });
    stat.textContent = `✓ Done — ${res.optimized}/${res.total} optimized · ${mb(res.saved)} saved. Refreshing…`;
    if (typeof syncFromSupabase === 'function') await syncFromSupabase();
    renderMediaGallery();
    if (typeof render === 'function') render();
  } catch (err) {
    stat.textContent = '✗ ' + (err.message || err);
  } finally {
    btn.disabled = false; btn.textContent = 'Optimize Now';
  }
}

function refreshMediaJerseyDropdown() {
  const sel = document.getElementById('mediaJerseySelect');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">— Pick jersey —</option>' + JERSEYS.map(j =>
    `<option value="${j.id}">${escapeAttr(j.country)} — ${escapeAttr(j.edition)}</option>`
  ).join('');
  if (current) sel.value = current;
}

let mediaUploading = false;

async function handleMediaSubmit(e) {
  e.preventDefault();
  if (mediaUploading) return;

  const form = e.target;
  const fd = new FormData(form);
  const jerseyId = (fd.get('jersey') || '').toString();

  const photos = $field(form, 'photos');
  const videos = $field(form, 'videos');
  const photoFiles = photos && photos.files ? Array.from(photos.files) : [];
  const videoFiles = videos && videos.files ? Array.from(videos.files) : [];
  const allFiles   = [...photoFiles, ...videoFiles];

  const msg  = document.getElementById('mediaUploadMsg');
  const warn = document.getElementById('mediaSizeWarn');
  warn.hidden = true;
  msg.textContent = '';
  msg.className = 'settings-msg';

  if (!jerseyId) {
    msg.textContent = '✗ Pick a jersey first.';
    msg.className = 'settings-msg err';
    return;
  }
  if (allFiles.length === 0) {
    msg.textContent = '✗ Choose at least one photo or video.';
    msg.className = 'settings-msg err';
    return;
  }

  mediaUploading = true;
  const btn = document.getElementById('mediaUploadBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading…';

  // Build the per-file progress queue
  const queue = allFiles.map(file => ({ file, status: 'queued', error: '' }));
  renderMediaQueueList(queue);

  let okCount = 0, failCount = 0;
  for (const q of queue) {
    q.status = 'uploading';
    renderMediaQueueList(queue);
    try {
      await uploadOne(jerseyId, q.file, warn);
      q.status = 'done'; okCount++;
    } catch (err) {
      q.status = 'failed';
      q.error  = err.message || String(err);
      failCount++;
      console.warn('Upload failed:', err);
    }
    renderMediaQueueList(queue);
  }

  mediaUploading = false;
  btn.disabled = false;
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg> Upload';

  msg.textContent = failCount === 0
    ? `✓ ${okCount} file${okCount === 1 ? '' : 's'} uploaded.`
    : `✓ ${okCount} uploaded · ✗ ${failCount} failed (see list below)`;
  msg.className = 'settings-msg ' + (failCount === 0 ? 'ok' : 'err');

  // Reset file inputs so re-selecting the same files works
  if (photos) photos.value = '';
  if (videos) videos.value = '';
  renderMediaGallery();
}

function renderMediaQueueList(queue) {
  const list = document.getElementById('mediaQueueList');
  if (!list) return;
  if (queue.length === 0) { list.innerHTML = ''; return; }
  list.innerHTML = queue.map(q => {
    const ico = q.status === 'done'      ? '✓'
              : q.status === 'failed'    ? '✗'
              : q.status === 'uploading' ? '⏳'
              : '•';
    return `
      <li class="media-queue-item q-${q.status}">
        <span class="qi-ico">${ico}</span>
        <span class="qi-name">${escapeAttr(q.file.name)}</span>
        <span class="qi-size">${formatBytes(q.file.size)}</span>
        <span class="qi-status">${q.status}${q.error ? ` — ${escapeAttr(q.error)}` : ''}</span>
      </li>
    `;
  }).join('');
}

async function uploadOne(jerseyId, file, warnEl) {
  if (!isCloudConfigured()) {
    throw new Error('Supabase client not ready. Refresh and try again.');
  }
  // Generous input cap — images + videos are compressed in the browser before
  // upload, so the file that actually reaches Supabase is far smaller.
  if (file.size > 300 * 1024 * 1024) {
    throw new Error(`File too large (${formatBytes(file.size)}). Max 300 MB per file.`);
  }
  if (file.size > 5 * 1024 * 1024 && file.type.startsWith('image/')) {
    warnEl.hidden = false;
    warnEl.textContent = `ℹ️ ${formatBytes(file.size)} image — will be auto-compressed (WebP, ~1400px) before upload.`;
  } else if (file.size > 5 * 1024 * 1024) {
    warnEl.hidden = false;
    warnEl.textContent = `⚠️ Large video (${formatBytes(file.size)}) — compress for faster customer loading.`;
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
    const imgAssets = assets.filter(a => a.type === 'image');
    return `
      <div class="media-group">
        <h4>${j ? `${j.country} · ${j.edition}` : jid} <span>${assets.length} file${assets.length === 1 ? '' : 's'} · ◀▶ reorder, 1st = main photo</span></h4>
        <div class="media-tiles">
          ${assets.map(a => {
            const isImg = a.type === 'image';
            const ii = isImg ? imgAssets.indexOf(a) : -1;
            const showOrder = isImg && imgAssets.length > 1;
            return `
            <div class="media-tile${ii === 0 ? ' is-primary' : ''}" data-jid="${jid}" data-aid="${a.id}">
              ${isImg
                ? `<img src="${a.url}" alt="${a.name}" />`
                : `<video src="${a.url}" muted preload="metadata"></video><span class="media-tile-play">▶</span>`}
              ${ii === 0 ? `<span class="media-tile-badge">MAIN</span>` : ''}
              ${showOrder ? `
                <div class="media-tile-order">
                  <button type="button" class="mt-move" data-mv="up" title="Move left"${ii === 0 ? ' disabled' : ''}>◀</button>
                  <button type="button" class="mt-move" data-mv="down" title="Move right"${ii === imgAssets.length - 1 ? ' disabled' : ''}>▶</button>
                </div>` : ''}
              <button type="button" class="media-tile-del" title="Delete">×</button>
              <span class="media-tile-name">${a.name}</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('.mt-move').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const tile = btn.closest('.media-tile');
      moveMedia(tile.dataset.jid, tile.dataset.aid, btn.dataset.mv === 'up' ? -1 : 1);
    });
  });

  wrap.querySelectorAll('.media-tile-del').forEach(btn => {
    btn.addEventListener('click', confirmTwoClicks(btn, async () => {
      const tile = btn.closest('.media-tile');
      const assetId = tile.dataset.aid;
      const jerseyId = tile.dataset.jid;
      const bucket = getJerseyMedia(jerseyId);
      const asset = [...bucket.images, ...bucket.videos].find(a => a.id === assetId);
      if (asset) {
        await cloudDelete(asset);             // removes from Storage + DB
      }
      removeAsset(jerseyId, assetId);          // removes from local cache
      renderMediaGallery();
    }));
  });

  // Click image/video to open in new tab
  wrap.querySelectorAll('.media-tile').forEach(tile => {
    const media = tile.querySelector('img, video');
    if (media) tile.addEventListener('click', () => window.open(media.src, '_blank'));
  });
}

/* Reorder a jersey's photos — first photo becomes the card's main image.
   Updates the local cache (instant) + persists sort_order to Supabase. */
let _mediaMoveBusy = false;
async function moveMedia(jerseyId, assetId, dir) {
  if (_mediaMoveBusy) return;
  const m = readMedia();
  const bucket = m[jerseyId];
  if (!bucket || !Array.isArray(bucket.images)) return;
  const imgs = bucket.images;
  const i = imgs.findIndex(a => a.id === assetId);
  const k = i + dir;
  if (i < 0 || k < 0 || k >= imgs.length) return;
  [imgs[i], imgs[k]] = [imgs[k], imgs[i]];
  m[jerseyId].images = imgs;

  _mediaMoveBusy = true;
  writeMedia(m);                       // instant: re-renders gallery + homepage cards
  try { await pushMediaSortOrder(imgs); } // persist order to Supabase
  catch (err) { console.warn('Reorder save failed (kept locally):', err.message || err); }
  finally { _mediaMoveBusy = false; }
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

    if (photoFile && photoFile.size > 15 * 1024 * 1024) {
      showReviewMsg('err', `Photo too large (${formatBytes(photoFile.size)}). Max 15 MB.`);
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
    btn.addEventListener('click', confirmTwoClicks(btn, async () => {
      const tile = btn.closest('.admin-review-tile');
      const id = tile.dataset.id;
      const photoPath = tile.dataset.photoPath || null;
      const videoPath = tile.dataset.videoPath || null;
      await deleteReviewRemote(id, photoPath, videoPath);
      writeReviews(readReviews().filter(r => r.id !== id));
    }));
  });
}

/* Two-click delete helper. Native confirm() is silently dismissed in
   some browsers / Safari configs, which made every delete button look
   broken. This wraps a click handler so the first click flags the button
   (red glow + label/title swap) and the second click within `timeout`ms
   actually runs the destructive op. Auto-reverts after the timeout. */
function confirmTwoClicks(btn, onConfirm, opts) {
  opts = opts || {};
  const timeout = opts.timeout || 3500;
  const confirmText = opts.confirmText || 'Click again';
  return async (ev) => {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    if (btn.dataset.confirming === '1') {
      btn.disabled = true;
      btn.classList.add('is-confirming-running');
      try { await onConfirm(ev); }
      catch (e) { console.warn('Delete action failed:', e); }
      btn.disabled = false;
      delete btn.dataset.confirming;
      btn.classList.remove('is-confirming', 'is-confirming-running');
      if (btn._prevText != null) { btn.textContent = btn._prevText; delete btn._prevText; }
      if (btn._prevTitle != null) { btn.title = btn._prevTitle; delete btn._prevTitle; }
      return;
    }
    btn.dataset.confirming = '1';
    btn.classList.add('is-confirming');
    // Visual + a11y hint — preserve original label so we can restore it
    btn._prevTitle = btn.title;
    btn.title = 'Click again to confirm — auto-cancels in 3s';
    if (btn.textContent.trim().length > 1 && btn.textContent.trim() !== '×') {
      btn._prevText = btn.textContent;
      btn.textContent = confirmText;
    }
    setTimeout(() => {
      if (btn.dataset.confirming === '1') {
        delete btn.dataset.confirming;
        btn.classList.remove('is-confirming');
        if (btn._prevText != null) { btn.textContent = btn._prevText; delete btn._prevText; }
        if (btn._prevTitle != null) { btn.title = btn._prevTitle; delete btn._prevTitle; }
      }
    }, timeout);
  };
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
    if (videoFile.size > 300 * 1024 * 1024) {
      showShowcaseMsg('err', `Video too large (${formatBytes(videoFile.size)}). Max 300 MB.`); return;
    }
    if (posterFile && posterFile.size > 15 * 1024 * 1024) {
      showShowcaseMsg('err', `Poster too large (${formatBytes(posterFile.size)}). Max 15 MB.`); return;
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

    try {
      btn.textContent = 'Compressing…';
      const compact = await compressVideo(videoFile, {}, pct =>
        showShowcaseMsg('ok', `Compressing video… ${Math.round(pct * 100)}%`));
      btn.textContent = 'Uploading video…';
      showShowcaseMsg('ok', `Uploading (${formatBytes(compact.size)})…`);
      await pushShowcaseVideo(meta, compact, posterFile && posterFile.size > 0 ? posterFile : null);
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
    btn.addEventListener('click', confirmTwoClicks(btn, async () => {
      const tile = btn.closest('.admin-review-tile');
      const id = tile.dataset.id;
      const videoPath = tile.dataset.videoPath || null;
      const posterPath = tile.dataset.posterPath || null;
      await deleteShowcaseRemote(id, videoPath, posterPath);
      writeShowcase(readShowcase().filter(v => v.id !== id));
    }));
  });
}

/* ---------- Hero Videos (caption-free band) ---------- */
function initHeroVideosAdmin() {
  const form = document.getElementById('heroVideoForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    const videoFile  = fd.get('video');
    const posterFile = fd.get('poster');
    const sortOrder  = parseInt(fd.get('sortOrder'), 10) || 0;

    if (!videoFile || videoFile.size === 0) {
      showHeroVideoMsg('err', 'Video file required.'); return;
    }
    if (videoFile.size > 300 * 1024 * 1024) {
      showHeroVideoMsg('err', `Video too large (${formatBytes(videoFile.size)}). Max 300 MB.`); return;
    }
    if (posterFile && posterFile.size > 15 * 1024 * 1024) {
      showHeroVideoMsg('err', `Poster too large (${formatBytes(posterFile.size)}). Max 15 MB.`); return;
    }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;

    try {
      btn.textContent = 'Compressing…';
      const compact = await compressVideo(videoFile, {}, pct =>
        showHeroVideoMsg('ok', `Compressing video… ${Math.round(pct * 100)}%`));
      btn.textContent = 'Uploading video…';
      showHeroVideoMsg('ok', `Uploading (${formatBytes(compact.size)})…`);
      await pushHeroVideo(compact, posterFile && posterFile.size > 0 ? posterFile : null, sortOrder);
      showHeroVideoMsg('ok', '✓ Hero video added — live on homepage now.');
      form.reset();
    } catch (err) {
      console.warn(err);
      showHeroVideoMsg('err', '✗ Failed: ' + (err.message || err));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add Hero Video';
    }
  });

  renderAdminHeroVideoList();
  window.addEventListener('herovideos:change', renderAdminHeroVideoList);
}

function showHeroVideoMsg(kind, text) {
  const msg = document.getElementById('heroVideoFormMsg');
  if (!msg) return;
  msg.hidden = false;
  msg.className = 'review-form-msg ' + kind;
  msg.textContent = text;
  setTimeout(() => { msg.hidden = true; }, 6000);
}

function renderAdminHeroVideoList() {
  const wrap = document.getElementById('adminHeroVideoList');
  if (!wrap) return;
  const videos = readHeroVideos();
  if (videos.length === 0) {
    wrap.innerHTML = `
      <div class="admin-review-empty">
        <span class="icon">🎞</span>
        <p>No hero videos yet. Add one above — it'll appear in the autoplay strip under the homepage hero.</p>
      </div>`;
    return;
  }
  wrap.innerHTML = videos.map(v => `
    <div class="admin-review-tile" data-id="${v.id}" data-video-path="${v.videoPath || ''}" data-poster-path="${v.posterPath || ''}">
      <video class="admin-review-tile-img" src="${v.videoUrl}" muted playsinline preload="metadata" ${v.posterUrl ? `poster="${v.posterUrl}"` : ''}></video>
      <div class="admin-review-tile-head">
        <strong>Hero video</strong>
        <span class="art-stars">#${v.sortOrder || 0}</span>
      </div>
      <button type="button" class="admin-review-tile-del" data-del title="Delete video">×</button>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', confirmTwoClicks(btn, async () => {
      const tile = btn.closest('.admin-review-tile');
      const id = tile.dataset.id;
      const videoPath = tile.dataset.videoPath || null;
      const posterPath = tile.dataset.posterPath || null;
      await deleteHeroVideoRemote(id, videoPath, posterPath);
      writeHeroVideos(readHeroVideos().filter(v => v.id !== id));
    }));
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
    btn.addEventListener('click', confirmTwoClicks(btn, () => {
      const card = btn.closest('.result-card');
      clearResult(card.dataset.mid);
      renderResults();
    }));
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
    btn.addEventListener('click', confirmTwoClicks(btn, () => {
      deleteOrder(btn.dataset.deleteRef);
      render();
    }));
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

/* clearAllOrders is now bound via confirmTwoClicks in bootDashboard */

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
  const seedBtn = document.getElementById('seedJerseysBtn');
  seedBtn.addEventListener('click', confirmTwoClicks(seedBtn, handleSeedJerseys, { confirmText: 'Click again to seed' }));
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

  wrap.innerHTML = JERSEYS.map((j, idx) => {
    const stock  = j.inStock ? `${j.stockLeft} in stock` : (j.comingSoon ? 'Coming Soon' : 'Out of stock');
    const stockCls = j.inStock ? 'ok' : (j.comingSoon ? 'warn' : 'bad');
    const isFirst = idx === 0;
    const isLast  = idx === JERSEYS.length - 1;
    return `
      <div class="admin-jersey-row" data-id="${j.id}">
        <div class="ajr-order">
          <button type="button" class="ajr-move" data-up title="Move up" ${isFirst ? 'disabled' : ''}>▲</button>
          <button type="button" class="ajr-move" data-down title="Move down" ${isLast ? 'disabled' : ''}>▼</button>
        </div>
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

  wrap.querySelectorAll('[data-up]').forEach(btn =>
    btn.addEventListener('click', () => moveJersey(btn.closest('.admin-jersey-row').dataset.id, -1)));
  wrap.querySelectorAll('[data-down]').forEach(btn =>
    btn.addEventListener('click', () => moveJersey(btn.closest('.admin-jersey-row').dataset.id, +1)));

  wrap.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.admin-jersey-row');
      const j = JERSEYS.find(x => x.id === row.dataset.id);
      if (j) openJerseyEditor(j);
    });
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', confirmTwoClicks(btn, async () => {
      const row = btn.closest('.admin-jersey-row');
      const id  = row.dataset.id;
      try {
        await ensureJerseysSeeded();   // make Supabase the source of truth first
        await deleteJerseyRemote(id);
        setJerseys(JERSEYS.filter(x => x.id !== id));
      } catch (err) {
        alert('Delete failed: ' + (err.message || err));
      }
    }));
  });
}

/* Reorder a jersey one slot up (-1) or down (+1). Reassigns sort_order for the
   whole list and persists to Supabase so the new order sticks everywhere. */
let _jerseyMoveBusy = false;
async function moveJersey(id, dir) {
  if (_jerseyMoveBusy) return;
  const arr = [...JERSEYS];
  const i = arr.findIndex(x => x.id === id);
  const k = i + dir;
  if (i < 0 || k < 0 || k >= arr.length) return;
  [arr[i], arr[k]] = [arr[k], arr[i]];
  // Higher sort_order shows first (matches data.js sync ordering)
  arr.forEach((j, idx) => { j.sortOrder = arr.length - idx; });

  _jerseyMoveBusy = true;
  setJerseys(arr);                 // optimistic: updates UI + cache immediately
  try {
    await seedJerseysFromStatic(); // full upsert with new sort_order (also seeds if empty)
  } catch (err) {
    console.warn('Reorder save failed (kept locally):', err.message || err);
  } finally {
    _jerseyMoveBusy = false;
  }
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
    setFieldValue(form, 'id',          jersey.id);
    setFieldValue(form, 'country',     jersey.country);
    setFieldValue(form, 'edition',     jersey.edition);
    setFieldValue(form, 'tag',         jersey.tag || 'home');
    setFieldValue(form, 'price',       jersey.price);
    setFieldValue(form, 'stockLeft',   jersey.stockLeft || 0);
    setFieldValue(form, 'primary',     (jersey.palette || {}).primary   || '#cccccc');
    setFieldValue(form, 'secondary',   (jersey.palette || {}).secondary || '#ffffff');
    setFieldValue(form, 'accent',      (jersey.palette || {}).accent    || '#000000');
    setFieldValue(form, 'crest',       jersey.crest || '');
    setFieldValue(form, 'shirtNumber', jersey.number || '');
    setFieldValue(form, 'sortOrder',   jersey.sortOrder || 0);
    const inStockEl = $field(form, 'inStock');
    const stripesEl = $field(form, 'stripes');
    const hiddenEl  = $field(form, 'hidden');
    if (inStockEl) inStockEl.checked = !!jersey.inStock;
    if (stripesEl) stripesEl.checked = !!(jersey.palette || {}).stripes;
    if (hiddenEl)  hiddenEl.checked  = !!jersey.hidden;
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
    inStock:    !!($field(form, 'inStock') && $field(form, 'inStock').checked),
    stockLeft:  parseInt(fd.get('stockLeft'), 10) || 0,
    comingSoon: (fd.get('tag') === 'coming'),
    palette: {
      primary:   fd.get('primary'),
      secondary: fd.get('secondary'),
      accent:    fd.get('accent'),
      stripes:   !!($field(form, 'stripes') && $field(form, 'stripes').checked),
    },
    crest:     (fd.get('crest') || '').toString().trim(),
    number:    (fd.get('shirtNumber') || '10').toString().trim(),
    sortOrder: parseInt(fd.get('sortOrder'), 10) || 0,
    hidden:    !!($field(form, 'hidden') && $field(form, 'hidden').checked),
  };

  const msg = document.getElementById('jerseyFormMsg');
  const btn = document.getElementById('jerseyFormSave');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    await ensureJerseysSeeded();   // seed full catalog first so we never collapse to one row
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

  const bankForm = document.getElementById('bankSettingsForm');
  if (bankForm) bankForm.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const value = {
      bankName:      (fd.get('bankName') || '').toString().trim(),
      branch:        (fd.get('branch') || '').toString().trim(),
      accountName:   (fd.get('accountName') || '').toString().trim(),
      accountNumber: (fd.get('accountNumber') || '').toString().trim(),
      routingNumber: (fd.get('routingNumber') || '').toString().trim(),
    };
    await saveSetting('bank_transfer', value, e.target);
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

  const saleForm = document.getElementById('saleSettingsForm');
  if (saleForm) saleForm.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const endsRaw = (fd.get('endsAt') || '').toString().trim();
    const value = {
      active:    fd.get('active') === 'on',
      label:     (fd.get('label') || '').toString().trim() || 'Sale',
      amountOff: parseInt(fd.get('amountOff'), 10) || 0,
      pctOff:    parseInt(fd.get('pctOff'), 10) || 0,
      endsAt:    endsRaw ? new Date(endsRaw).toISOString() : '',
      popup: {
        enabled: fd.get('popupEnabled') === 'on',
        badge:   (fd.get('popupBadge')   || '').toString().trim(),
        title:   (fd.get('popupTitle')   || '').toString().trim(),
        sub:     (fd.get('popupSub')     || '').toString().trim(),
        cta:     (fd.get('popupCta')     || '').toString().trim() || 'Shop Now',
        ctaUrl:  (fd.get('popupCtaUrl')  || '').toString().trim() || '#jerseys',
      },
    };
    await saveSetting('sale', value, e.target);
  });

  const contactForm = document.getElementById('contactSettingsForm');
  if (contactForm) contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const value = {
      address:      (fd.get('address') || '').toString().trim(),
      phone:        (fd.get('phone') || '').toString().trim(),
      phoneDisplay: (fd.get('phoneDisplay') || '').toString().trim(),
      email:        (fd.get('email') || '').toString().trim(),
      hours:        (fd.get('hours') || '').toString().trim(),
      brandDesc:    (fd.get('brandDesc') || '').toString().trim(),
    };
    await saveSetting('contact', value, e.target);
  });

  const socialForm = document.getElementById('socialSettingsForm');
  if (socialForm) socialForm.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const value = {
      facebook:  (fd.get('facebook') || '').toString().trim(),
      instagram: (fd.get('instagram') || '').toString().trim(),
      messenger: (fd.get('messenger') || '').toString().trim(),
      tiktok:    (fd.get('tiktok') || '').toString().trim(),
      youtube:   (fd.get('youtube') || '').toString().trim(),
    };
    await saveSetting('social', value, e.target);
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
    btn.addEventListener('click', confirmTwoClicks(btn, async () => {
      const idx = parseInt(btn.closest('.player-row').dataset.idx, 10);
      const next = PLAYERS.filter((_, i) => i !== idx);
      try {
        await pushSetting('players', next);
        PLAYERS = next;
        writeSettings({ ...readSettings(), players: next });
        renderPlayersList();
      } catch (err) {
        alert('Delete failed: ' + (err.message || err));
      }
    }));
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
      featured:    !!($field(form, 'featured') && $field(form, 'featured').checked),
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
    btn.addEventListener('click', confirmTwoClicks(btn, async () => {
      const idx = parseInt(btn.closest('.offer-row').dataset.idx, 10);
      const next = OFFERS.filter((_, i) => i !== idx);
      try {
        await pushSetting('offers', next);
        OFFERS = next;
        writeSettings({ ...readSettings(), offers: next });
        renderOffersList();
      } catch (err) {
        alert('Delete failed: ' + (err.message || err));
      }
    }));
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

/* Safe form field accessor — uses form.elements.namedItem(name) which works
   in all browsers + jsdom (form[name] direct access is a legacy quirk that
   fails for built-in attribute names like 'title', 'hidden', 'id', and
   isn't supported uniformly across all environments). */
function $field(form, name) {
  if (!form || !form.elements) return null;
  return form.elements.namedItem ? form.elements.namedItem(name) : form.elements[name];
}
function setFieldValue(form, name, val) {
  const el = $field(form, name);
  if (el && 'value' in el) el.value = val == null ? '' : val;
}
function setFieldChecked(form, name, on) {
  const el = $field(form, name);
  if (el && 'checked' in el) el.checked = !!on;
}
/* ISO timestamp → value for a <input type="datetime-local"> (local wall clock) */
function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fillSettingsForms() {
  const pay = document.getElementById('paymentSettingsForm');
  if (pay) {
    setFieldValue(pay, 'bkash',  PAY_NUMBERS.bkash.number);
    setFieldValue(pay, 'nagad',  PAY_NUMBERS.nagad.number);
    setFieldValue(pay, 'rocket', PAY_NUMBERS.rocket.number);
  }
  const bank = document.getElementById('bankSettingsForm');
  if (bank && typeof BANK_TRANSFER !== 'undefined') {
    setFieldValue(bank, 'bankName',      BANK_TRANSFER.bankName);
    setFieldValue(bank, 'branch',        BANK_TRANSFER.branch);
    setFieldValue(bank, 'accountName',   BANK_TRANSFER.accountName);
    setFieldValue(bank, 'accountNumber', BANK_TRANSFER.accountNumber);
    setFieldValue(bank, 'routingNumber', BANK_TRANSFER.routingNumber);
  }
  const contact = document.getElementById('contactSettingsForm');
  if (contact) {
    setFieldValue(contact, 'address',      CONTACT.address);
    setFieldValue(contact, 'phone',        CONTACT.phone);
    setFieldValue(contact, 'phoneDisplay', CONTACT.phoneDisplay);
    setFieldValue(contact, 'email',        CONTACT.email);
    setFieldValue(contact, 'hours',        CONTACT.hours);
    setFieldValue(contact, 'brandDesc',    CONTACT.brandDesc);
  }
  const social = document.getElementById('socialSettingsForm');
  if (social) {
    setFieldValue(social, 'facebook',  SOCIAL.facebook);
    setFieldValue(social, 'instagram', SOCIAL.instagram);
    setFieldValue(social, 'messenger', SOCIAL.messenger);
    setFieldValue(social, 'tiktok',    SOCIAL.tiktok || '');
    setFieldValue(social, 'youtube',   SOCIAL.youtube || '');
  }
  const del = document.getElementById('deliverySettingsForm');
  if (del) {
    setFieldValue(del, 'dhaka',     DELIVERY.dhaka);
    setFieldValue(del, 'outside',   DELIVERY.outside);
    setFieldValue(del, 'freeAbove', DELIVERY.freeAbove);
  }
  const sale = document.getElementById('saleSettingsForm');
  if (sale && typeof SALE !== 'undefined') {
    const pp = SALE.popup || {};
    setFieldChecked(sale, 'active',    SALE.active);
    setFieldValue(sale, 'label',       SALE.label);
    setFieldValue(sale, 'amountOff',   SALE.amountOff);
    setFieldValue(sale, 'pctOff',      SALE.pctOff);
    setFieldValue(sale, 'endsAt',      isoToLocalInput(SALE.endsAt));
    setFieldChecked(sale, 'popupEnabled', pp.enabled);
    setFieldValue(sale, 'popupBadge',  pp.badge);
    setFieldValue(sale, 'popupTitle',  pp.title);
    setFieldValue(sale, 'popupSub',    pp.sub);
    setFieldValue(sale, 'popupCta',    pp.cta);
    setFieldValue(sale, 'popupCtaUrl', pp.ctaUrl);
  }
  const brand = document.getElementById('brandSettingsForm');
  if (brand) {
    let kickoffIso = '';
    try { kickoffIso = KICKOFF instanceof Date && !isNaN(KICKOFF) ? KICKOFF.toISOString() : ''; } catch (_) {}
    setFieldValue(brand, 'whatsapp', WHATSAPP);
    setFieldValue(brand, 'kickoff',  kickoffIso);
    setFieldValue(brand, 'title',    HERO.title);
    setFieldValue(brand, 'accent',   HERO.accent);
    setFieldValue(brand, 'subtitle', HERO.subtitle);
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
    btn.addEventListener('click', confirmTwoClicks(btn, async () => {
      const code = btn.closest('.promo-row').dataset.code;
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
    }));
  });
}

/* Refresh any dropdown that lists jerseys (Media Library, Showcase form, etc.) */
function refreshJerseyDropdowns() {
  refreshMediaJerseyDropdown();
  const showSel = document.querySelector('#showcaseForm select[name=jerseyId]');
  if (showSel) {
    const current = showSel.value;
    showSel.innerHTML = '<option value="">— None —</option>' + JERSEYS.map(j =>
      `<option value="${j.id}">${escapeAttr(j.country)} — ${escapeAttr(j.edition)}</option>`
    ).join('');
    if (current) showSel.value = current;
  }
  const playerSel = document.getElementById('playerJerseySelect');
  if (playerSel) {
    const current = playerSel.value;
    playerSel.innerHTML = '<option value="">— Pick jersey —</option>' + JERSEYS.map(j =>
      `<option value="${j.id}">${escapeAttr(j.country)} — ${escapeAttr(j.edition)}</option>`
    ).join('');
    if (current) playerSel.value = current;
  }
}
