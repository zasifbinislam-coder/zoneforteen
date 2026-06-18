/* ============================================================
   ZONE14 — Shared data + utilities
   Loaded by both index.html and order.html
   ============================================================ */

/* These start with the defaults below but can be overridden at runtime by
   site_settings rows from Supabase (loaded in syncFromSupabase). Use `let`
   so the admin Settings panel can mutate them after edits. */
let WHATSAPP = '8801723360078';
let KICKOFF  = new Date('2026-06-11T18:00:00-05:00'); // 11 June 2026, Estadio Azteca

/* Delivery charges (BDT) */
let DELIVERY = {
  dhaka:   70,
  outside: 130,
  freeAbove: 3000,         // free delivery above this subtotal
};

const CUSTOM_PRINT_FEE = 150; // per jersey for name+number

/* Promo codes (mock — real validation happens manually on WhatsApp side) */
let PROMOS = {
  WC2026:     { type: 'pct',  value: 10, label: '10% off — World Cup 2026' },
  ZONE14:     { type: 'pct',  value: 14, label: '14% off — Zone14 launch' },
  FIRSTORDER: { type: 'flat', value: 150, label: '৳150 off your first order' },
  TEAMSET:    { type: 'pct',  value: 25, label: '25% off — Full Team Set (5+ jerseys)' },
  MATCHDAY:   { type: 'pct',  value: 15, label: '15% off — Match Day special' },
};

/* ---------- SITEWIDE PROMOTIONAL SALE ----------
   When `active` is true and the current time is before `endsAt`, every jersey's
   price is reduced (flat ৳ off, or % off when pctOff > 0). Cards show the old
   price struck through, and a one-time popup invites shoppers in. Fully
   overridable from the admin Settings panel via the `sale` site_settings key. */
let SALE = {
  active:    true,
  label:     'World Cup Sale',
  amountOff: 100,                          // flat ৳ off each jersey
  pctOff:    0,                            // % off (used instead of amountOff when > 0)
  endsAt:    '2026-06-25T23:59:59+06:00',  // 10-day campaign · 15–25 June 2026
  popup: {
    enabled: true,
    badge:   'LIMITED TIME · 10 DAYS ONLY',
    title:   '৳100 OFF Every Jersey',
    sub:     'World Cup 2026 kits now ৳1,399. Grab yours before the sale ends.',
    cta:     'Shop the Sale',
    ctaUrl:  '#jerseys',
  },
};

/* Is the sale running right now? (active flag + not past its end date) */
function saleActive() {
  if (!SALE || !SALE.active) return false;
  if (SALE.endsAt) {
    const end = new Date(SALE.endsAt).getTime();
    if (isFinite(end) && Date.now() > end) return false;
  }
  return true;
}

/* Effective price for a jersey after any active sale (rounded ৳). */
function salePrice(j) {
  const base = Number(j.price) || 0;
  if (!saleActive()) return base;
  let p = base;
  if (Number(SALE.pctOff) > 0)         p = base * (1 - SALE.pctOff / 100);
  else if (Number(SALE.amountOff) > 0) p = base - Number(SALE.amountOff);
  return Math.max(0, Math.round(p));
}

/* True only when this jersey is genuinely cheaper under the sale. */
function jerseyOnSale(j) {
  return saleActive() && salePrice(j) < (Number(j.price) || 0);
}

/* Price markup for cards / quick view — strikes through the old price on sale. */
function priceTagHTML(j, cls) {
  const base  = Number(j.price) || 0;
  const klass = cls || 'jersey-price';
  if (jerseyOnSale(j)) {
    return `<span class="${klass} on-sale">` +
             `<span class="price-was">৳${base.toLocaleString('en-IN')}</span> ` +
             `<span class="price-now">৳${salePrice(j).toLocaleString('en-IN')}</span>` +
           `</span>`;
  }
  return `<span class="${klass}">৳${base.toLocaleString('en-IN')}</span>`;
}

/* Mobile-banking merchant numbers shown on the order page. Overridable from
   the Settings admin panel. */
let PAY_NUMBERS = {
  bkash:  { label: 'bKash Send Money number',  number: '01723-360078' },
  nagad:  { label: 'Nagad Send Money number',  number: '01723-360078' },
  rocket: { label: 'Rocket Send Money number', number: '01723360078-1' },
};

/* Bank account details for the Bank Transfer payment option. */
let BANK_TRANSFER = {
  bankName:      'Dutch-Bangla Bank Limited',
  branch:        'Dhanmondi Branch',
  accountName:   'Zone14',
  accountNumber: '000-000-00000',
  routingNumber: '090260439',
};

/* Hero section copy — overridable from admin */
let HERO = {
  title:    'GEAR UP FOR THE',
  accent:   'WORLD CUP 2026',
  subtitle: 'Premium World Cup 2026 jerseys, handcrafted in Bangladesh. Worn by champions, built for fans.',
};

/* Contact info shown in footer + uses across the site — overridable from admin */
let CONTACT = {
  address:     'Lalmatia Block D, Dhanmondi, Dhaka, Bangladesh',
  phone:       '+8801723360078',
  phoneDisplay:'+880 1723-360078',
  email:       'zoneforteen@gmail.com',
  hours:       'Open daily · 10am – 10pm',
  brandDesc:   'Premium football jerseys for the true fan. Built in Bangladesh, worn worldwide.',
};

/* Social links — overridable from admin */
let SOCIAL = {
  facebook:  'https://www.facebook.com/zoneforteen/',
  instagram: 'https://www.instagram.com/zoneforteen/',
  messenger: 'https://m.me/zoneforteen',
  tiktok:    '',
  youtube:   '',
};

/* Homepage Offers section cards — overridable from admin */
let OFFERS = [
  {
    tag: 'Most Popular', title: 'Buy 2 Get 1', accent: 'FREE', featured: true,
    description: 'Pick any three jerseys. Pay for two. Cheapest one is on us.',
    priceLine: '<span class="strike">৳4,497</span> ৳4,000',
    ctaText: 'Claim Offer',
    ctaUrl: '#jerseys',
  },
  {
    tag: 'Squad Goals', title: 'Full Team Set', accent: '−25%', featured: false,
    description: 'Buy 5 or more jerseys in one order. Perfect for clubs and friends.',
    priceLine: '<span class="strike">৳7,495</span> ৳6,500',
    ctaText: 'Order Team Set',
    ctaUrl: '#jerseys',
  },
  {
    tag: 'Limited Time', title: 'World Cup', accent: '10% OFF', featured: false,
    description: 'Every kit, no minimum. Use code at checkout — only until kick-off on 11 June.',
    priceLine: 'Code · <span class="accent" style="font-family:\'Courier New\',monospace;letter-spacing:0.1em">WC2026</span>',
    ctaText: 'Shop With Code',
    ctaUrl: '#jerseys',
  },
];

/* ---------- WORLD CUP 2026 MATCH HUB ----------
   Real group-stage fixtures for the four teams we sell jerseys for, from the
   actual WC 2026 draw: Brazil (Group C), Spain (Group H), France (Group I),
   Argentina (Group J). Matchday-1 dates/times are confirmed from the live feed.
   Matchday-2 & 3 dates are best-estimates within the official matchday windows —
   the live auto-score sync (syncLiveScores) overrides scores + results with real
   data the moment each match kicks off / finishes, so accuracy is self-healing.
   Each match carries `group` so the standings table can compute live. */
const MATCHES = [
  /* ----- Group C · Brazil ----- */
  { id:'c-bra-mar', group:'C', date:'2026-06-13T22:00:00Z', stage:'Group C · Matchday 1', home:'BRA', away:'MAR', venue:'SoFi Stadium',        city:'Los Angeles' },
  { id:'c-bra-sco', group:'C', date:'2026-06-19T22:00:00Z', stage:'Group C · Matchday 2', home:'BRA', away:'SCO', venue:'Hard Rock Stadium',   city:'Miami' },
  { id:'c-bra-hai', group:'C', date:'2026-06-24T20:00:00Z', stage:'Group C · Matchday 3', home:'BRA', away:'HAI', venue:'Mercedes-Benz Stadium',city:'Atlanta' },

  /* ----- Group H · Spain ----- */
  { id:'h-esp-cpv', group:'H', date:'2026-06-15T16:00:00Z', stage:'Group H · Matchday 1', home:'ESP', away:'CPV', venue:'Lumen Field',         city:'Seattle' },
  { id:'h-esp-ksa', group:'H', date:'2026-06-20T16:00:00Z', stage:'Group H · Matchday 2', home:'ESP', away:'KSA', venue:'Levi\'s Stadium',     city:'San Francisco Bay' },
  { id:'h-esp-uru', group:'H', date:'2026-06-25T16:00:00Z', stage:'Group H · Matchday 3', home:'ESP', away:'URU', venue:'SoFi Stadium',        city:'Los Angeles' },

  /* ----- Group I · France ----- */
  { id:'i-fra-sen', group:'I', date:'2026-06-16T19:00:00Z', stage:'Group I · Matchday 1', home:'FRA', away:'SEN', venue:'MetLife Stadium',     city:'New York / NJ' },
  { id:'i-fra-irq', group:'I', date:'2026-06-21T19:00:00Z', stage:'Group I · Matchday 2', home:'FRA', away:'IRQ', venue:'Gillette Stadium',    city:'Boston' },
  { id:'i-fra-nor', group:'I', date:'2026-06-26T19:00:00Z', stage:'Group I · Matchday 3', home:'FRA', away:'NOR', venue:'Lincoln Financial',   city:'Philadelphia' },

  /* ----- Group J · Argentina ----- */
  { id:'j-arg-alg', group:'J', date:'2026-06-17T01:00:00Z', stage:'Group J · Matchday 1', home:'ARG', away:'ALG', venue:'AT&T Stadium',        city:'Dallas' },
  { id:'j-arg-aut', group:'J', date:'2026-06-22T01:00:00Z', stage:'Group J · Matchday 2', home:'ARG', away:'AUT', venue:'NRG Stadium',         city:'Houston' },
  { id:'j-arg-jor', group:'J', date:'2026-06-27T01:00:00Z', stage:'Group J · Matchday 3', home:'ARG', away:'JOR', venue:'Estadio Azteca',      city:'Mexico City' },
];

/* Group standings — the four groups featuring our jerseys. Stats start at 0
   and are recomputed live from real results by computeGroupStats() in script.js. */
