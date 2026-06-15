/* ============================================================
   ZONE14 — Order / Checkout page logic
   Requires data.js
   ============================================================ */

const state = {
  promo: null,   // { code, label, type, value }
};

/* PAY_NUMBERS now lives in data.js (let) and is overridable from the
   Settings admin panel via site_settings table. */

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // If a jersey was passed via URL params (legacy fallback), seed the cart
  const url = new URLSearchParams(location.search);
  if (url.get('jersey')) {
    const id   = url.get('jersey');
    const size = url.get('size') || 'M';
    const qty  = parseInt(url.get('qty') || '1', 10);
    if (getJersey(id)) addToCart(id, size, qty);
  }

  fillDivisions();
  hookForm();
  hookPromo();
  hookPayment();
  hookPlaceOrder();
  hookSuccessModal();

  rerender();
  window.addEventListener('cart:change', rerender);
});

/* ---------- Render ---------- */
function rerender() {
  renderCart();
  renderTotals();
}

function renderCart() {
  const wrap  = document.getElementById('cartItems');
  const count = document.getElementById('sumCount');
  const cart  = readCart();

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  count.textContent = totalItems + (totalItems === 1 ? ' item' : ' items');

  if (cart.length === 0) {
    wrap.innerHTML = `
      <div class="cart-empty">
        Your cart is empty.<br/>
        <a href="index.html#jerseys">Browse jerseys →</a>
      </div>
    `;
    return;
  }

  wrap.innerHTML = cart.map(item => {
    const j = getJersey(item.id);
    if (!j) return '';
    return `
      <div class="cart-item" data-id="${j.id}" data-size="${item.size}">
        <div class="cart-item-img">${jerseySVG(j)}</div>
        <div class="cart-item-info">
          <span class="cart-item-name">${j.country} ${j.edition}</span>
          <span class="cart-item-meta">Size · ${item.size}</span>
          <div class="cart-item-controls">
            <button type="button" class="qty-btn" data-act="dec" aria-label="Decrease">−</button>
            <span class="qty-display">${item.qty}</span>
            <button type="button" class="qty-btn" data-act="inc" aria-label="Increase">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">${
            jerseyOnSale(j)
              ? `<span class="ci-was">${fmtBDT(j.price * item.qty)}</span> ${fmtBDT(salePrice(j) * item.qty)}`
              : fmtBDT(j.price * item.qty)
          }</span>
          <button type="button" class="cart-item-remove" data-act="rm" aria-label="Remove">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Wire qty + remove buttons
  wrap.querySelectorAll('.cart-item').forEach(row => {
    const id   = row.dataset.id;
    const size = row.dataset.size;
    row.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        const item = readCart().find(i => i.id === id && i.size === size);
        if (!item) return;
        if (act === 'inc') setCartQty(id, size, item.qty + 1);
        if (act === 'dec') {
          if (item.qty <= 1) removeFromCart(id, size);
          else setCartQty(id, size, item.qty - 1);
        }
        if (act === 'rm') removeFromCart(id, size);
      });
    });
  });
}

function renderTotals() {
  const cart = readCart();
  const subtotal = cart.reduce((s, i) => {
    const j = getJersey(i.id);
    return s + (j ? salePrice(j) * i.qty : 0);
  }, 0);
  // How much the sale shaved off the original prices (for the savings line)
  const saleSavings = cart.reduce((s, i) => {
    const j = getJersey(i.id);
    return s + (j ? (j.price - salePrice(j)) * i.qty : 0);
  }, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  // Shipping
  const zone = (document.querySelector('input[name=zone]:checked') || {}).value || 'dhaka';
  let shipping = 0;
  if (totalItems > 0) {
    shipping = DELIVERY[zone] || DELIVERY.dhaka;
    if (subtotal >= DELIVERY.freeAbove) shipping = 0;
  }

  // Discount
  let discount = 0;
  let discountLabel = 'Discount';
  if (state.promo && subtotal > 0) {
    discountLabel = state.promo.label;
    discount = state.promo.type === 'pct'
      ? subtotal * (state.promo.value / 100)
      : Math.min(state.promo.value, subtotal);
  }

  const grand = Math.max(0, subtotal + shipping - discount);

  document.getElementById('tSubtotal').textContent = fmtBDT(subtotal);

  const saleRow = document.getElementById('saleSavingsRow');
  if (saleRow) {
    if (saleSavings > 0 && totalItems > 0) {
      saleRow.hidden = false;
      document.getElementById('tSaleSavings').textContent = '−' + fmtBDT(saleSavings);
    } else {
      saleRow.hidden = true;
    }
  }

  document.getElementById('tShipping').textContent = totalItems === 0
    ? '—'
    : (shipping === 0 ? 'FREE' : fmtBDT(shipping));

  const discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    discountRow.hidden = false;
    document.getElementById('tDiscountLabel').textContent = discountLabel;
    document.getElementById('tDiscount').textContent = '−' + fmtBDT(discount);
  } else {
    discountRow.hidden = true;
  }

  document.getElementById('tGrand').textContent = fmtBDT(grand);

  // Sync the "send this amount" hint inside payment instructions
  const amtText = totalItems === 0 ? 'total amount' : fmtBDT(grand);
  const amtHint = document.getElementById('payAmountHint');
  if (amtHint) amtHint.textContent = amtText;
  const bankAmtHint = document.getElementById('bankAmountHint');
  if (bankAmtHint) bankAmtHint.textContent = amtText;

  renderShipProgress(subtotal, totalItems);

  // Place order button enabled only with items
  document.getElementById('placeOrder').disabled = totalItems === 0;
}

function renderShipProgress(subtotal, totalItems) {
  const wrap = document.getElementById('shipProgress');
  const msg  = document.getElementById('shipMsg');
  const fill = document.getElementById('shipBarFill');

  if (totalItems === 0) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = '';

  const need = DELIVERY.freeAbove;
  const pct  = Math.min(100, (subtotal / need) * 100);
  fill.style.width = pct + '%';

  if (subtotal >= need) {
    wrap.classList.add('complete');
    msg.innerHTML = `<strong>🎉 Free delivery unlocked!</strong> No shipping charge on this order.`;
  } else {
    wrap.classList.remove('complete');
    const remaining = need - subtotal;
    msg.innerHTML = `Add <strong>${fmtBDT(remaining)}</strong> more for <strong>FREE delivery</strong>.`;
  }
}

/* ---------- Form setup ---------- */
function fillDivisions() {
  const sel = document.getElementById('divisionSelect');
  Object.keys(BD_LOCATIONS).forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    sel.appendChild(opt);
  });
}

function fillDistricts(division) {
  const sel = document.getElementById('districtSelect');
  sel.innerHTML = '<option value="">Select district</option>';
  sel.disabled = !division;
  if (!division) return;
  Object.keys(BD_LOCATIONS[division] || {}).forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    sel.appendChild(opt);
  });
  // Reset downstream
  fillThanas('', '');
}

function fillThanas(division, district) {
  const sel = document.getElementById('thanaSelect');
  sel.innerHTML = '<option value="">Select thana / area</option>';
  sel.disabled = !(division && district);
  if (!(division && district)) return;
  const list = (BD_LOCATIONS[division] || {})[district] || [];
  list.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  });
  // Always offer Other → free-text fallback
  const other = document.createElement('option');
  other.value = '__other__';
  other.textContent = 'Other (specify in address)';
  sel.appendChild(other);
}

function hookForm() {
  // Re-render totals when zone changes
  document.querySelectorAll('input[name=zone]').forEach(r => {
    r.addEventListener('change', renderTotals);
  });

  // Cascading address selectors
  const divSel = document.getElementById('divisionSelect');
  const disSel = document.getElementById('districtSelect');

  divSel.addEventListener('change', e => {
    const v = e.target.value;
    fillDistricts(v);

    // Auto-detect zone: Dhaka district = inside Dhaka rate
    // (We don't know the district yet, so default to outside if not Dhaka division)
    const dhakaRadio   = document.querySelector('input[name=zone][value=dhaka]');
    const outsideRadio = document.querySelector('input[name=zone][value=outside]');
    if (v === 'Dhaka') dhakaRadio.checked = true; // refined again when district is picked
    else if (v) outsideRadio.checked = true;
    renderTotals();
  });

  disSel.addEventListener('change', e => {
    const division = divSel.value;
    const district = e.target.value;
    fillThanas(division, district);

    // Refine zone: only Dhaka district within Dhaka division = "Inside Dhaka"
    const dhakaRadio   = document.querySelector('input[name=zone][value=dhaka]');
    const outsideRadio = document.querySelector('input[name=zone][value=outside]');
    if (division === 'Dhaka' && district === 'Dhaka') dhakaRadio.checked = true;
    else outsideRadio.checked = true;
    renderTotals();
  });

}

/* Show/hide the mobile-banking instructions block based on selected method */
function hookPayment() {
  const wrap   = document.getElementById('payInstructions');
  const numEl  = document.getElementById('payNumber');
  const lblEl  = document.getElementById('payNumLabel');
  const txnEl  = document.getElementById('txnIdInput');
  const copyBtn = document.getElementById('copyPayNum');

  const bankWrap   = document.getElementById('bankInstructions');
  const bankTxnEl  = document.getElementById('bankTxnIdInput');

  const fillBank = () => {
    const cfg = (typeof BANK_TRANSFER !== 'undefined') ? BANK_TRANSFER : {};
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    setText('bankName',          cfg.bankName);
    setText('bankBranch',        cfg.branch);
    setText('bankAccountName',   cfg.accountName);
    setText('bankAccountNumber', cfg.accountNumber);
    setText('bankRoutingNumber', cfg.routingNumber);
    const routingRow = document.getElementById('bankRoutingRow');
    if (routingRow) routingRow.style.display = cfg.routingNumber ? '' : 'none';
  };

  const sync = () => {
    const method = (document.querySelector('input[name=payment]:checked') || {}).value;
    const cfg = PAY_NUMBERS[method];
    if (cfg) {
      wrap.hidden = false;
      lblEl.textContent = cfg.label;
      numEl.textContent = cfg.number;
      txnEl.required = true;
    } else {
      wrap.hidden = true;
      txnEl.required = false;
      txnEl.value = '';
    }
    if (method === 'bank') {
      fillBank();
      bankWrap.hidden = false;
      bankTxnEl.required = true;
    } else {
      bankWrap.hidden = true;
      bankTxnEl.required = false;
      bankTxnEl.value = '';
    }
  };

  document.querySelectorAll('input[name=payment]').forEach(r =>
    r.addEventListener('change', sync)
  );

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(numEl.textContent.replace(/\D/g, ''));
      const prev = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = prev; }, 1400);
    } catch { /* clipboard blocked; nothing actionable */ }
  });

  // Wire every bank-detail copy button
  document.querySelectorAll('[data-bank-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const target = document.getElementById(btn.dataset.bankCopy);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        const prev = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = prev; }, 1400);
      } catch { /* clipboard blocked */ }
    });
  });

  // Settings may change after boot (admin edits bank details in another tab)
  window.addEventListener('settings:applied', fillBank);

  sync();
}

/* ---------- Promo ---------- */
function hookPromo() {
  const input    = document.getElementById('promoInput');
  const applyBtn = document.getElementById('applyPromo');
  const feedback = document.getElementById('promoFeedback');

  const apply = () => {
    const code = input.value.trim().toUpperCase();
    if (!code) { feedback.textContent = ''; feedback.className = 'promo-feedback'; state.promo = null; renderTotals(); return; }

    const promo = PROMOS[code];
    if (!promo) {
      feedback.textContent = '✗ Invalid promo code.';
      feedback.className = 'promo-feedback bad';
      state.promo = null;
    } else {
      feedback.textContent = '✓ ' + promo.label + ' applied.';
      feedback.className = 'promo-feedback ok';
      state.promo = { code, ...promo };
    }
    renderTotals();
  };

  applyBtn.addEventListener('click', apply);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
}

/* ---------- Place order ---------- */
function hookPlaceOrder() {
  document.getElementById('placeOrder').addEventListener('click', () => {
    const form = document.getElementById('orderForm');

    // Validate built-in HTML constraints
    if (!form.checkValidity()) {
      form.reportValidity();
      // scroll to first invalid field
      const invalid = form.querySelector(':invalid');
      if (invalid) invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const cart = readCart();
    if (cart.length === 0) return;

    const fd = new FormData(form);
    const ref = 'Z14-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    // Build the WhatsApp message
    const lines = [];
    lines.push(`🛒 *NEW ORDER · Zone14*`);
    lines.push(`Order #: *${ref}*`);
    lines.push(``);
    lines.push(`👤 *Customer*`);
    lines.push(`Name: ${fd.get('name')}`);
    lines.push(`Phone: ${fd.get('phone')}`);
    if (fd.get('email')) lines.push(`Email: ${fd.get('email')}`);
    lines.push(``);
    lines.push(`📍 *Delivery*`);
    lines.push(`Address: ${fd.get('address')}`);
    const thanaTxt = fd.get('thana') === '__other__' ? '(specified in address)' : fd.get('thana');
    lines.push(`Thana: ${thanaTxt}`);
    lines.push(`District: ${fd.get('district')}, ${fd.get('division')}`);
    if (fd.get('postcode')) lines.push(`Postcode: ${fd.get('postcode')}`);
    lines.push(`Zone: ${fd.get('zone') === 'dhaka' ? 'Inside Dhaka (24h)' : 'Outside Dhaka (2–3 days)'}`);
    lines.push(``);
    lines.push(`👕 *Items (${cart.reduce((s, i) => s + i.qty, 0)})*`);
    let subtotal = 0;
    let saleSavings = 0;
    cart.forEach(i => {
      const j = getJersey(i.id);
      const unit = salePrice(j);
      const lineTotal = unit * i.qty;
      subtotal += lineTotal;
      saleSavings += (j.price - unit) * i.qty;
      const saleNote = jerseyOnSale(j) ? ` (sale, was ${fmtBDT(j.price)})` : '';
      lines.push(`• ${j.country} ${j.edition} — Size ${i.size} × ${i.qty} = ${fmtBDT(lineTotal)}${saleNote}`);
    });
    lines.push(``);

    const paymentLabel = ({
      cod: 'Cash on Delivery',
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      bank: 'Bank Transfer'
    })[fd.get('payment')];
    lines.push(`💳 *Payment*: ${paymentLabel}`);
    if (fd.get('txnId')) {
      lines.push(`Transaction ID: ${fd.get('txnId')}`);
    }
    if (fd.get('bankTxnId')) {
      lines.push(`Bank Reference: ${fd.get('bankTxnId')}`);
    }
    lines.push(``);

    lines.push(`💰 *Bill*`);
    lines.push(`Subtotal: ${fmtBDT(subtotal)}`);
    if (saleSavings > 0) lines.push(`🔥 Sale savings: −${fmtBDT(saleSavings)}`);
    const zone = fd.get('zone');
    const shipping = subtotal >= DELIVERY.freeAbove ? 0 : DELIVERY[zone];
    lines.push(`Delivery: ${shipping === 0 ? 'FREE' : fmtBDT(shipping)}`);
    let discount = 0;
    if (state.promo) {
      discount = state.promo.type === 'pct'
        ? subtotal * (state.promo.value / 100)
        : Math.min(state.promo.value, subtotal);
      lines.push(`Promo (${state.promo.code}): −${fmtBDT(discount)}`);
    }
    const grand = Math.max(0, subtotal + shipping - discount);
    lines.push(`*TOTAL: ${fmtBDT(grand)}*`);

    if (fd.get('notes')) {
      lines.push(``);
      lines.push(`📝 *Notes*: ${fd.get('notes')}`);
    }

    lines.push(``);
    lines.push(`Sent from zoneforteen.com ✓`);

    const message = encodeURIComponent(lines.join('\n'));

    // 1) Open Sir's WhatsApp with the order details (must happen first — user gesture)
    window.open(`https://wa.me/${WHATSAPP}?text=${message}`, '_blank', 'noopener');

    // 2) Auto-pop a second tab with the customer's own WhatsApp pre-filled with a
    //    confirmation message they can "Message Yourself". Some browsers block the
    //    second popup — the success modal includes a manual fallback button.
    const custPhoneRaw = (fd.get('phone') || '').replace(/\D/g, '');
    const custPhone    = custPhoneRaw.startsWith('0') ? '880' + custPhoneRaw.slice(1) : custPhoneRaw;
    const confirmLines = [
      `✓ *ORDER CONFIRMED · ZONE14*`,
      `Order #${ref}`,
      ``,
      `Hi ${fd.get('name')}!`,
      `Thank you for your order. Here's your copy:`,
      ``,
      `👕 *Items*`,
      ...cart.map(i => {
        const j = getJersey(i.id);
        return `• ${j.country} ${j.edition} — Size ${i.size} × ${i.qty}`;
      }),
    ];
    confirmLines.push(``);
    confirmLines.push(`💰 *Total: ${fmtBDT(grand)}*`);
    confirmLines.push(`Payment: ${paymentLabel}`);
    if (fd.get('txnId'))     confirmLines.push(`TrxID: ${fd.get('txnId')}`);
    if (fd.get('bankTxnId')) confirmLines.push(`Bank Ref: ${fd.get('bankTxnId')}`);
    confirmLines.push(`Delivery: ${fd.get('zone') === 'dhaka' ? 'Inside Dhaka · 24h' : 'Outside Dhaka · 2–3 days'}`);
    confirmLines.push(``);
    confirmLines.push(`We'll WhatsApp you with shipment updates.`);
    confirmLines.push(`Questions? wa.me/${WHATSAPP}`);
    confirmLines.push(``);
    confirmLines.push(`— Zone14 Team`);
    const confirmMsg = encodeURIComponent(confirmLines.join('\n'));
    const confirmUrl = `https://wa.me/${custPhone}?text=${confirmMsg}`;

    setTimeout(() => window.open(confirmUrl, '_blank', 'noopener'), 700);

    // Persist the order so it shows up on the admin dashboard
    saveOrder({
      ref,
      date: Date.now(),
      status: 'pending',
      customer: {
        name:     fd.get('name'),
        phone:    fd.get('phone'),
        email:    fd.get('email')   || '',
        address:  fd.get('address'),
        thana:    fd.get('thana') === '__other__' ? '' : fd.get('thana'),
        district: fd.get('district'),
        division: fd.get('division'),
        postcode: fd.get('postcode') || '',
        zone:     fd.get('zone'),
      },
      items: cart.map(i => {
        const j = getJersey(i.id);
        return {
          id: i.id, country: j.country, edition: j.edition,
          size: i.size, qty: i.qty, price: salePrice(j),
          listPrice: j.price, onSale: jerseyOnSale(j),
        };
      }),
      payment: fd.get('payment'),
      txnId:     fd.get('txnId')     || '',
      bankTxnId: fd.get('bankTxnId') || '',
      notes:   fd.get('notes') || '',
      promo:   state.promo ? state.promo.code : '',
      totals:  { subtotal, shipping, discount, grand, saleSavings },
    });

    // 3) EmailJS — fire admin + customer emails in the background. Silently no-ops
    //    while credentials are placeholders, so the WhatsApp flow always works.
    sendOrderEmails({
      ref,
      cart,
      fd,
      paymentLabel,
      grand,
      subtotal,
      shipping,
      discount,
    });

    // Show success modal
    document.getElementById('orderRef').textContent = ref;
    document.getElementById('successTrackLink').href = `track.html?ref=${ref}`;
    document.getElementById('orderSuccess').classList.add('show');
    clearCart();
    rerender();
  });
}

