/* ============================================================
   ZONE14 — Order / Checkout page logic
   Requires data.js
   ============================================================ */

const state = {
  promo:        null,   // { code, label, type, value }
  customPrint:  false,  // adds the printing line
};

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

  // Star Player pre-fill: ?customName=MESSI&customNumber=10
  if (url.get('customName') || url.get('customNumber')) {
    setTimeout(() => {
      const nameInput = document.querySelector('input[name=customName]');
      const numInput  = document.querySelector('input[name=customNumber]');
      if (nameInput && url.get('customName'))   { nameInput.value = url.get('customName').toUpperCase(); nameInput.dispatchEvent(new Event('input')); }
      if (numInput  && url.get('customNumber')) { numInput.value  = url.get('customNumber');             numInput.dispatchEvent(new Event('input')); }
    }, 50);
  }

  fillDivisions();
  hookForm();
  hookPromo();
  hookCustomization();
  hookPromoChips();
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
          <span class="cart-item-price">${fmtBDT(j.price * item.qty)}</span>
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
    return s + (j ? j.price * i.qty : 0);
  }, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  // Customization fee — currently a launch promo: FREE
  const customFee = (state.customPrint && totalItems > 0) ? 0 : 0; // free during launch

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

  const grand = Math.max(0, subtotal + customFee + shipping - discount);

  document.getElementById('tSubtotal').textContent = fmtBDT(subtotal);
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

  const customRow = document.getElementById('customRow');
  customRow.hidden = !state.customPrint || totalItems === 0;
  document.getElementById('tCustom').textContent = 'FREE';

  document.getElementById('tGrand').textContent = fmtBDT(grand);

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

  // Uppercase the custom name as the user types
  const nameField = document.querySelector('input[name=customName]');
  if (nameField) {
    nameField.addEventListener('input', e => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    });
  }
}

function hookCustomization() {
  const name = document.querySelector('input[name=customName]');
  const num  = document.querySelector('input[name=customNumber]');
  const sync = () => {
    state.customPrint = !!(name.value.trim() || num.value.trim());
    renderTotals();
  };
  [name, num].forEach(el => el && el.addEventListener('input', sync));
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

function hookPromoChips() {
  document.querySelectorAll('.promo-hint code[data-promo]').forEach(c => {
    c.addEventListener('click', () => {
      document.getElementById('promoInput').value = c.dataset.promo;
      document.getElementById('applyPromo').click();
    });
  });
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
    cart.forEach(i => {
      const j = getJersey(i.id);
      const lineTotal = j.price * i.qty;
      subtotal += lineTotal;
      lines.push(`• ${j.country} ${j.edition} — Size ${i.size} × ${i.qty} = ${fmtBDT(lineTotal)}`);
    });
    lines.push(``);

    if (fd.get('customName') || fd.get('customNumber')) {
      lines.push(`✨ *Custom Print*`);
      if (fd.get('customName'))   lines.push(`Name: ${fd.get('customName')}`);
      if (fd.get('customNumber')) lines.push(`Number: ${fd.get('customNumber')}`);
      lines.push(`(FREE during launch)`);
      lines.push(``);
    }

    lines.push(`💳 *Payment*: ${({
      cod: 'Cash on Delivery',
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      bank: 'Bank Transfer'
    })[fd.get('payment')]}`);
    lines.push(``);

    lines.push(`💰 *Bill*`);
    lines.push(`Subtotal: ${fmtBDT(subtotal)}`);
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
    lines.push(`Sent from zone14.bd ✓`);

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
    if (fd.get('customName') || fd.get('customNumber')) {
      confirmLines.push(`✨ Custom print: ${fd.get('customName') || ''} ${fd.get('customNumber') || ''}`.trim());
    }
    confirmLines.push(``);
    confirmLines.push(`💰 *Total: ${fmtBDT(grand)}*`);
    confirmLines.push(`Payment: ${({cod:'Cash on Delivery',bkash:'bKash',nagad:'Nagad',rocket:'Rocket',bank:'Bank Transfer'})[fd.get('payment')]}`);
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
          size: i.size, qty: i.qty, price: j.price,
        };
      }),
      custom: {
        name:   fd.get('customName')   || '',
        number: fd.get('customNumber') || '',
      },
      payment: fd.get('payment'),
      notes:   fd.get('notes') || '',
      promo:   state.promo ? state.promo.code : '',
      totals:  { subtotal, shipping, discount, grand },
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