const GROUPS = [
  { name:'C', teams:[
    { code:'BRA', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'MAR', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'SCO', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'HAI', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
  ]},
  { name:'H', teams:[
    { code:'ESP', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'URU', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'CPV', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'KSA', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
  ]},
  { name:'I', teams:[
    { code:'FRA', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'SEN', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'NOR', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'IRQ', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
  ]},
  { name:'J', teams:[
    { code:'ARG', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'AUT', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'ALG', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'JOR', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
  ]},
];

/* Host stadiums (8 of the 16 WC 2026 venues — most-attended subset) */
const VENUES = [
  { city:'Mexico City', stadium:'Estadio Azteca',       country:'MEX', cap:87000 },
  { city:'New York/NJ', stadium:'MetLife Stadium',      country:'USA', cap:82500 },
  { city:'Dallas',      stadium:'AT&T Stadium',         country:'USA', cap:80000 },
  { city:'Atlanta',     stadium:'Mercedes-Benz Stadium',country:'USA', cap:71000 },
  { city:'Los Angeles', stadium:'SoFi Stadium',         country:'USA', cap:70000 },
  { city:'Seattle',     stadium:'Lumen Field',          country:'USA', cap:69000 },
  { city:'Miami',       stadium:'Hard Rock Stadium',    country:'USA', cap:65000 },
  { city:'Vancouver',   stadium:'BC Place',             country:'CAN', cap:54000 },
];

/* Country names + ISO-2 codes (for flagcdn.com images) + palette + flag gradient
   used to color the country name text in jersey cards. Gradients mirror the
   horizontal/vertical bands of each national flag. */
const COUNTRY = {
  ARG: { name:'Argentina',     iso2:'ar',     bg:'#75aadb', fg:'#1a3a5e',
         gradient:'linear-gradient(180deg, #75aadb 0% 33%, #ffffff 33% 67%, #75aadb 67% 100%)' },
  BRA: { name:'Brazil',        iso2:'br',     bg:'#fbe10d', fg:'#009c3b',
         gradient:'linear-gradient(135deg, #009c3b 0% 50%, #fbe10d 50% 100%)' },
  FRA: { name:'France',        iso2:'fr',     bg:'#1e3a8a', fg:'#ffffff',
         gradient:'linear-gradient(90deg, #1e3a8a 0% 33%, #ffffff 33% 67%, #ef4135 67% 100%)' },
  ESP: { name:'Spain',         iso2:'es',     bg:'#c60b1e', fg:'#ffc400',
         gradient:'linear-gradient(180deg, #c60b1e 0% 25%, #ffc400 25% 75%, #c60b1e 75% 100%)' },
  GER: { name:'Germany',       iso2:'de',     bg:'#1a1a1a', fg:'#ffffff',
         gradient:'linear-gradient(180deg, #d8d8d8 0% 33%, #ee0a17 33% 67%, #ffce00 67% 100%)' },
  POR: { name:'Portugal',      iso2:'pt',     bg:'#c8102e', fg:'#006a44',
         gradient:'linear-gradient(90deg, #006a44 0% 40%, #ffd700 40% 50%, #c8102e 50% 100%)' },
  ENG: { name:'England',       iso2:'gb-eng', bg:'#ffffff', fg:'#cf142b',
         gradient:'linear-gradient(90deg, #ffffff 0% 40%, #cf142b 40% 60%, #ffffff 60% 100%)' },
  ITA: { name:'Italy',         iso2:'it',     bg:'#0066b3', fg:'#ffffff',
         gradient:'linear-gradient(90deg, #009246 0% 33%, #ffffff 33% 67%, #ce2b37 67% 100%)' },
  NED: { name:'Netherlands',   iso2:'nl',     bg:'#ff6b00', fg:'#0a1a4a',
         gradient:'linear-gradient(180deg, #ae1c28 0% 33%, #ffffff 33% 67%, #21468b 67% 100%)' },
  MEX: { name:'Mexico',        iso2:'mx',     bg:'#006847', fg:'#ce1126' },
  USA: { name:'USA',           iso2:'us',     bg:'#0a1f5c', fg:'#ffffff' },
  CAN: { name:'Canada',        iso2:'ca',     bg:'#d52b1e', fg:'#ffffff' },
  JPN: { name:'Japan',         iso2:'jp',     bg:'#ffffff', fg:'#bc002d' },
  KSA: { name:'Saudi Arabia',  iso2:'sa',     bg:'#006c35', fg:'#ffffff' },
  AUS: { name:'Australia',     iso2:'au',     bg:'#012169', fg:'#ffd700' },
  EGY: { name:'Egypt',         iso2:'eg',     bg:'#ce1126', fg:'#ffffff' },
  SUI: { name:'Switzerland',   iso2:'ch',     bg:'#d52b1e', fg:'#ffffff' },
  CRO: { name:'Croatia',       iso2:'hr',     bg:'#171796', fg:'#ffffff' },
  TUN: { name:'Tunisia',       iso2:'tn',     bg:'#e70013', fg:'#ffffff' },
  CRC: { name:'Costa Rica',    iso2:'cr',     bg:'#002b7f', fg:'#ce1126' },
  DEN: { name:'Denmark',       iso2:'dk',     bg:'#c8102e', fg:'#ffffff' },
  CIV: { name:"Côte d'Ivoire", iso2:'ci',     bg:'#ff8200', fg:'#009639' },
  PAN: { name:'Panama',        iso2:'pa',     bg:'#005293', fg:'#d21034' },
  SEN: { name:'Senegal',       iso2:'sn',     bg:'#00853f', fg:'#fdef42' },
  NOR: { name:'Norway',        iso2:'no',     bg:'#ef2b2d', fg:'#002868' },
  MAR: { name:'Morocco',       iso2:'ma',     bg:'#c1272d', fg:'#006233' },
  HAI: { name:'Haiti',         iso2:'ht',     bg:'#00209f', fg:'#d21034' },
  SCO: { name:'Scotland',      iso2:'gb-sct', bg:'#0065bf', fg:'#ffffff' },
  CPV: { name:'Cape Verde',    iso2:'cv',     bg:'#003893', fg:'#cf2027' },
  URU: { name:'Uruguay',       iso2:'uy',     bg:'#7b9ce1', fg:'#001489' },
  IRQ: { name:'Iraq',          iso2:'iq',     bg:'#007a3d', fg:'#ce1126' },
  ALG: { name:'Algeria',       iso2:'dz',     bg:'#006233', fg:'#d21034' },
  AUT: { name:'Austria',       iso2:'at',     bg:'#ed2939', fg:'#ffffff' },
  JOR: { name:'Jordan',        iso2:'jo',     bg:'#007a3d', fg:'#ce1126' },
};

/* Real country flag (from flagcdn.com — works under file:// too) */
function flagImg(code, alt) {
  const c = COUNTRY[code];
  if (!c || !c.iso2) return '';
  return `<img class="flag-img" src="https://flagcdn.com/${c.iso2}.svg" alt="${alt || c.name}" loading="lazy" />`;
}

/* Which country codes have jerseys in our catalog (for the "Get the Kit" button) */
const COUNTRY_TO_JERSEY = {
  ARG: 'arg-home',
  BRA: 'bra-home',
  FRA: 'fra-home',
  ESP: 'esp-home',
};

/* ---------- STAR PLAYERS — drive custom-print upsell ---------- */
let PLAYERS = [
  { id:'messi',    name:'MESSI',    number:10, country:'ARG', jersey:'arg-home', position:'Forward',    blurb:'Captain · 8× Ballon d\'Or' },
  { id:'mac',      name:'MAC ALL.', number:20, country:'ARG', jersey:'arg-home', position:'Midfielder', blurb:'2022 WC Final scorer' },
  { id:'vini',     name:'VINI JR',  number:7,  country:'BRA', jersey:'bra-home', position:'Forward',    blurb:'Real Madrid · Samba magic' },
  { id:'rodrygo',  name:'RODRYGO',  number:10, country:'BRA', jersey:'bra-home', position:'Forward',    blurb:'Brazil\'s playmaker' },
  { id:'mbappe',   name:'MBAPPÉ',   number:10, country:'FRA', jersey:'fra-home', position:'Forward',    blurb:'Captain · Real Madrid' },
  { id:'griez',    name:'GRIEZMANN',number:7,  country:'FRA', jersey:'fra-home', position:'Forward',    blurb:'Maestro · 2018 WC winner' },
  { id:'pedri',    name:'PEDRI',    number:8,  country:'ESP', jersey:'esp-home', position:'Midfielder', blurb:'La Roja\'s engine' },
  { id:'yamal',    name:'YAMAL',    number:19, country:'ESP', jersey:'esp-home', position:'Winger',     blurb:'Generational talent' },
];

/* ---------- SOCIAL PROOF — rotating order toasts ---------- */
const SOCIAL_PROOF = [
  { name:'Rakib',   city:'Sylhet',     action:'ordered Brazil Home, size L',                       minsAgo:2  },
  { name:'Tahmid',  city:'Chattogram', action:'added Argentina Home to cart',                       minsAgo:4  },
  { name:'Sadia',   city:'Dhaka',      action:'claimed the BUY 2 GET 1 FREE offer',                 minsAgo:7  },
  { name:'Mahir',   city:'Khulna',     action:'bought a France kit with MBAPPÉ 10 print',           minsAgo:11 },
  { name:'Nusrat',  city:'Dhanmondi',  action:'ordered Spain Home with custom name',                minsAgo:13 },
  { name:'Arif',    city:'Mirpur',     action:'ordered Argentina Home, size M · MESSI 10',          minsAgo:16 },
  { name:'Rashed',  city:'Rajshahi',   action:'completed Full Team Set (5 jerseys, -25%)',          minsAgo:21 },
  { name:'Imran',   city:'Gulshan',    action:'ordered Brazil Home with VINI 7 print',              minsAgo:25 },
  { name:'Sumaiya', city:'Bashundhara',action:'added France Home to wishlist',                       minsAgo:31 },
  { name:'Sakib',   city:'Comilla',    action:'ordered Spain Home, size XL',                        minsAgo:38 },
  { name:'Faisal',  city:'Mymensingh', action:'used code WC2026 for 10% off',                       minsAgo:45 },
  { name:'Tania',   city:'Banani',     action:'ordered Argentina Home, size S',                     minsAgo:52 },
];

/* ---------- WISHLIST helpers (localStorage — persists across visits) ---------- */
const WL_KEY = 'zone14_wishlist_v1';
function readWishlist() {
  try { return JSON.parse(localStorage.getItem(WL_KEY)) || []; }
  catch (_) { return []; }
}
function writeWishlist(ids) {
  localStorage.setItem(WL_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('wishlist:change', { detail: ids }));
}
function toggleWishlist(id) {
  const list = readWishlist();
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1);
  else list.push(id);
  writeWishlist(list);
  return list.includes(id);
}
function inWishlist(id) { return readWishlist().includes(id); }
function wishlistCount() { return readWishlist().length; }

/* ---------- BD divisions for the address dropdown (legacy fallback) ---------- */
const BD_DIVISIONS = [
  'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi',
  'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh'
];

/* ---------- BD locations — cascading Division → District → Thana ----------
   Thanas/upazilas listed for the major districts. For sparser districts,
   the thana dropdown shows the district itself + "Other (type below)". */
const BD_LOCATIONS = {
  Dhaka: {
    Dhaka: [
      'Adabar', 'Badda', 'Banani', 'Bangshal', 'Bashundhara', 'Cantonment', 'Chawkbazar',
      'Dakshinkhan', 'Darus Salam', 'Demra', 'Dhanmondi', 'Gandaria', 'Gulshan',
      'Hatirjheel', 'Hazaribagh', 'Jatrabari', 'Kadamtali', 'Kafrul', 'Kalabagan',
      'Kamrangirchar', 'Khilgaon', 'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur',
      'Mohammadpur', 'Motijheel', 'New Market', 'Paltan', 'Pallabi', 'Ramna',
      'Rampura', 'Sabujbagh', 'Shah Ali', 'Shahbagh', 'Shahjahanpur',
      'Sher-e-Bangla Nagar', 'Shyampur', 'Sutrapur', 'Tejgaon', 'Turag',
      'Uttara', 'Uttarkhan', 'Vatara', 'Wari'
    ],
    Gazipur:    ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Kaliganj', 'Sreepur', 'Tongi'],
    Narayanganj:['Narayanganj Sadar', 'Bandar', 'Sonargaon', 'Araihazar', 'Rupganj'],
    Tangail:    ['Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Dhanbari'],
    Kishoreganj:['Kishoreganj Sadar', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail', 'Austagram'],
    Manikganj:  ['Manikganj Sadar', 'Daulatpur', 'Ghior', 'Harirampur', 'Saturia', 'Shibalaya', 'Singair'],
    Munshiganj: ['Munshiganj Sadar', 'Gazaria', 'Lohajang', 'Sirajdikhan', 'Sreenagar', 'Tongibari'],
    Faridpur:   ['Faridpur Sadar', 'Alfadanga', 'Bhanga', 'Boalmari', 'Charbhadrasan', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha'],
    Narsingdi:  ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'],
    Gopalganj:  ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
    Madaripur:  ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar'],
    Shariatpur: ['Shariatpur Sadar', 'Bhedarganj', 'Damudya', 'Gosairhat', 'Naria', 'Zajira'],
    Rajbari:    ['Rajbari Sadar', 'Baliakandi', 'Goalandaghat', 'Pangsha', 'Kalukhali'],
  },
  Chattogram: {
    Chattogram: [
      'Bayazid', 'Bandar', 'Boalkhali', 'Anwara', 'Banshkhali', 'Chandanaish',
      'Chandgaon', 'Chittagong Port', 'Double Mooring', 'Fatikchhari', 'Halishahar',
      'Hathazari', 'Karnaphuli', 'Khulshi', 'Kotwali', 'Lohagara', 'Mirsharai',
      'Pahartali', 'Panchlaish', 'Patenga', 'Patiya', 'Rangunia', 'Raozan',
      'Sandwip', 'Satkania', 'Sitakunda'
    ],
    "Cox's Bazar":['Cox\'s Bazar Sadar', 'Chakaria', 'Kutubdia', 'Maheshkhali', 'Pekua', 'Ramu', 'Teknaf', 'Ukhia'],
    Cumilla:      ['Cumilla Adarsha Sadar', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Manoharganj', 'Meghna', 'Muradnagar', 'Nangalkot', 'Sadar Dakshin', 'Titas'],
    Feni:         ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Fulgazi', 'Parshuram', 'Sonagazi'],
    Noakhali:     ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Kabirhat', 'Senbagh', 'Sonaimuri', 'Subarnachar'],
    Lakshmipur:   ['Lakshmipur Sadar', 'Kamalnagar', 'Raipur', 'Ramganj', 'Ramgati'],
    Chandpur:     ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti'],
    Brahmanbaria: ['Brahmanbaria Sadar', 'Akhaura', 'Ashuganj', 'Bancharampur', 'Bijoynagar', 'Kasba', 'Nabinagar', 'Nasirnagar', 'Sarail'],
    Khagrachhari: ['Khagrachhari Sadar', 'Dighinala', 'Lakshmichhari', 'Mahalchhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh'],
    Rangamati:    ['Rangamati Sadar', 'Bagaichhari', 'Barkal', 'Belaichhari', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali'],
    Bandarban:    ['Bandarban Sadar', 'Alikadam', 'Lama', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi'],
  },
  Khulna: {
    Khulna:    ['Khalishpur', 'Khan Jahan Ali', 'Sonadanga', 'Khulna Sadar', 'Daulatpur', 'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsa', 'Terokhada'],
    Bagerhat:  ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
    Satkhira:  ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
    Jessore:   ['Jessore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
    Jhenaidah: ['Jhenaidah Sadar', 'Harinakunda', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'],
    Magura:    ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
    Narail:    ['Narail Sadar', 'Kalia', 'Lohagara'],
    Kushtia:   ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Mirpur'],
    Chuadanga: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
    Meherpur:  ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
  },
  Rajshahi: {
    Rajshahi:        ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Paba', 'Puthia', 'Tanore'],
    Naogaon:         ['Naogaon Sadar', 'Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mahadebpur', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'],
    Natore:          ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Singra', 'Naldanga'],
    Chapainawabganj: ['Chapainawabganj Sadar', 'Bholahat', 'Gomastapur', 'Nachole', 'Shibganj'],
    Pabna:           ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'],
    Sirajganj:       ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullahpara'],
    Bogura:          ['Bogura Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatala'],
    Joypurhat:       ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'],
  },
  Sylhet: {
    Sylhet:     ['Sylhet Sadar', 'Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Dakshin Surma', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmaninagar', 'Zakiganj'],
    Habiganj:   ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniyachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Shaistaganj'],
    Moulvibazar:['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal'],
    Sunamganj:  ['Sunamganj Sadar', 'Bishwambarpur', 'Chhatak', 'Derai', 'Dharmapasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sullah', 'Tahirpur', 'South Sunamganj', 'Madhyanagar'],
  },
  Barishal: {
    Barishal:   ['Barishal Sadar', 'Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'],
    Bhola:      ['Bhola Sadar', 'Borhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
    Patuakhali: ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Dumki', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Rangabali'],
    Pirojpur:   ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad', 'Zianagar'],
    Jhalokati:  ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
    Barguna:    ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali'],
  },
  Rangpur: {
    Rangpur:    ['Rangpur Sadar', 'Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
    Dinajpur:   ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Phulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
    Thakurgaon: ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranisankail'],
    Panchagarh: ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'],
    Nilphamari: ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Saidpur'],
    Lalmonirhat:['Lalmonirhat Sadar', 'Aditmari', 'Hatibandha', 'Kaliganj', 'Patgram'],
    Kurigram:   ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Phulbari', 'Nageshwari', 'Rajarhat', 'Raumari', 'Ulipur'],
    Gaibandha:  ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'],
  },
  Mymensingh: {
    Mymensingh:['Mymensingh Sadar', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Tarakanda', 'Trishal'],
    Jamalpur:  ['Jamalpur Sadar', 'Bakshiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'],
    Sherpur:   ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'],
    Netrokona: ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Khaliajuri', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Purbadhala'],
  },
};

/* ---------- ORDERS (localStorage — viewable from the admin page) ---------- */
const ORDERS_KEY = 'zone14_orders_v1';
function readOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
  catch (_) { return []; }
}
function writeOrders(list) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
}
function saveOrder(order) {
  const list = readOrders();
  list.unshift(order);            // newest first
  writeOrders(list);
}
function updateOrderStatus(ref, status) {
  const list = readOrders();
  const o = list.find(x => x.ref === ref);
  if (o) { o.status = status; o.statusUpdatedAt = Date.now(); writeOrders(list); }
  return o;
}
function deleteOrder(ref) {
  writeOrders(readOrders().filter(o => o.ref !== ref));
}

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

/* ============================================================
   SUPABASE — real shared backend for predictions + results.
   Anon key below is the PUBLIC client-side key (safe to commit);
   Row-Level Security policies in supabase-setup.sql gate writes.
   ============================================================ */
const SUPABASE_CFG = {
  url:  'https://ndtndrnzhfmlyukjjypv.supabase.co',
  anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdG5kcm56aGZtbHl1a2pqeXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0Njg2ODIsImV4cCI6MjA5NTA0NDY4Mn0.yc5eVYz-hnC-IRjC8JWRUfVOGDoroYl-SbETQnFBoIY',
};
let _sb = null;
function getSupabase() {
  if (_sb) return _sb;
  if (typeof supabase === 'undefined') return null;   // CDN not loaded yet
  _sb = supabase.createClient(SUPABASE_CFG.url, SUPABASE_CFG.anon, {
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return _sb;
}

/* Pull latest predictions + results from Supabase into localStorage cache.
   Called on page load and on every realtime change broadcast.
   Returns true if sync succeeded. */
async function syncFromSupabase() {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const [
      { data: preds,    error: e1 },
      { data: results,  error: e2 },
      { data: media,    error: e3 },
      { data: reviews,  error: e4 },
      { data: showcase, error: e5 },
      { data: jerseys,  error: e6 },
      { data: settings, error: e7 },
      { data: heroVids, error: e8 },
      { data: salesRows, error: e9 },
      { data: stockRows, error: e10 },
      { data: expenseRows, error: e11 },
    ] = await Promise.all([
      sb.from('predictions').select('*'),
      sb.from('match_results').select('*'),
      sb.from('jersey_media').select('*').order('sort_order').order('uploaded_at'),
      sb.from('customer_reviews').select('*').eq('approved', true)
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false }),
      sb.from('showcase_videos').select('*')
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false }),
      sb.from('jerseys').select('*').eq('hidden', false)
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: true }),
      sb.from('site_settings').select('*'),
      sb.from('hero_videos').select('*')
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false }),
      sb.from('sales').select('*').order('sold_at', { ascending: false }),
      sb.from('stock').select('*'),
      sb.from('expenses').select('*').order('spent_at', { ascending: false }),
    ]);

    // Site settings — apply before anything else so prices/promos are correct
    if (!e7 && Array.isArray(settings)) {
      const map = {};
      settings.forEach(r => { map[r.key] = r.value; });
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
      applySettings(map);
    }
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;
    // jerseys override — when populated, replaces the static seed catalog
    if (!e6 && jerseys && jerseys.length > 0) {
      const mapped = jerseys.map(rowToJersey);
      localStorage.setItem(JERSEYS_KEY, JSON.stringify(mapped));
      setJerseys(mapped);
    }

    // sales + stock errors non-fatal — tables may not exist yet on first deploy
    if (!e9 && Array.isArray(salesRows)) {
      localStorage.setItem(SALES_KEY, JSON.stringify(salesRows.map(rowToSale)));
      window.dispatchEvent(new CustomEvent('sales:change'));
    }
    if (!e10 && Array.isArray(stockRows)) {
      const map = {};
      stockRows.forEach(r => {
        if (!map[r.jersey_id]) map[r.jersey_id] = {};
        map[r.jersey_id][r.size] = r.qty;
      });
      localStorage.setItem(STOCK_KEY, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent('stock:change'));
    }
    if (!e11 && Array.isArray(expenseRows)) {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenseRows.map(rowToExpense)));
      window.dispatchEvent(new CustomEvent('expenses:change'));
    }

    // hero videos error non-fatal — table may not exist yet on first deploy
    if (!e8 && heroVids) {
      const localHero = heroVids.map(r => ({
        id:         r.id,
        videoUrl:   r.video_url,
        videoPath:  r.video_path,
        posterUrl:  r.poster_url,
        posterPath: r.poster_path,
        sortOrder:  r.sort_order,
        createdAt:  r.created_at ? new Date(r.created_at).getTime() : null,
      }));
      localStorage.setItem(HERO_VIDEOS_KEY, JSON.stringify(localHero));
      window.dispatchEvent(new CustomEvent('herovideos:change'));
    }

    // showcase error non-fatal — table may not exist yet on first deploy
    if (!e5 && showcase) {
      const localShowcase = showcase.map(r => ({
        id:         r.id,
        title:      r.title,
        subtitle:   r.subtitle,
        duration:   r.duration,
        videoUrl:   r.video_url,
        videoPath:  r.video_path,
        posterUrl:  r.poster_url,
        posterPath: r.poster_path,
        jerseyId:   r.jersey_id,
        sortOrder:  r.sort_order,
        createdAt:  r.created_at ? new Date(r.created_at).getTime() : null,
      }));
      localStorage.setItem(SHOWCASE_KEY, JSON.stringify(localShowcase));
      window.dispatchEvent(new CustomEvent('showcase:change'));
    }
    // reviews error is non-fatal — table may not exist yet on first deploy
    if (!e4 && reviews) {
      const localReviews = reviews.map(r => ({
        id:           r.id,
        name:         r.name,
        location:     r.location,
        rating:       r.rating,
        text:         r.review_text,
        purchaseInfo: r.purchase_info,
        photoUrl:     r.photo_url,
        photoPath:    r.photo_path,
        videoUrl:     r.video_url,
        videoPath:    r.video_path,
        createdAt:    r.created_at ? new Date(r.created_at).getTime() : null,
      }));
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(localReviews));
      window.dispatchEvent(new CustomEvent('reviews:change'));
    }

    // jersey_media → group by jersey_id into local cache shape
    const mediaByJersey = {};
    (media || []).forEach(r => {
      if (!mediaByJersey[r.jersey_id]) mediaByJersey[r.jersey_id] = { images: [], videos: [] };
      const asset = {
        id:           r.id,
        type:         r.type,
        url:          r.url,
        storagePath:  r.storage_path,
        name:         r.name,
        size:         r.size_bytes,
        uploadedAt:   r.uploaded_at ? new Date(r.uploaded_at).getTime() : null,
      };
      mediaByJersey[r.jersey_id][r.type === 'video' ? 'videos' : 'images'].push(asset);
    });
    localStorage.setItem(MEDIA_KEY, JSON.stringify(mediaByJersey));
    window.dispatchEvent(new CustomEvent('media:change'));

    const local = (preds || []).map(p => ({
      id:        p.id,
      matchId:   p.match_id,
      name:      p.name,
      choice:    p.choice,
      createdAt: new Date(p.created_at).getTime(),
      updatedAt: p.updated_at ? new Date(p.updated_at).getTime() : null,
    }));
    localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(local));

    const map = {};
    (results || []).forEach(r => {
      map[r.match_id] = {
        homeScore:  r.home_score,
        awayScore:  r.away_score,
        outcome:    r.outcome,
        finishedAt: new Date(r.finished_at).getTime(),
      };
    });
    localStorage.setItem(RESULTS_KEY, JSON.stringify(map));

    window.dispatchEvent(new CustomEvent('predictions:change'));
    window.dispatchEvent(new CustomEvent('results:change'));
    return true;
  } catch (err) {
    console.warn('Supabase sync failed (using localStorage cache):', err.message || err);
    return false;
  }
}