function hookSuccessModal() {
  const modal = document.getElementById('orderSuccess');
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('show');
  });
}

/* ---------- EmailJS dispatch ----------
   Sends two emails (admin + customer) using the templates configured in
   emailjs-config.js. While credentials are placeholders, the function
   silently exits so the WhatsApp flow continues to work unchanged.
   Errors are LOUDLY logged (red) so root-cause is obvious in console. */
function sendOrderEmails({ ref, cart, fd, paymentLabel, grand, subtotal, shipping, discount }) {
  const c = window.EMAILJS_CONFIG;

  // Diagnostic preamble — surfaces silent skip conditions
  console.group('%c[Zone14 EmailJS]', 'background:#5ee9e3;color:#000;padding:2px 6px;border-radius:3px;font-weight:bold;');
  console.log('SDK loaded?  ', !!window.emailjs);
  console.log('Config loaded?', !!c);
  console.log('Public key ok?', c && !c.PUBLIC_KEY.startsWith('PASTE_'));

  if (!window.emailjs) { console.error('✗ EmailJS SDK missing — script tag failed to load'); console.groupEnd(); return; }
  if (!c)              { console.error('✗ EMAILJS_CONFIG missing — emailjs-config.js failed to load'); console.groupEnd(); return; }
  if (c.PUBLIC_KEY.startsWith('PASTE_')) { console.warn('⚠ EmailJS placeholder credentials — emails skipped'); console.groupEnd(); return; }

  const vars = buildEmailVars({ ref, cart, fd, paymentLabel, grand, subtotal, shipping, discount });
  console.log('Sending vars:', vars);
  console.groupEnd();

  // Admin email — always fires
  window.emailjs.send(c.SERVICE_ID, c.ADMIN_TEMPLATE_ID, vars)
    .then(r => console.log('%c[Zone14 EmailJS] ✓ Admin email sent', 'color:#0aa37f;font-weight:bold;', r))
    .catch(err => console.error('%c[Zone14 EmailJS] ✗ ADMIN SEND FAILED', 'color:#ff4040;font-weight:bold;', 'status:', err && err.status, 'text:', err && err.text, 'full:', err));

  // Customer email — only if they gave an address
  if (vars.customer_email) {
    window.emailjs.send(c.SERVICE_ID, c.CUSTOMER_TEMPLATE_ID, vars)
      .then(r => console.log('%c[Zone14 EmailJS] ✓ Customer email sent', 'color:#0aa37f;font-weight:bold;', r))
      .catch(err => console.error('%c[Zone14 EmailJS] ✗ CUSTOMER SEND FAILED', 'color:#ff4040;font-weight:bold;', 'status:', err && err.status, 'text:', err && err.text, 'full:', err));
  } else {
    console.log('[Zone14 EmailJS] Customer email skipped — no email provided');
  }
}

