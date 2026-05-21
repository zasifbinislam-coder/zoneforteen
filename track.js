/* ============================================================
   ZONE14 — Order tracking page
   Reads from localStorage (same source as the admin dashboard).
   ============================================================ */

const STATUS_FLOW = [
  { key: 'pending',   label: 'Order Placed',    desc: 'We received your order, awaiting confirmation.' },
  { key: 'confirmed', label: 'Confirmed',       desc: 'Order verified and being prepared.' },
  { key: 'packed',    label: 'Packed',          desc: 'Your jersey is packed and ready for the courier.' },
  { key: 'shipped',   label: 'Shipped',         desc: 'On the way — track via courier SMS.' },
  { key: 'delivered', label: 'Delivered',       desc: 'Order delivered. Enjoy! 🏆' },
];
const STATUS_COLOR = {
  pending:   '#ffb547',
  confirmed: '#5ee9e3',
  packed:    '#00d4ff',
  shipped:   '#a78bfa',
  delivered: '#51e0a4',
  cancelled: '#ff6b6b',
};
const PAYMENT_LABELS = {
  cod:    'Cash on Delivery',
  bkash:  'bKash',
  nagad:  'Nagad',
  rocket: 'Rocket',
  bank:   'Bank Transfer',
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  const params = new URLSearchParams(location.search);
  const ref = (params.get('ref') || '').trim().toUpperCase();
  if (ref) {
    if (!loadOrder(ref)) {
      showLookup(`We couldn't find order "${ref}" on this device. Try another reference or message us on WhatsApp.`);
    }
  } else {
    showLookup();
  }

  document.getElementById('trackLookupForm').addEventListener('submit', e => {
    e.preventDefault();
    const r = document.getElementById('trackInput').value.trim().toUpperCase();
    if (!r) return;
    if (!loadOrder(r)) {
      document.getElementById('trackLookupMsg').textContent =
        `No order found with ref "${r}" on this browser.`;
      document.getElementById('trackInput').classList.add('shake');
      setTimeout(() => document.getElementById('trackInput').classList.remove('shake'), 400);
      return;
    }
    // Push ref into URL so the customer can bookmark/share
    history.replaceState(null, '', `track.html?ref=${r}`);
  });

  // Live re-render when admin changes the status in another tab on the same device
  window.addEventListener('storage', e => {
    if (e.key === ORDERS_KEY) {
      const currentRef = (new URLSearchParams(location.search)).get('ref');
      if (currentRef) loadOrder(currentRef);
    }
  });

  document.getElementById('tdPrint').addEventListener('click', () => window.print());
});

function showLookup(msg) {
  if (msg) document.getElementById('trackLookupMsg').textContent = msg;
  document.getElementById('trackLookup').hidden = false;
  document.getElementById('trackDetail').hidden = true;
}

function loadOrder(ref) {
  const order = readOrders().find(o => (o.ref || '').toUpperCase() === ref);
  if (!order) return false;

  document.getElementById('trackLookup').hidden = true;
  document.getElementById('trackDetail').hidden = false;

  // Header
  document.getElementById('tdRef').textContent = order.ref;
  document.getElementById('tdDate').textContent = `Placed ${formatTrackDate(order.date)}`;
  const statusEl = document.getElementById('tdStatus');
  statusEl.textContent = order.status.toUpperCase();
  statusEl.style.color = STATUS_COLOR[order.status] || '#fff';
  statusEl.style.borderColor = STATUS_COLOR[order.status] || 'var(--border)';

  // Timeline
  renderTimeline(order);

  // Items
  const items = order.items || [];
  document.getElementById('tdItems').innerHTML = items.map(i => `
    <li>
      <span class="td-item-name">${i.country} ${i.edition}</span>
      <span class="td-item-meta">Size ${i.size} · Qty ${i.qty}</span>
      <span class="td-item-price">${fmtBDT(i.price * i.qty)}</span>
    </li>
  `).join('');

  // Customization
  const custom = order.custom || {};
  const customWrap = document.getElementById('tdCustom');
  if (custom.name || custom.number) {
    customWrap.hidden = false;
    customWrap.innerHTML = `<strong>Custom print:</strong> ${[custom.name, custom.number].filter(Boolean).join(' ')}`;
  } else {
    customWrap.hidden = true;
  }

  // Bill
  const t = order.totals || {};
  const billRows = [
    ['Subtotal', fmtBDT(t.subtotal || 0)],
    ['Delivery', t.shipping ? fmtBDT(t.shipping) : 'FREE'],
  ];
  if (t.discount > 0) billRows.push([`Discount${order.promo ? ' (' + order.promo + ')' : ''}`, '−' + fmtBDT(t.discount)]);
  document.getElementById('tdBill').innerHTML = `
    ${billRows.map(([l, v]) => `<div class="td-bill-row"><span>${l}</span><span>${v}</span></div>`).join('')}
    <div class="td-bill-row grand"><span>Total</span><span>${fmtBDT(t.grand || 0)}</span></div>
  `;

  // Delivery
  const c = order.customer || {};
  document.getElementById('tdDelivery').innerHTML = `
    <strong>${c.name || ''}</strong> · ${c.phone || ''}<br/>
    ${c.address || ''}<br/>
    ${[c.thana, c.district, c.division].filter(Boolean).join(', ')}${c.postcode ? ' · ' + c.postcode : ''}<br/>
    <span class="muted">${c.zone === 'dhaka' ? 'Inside Dhaka · 24 h' : 'Outside Dhaka · 2–3 days'}</span>
  `;
  document.getElementById('tdPayment').innerHTML = `Payment: <strong>${PAYMENT_LABELS[order.payment] || order.payment || '—'}</strong>`;

  // WhatsApp deep link with order ref
  const waMsg = encodeURIComponent(`Hi Zone14! I have a question about order #${order.ref}.`);
  document.getElementById('tdWhatsapp').href = `https://wa.me/${WHATSAPP}?text=${waMsg}`;

  return true;
}

function renderTimeline(order) {
  const tl = document.getElementById('tdTimeline');
  const currentIdx = STATUS_FLOW.findIndex(s => s.key === order.status);
  const cancelled = order.status === 'cancelled';

  tl.innerHTML = STATUS_FLOW.map((stage, i) => {
    const done = !cancelled && i <= currentIdx;
    const active = !cancelled && i === currentIdx;
    return `
      <li class="tl-step${done ? ' done' : ''}${active ? ' active' : ''}">
        <span class="tl-dot">${done ? '✓' : i + 1}</span>
        <div class="tl-body">
          <span class="tl-label">${stage.label}</span>
          <span class="tl-desc">${stage.desc}</span>
        </div>
      </li>
    `;
  }).join('') + (cancelled ? `
    <li class="tl-step cancelled">
      <span class="tl-dot">✕</span>
      <div class="tl-body">
        <span class="tl-label">Cancelled</span>
        <span class="tl-desc">This order was cancelled. Message us if this is unexpected.</span>
      </div>
    </li>
  ` : '');
}

function formatTrackDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}