/* Subscribe to realtime changes — leaderboard updates the moment
   anyone in the world submits a prediction or the admin enters a result. */
function subscribeToSupabaseChanges() {
  const sb = getSupabase();
  if (!sb) return;
  sb.channel('zone14-predictions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' },
        () => syncFromSupabase())
    .subscribe();
  sb.channel('zone14-results')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results' },
        () => syncFromSupabase())
    .subscribe();
  sb.channel('zone14-jersey-media')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jersey_media' },
        () => syncFromSupabase())
    .subscribe();
  sb.channel('zone14-customer-reviews')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_reviews' },
        () => syncFromSupabase())
    .subscribe();
  sb.channel('zone14-showcase-videos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_videos' },
        () => syncFromSupabase())
    .subscribe();
  sb.channel('zone14-hero-videos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_videos' },
        () => syncFromSupabase())
    .subscribe();
  sb.channel('zone14-jerseys')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jerseys' },
        () => syncFromSupabase())
    .subscribe();
  sb.channel('zone14-site-settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' },
        () => syncFromSupabase())
    .subscribe();
}

/* On page boot, hydrate JERSEYS from localStorage cache instantly (before
   the network sync completes) so the catalog reflects admin changes from
   the very first paint, not after a 300ms Supabase round-trip. */
