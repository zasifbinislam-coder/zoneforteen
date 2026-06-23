/* ============================================================
   ZONE14 — Accounts / Finance page
   Income (from sales) − all business expenses = Net profit.
   Same soft passcode as the admin page. Data lives in Supabase
   (sales + expenses), cached in localStorage for instant render.
   ============================================================ */

const ACCT_PASS = 'Brazil2002@rz';      // same as admin
const ACCT_AUTH_KEY = 'zone14_admin_auth';

document.addEventListener('DOMContentLoaded', () => {
  const gate = document.getElementById('acctGate');
  const app  = document.getElementById('acctApp');

  const reveal = () => { gate.style.display = 'none'; app.hidden = false; bootAccounts(); };

  if (sessionStorage.getItem(ACCT_AUTH_KEY) === '1') reveal();

  document.getElementById('acctGateForm').addEventListener('submit', e => {
    e.preventDefault();
    const inp = document.getElementById('acctPass');
    if (inp.value === ACCT_PASS) {
      sessionStorage.setItem(ACCT_AUTH_KEY, '1');
      reveal();
    } else {
      inp.value = '';
      inp.placeholder = 'Wrong passcode — try again';
      inp.classList.add('shake');
      setTimeout(() => inp.classList.remove('shake'), 400);
    }
  });
});

function bootAccounts() {
  document.getElementById('acctLogout').addEventListener('click', () => {
    sessionStorage.removeItem(ACCT_AUTH_KEY);
    location.reload();
  });
  document.getElementById('acctExport').addEventListener('click', exportAccountsJson);

  // Category dropdown
  const sel = document.getElementById('expCategory');
  sel.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');

  // Default date = today
  const dateEl = document.getElementById('expDate');
  dateEl.value = new Date().toISOString().slice(0, 10);

  document.getElementById('expenseForm').addEventListener('submit', onAddExpense);

  initSalesStock();
  renderAll();

  window.addEventListener('expenses:change', renderAll);
  window.addEventListener('sales:change', () => { renderAll(); renderSalesList(); });
  window.addEventListener('stock:change', () => { renderStockGrid(); renderInventory(); });
  window.addEventListener('jerseys:change', () => { refreshSaleJerseyDropdown(); renderStockGrid(); renderInventory(); });

  // Pull latest from Supabase, then keep in sync
  if (typeof syncFromSupabase === 'function') syncFromSupabase().then(() => {
    renderAll(); renderSalesList(); renderStockGrid(); refreshSaleJerseyDropdown();
  });
  if (typeof subscribeToSupabaseChanges === 'function') subscribeToSupabaseChanges();
}

