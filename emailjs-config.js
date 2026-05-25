/* ============================================================
   ZONE14 — EmailJS configuration
   ------------------------------------------------------------
   Sir, fill these 4 values from https://dashboard.emailjs.com:

   1. PUBLIC_KEY  → Account → General → "Public Key"
   2. SERVICE_ID  → Email Services → your Gmail service ID
   3. ADMIN_TEMPLATE_ID    → Email Templates → template that emails YOU
                              (To: zasifbinislam@gmail.com)
   4. CUSTOMER_TEMPLATE_ID → Email Templates → template that emails the customer
                              (To: {{customer_email}})

   Template variables both templates can use:
     {{order_ref}}   {{customer_name}}   {{customer_phone}}   {{customer_email}}
     {{address}}     {{zone}}            {{items_text}}       {{payment_method}}
     {{txn_id}}      {{subtotal}}        {{shipping}}         {{discount}}
     {{grand_total}} {{notes}}           {{promo}}

   While placeholders are still in here, EmailJS silently no-ops
   and orders still flow via WhatsApp (so nothing breaks).
   ============================================================ */

window.EMAILJS_CONFIG = {
  PUBLIC_KEY: 'BzoHWLrShem3kuEgu',
  SERVICE_ID: 'service_k8dywsm',
  ADMIN_TEMPLATE_ID: 'template_u55u4i9',
  CUSTOMER_TEMPLATE_ID: 'template_cna7ged',
  ADMIN_EMAIL: 'zoneforteen@gmail.com',
};

(function bootEmailJS() {
  const c = window.EMAILJS_CONFIG;
  if (!window.emailjs || !c || c.PUBLIC_KEY.startsWith('PASTE_')) return;
  try { window.emailjs.init({ publicKey: c.PUBLIC_KEY }); }
  catch (e) { console.warn('EmailJS init failed:', e); }
})();