(function hydrateJerseysFromCache() {
  try {
    const raw = localStorage.getItem(JERSEYS_KEY);
    if (!raw) return;
    const cached = JSON.parse(raw);
    if (Array.isArray(cached) && cached.length > 0) {
      // Defer until JERSEYS const has been assigned below
      setTimeout(() => setJerseys(cached), 0);
    }
  } catch (_) {}
})();

/* Background pushes — called from savePrediction / saveResult / clearResult.
   Fire-and-forget; UI doesn't wait on them. */
async function pushPrediction(matchId, name, choice) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { error } = await sb.from('predictions').upsert({
      match_id:   matchId,
      name:       name,
      choice:     choice,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'match_id,name' });
    if (error) throw error;
  } catch (err) { console.warn('Push prediction failed:', err.message || err); }
}
async function pushResult(matchId, homeScore, awayScore, outcome) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { error } = await sb.from('match_results').upsert({
      match_id:    matchId,
      home_score:  homeScore,
      away_score:  awayScore,
      outcome:     outcome,
      finished_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (err) { console.warn('Push result failed:', err.message || err); }
}
async function deleteResultRemote(matchId) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { error } = await sb.from('match_results').delete().eq('match_id', matchId);
    if (error) throw error;
  } catch (err) { console.warn('Delete result failed:', err.message || err); }
}

/* ============================================================
   MATCH PREDICTIONS + RESULTS
   Cache-first: localStorage powers instant reads, Supabase is
   source of truth — synced on load and via realtime broadcasts.
   ============================================================ */
const PREDICTIONS_KEY = 'zone14_predictions_v1';
const RESULTS_KEY     = 'zone14_results_v1';
const PREDICTOR_KEY   = 'zone14_predictor_name'; // remembers visitor's name

function readPredictions() {
  try { return JSON.parse(localStorage.getItem(PREDICTIONS_KEY)) || []; }
  catch (_) { return []; }
}
function writePredictions(list) {
  localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('predictions:change'));
}
function savePrediction(matchId, name, choice) {
  const clean = name.trim();
  if (!clean) return false;
  const list = readPredictions();
  const idx = list.findIndex(p =>
    p.matchId === matchId && p.name.toLowerCase() === clean.toLowerCase()
  );
  if (idx >= 0) {
    list[idx].choice    = choice;
    list[idx].updatedAt = Date.now();
  } else {
    list.push({
      id:        'p_' + Math.random().toString(36).slice(2, 10),
      matchId, name: clean, choice,
      createdAt: Date.now(),
    });
  }
  writePredictions(list);
  localStorage.setItem(PREDICTOR_KEY, clean);   // remember for next time
  pushPrediction(matchId, clean, choice);       // sync to Supabase (fire & forget)
  return true;
}
function getPredictorName() {
  return localStorage.getItem(PREDICTOR_KEY) || '';
}
function getMyPrediction(matchId) {
  const name = getPredictorName();
  if (!name) return null;
  return readPredictions().find(p =>
    p.matchId === matchId && p.name.toLowerCase() === name.toLowerCase()
  ) || null;
}

function readResults() {
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY)) || {}; }
  catch (_) { return {}; }
}
function writeResults(r) {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(r));
  window.dispatchEvent(new CustomEvent('results:change'));
}
function saveResult(matchId, homeScore, awayScore) {
  const home = Math.max(0, parseInt(homeScore, 10) || 0);
  const away = Math.max(0, parseInt(awayScore, 10) || 0);
  const outcome = home > away ? 'home' : away > home ? 'away' : 'draw';
  const r = readResults();
  r[matchId] = { homeScore: home, awayScore: away, outcome, finishedAt: Date.now() };
  writeResults(r);
  pushResult(matchId, home, away, outcome);   // sync to Supabase
  return r[matchId];
}
function clearResult(matchId) {
  const r = readResults();
  delete r[matchId];
  writeResults(r);
  deleteResultRemote(matchId);                // sync to Supabase
}