/* ---------- Helpers ---------- */
function escapeAttr(s) {
  return String(s || '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function confirmTwoClicks(btn, onConfirm) {
  return async (ev) => {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    if (btn.dataset.confirming === '1') {
      btn.disabled = true;
      try { await onConfirm(ev); } catch (e) { console.warn(e); }
      return;
    }
    btn.dataset.confirming = '1';
    const prev = btn.textContent;
    btn.textContent = 'Sure?';
    setTimeout(() => { delete btn.dataset.confirming; btn.textContent = prev; }, 3000);
  };
}

/* ============================================================
   SALES & STOCK (moved here so one login covers everything)
   ============================================================ */
function initSalesStock() {
  const form = document.getElementById('saleForm');
  if (!form) return;

  refreshSaleJerseyDropdown();
  renderSalesList();
  renderStockGrid();

  const jSel = document.getElementById('saleJersey');
  const sell = document.getElementById('saleSell');
  const cost = document.getElementById('saleCost');
  const pay  = document.getElementById('salePayment');
  const recv = document.getElementById('saleReceived');
  const qtyEl = form.querySelector('input[name=qty]');

  const syncReceived = () => {
    const total = (parseInt(sell.value, 10) || 0) * (parseInt(qtyEl.value, 10) || 1);
    if (pay.value === 'paid') recv.value = total;
    else if (pay.value === 'due') recv.value = 0;
  };
  jSel.addEventListener('change', () => {
    const j = getJersey(jSel.value);
    if (j) {
      sell.value = (typeof salePrice === 'function') ? salePrice(j) : j.price;
      if (!cost.value) cost.placeholder = 'e.g. ' + Math.round(j.price * 0.6);
    }
    syncReceived();
  });
  [pay, sell, qtyEl].forEach(el => el.addEventListener('change', syncReceived));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const j  = getJersey(fd.get('jerseyId'));
    const qty = parseInt(fd.get('qty'), 10) || 1;
    const sellPrice = parseInt(fd.get('sellPrice'), 10) || 0;
    if (!sellPrice) { acctMsg(form, 'err', 'Sell price দিন।'); return; }

    const sale = {
      soldAt: Date.now(),
      jerseyId: fd.get('jerseyId') || '',
      team:    j ? j.country : '',
      edition: j ? j.edition : '',
      size:    fd.get('size') || 'M',
      qty, sellPrice,
      costPrice: parseInt(fd.get('costPrice'), 10) || 0,
      customer: (fd.get('customer') || '').toString().trim(),
      phone:    (fd.get('phone') || '').toString().trim(),
      area:     (fd.get('area') || '').toString().trim(),
      paymentStatus: fd.get('paymentStatus') || 'due',
      received: parseInt(fd.get('received'), 10) || 0,
      deliveryStatus: fd.get('deliveryStatus') || 'pending',
      notes: (fd.get('notes') || '').toString().trim(),
    };

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const row = await pushSale(sale);
      writeSales([rowToSale(row), ...readSales()]);
      if (fd.get('deductStock') === 'on' && sale.jerseyId) {
        const next = Math.max(0, getStock(sale.jerseyId, sale.size) - qty);
        await pushStock(sale.jerseyId, sale.size, next);
        const map = readStock();
        if (!map[sale.jerseyId]) map[sale.jerseyId] = {};
        map[sale.jerseyId][sale.size] = next;
        writeStock(map);
      }
      acctMsg(form, 'ok', '✓ Sale saved.');
      form.reset();
      const qf = form.querySelector('input[name=qty]'); if (qf) qf.value = 1;
    } catch (err) {
      console.warn(err);
      acctMsg(form, 'err', '✗ ' + (err.message || err));
    } finally {
      btn.disabled = false; btn.textContent = 'Save Sale';
    }
  });
}

function refreshSaleJerseyDropdown() {
  const sel = document.getElementById('saleJersey');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Select jersey</option>' +
    JERSEYS.map(j => `<option value="${j.id}">${escapeAttr(j.country)} — ${escapeAttr(j.edition)}</option>`).join('');
  if (cur) sel.value = cur;
}