function buildEmailVars({ ref, cart, fd, paymentLabel, grand, subtotal, shipping, discount }) {
  const c = window.EMAILJS_CONFIG;
  const itemsText = cart.map(i => {
    const j = getJersey(i.id);
    const saleNote = jerseyOnSale(j) ? ` (sale, was ${fmtBDT(j.price)})` : '';
    return `• ${j.country} ${j.edition} — Size ${i.size} × ${i.qty} = ${fmtBDT(salePrice(j) * i.qty)}${saleNote}`;
  }).join('\n');

  const addressFull = [
    fd.get('address'),
    fd.get('thana') === '__other__' ? '' : fd.get('thana'),
    fd.get('district'),
    fd.get('division'),
    fd.get('postcode'),
  ].filter(Boolean).join(', ');

  return {
    order_ref:      ref,
    customer_name:  fd.get('name'),
    customer_phone: fd.get('phone'),
    customer_email: fd.get('email') || '',
    address:        addressFull,
    zone:           fd.get('zone') === 'dhaka' ? 'Inside Dhaka (24h)' : 'Outside Dhaka (2–3 days)',
    items_text:     itemsText,
    payment_method: paymentLabel,
    txn_id:         fd.get('txnId') || fd.get('bankTxnId') || '—',
    subtotal:       fmtBDT(subtotal),
    shipping:       shipping === 0 ? 'FREE' : fmtBDT(shipping),
    discount:       discount > 0 ? '−' + fmtBDT(discount) : '—',
    grand_total:    fmtBDT(grand),
    notes:          fd.get('notes') || '',
    promo:          state.promo ? state.promo.code : '',
    admin_email:    c.ADMIN_EMAIL,
  };
}