/* ---------- LIVE AUTO-SCORES (from the public WC feed) ----------
   Kept in their own localStorage key so they never collide with admin-entered
   match_results synced from Supabase. mergedResults() overlays them (live wins)
   for every consumer — match grid, group standings, leaderboard. */
const LIVE_KEY = 'zone14_live_scores_v1';
function readLiveScores() {
  try { return JSON.parse(localStorage.getItem(LIVE_KEY)) || {}; }
  catch (_) { return {}; }
}
function writeLiveScores(obj) {
  localStorage.setItem(LIVE_KEY, JSON.stringify(obj));
  window.dispatchEvent(new CustomEvent('results:change'));
}
/* Admin results + live auto-scores combined; the live feed takes precedence. */
function mergedResults() {
  return { ...readResults(), ...readLiveScores() };
}

/* Compute leaderboard — aggregate predictions across all results */
function computeLeaderboard() {
  const preds   = readPredictions();
  const results = mergedResults();
  const tally   = {};

  preds.forEach(p => {
    const key = p.name.trim().toLowerCase();
    if (!key) return;
    if (!tally[key]) {
      tally[key] = { name: p.name.trim(), correct: 0, scored: 0, pending: 0, total: 0 };
    }
    tally[key].total++;
    const r = results[p.matchId];
    if (r) {
      tally[key].scored++;
      if (r.outcome === p.choice) tally[key].correct++;
    } else {
      tally[key].pending++;
    }
  });

  return Object.values(tally).sort((a, b) =>
       b.correct - a.correct                   // most correct first
    || (b.scored ? b.correct/b.scored : 0) - (a.scored ? a.correct/a.scored : 0) // then accuracy
    || b.total - a.total                       // then most active
    || a.name.localeCompare(b.name)
  );
}

const PREDICTION_CHOICES = [
  { value: 'home', label: 'WIN' },
  { value: 'draw', label: 'DRAW' },
  { value: 'away', label: 'WIN' },
];

/* ============================================================
   MEDIA LIBRARY — admin-uploaded photos & videos per jersey
   ============================================================
   Uploads go to Supabase Storage (bucket: 'media'), URLs tracked in
   the jersey_media table, instantly visible to every customer worldwide
   via Supabase's CDN. localStorage acts purely as a read cache so the
   sync helpers stay fast.

   Cloud is always on now — there is no local-only fallback for uploads.
*/
function isCloudConfigured() {
  return !!getSupabase();
}

/* Client-side image compression — runs in the admin's browser before upload so
   customers download small, fast images. Resizes to maxW and re-encodes as WebP
   (keeps transparency + high quality). Non-images (and SVG/GIF) pass through
   untouched; if the result isn't smaller, the original is kept. */
function compressImage(file, maxW = 1400, quality = 0.82) {
  return new Promise(resolve => {
    if (!file || !file.type || !file.type.startsWith('image/') ||
        file.type.includes('svg') || file.type.includes('gif')) {
      return resolve(file);
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (!blob || blob.size >= file.size) return resolve(file);  // never upsize
        const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
        resolve(new File([blob], name, { type: 'image/webp', lastModified: Date.now() }));
      }, 'image/webp', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/* Client-side VIDEO compression — re-encodes in the admin browser via the
   built-in MediaRecorder (no external tools). Downscales to maxW, caps bitrate
   for fast customer loading, keeps audio, and prefers MP4 when the browser can
   record it (Safari) else WebM. Real-time: a 30s clip takes ~30s to process —
   onProgress(0..1) drives a progress bar. Falls back to the original on any
   failure or if the result isn't smaller, so uploads never break. */
function compressVideo(file, opts, onProgress) {
  opts = opts || {};
  const maxW = opts.maxW || 1280;
  const bitrate = opts.bitrate || 2800000;   // ~2.8 Mbps — quality-leaning
  return new Promise(resolve => {
    const ok = typeof MediaRecorder !== 'undefined' &&
               HTMLCanvasElement.prototype.captureStream;
    if (!file || !file.type || !file.type.startsWith('video/') || !ok) return resolve(file);

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url; video.muted = false; video.playsInline = true; video.preload = 'auto';
    const done = (f) => { try { URL.revokeObjectURL(url); } catch (_) {} resolve(f); };

    video.onloadedmetadata = () => {
      const scale = Math.min(1, maxW / (video.videoWidth || maxW));
      const w = Math.round((video.videoWidth || maxW) * scale);
      const h = Math.round((video.videoHeight || maxW) * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);

      // Keep audio — tap it through Web Audio (not wired to speakers, so it
      // records silently while processing).
      let audioCtx;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          audioCtx = new AC();
          const src = audioCtx.createMediaElementSource(video);
          const dest = audioCtx.createMediaStreamDestination();
          src.connect(dest);
          dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
          if (audioCtx.resume) audioCtx.resume();
        }
      } catch (_) {}

      let mime = 'video/mp4;codecs=h264,aac';
      if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mime)) { if (audioCtx) try{audioCtx.close();}catch(_){} return done(file); }
      const outExt = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
      const outType = mime.indexOf('mp4') >= 0 ? 'video/mp4' : 'video/webm';

      let rec;
      try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate }); }
      catch (_) { if (audioCtx) try{audioCtx.close();}catch(_){} return done(file); }

      const chunks = [];
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        try { if (audioCtx) audioCtx.close(); } catch (_) {}
        const blob = new Blob(chunks, { type: outType });
        if (!blob.size || blob.size >= file.size) return done(file);
        const name = file.name.replace(/\.[^.]+$/, '') + '.' + outExt;
        done(new File([blob], name, { type: outType, lastModified: Date.now() }));
      };

      const dur = video.duration || 0;
      const draw = () => {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, w, h);
        if (onProgress && dur) onProgress(Math.min(0.99, video.currentTime / dur));
        requestAnimationFrame(draw);
      };
      video.onended = () => { try { rec.stop(); } catch (_) {} if (onProgress) onProgress(1); };

      try { rec.start(1000); } catch (_) { return done(file); }
      video.play().then(draw).catch(() => { try { rec.stop(); } catch (_) {} done(file); });
    };
    video.onerror = () => done(file);
  });
}

/* Upload a single file to Supabase Storage + insert the matching
   jersey_media row. Returns the inserted row (with public url). */
async function cloudUpload(jerseyId, file) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');

  // Shrink before upload — images to WebP, videos re-encoded via MediaRecorder
  file = file.type && file.type.startsWith('video/')
    ? await compressVideo(file)
    : await compressImage(file);
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${jerseyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data: up, error: upErr } = await sb.storage
    .from('media')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  const { data: pub } = sb.storage.from('media').getPublicUrl(up.path);

  const { data: row, error: rowErr } = await sb.from('jersey_media').insert({
    jersey_id:    jerseyId,
    type:         file.type.startsWith('video/') ? 'video' : 'image',
    url:          pub.publicUrl,
    storage_path: up.path,
    name:         file.name,
    size_bytes:   file.size,
  }).select().single();
  if (rowErr) {
    // Clean up the orphaned storage object so we don't leak files
    try { await sb.storage.from('media').remove([up.path]); } catch (_) {}
    throw rowErr;
  }
  return row;
}

/* One-click migration: download each already-uploaded jersey photo, compress it
   (WebP ~1400px), re-upload, repoint the row, and delete the old fat file.
   Runs entirely in the admin browser. onProgress({done,total,optimized,saved}). */