function renderSalesList() {
  const wrap = document.getElementById('salesList');
  if (!wrap) return;
  const sales = readSales();
  const duePill = document.getElementById('salesDuePill');
  const dueCount = sales.filter(s => (s.sellPrice * s.qty - (s.received || 0)) > 0).length;
  if (duePill) { duePill.hidden = dueCount === 0; duePill.textContent = dueCount + ' due'; }

  if (!sales.length) {
    wrap.innerHTML = `<div class="admin-review-empty"><span class="icon">🧾</span><p>No sales yet. Record your first sale above.</p></div>`;
    return;
  }

  wrap.innerHTML = sales.slice(0, 50).map(s => {
    const total = s.sellPrice * s.qty;
    const due = Math.max(0, total - (s.received || 0));
    const d = new Date(s.soldAt);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
    const payCls = due === 0 ? 'paid' : (s.received > 0 ? 'partial' : 'due');
    const payLbl = due === 0 ? 'PAID' : (s.received > 0 ? 'PARTIAL · due ' + fmtBDT(due) : 'DUE ' + fmtBDT(due));
    return `
      <div class="sale-row ${payCls}" data-id="${s.id}">
        <div class="sale-main">
          <strong>${escapeHtml(s.team || '—')} <span class="sale-size">${escapeHtml(s.size)}</span> ×${s.qty}</strong>
          <span class="sale-cust">${escapeHtml(s.customer || 'Walk-in')}${s.phone ? ' · ' + escapeHtml(s.phone) : ''}${s.area ? ' · ' + escapeHtml(s.area) : ''}</span>
        </div>
        <div class="sale-meta">
          <span class="sale-total">${fmtBDT(total)}</span>
          <span class="sale-pay ${payCls}">${payLbl}</span>
          <span class="sale-date">${dateStr}</span>
        </div>
        <div class="sale-actions">
          ${due > 0 ? `<button type="button" class="btn btn-ghost btn-sm" data-paid title="Mark fully paid">✓ Paid</button>` : ''}
          <button type="button" class="btn btn-ghost btn-sm" data-del style="color:#ff6b6b" title="Delete">×</button>
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-paid]').forEach(btn => btn.addEventListener('click', async () => {
    const id = btn.closest('.sale-row').dataset.id;
    const sales = readSales();
    const s = sales.find(x => x.id === id);
    if (!s) return;
    const total = s.sellPrice * s.qty;
    try {
      await updateSaleRemote(id, { received: total, payment_status: 'paid' });
      s.received = total; s.paymentStatus = 'paid';
      writeSales(sales);
    } catch (err) { alert('Failed: ' + (err.message || err)); }
  }));
  wrap.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', confirmTwoClicks(btn, async () => {
    const id = btn.closest('.sale-row').dataset.id;
    await deleteSaleRemote(id);
    writeSales(readSales().filter(x => x.id !== id));
  })));
}

function renderStockGrid() {
  const wrap = document.getElementById('stockGrid');
  if (!wrap) return;
  const stock = readStock();
  if (!JERSEYS.length) { wrap.innerHTML = '<p style="color:var(--text-mute);font-size:13px">No jerseys yet.</p>'; return; }

  wrap.innerHTML = JERSEYS.map(j => {
    const st = stock[j.id] || {};
    return `
      <div class="stock-row" data-id="${j.id}">
        <span class="stock-team">${escapeHtml(j.country)} <span style="color:var(--text-mute)">${escapeHtml(j.edition)}</span></span>
        ${['M','L','XL','XXL'].map(sz => `
          <label class="stock-cell">${sz}<input type="number" min="0" max="999" value="${st[sz] || 0}" data-size="${sz}" /></label>
        `).join('')}
        <button type="button" class="btn btn-ghost btn-sm" data-save-stock>Save</button>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-save-stock]').forEach(btn => btn.addEventListener('click', async () => {
    const row = btn.closest('.stock-row');
    const id = row.dataset.id;
    btn.disabled = true; btn.textContent = '…';
    try {
      const map = readStock();
      if (!map[id]) map[id] = {};
      for (const inp of row.querySelectorAll('input[data-size]')) {
        const sz = inp.dataset.size;
        const qty = Math.max(0, parseInt(inp.value, 10) || 0);
        await pushStock(id, sz, qty);
        map[id][sz] = qty;
      }
      writeStock(map);
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = 'Save'; btn.disabled = false; }, 1500);
    } catch (err) {
      alert('Save failed: ' + (err.message || err));
      btn.textContent = 'Save'; btn.disabled = false;
    }
  }));
}

async function onAddExpense(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const amount = parseInt(fd.get('amount'), 10) || 0;
  if (amount <= 0) { acctMsg(form, 'err', 'Amount দিন।'); return; }

  const exp = {
    spentAt: fd.get('date') ? new Date(fd.get('date')).getTime() : Date.now(),
    category: fd.get('category') || 'Other',
    amount,
    note: (fd.get('note') || '').toString().trim(),
  };

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const row = await pushExpense(exp);
    writeExpenses([rowToExpense(row), ...readExpenses()]);
    acctMsg(form, 'ok', '✓ Expense saved.');
    form.reset();
    document.getElementById('expDate').value = new Date().toISOString().slice(0, 10);
  } catch (err) {
    console.warn(err);
    acctMsg(form, 'err', '✗ ' + (err.message || err));
  } finally {
    btn.disabled = false; btn.textContent = 'Save Expense';
  }
}

function acctMsg(form, kind, text) {
  const msg = form.querySelector('[data-msg]');
  if (!msg) return;
  msg.textContent = text;
  msg.className = 'settings-msg ' + kind;
  setTimeout(() => { msg.textContent = ''; msg.className = 'settings-msg'; }, 4000);
}

