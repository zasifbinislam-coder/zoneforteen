/* ============================================================
   ZONE14 — Shared data + utilities
   Loaded by both index.html and order.html
   ============================================================ */

const WHATSAPP = '8801723360078';
const KICKOFF  = new Date('2026-06-11T18:00:00-05:00'); // 11 June 2026, Estadio Azteca

/* Delivery charges (BDT) */
const DELIVERY = {
  dhaka:   70,
  outside: 130,
  freeAbove: 3000,         // free delivery above this subtotal
};

const CUSTOM_PRINT_FEE = 150; // per jersey for name+number

/* Promo codes (mock — real validation happens manually on WhatsApp side) */
const PROMOS = {
  WC2026:     { type: 'pct',  value: 10, label: '10% off — World Cup 2026' },
  ZONE14:     { type: 'pct',  value: 14, label: '14% off — Zone14 launch' },
  FIRSTORDER: { type: 'flat', value: 150, label: '৳150 off your first order' },
  TEAMSET:    { type: 'pct',  value: 25, label: '25% off — Full Team Set (5+ jerseys)' },
  MATCHDAY:   { type: 'pct',  value: 15, label: '15% off — Match Day special' },
};

/* ---------- WORLD CUP 2026 MATCH HUB ---------- */
/* Plausible group-stage fixtures for the teams we sell (Brazil, Argentina,
   France, Spain). All dates use real WC 2026 venue locales. */
const MATCHES = [
  { id:'m1', date:'2026-06-11T18:00:00-05:00', stage:'Group A · Opening Match', home:'MEX', away:'KSA', venue:'Estadio Azteca', city:'Mexico City', featured:true },
  { id:'m2', date:'2026-06-13T15:00:00-05:00', stage:'Group D · MD1',          home:'ARG', away:'JPN', venue:'MetLife Stadium',  city:'New York / NJ' },
  { id:'m3', date:'2026-06-14T12:00:00-05:00', stage:'Group E · MD1',          home:'BRA', away:'AUS', venue:'SoFi Stadium',     city:'Los Angeles' },
  { id:'m4', date:'2026-06-14T18:00:00-05:00', stage:'Group F · MD1',          home:'ESP', away:'CRO', venue:'Mercedes-Benz',    city:'Atlanta' },
  { id:'m5', date:'2026-06-15T15:00:00-05:00', stage:'Group G · MD1',          home:'FRA', away:'DEN', venue:'NRG Stadium',      city:'Houston' },
  { id:'m6', date:'2026-06-19T15:00:00-05:00', stage:'Group D · MD2',          home:'ARG', away:'SEN', venue:'Lincoln Financial',city:'Philadelphia' },
  { id:'m7', date:'2026-06-20T18:00:00-05:00', stage:'Group E · MD2',          home:'BRA', away:'EGY', venue:'Hard Rock Stadium',city:'Miami' },
  { id:'m8', date:'2026-06-24T20:00:00-05:00', stage:'Group F · MD3',          home:'ESP', away:'TUN', venue:'Lumen Field',      city:'Seattle' },
  { id:'m9', date:'2026-06-25T18:00:00-05:00', stage:'Group G · MD3',          home:'FRA', away:'CIV', venue:'BMO Field',        city:'Toronto' },
];

/* Group standings — focus on the four groups featuring our jerseys */
const GROUPS = [
  { name:'D', teams:[
    { code:'ARG', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'JPN', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'SEN', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'NOR', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
  ]},
  { name:'E', teams:[
    { code:'BRA', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'AUS', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'EGY', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'SUI', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
  ]},
  { name:'F', teams:[
    { code:'ESP', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'CRO', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'TUN', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'CRC', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
  ]},
  { name:'G', teams:[
    { code:'FRA', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'DEN', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'CIV', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
    { code:'PAN', P:0, W:0, D:0, L:0, GF:0, GA:0, Pts:0 },
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
const PLAYERS = [
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
      { data: preds,   error: e1 },
      { data: results, error: e2 },
      { data: media,   error: e3 },
    ] = await Promise.all([
      sb.from('predictions').select('*'),
      sb.from('match_results').select('*'),
      sb.from('jersey_media').select('*').order('sort_order').order('uploaded_at'),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;

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
}

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

/* Compute leaderboard — aggregate predictions across all results */
function computeLeaderboard() {
  const preds   = readPredictions();
  const results = readResults();
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

/* Upload a single file to Supabase Storage + insert the matching
   jersey_media row. Returns the inserted row (with public url). */
async function cloudUpload(jerseyId, file) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not ready');

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
    await sb.storage.from('media').remove([up.path]).catch(() => {});
    throw rowErr;
  }
  return row;
}

/* Delete both the row and the underlying storage object */
async function cloudDelete(asset) {
  const sb = getSupabase();
  if (!sb) return;
  if (asset.storagePath) {
    await sb.storage.from('media').remove([asset.storagePath]).catch(() => {});
  }
  await sb.from('jersey_media').delete().eq('id', asset.id).catch(() => {});
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
   VIDEO SHOWCASE — landing-page video grid (above Reviews)
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

const JERSEYS = [
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