async function recompressExistingMedia(onProgress) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');
  const { data: rows, error } = await sb.from('jersey_media').select('*').eq('type', 'image');
  if (error) throw error;

  const total = (rows || []).length;
  let done = 0, optimized = 0, saved = 0;

  for (const r of (rows || [])) {
    try {
      const resp = await fetch(r.url, { cache: 'no-store' });
      const blob = await resp.blob();
      const origSize = blob.size;
      const file = new File([blob], r.name || 'photo.jpg', { type: blob.type || 'image/jpeg' });
      const compressed = await compressImage(file);

      // Only replace when meaningfully smaller (>8%)
      if (compressed.size < origSize * 0.92) {
        const ext = (compressed.name.split('.').pop() || 'webp').toLowerCase();
        const path = `${r.jersey_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { data: up, error: upErr } = await sb.storage
          .from('media').upload(path, compressed, { contentType: compressed.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = sb.storage.from('media').getPublicUrl(up.path);

        const { error: updErr } = await sb.from('jersey_media').update({
          url: pub.publicUrl, storage_path: up.path,
          name: compressed.name, size_bytes: compressed.size,
        }).eq('id', r.id);
        if (updErr) { try { await sb.storage.from('media').remove([up.path]); } catch (_) {} throw updErr; }

        if (r.storage_path) { try { await sb.storage.from('media').remove([r.storage_path]); } catch (_) {} }
        optimized++; saved += (origSize - compressed.size);
      }
    } catch (e) {
      console.warn('Recompress skipped for', r.id, e.message || e);
    }
    done++;
    if (onProgress) onProgress({ done, total, optimized, saved });
  }
  return { total, optimized, saved };
}

/* Delete both the row and the underlying storage object.
   Each step is independently try/caught — Supabase's PostgrestFilterBuilder
   is awaitable but doesn't implement .catch(), so chaining .catch() on
   .eq(...) throws TypeError and silently breaks every delete button. */
async function cloudDelete(asset) {
  const sb = getSupabase();
  if (!sb) return;
  if (asset.storagePath) {
    try { await sb.storage.from('media').remove([asset.storagePath]); } catch (_) {}
  }
  try { await sb.from('jersey_media').delete().eq('id', asset.id); } catch (_) {}
}

/* Persist a new image order — sort_order ascending (0 = first/primary). */
async function pushMediaSortOrder(assets) {
  const sb = getSupabase();
  if (!sb) return;
  for (let i = 0; i < assets.length; i++) {
    try { await sb.from('jersey_media').update({ sort_order: i }).eq('id', assets[i].id); } catch (_) {}
  }
}

const MEDIA_KEY = 'zone14_media_v1';
function readMedia() {
  try { return JSON.parse(localStorage.getItem(MEDIA_KEY)) || {}; }
  catch (_) { return {}; }
}
function writeMedia(obj) {
  try {
    localStorage.setItem(MEDIA_KEY, JSON.stringify(obj));
    window.dispatchEvent(new CustomEvent('media:change'));
    return true;
  } catch (e) {
    return false;
  }
}

/* Asset shape: { id, jerseyId, type: 'image'|'video', url, name, size, uploadedAt }
   Storage shape: { [jerseyId]: { images: Asset[], videos: Asset[] } }      */
function getJerseyMedia(jerseyId) {
  const m = readMedia();
  return m[jerseyId] || { images: [], videos: [] };
}
function listAllAssets() {
  const m = readMedia();
  const out = [];
  Object.entries(m).forEach(([jid, bucket]) => {
    (bucket.images || []).forEach(a => out.push({ ...a, jerseyId: jid, type: 'image' }));
    (bucket.videos || []).forEach(a => out.push({ ...a, jerseyId: jid, type: 'video' }));
  });
  return out;
}
function addAsset(jerseyId, asset) {
  const m = readMedia();
  if (!m[jerseyId]) m[jerseyId] = { images: [], videos: [] };
  const bucket = asset.type === 'video' ? 'videos' : 'images';
  m[jerseyId][bucket].push(asset);
  return writeMedia(m);
}
function removeAsset(jerseyId, assetId) {
  const m = readMedia();
  if (!m[jerseyId]) return;
  m[jerseyId].images = (m[jerseyId].images || []).filter(a => a.id !== assetId);
  m[jerseyId].videos = (m[jerseyId].videos || []).filter(a => a.id !== assetId);
  writeMedia(m);
}
function clearAllMedia() {
  localStorage.removeItem(MEDIA_KEY);
  window.dispatchEvent(new CustomEvent('media:change'));
}

/* Read a File into a Base64 data URL — used for local-mode uploads */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/* Estimate current localStorage media-bucket size in bytes (rough) */
function mediaStorageBytes() {
  try { return new Blob([localStorage.getItem(MEDIA_KEY) || '']).size; }
  catch (_) { return 0; }
}

/* ============================================================
   CUSTOMER REVIEWS — admin-posted real reviews with optional photo
   Stored in Supabase customer_reviews table + media bucket for photos.
   localStorage acts as a sync cache so the carousel renders instantly.
   ============================================================ */
const REVIEWS_KEY = 'zone14_reviews_v1';

function readReviews() {
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || []; }
  catch (_) { return []; }
}
function writeReviews(arr) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent('reviews:change'));
}

async function pushReview(review, photoFile, videoFile) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');

  const uploadOne = async (file, folderName) => {
    file = await compressImage(file);          // shrink review photos before upload
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `${folderName}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data: up, error: upErr } = await sb.storage
      .from('media')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = sb.storage.from('media').getPublicUrl(up.path);
    return { url: pub.publicUrl, path: up.path };
  };

  let photo_url = null, photo_path = null;
  let video_url = null, video_path = null;
  const cleanup = [];

  try {
    if (photoFile) {
      const r = await uploadOne(photoFile, 'reviews');
      photo_url = r.url; photo_path = r.path;
      cleanup.push(r.path);
    }
    if (videoFile) {
      const r = await uploadOne(videoFile, 'reviews');
      video_url = r.url; video_path = r.path;
      cleanup.push(r.path);
    }

    const { data, error } = await sb.from('customer_reviews').insert({
      name:          review.name,
      location:      review.location || null,
      rating:        review.rating,
      review_text:   review.text,
      purchase_info: review.purchase || null,
      photo_url, photo_path,
      video_url, video_path,
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    // Clean up any uploaded files on row-insert failure
    if (cleanup.length) {
      try { await sb.storage.from('media').remove(cleanup); } catch (_) {}
    }
    throw err;
  }
}

async function deleteReviewRemote(id, photoPath, videoPath) {
  const sb = getSupabase();
  if (!sb) return;
  const toRemove = [photoPath, videoPath].filter(Boolean);
  if (toRemove.length) {
    try { await sb.storage.from('media').remove(toRemove); } catch (_) {}
  }
  try { await sb.from('customer_reviews').delete().eq('id', id); } catch (_) {}
}

/* ============================================================
   SHOWCASE VIDEOS — admin-uploaded curated "Jersey Videos" grid
   Independent of jersey_media. Stored in showcase_videos table
   + media bucket (folder: 'showcase/'). Cache-first read pattern. */
const SHOWCASE_KEY = 'zone14_showcase_v1';

function readShowcase() {
  try { return JSON.parse(localStorage.getItem(SHOWCASE_KEY)) || []; }
  catch (_) { return []; }
}
function writeShowcase(arr) {
  localStorage.setItem(SHOWCASE_KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent('showcase:change'));
}

async function pushShowcaseVideo(meta, videoFile, posterFile) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');

  const uploadOne = async (file) => {
    file = await compressImage(file);          // poster images shrink; videos pass through
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `showcase/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data: up, error: upErr } = await sb.storage
      .from('media')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = sb.storage.from('media').getPublicUrl(up.path);
    return { url: pub.publicUrl, path: up.path };
  };

  if (!videoFile) throw new Error('Video file is required');

  const cleanup = [];
  try {
    const vid = await uploadOne(videoFile);
    cleanup.push(vid.path);

    let posterUrl = null, posterPath = null;
    if (posterFile) {
      const p = await uploadOne(posterFile);
      posterUrl = p.url; posterPath = p.path;
      cleanup.push(p.path);
    }

    const { data, error } = await sb.from('showcase_videos').insert({
      title:       meta.title,
      subtitle:    meta.subtitle || null,
      duration:    meta.duration || null,
      jersey_id:   meta.jerseyId || null,
      sort_order:  meta.sortOrder || 0,
      video_url:   vid.url,
      video_path:  vid.path,
      poster_url:  posterUrl,
      poster_path: posterPath,
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    if (cleanup.length) {
      try { await sb.storage.from('media').remove(cleanup); } catch (_) {}
    }
    throw err;
  }
}

async function deleteShowcaseRemote(id, videoPath, posterPath) {
  const sb = getSupabase();
  if (!sb) return;
  const toRemove = [videoPath, posterPath].filter(Boolean);
  if (toRemove.length) {
    try { await sb.storage.from('media').remove(toRemove); } catch (_) {}
  }
  try { await sb.from('showcase_videos').delete().eq('id', id); } catch (_) {}
}

/* ============================================================
   HERO VIDEOS — caption-free autoplay strip under the hero banner.
   Pure videos, no titles. Stored in hero_videos table + media bucket
   (folder: 'hero/'). Cache-first read pattern, mirrors showcase.
   ============================================================ */
const HERO_VIDEOS_KEY = 'zone14_hero_videos_v1';

function readHeroVideos() {
  try { return JSON.parse(localStorage.getItem(HERO_VIDEOS_KEY)) || []; }
  catch (_) { return []; }
}
function writeHeroVideos(arr) {
  localStorage.setItem(HERO_VIDEOS_KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent('herovideos:change'));
}

async function pushHeroVideo(videoFile, posterFile, sortOrder) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');
  if (!videoFile) throw new Error('Video file is required');

  const uploadOne = async (file) => {
    file = await compressImage(file);          // poster images shrink; videos pass through
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data: up, error: upErr } = await sb.storage
      .from('media')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = sb.storage.from('media').getPublicUrl(up.path);
    return { url: pub.publicUrl, path: up.path };
  };

  const cleanup = [];
  try {
    const vid = await uploadOne(videoFile);
    cleanup.push(vid.path);

    let posterUrl = null, posterPath = null;
    if (posterFile) {
      const p = await uploadOne(posterFile);
      posterUrl = p.url; posterPath = p.path;
      cleanup.push(p.path);
    }

    const { data, error } = await sb.from('hero_videos').insert({
      video_url:   vid.url,
      video_path:  vid.path,
      poster_url:  posterUrl,
      poster_path: posterPath,
      sort_order:  sortOrder || 0,
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    if (cleanup.length) {
      try { await sb.storage.from('media').remove(cleanup); } catch (_) {}
    }
    throw err;
  }
}

async function deleteHeroVideoRemote(id, videoPath, posterPath) {
  const sb = getSupabase();
  if (!sb) return;
  const toRemove = [videoPath, posterPath].filter(Boolean);
  if (toRemove.length) {
    try { await sb.storage.from('media').remove(toRemove); } catch (_) {}
  }
  try { await sb.from('hero_videos').delete().eq('id', id); } catch (_) {}
}

/* ============================================================
   JERSEYS — admin catalog override. When the Supabase `jerseys` table
   has any rows, JERSEYS[] is replaced by them. Empty table = static seed.
   ============================================================ */
const JERSEYS_KEY = 'zone14_jerseys_v1';
const JERSEYS_SEED_BACKUP = null; // populated below after JERSEYS is declared

/* Replace JERSEYS in place so all existing references keep working.
   Dispatches 'jerseys:change' so the UI re-renders. */
function setJerseys(arr) {
  JERSEYS.length = 0;
  arr.forEach(j => JERSEYS.push(j));
  // Persist to cache so admin edits/deletes survive reloads even before the
  // next Supabase round-trip (and so a deleted seed jersey doesn't reappear).
  try { localStorage.setItem(JERSEYS_KEY, JSON.stringify(arr)); } catch (_) {}
  window.dispatchEvent(new CustomEvent('jerseys:change'));
}

/* Convert a Supabase row → JERSEYS[] item shape */
function rowToJersey(r) {
  return {
    id:         r.id,
    country:    r.country,
    edition:    r.edition,
    tag:        r.tag,
    price:      r.price,
    inStock:    !!r.in_stock,
    stockLeft:  r.stock_left || 0,
    comingSoon: !!r.coming_soon,
    palette: {
      primary:   r.palette_primary || '#cccccc',
      secondary: r.palette_secondary || '#ffffff',
      accent:    r.palette_accent || '#000000',
      stripes:   !!r.palette_stripes,
    },
    crest:  r.crest || '',
    number: r.shirt_number || '10',
    images: [], video: '',
    details: {
      fabric: r.fabric || 'Premium polyester · 100% breathable mesh',
      fit:    r.fit    || 'Slim athletic cut · True to Nike/Adidas international sizing',
      care:   r.care   || 'Machine wash cold · Do not bleach · Hang dry · No iron on print',
      origin: r.origin || 'Manufactured for Zone14, Bangladesh',
    },
    _override: true,  // marker so admin UI knows this is editable
  };
}

/* Reverse — JERSEYS item shape → Supabase row */
function jerseyToRow(j) {
  return {
    id:                j.id,
    country:           j.country,
    edition:           j.edition,
    tag:               j.tag,
    price:             j.price,
    in_stock:          !!j.inStock,
    stock_left:        j.stockLeft || 0,
    coming_soon:       !!j.comingSoon,
    palette_primary:   (j.palette || {}).primary,
    palette_secondary: (j.palette || {}).secondary,
    palette_accent:    (j.palette || {}).accent,
    palette_stripes:   !!(j.palette || {}).stripes,
    crest:             j.crest,
    shirt_number:      j.number,
    fabric:            (j.details || {}).fabric,
    fit:               (j.details || {}).fit,
    care:              (j.details || {}).care,
    origin:            (j.details || {}).origin,
    sort_order:        j.sortOrder || 0,
    hidden:            !!j.hidden,
    updated_at:        new Date().toISOString(),
  };
}

async function pushJersey(jersey) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');
  const row = jerseyToRow(jersey);
  const { data, error } = await sb.from('jerseys').upsert(row).select().single();
  if (error) throw error;
  return data;
}

async function deleteJerseyRemote(id) {
  const sb = getSupabase();
  if (!sb) return;
  // try/catch — Supabase query builders don't expose .catch() directly
  try { await sb.from('jerseys').delete().eq('id', id); } catch (_) {}
}

/* ============================================================
   SITE SETTINGS — key/value config from Supabase site_settings table.
   Loaded on boot and applied to module-level configs (DELIVERY, PROMOS,
   PAY_NUMBERS, WHATSAPP, KICKOFF, HERO). Admin panel pushes updates here.
   ============================================================ */
const SETTINGS_KEY = 'zone14_settings_v1';

function readSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch (_) { return {}; }
}
function writeSettings(obj) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj));
  window.dispatchEvent(new CustomEvent('settings:change'));
}

/* Apply a settings map (key → value) to live module-level configs.
   Called from sync + hydration; the *values* of these vars change in place. */
function applySettings(settings) {
  if (!settings || typeof settings !== 'object') return;
  if (settings.whatsapp)        WHATSAPP    = settings.whatsapp;
  if (settings.kickoff)         KICKOFF     = new Date(settings.kickoff);
  if (settings.delivery)        DELIVERY    = { ...DELIVERY, ...settings.delivery };
  if (settings.promos)          PROMOS      = { ...settings.promos };
  if (settings.payment_numbers) PAY_NUMBERS = { ...PAY_NUMBERS, ...settings.payment_numbers };
  if (settings.bank_transfer)   BANK_TRANSFER = { ...BANK_TRANSFER, ...settings.bank_transfer };
  if (settings.hero)            HERO        = { ...HERO, ...settings.hero };
  if (Array.isArray(settings.offers)  && settings.offers.length  > 0) OFFERS  = settings.offers;
  if (Array.isArray(settings.players) && settings.players.length > 0) PLAYERS = settings.players;
  if (settings.contact) CONTACT = { ...CONTACT, ...settings.contact };
  if (settings.social)  SOCIAL  = { ...SOCIAL,  ...settings.social };
  if (settings.sale)    SALE    = {
    ...SALE, ...settings.sale,
    popup: { ...SALE.popup, ...(settings.sale.popup || {}) },
  };
  window.dispatchEvent(new CustomEvent('settings:applied'));
}

async function pushSetting(key, value) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');
  const { error } = await sb.from('site_settings').upsert({
    key, value, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/* Hydrate from cache on boot so saved settings apply before network sync */
(function hydrateSettingsFromCache() {
  setTimeout(() => {
    const cached = readSettings();
    if (Object.keys(cached).length > 0) applySettings(cached);
  }, 0);
})();

/* Seed the jerseys table from the static catalog on first use */
async function seedJerseysFromStatic() {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');
  const rows = JERSEYS.map(jerseyToRow);
  const { error } = await sb.from('jerseys').upsert(rows);
  if (error) throw error;
}

/* If the jerseys table is still empty (catalog is the static seed), push the
   FULL current catalog to Supabase before any single add/edit/delete. Without
   this, editing one jersey would collapse the catalog to a single row, and
   deleting a seed jersey wouldn't persist (it'd reappear on reload / for other
   visitors). Returns true if it just seeded. */
async function ensureJerseysSeeded() {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { count, error } = await sb.from('jerseys').select('id', { count: 'exact', head: true });
    if (error) return false;
    if ((count || 0) === 0) { await seedJerseysFromStatic(); return true; }
  } catch (_) {}
  return false;
}

/* ---------- LIVE GROUP STANDINGS (all 12 WC groups, from the public feed) ---------- */
const GROUP_STANDINGS_KEY = 'zone14_group_standings_v1';
function readGroupStandings() {
  try { return JSON.parse(localStorage.getItem(GROUP_STANDINGS_KEY)) || null; }
  catch (_) { return null; }
}

/* ---------- ALL WC MATCHES (every group: finished + live + upcoming) ---------- */
const ALL_MATCHES_KEY = 'zone14_all_matches_v1';
function readAllMatches() {
  try { return JSON.parse(localStorage.getItem(ALL_MATCHES_KEY)) || null; }
  catch (_) { return null; }
}

/* ============================================================
   SALES LEDGER + STOCK — admin business tracking (Supabase-backed)
   ============================================================ */
const SALES_KEY = 'zone14_sales_v1';
const STOCK_KEY = 'zone14_stock_v1';
const SIZES = ['M', 'L', 'XL', 'XXL'];

function readSales() {
  try { return JSON.parse(localStorage.getItem(SALES_KEY)) || []; }
  catch (_) { return []; }
}
function writeSales(arr) {
  localStorage.setItem(SALES_KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent('sales:change'));
}
/* Stock cache shape: { [jerseyId]: { M, L, XL, XXL } } */
function readStock() {
  try { return JSON.parse(localStorage.getItem(STOCK_KEY)) || {}; }
  catch (_) { return {}; }
}
function writeStock(map) {
  localStorage.setItem(STOCK_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent('stock:change'));
}
function getStock(jerseyId, size) {
  const m = readStock();
  return (m[jerseyId] && m[jerseyId][size]) || 0;
}

/* Map a Supabase sales row → local shape */
function rowToSale(r) {
  return {
    id: r.id, soldAt: r.sold_at ? new Date(r.sold_at).getTime() : Date.now(),
    jerseyId: r.jersey_id, team: r.team, edition: r.edition, size: r.size,
    qty: r.qty, sellPrice: r.sell_price, costPrice: r.cost_price,
    customer: r.customer, phone: r.phone, area: r.area,
    paymentStatus: r.payment_status, received: r.received,
    deliveryStatus: r.delivery_status, notes: r.notes,
  };
}

async function pushSale(sale) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');
  const { data, error } = await sb.from('sales').insert({
    sold_at:        new Date(sale.soldAt || Date.now()).toISOString(),
    jersey_id:      sale.jerseyId || null,
    team:           sale.team || null,
    edition:        sale.edition || null,
    size:           sale.size || null,
    qty:            sale.qty || 1,
    sell_price:     sale.sellPrice || 0,
    cost_price:     sale.costPrice || 0,
    customer:       sale.customer || null,
    phone:          sale.phone || null,
    area:           sale.area || null,
    payment_status: sale.paymentStatus || 'due',
    received:       sale.received || 0,
    delivery_status:sale.deliveryStatus || 'pending',
    notes:          sale.notes || null,
  }).select().single();
  if (error) throw error;
  return data;
}
async function updateSaleRemote(id, patch) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');
  const { error } = await sb.from('sales').update(patch).eq('id', id);
  if (error) throw error;
}
async function deleteSaleRemote(id) {
  const sb = getSupabase();
  if (!sb) return;
  try { await sb.from('sales').delete().eq('id', id); } catch (_) {}
}
/* Upsert one stock cell (jersey + size → qty) */
async function pushStock(jerseyId, size, qty) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');
  const { error } = await sb.from('stock').upsert({
    jersey_id: jerseyId, size, qty: Math.max(0, qty | 0),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'jersey_id,size' });
  if (error) throw error;
}

/* ============================================================
   EXPENSES — full business cost tracking (for the Accounts page)
   ============================================================ */
const EXPENSES_KEY = 'zone14_expenses_v1';
const EXPENSE_CATEGORIES = [
  'Stock / Product purchase',
  'Facebook Ads',
  'Delivery / Courier',
  'Packaging',
  'Printing (name/number)',
  'Rent',
  'Salary / Labour',
  'Transport',
  'Other',
];

function readExpenses() {
  try { return JSON.parse(localStorage.getItem(EXPENSES_KEY)) || []; }
  catch (_) { return []; }
}
function writeExpenses(arr) {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent('expenses:change'));
}
function rowToExpense(r) {
  return {
    id: r.id,
    spentAt: r.spent_at ? new Date(r.spent_at).getTime() : Date.now(),
    category: r.category, amount: r.amount, note: r.note,
  };
}
async function pushExpense(exp) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');
  const { data, error } = await sb.from('expenses').insert({
    spent_at: new Date(exp.spentAt || Date.now()).toISOString(),
    category: exp.category, amount: exp.amount || 0, note: exp.note || null,
  }).select().single();
  if (error) throw error;
  return data;
}
async function deleteExpenseRemote(id) {
  const sb = getSupabase();
  if (!sb) return;
  try { await sb.from('expenses').delete().eq('id', id); } catch (_) {}
}

/* Full Profit & Loss for the Accounts page (cash basis). */
function computeAccounts() {
  const sales = readSales();
  let revenue = 0, received = 0, due = 0;
  sales.forEach(s => {
    const total = s.sellPrice * s.qty;
    revenue  += total;
    received += s.received || 0;
    due      += Math.max(0, total - (s.received || 0));
  });

  const expenses = readExpenses();
  const byCategory = {};
  let expenseTotal = 0;
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0);
    expenseTotal += e.amount || 0;
  });

  return {
    revenue, received, due,
    expenseTotal, byCategory,
    netProfit: received - expenseTotal,          // real cash in hand
    projectedProfit: revenue - expenseTotal,      // if all dues collected
    expenseCount: expenses.length,
  };
}

/* Sales summary for the dashboard cards */
function computeSalesSummary() {
  const sales = readSales();
  let revenue = 0, profit = 0, received = 0, due = 0, units = 0;
  sales.forEach(s => {
    const total = s.sellPrice * s.qty;
    revenue  += total;
    profit   += (s.sellPrice - s.costPrice) * s.qty;
    received += s.received || 0;
    due      += Math.max(0, total - (s.received || 0));
    units    += s.qty;
  });
  return { revenue, profit, received, due, units, orders: sales.length };
}

/* ============================================================
   VIDEO SHOWCASE — declarative fallback cards (used only when the admin
   hasn't uploaded any showcase videos yet — keeps the section non-empty)
   ============================================================ */
const VIDEO_SHOWCASE = [
  {
    id: 'arg-unbox',  jerseyId: 'arg-home', title: 'Argentina Home · Unboxing',
    subtitle: 'Hand-stitched crest, premium mesh — close-up review',
    duration: '0:42',
  },
  {
    id: 'bra-fit',    jerseyId: 'bra-home', title: 'Brazil Home · Fit & Drape',
    subtitle: 'How the slim athletic cut sits on size L',
    duration: '0:58',
  },
  {
    id: 'fra-360',    jerseyId: 'fra-home', title: 'France Home · 360° Spin',
    subtitle: 'Every angle — front, back, sleeves, hem stripe',
    duration: '0:35',
  },
  {
    id: 'esp-print',  jerseyId: 'esp-home', title: 'Spain Home · Custom Print',
    subtitle: 'PEDRI 8 heat-pressed — durability test',
    duration: '1:12',
  },
];

/* ---------- JERSEY DATA ----------
   Each jersey supports up to 4 real photos and an optional video.
   Drop files matching the naming convention in /images/jerseys/<id>/N.jpg
   and /videos/jerseys/<id>.mp4 — they auto-appear in the Quick View modal.
   The site falls back to the SVG illustration if no files exist yet.
   See /images/README.md and /videos/README.md for details.
*/
const DEFAULT_DETAILS = {
  fabric: 'Premium polyester · 100% breathable mesh',
  fit:    'Slim athletic cut · True to Nike/Adidas international sizing',
  care:   'Machine wash cold · Do not bleach · Hang dry · No iron on print',
  origin: 'Manufactured for Zone14, Bangladesh',
};
function _jImgs(id, n)  { return Array.from({length: n}, (_, i) => `images/jerseys/${id}/${i+1}.jpg`); }
function _jVideo(id)    { return `videos/jerseys/${id}.mp4`; }

let JERSEYS = [
  /* ----- HOME KITS (in stock) ----- */
  {
    id: 'bra-home', country: 'Brazil', edition: 'Home Kit', tag: 'home',
    price: 1499, inStock: true, stockLeft: 8,
    palette: { primary: '#fbe10d', secondary: '#009c3b', accent: '#002776', stripes: false },
    crest: 'CBF', number: '10',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'arg-home', country: 'Argentina', edition: 'Home Kit', tag: 'home',
    price: 1499, inStock: true, stockLeft: 5,
    palette: { primary: '#75aadb', secondary: '#ffffff', accent: '#f6b40e', stripes: true },
    crest: 'AFA', number: '10',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'fra-home', country: 'France', edition: 'Home Kit', tag: 'home',
    price: 1499, inStock: true, stockLeft: 11,
    palette: { primary: '#1e3a8a', secondary: '#ffffff', accent: '#ef4135', stripes: false },
    crest: 'FFF', number: '10',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'esp-home', country: 'Spain', edition: 'Home Kit', tag: 'home',
    price: 1499, inStock: true, stockLeft: 7,
    palette: { primary: '#c60b1e', secondary: '#ffc400', accent: '#1a3a5e', stripes: false },
    crest: 'RFEF', number: '9',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },

  /* ----- AWAY KITS (out of stock — restock soon) ----- */
  {
    id: 'bra-away', country: 'Brazil', edition: 'Away Kit', tag: 'away',
    price: 1499, inStock: false, stockLeft: 0,
    palette: { primary: '#002776', secondary: '#fbe10d', accent: '#009c3b', stripes: false },
    crest: 'CBF', number: '11',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'arg-away', country: 'Argentina', edition: 'Away Kit', tag: 'away',
    price: 1499, inStock: false, stockLeft: 0,
    palette: { primary: '#1a1a3e', secondary: '#75aadb', accent: '#f6b40e', stripes: false },
    crest: 'AFA', number: '10',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'fra-away', country: 'France', edition: 'Away Kit', tag: 'away',
    price: 1499, inStock: false, stockLeft: 0,
    palette: { primary: '#f4eedb', secondary: '#1e3a8a', accent: '#ef4135', stripes: false },
    crest: 'FFF', number: '7',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'esp-away', country: 'Spain', edition: 'Away Kit', tag: 'away',
    price: 1499, inStock: false, stockLeft: 0,
    palette: { primary: '#0a1f44', secondary: '#c60b1e', accent: '#ffc400', stripes: false },
    crest: 'RFEF', number: '6',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },

  /* ----- COMING SOON — pre-order to reserve a kit ----- */
  {
    id: 'ger-home', country: 'Germany', edition: 'Home Kit', tag: 'home',
    price: 1499, inStock: false, comingSoon: true, stockLeft: 0,
    palette: { primary: '#ffffff', secondary: '#1a1a1a', accent: '#dd0000', stripes: false },
    crest: 'DFB', number: '13',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'por-home', country: 'Portugal', edition: 'Home Kit', tag: 'home',
    price: 1499, inStock: false, comingSoon: true, stockLeft: 0,
    palette: { primary: '#c8102e', secondary: '#006a44', accent: '#ffd700', stripes: false },
    crest: 'FPF', number: '7',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'eng-home', country: 'England', edition: 'Home Kit', tag: 'home',
    price: 1499, inStock: false, comingSoon: true, stockLeft: 0,
    palette: { primary: '#ffffff', secondary: '#1a3a8e', accent: '#cf142b', stripes: false },
    crest: 'ENG', number: '9',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'ita-home', country: 'Italy', edition: 'Home Kit', tag: 'home',
    price: 1499, inStock: false, comingSoon: true, stockLeft: 0,
    palette: { primary: '#0066b3', secondary: '#ffffff', accent: '#ffd700', stripes: false },
    crest: 'FIGC', number: '10',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
  {
    id: 'ned-home', country: 'Netherlands', edition: 'Home Kit', tag: 'home',
    price: 1499, inStock: false, comingSoon: true, stockLeft: 0,
    palette: { primary: '#ff6b00', secondary: '#0a1a4a', accent: '#ffffff', stripes: false },
    crest: 'KNVB', number: '4',
    images: [], video: '',
    details: { ...DEFAULT_DETAILS },
  },
];

/* ---------- JERSEY SVG RENDERER ---------- */
function jerseySVG({ palette, country, crest, number }) {
  const { primary, secondary, accent, stripes } = palette;
  const slug = country.replace(/\s/g, '') + '-' + Math.random().toString(36).slice(2, 6);
  const stripesPattern = stripes
    ? `<defs><pattern id="str-${slug}" x="0" y="0" width="40" height="200" patternUnits="userSpaceOnUse">
         <rect width="20" height="200" fill="${primary}"/>
         <rect x="20" width="20" height="200" fill="${secondary}"/>
       </pattern></defs>`
    : '';
  const bodyFill = stripes ? `url(#str-${slug})` : primary;

  return `
    <svg viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${country} jersey">
      ${stripesPattern}
      <defs>
        <filter id="sh-${slug}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#sh-${slug})">
        <path d="M60 38 L20 70 L40 110 L70 95 Z" fill="${secondary}"/>
        <path d="M180 38 L220 70 L200 110 L170 95 Z" fill="${secondary}"/>
        <path d="M70 38 L90 22 Q120 35 150 22 L170 38 L170 245 Q170 255 160 255 L80 255 Q70 255 70 245 Z"
              fill="${bodyFill}" stroke="${accent}" stroke-width="1.5"/>
        <path d="M105 22 Q120 38 135 22 L130 18 Q120 28 110 18 Z" fill="${accent}"/>
        <path d="M108 22 Q120 35 132 22" stroke="${secondary}" stroke-width="1.5" fill="none"/>
        <rect x="25" y="100" width="30" height="6" fill="${accent}" rx="2"/>
        <rect x="185" y="100" width="30" height="6" fill="${accent}" rx="2"/>
        <rect x="70" y="240" width="100" height="6" fill="${accent}" opacity="0.85"/>
        <path d="M70 80 L70 240" stroke="${accent}" stroke-width="0.8" opacity="0.4"/>
        <path d="M170 80 L170 240" stroke="${accent}" stroke-width="0.8" opacity="0.4"/>
      </g>
      <g transform="translate(85 70)">
        <path d="M0 0 L18 0 L20 6 L18 16 L9 22 L0 16 L-2 6 Z" fill="${accent}" stroke="${secondary}" stroke-width="0.6"/>
        <text x="9" y="13" font-family="Arial Black, sans-serif" font-size="6" fill="${secondary}" text-anchor="middle" font-weight="900">${crest}</text>
      </g>
      <g transform="translate(143 72)">
        <text font-family="Bebas Neue, Arial" font-size="11" fill="${accent}" font-weight="700" letter-spacing="1">Z14</text>
      </g>
      <text x="120" y="180" font-family="Bebas Neue, Arial Black" font-size="64" fill="${accent}" text-anchor="middle" font-weight="900" opacity="0.95" letter-spacing="2">${number}</text>
      <path d="M85 35 L88 245" stroke="${secondary}" stroke-width="2" opacity="0.18"/>
    </svg>
  `;
}

/* ---------- HELPERS ---------- */
const fmtBDT = (n) => '৳' + Math.round(n).toLocaleString('en-IN');

function getJersey(id) {
  return JERSEYS.find(j => j.id === id);
}

/* ---------- CART (sessionStorage) ---------- */
const CART_KEY = 'zone14_cart_v1';

function readCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
  } catch (_) { return []; }
}

function writeCart(items) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart:change', { detail: items }));
}

function addToCart(id, size, qty = 1) {
  const cart = readCart();
  const idx = cart.findIndex(i => i.id === id && i.size === size);
  if (idx >= 0) {
    cart[idx].qty = Math.min(20, cart[idx].qty + qty);
  } else {
    cart.push({ id, size, qty });
  }
  writeCart(cart);
}

function removeFromCart(id, size) {
  writeCart(readCart().filter(i => !(i.id === id && i.size === size)));
}

function setCartQty(id, size, qty) {
  const cart = readCart();
  const item = cart.find(i => i.id === id && i.size === size);
  if (item) {
    item.qty = Math.max(1, Math.min(20, qty));
    writeCart(cart);
  }
}

function clearCart() {
  sessionStorage.removeItem(CART_KEY);
  window.dispatchEvent(new CustomEvent('cart:change', { detail: [] }));
}

function cartCount() {
  return readCart().reduce((sum, i) => sum + i.qty, 0);
}
