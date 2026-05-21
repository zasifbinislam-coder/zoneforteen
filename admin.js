/* ============================================================
   ZONE14 — Admin Dashboard
   Reads orders from localStorage (saved by order.js).
   Soft passcode gate — NOT real security. For real production
   you'd need a backend with proper auth.
   ============================================================ */

const ADMIN_PASS = 'zone14admin';
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
  document.getElementById('seedDemo').addEventListener('click', seedDemoOrders);
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
  window.addEventListener('storage', () => { render(); renderResults(); });
  window.addEventListener('predictions:change', renderResults);
  window.addEventListener('results:change',     renderResults);
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
      items: [{ id:'arg-home', country:'Argentina', edition:'Home Kit', size:'L', qty:1, price:1500 }],
      custom: { name:'MESSI', number:'10' }, payment:'cod', notes:'Call before delivery please.',
      promo:'WC2026', totals: { subtotal:1500, shipping:70, discount:150, grand:1420 },
    },
    {
      ref: 'Z14-DEMO02', date: Date.now() - 86400000, status: 'confirmed',
      customer: { name:'Tahmid Rahman', phone:'01987654321', email:'',
                  address:'Building 12, Flat 5A', thana:'Khulshi', district:'Chattogram', division:'Chattogram', postcode:'4225', zone:'outside' },
      items: [
        { id:'bra-home', country:'Brazil', edition:'Home Kit', size:'M', qty:1, price:1500 },
        { id:'fra-home', country:'France', edition:'Home Kit', size:'L', qty:1, price:1500 },
      ],
      custom: { name:'', number:'' }, payment:'bkash', notes:'',
      promo:'', totals: { subtotal:3000, shipping:0, discount:0, grand:3000 },
    },
    {
      ref: 'Z14-DEMO03', date: Date.now() - 172800000, status: 'shipped',
      customer: { name:'Sadia Islam', phone:'01555512345', email:'sadia@example.com',
                  address:'7 Zindabazar Main Road', thana:'Sylhet Sadar', district:'Sylhet', division:'Sylhet', postcode:'3100', zone:'outside' },
      items: [{ id:'esp-home', country:'Spain', edition:'Home Kit', size:'S', qty:2, price:1500 }],
      custom: { name:'PEDRI', number:'8' }, payment:'nagad', notes:'',
      promo:'TEAMSET', totals: { subtotal:3000, shipping:0, discount:750, grand:2250 },
    },
    {
      ref: 'Z14-DEMO04', date: Date.now() - 259200000, status: 'delivered',
      customer: { name:'Mahir Chowdhury', phone:'01711122233', email:'',
                  address:'House 9, Sector 4', thana:'Uttara', district:'Dhaka', division:'Dhaka', postcode:'1230', zone:'dhaka' },
      items: [{ id:'arg-home', country:'Argentina', edition:'Home Kit', size:'XL', qty:1, price:1500 }],
      custom: { name:'', number:'' }, payment:'cod', notes:'',
      promo:'', totals: { subtotal:1500, shipping:70, discount:0, grand:1570 },
    },
  ];
  demos.forEach(o => saveOrder(o));
  render();
}