/* Console-only debug helper. Open F12 → paste `zone14TestEmail()` → Enter.
   Fires a single admin-template email with hardcoded test data so you can
   isolate EmailJS issues without going through the full checkout flow. */
window.zone14TestEmail = function () {
  const c = window.EMAILJS_CONFIG;
  if (!window.emailjs || !c || c.PUBLIC_KEY.startsWith('PASTE_')) {
    console.error('EmailJS not ready — SDK loaded:', !!window.emailjs, 'config:', !!c);
    return Promise.reject('Not ready');
  }
  const vars = {
    order_ref: 'CONSOLE-' + Date.now().toString(36).toUpperCase(),
    customer_name: 'Console Test', customer_phone: '01700000000',
    customer_email: c.ADMIN_EMAIL, address: 'Debug address',
    zone: 'Inside Dhaka', items_text: '• Debug item × 1',
    payment_method: 'COD', txn_id: '—',
    subtotal: 'BDT 1,000', shipping: 'FREE', discount: '—', grand_total: 'BDT 1,000',
    notes: 'Console debug ping', promo: '', admin_email: c.ADMIN_EMAIL,
  };
  console.log('[zone14TestEmail] firing with:', vars);
  return window.emailjs.send(c.SERVICE_ID, c.ADMIN_TEMPLATE_ID, vars)
    .then(r => { console.log('%c✓ SUCCESS', 'color:#0aa37f;font-weight:bold;font-size:14px;', r); return r; })
    .catch(e => { console.error('%c✗ FAILED', 'color:#ff4040;font-weight:bold;font-size:14px;', 'status:', e.status, 'text:', e.text, 'full:', e); throw e; });
};