function renderAll() {
  const a = computeAccounts();

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('acIncome', fmtBDT(a.received));
  set('acExpense', fmtBDT(a.expenseTotal));
  set('acExpenseCount', a.expenseCount + ' entr' + (a.expenseCount === 1 ? 'y' : 'ies'));
  set('acDue', fmtBDT(a.due));

  const net = document.getElementById('acNet');
  if (net) {
    net.textContent = fmtBDT(a.netProfit);
    net.style.color = a.netProfit >= 0 ? '#51e0a4' : '#ff6b6b';
  }

  // Written-out calculation
  const calc = document.getElementById('calcRows');
  if (calc) {
    calc.innerHTML = `
      <div class="calc-row"><span>Sales revenue (সব বিক্রি)</span><span>${fmtBDT(a.revenue)}</span></div>
      <div class="calc-row"><span>− এখনো বাকি (due, hand-এ আসেনি)</span><span class="neg">−${fmtBDT(a.due)}</span></div>
      <div class="calc-row sub"><span>= Money in hand (received)</span><span>${fmtBDT(a.received)}</span></div>
      <div class="calc-row"><span>− Total expenses (সব খরচ)</span><span class="neg">−${fmtBDT(a.expenseTotal)}</span></div>
      <div class="calc-row total ${a.netProfit >= 0 ? 'pos' : 'neg'}"><span>= NET PROFIT (আসল লাভ)</span><span>${fmtBDT(a.netProfit)}</span></div>
      <div class="calc-note">সব due উঠে এলে লাভ হবে: <strong>${fmtBDT(a.projectedProfit)}</strong></div>
    `;
  }

  renderInventory();
  renderCategoryBreakdown(a);
  renderExpenseList();
}

/* Inventory snapshot — how many jerseys are in stock right now, and how many
   units have been sold (sum of qty across every recorded sale). Both tick
   automatically as stock is edited and sales are added. */
function renderInventory() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  // Total stock units on hand = sum of every size of every jersey
  const stock = readStock();
  let stockUnits = 0;
  Object.values(stock).forEach(sizes =>
    Object.values(sizes || {}).forEach(q => { stockUnits += (parseInt(q, 10) || 0); }));

  // Total jerseys sold = sum of qty across all sales
  const sales = readSales();
  const soldUnits = sales.reduce((sum, s) => sum + (parseInt(s.qty, 10) || 0), 0);

  const designs = (typeof JERSEYS !== 'undefined' ? JERSEYS.length : 0);

  set('acStock', stockUnits);
  set('acStockSub', `${designs} design${designs === 1 ? '' : 's'} in catalog`);
  set('acSold', soldUnits);
  set('acSoldSub', `${sales.length} sale${sales.length === 1 ? '' : 's'} recorded`);
}

function renderCategoryBreakdown(a) {
  const wrap = document.getElementById('catBreakdown');
  if (!wrap) return;
  const entries = Object.entries(a.byCategory).sort((x, y) => y[1] - x[1]);
  if (!entries.length) {
    wrap.innerHTML = `<p style="color:var(--text-mute);font-size:13px">কোনো খরচ যোগ হয়নি এখনো।</p>`;
    return;
  }
  const max = entries[0][1] || 1;
  wrap.innerHTML = entries.map(([cat, amt]) => `
    <div class="cat-row">
      <div class="cat-head"><span>${cat}</span><strong>${fmtBDT(amt)}</strong></div>
      <div class="cat-bar"><div class="cat-bar-fill" style="width:${Math.round((amt / max) * 100)}%"></div></div>
    </div>
  `).join('');
}

function renderExpenseList() {
  const wrap = document.getElementById('expenseList');
  if (!wrap) return;
  const expenses = readExpenses();
  if (!expenses.length) {
    wrap.innerHTML = `<div class="admin-review-empty"><span class="icon">🧾</span><p>No expenses yet. Add your first cost above.</p></div>`;
    return;
  }
  wrap.innerHTML = expenses.slice(0, 100).map(e => {
    const d = new Date(e.spentAt);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
    return `
      <div class="expense-row" data-id="${e.id}">
        <div class="exp-main">
          <strong>${escapeHtml(e.category)}</strong>
          ${e.note ? `<span class="exp-note">${escapeHtml(e.note)}</span>` : ''}
        </div>
        <span class="exp-amt">−${fmtBDT(e.amount)}</span>
        <span class="exp-date">${dateStr}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-del style="color:#ff6b6b" title="Delete">×</button>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    if (btn.dataset.confirm !== '1') {
      btn.dataset.confirm = '1'; btn.textContent = 'Sure?';
      setTimeout(() => { btn.dataset.confirm = '0'; btn.textContent = '×'; }, 2500);
      return;
    }
    const id = btn.closest('.expense-row').dataset.id;
    await deleteExpenseRemote(id);
    writeExpenses(readExpenses().filter(x => x.id !== id));
  }));
}

function exportAccountsJson() {
  const data = {
    generatedAt: new Date().toISOString(),
    summary: computeAccounts(),
    sales: readSales(),
    expenses: readExpenses(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zone14-accounts-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
