// Every word shown in the app lives in this one file, in three languages:
//   hinglish  = Hindi written in English letters (default)
//   hi        = हिन्दी in Devanagari
//   en        = English
// To change a word, find its key (the name before the colon) and edit it
// in all three places. The screens never contain words themselves; they
// only say t.something and this file decides what that is.

const en = {
  languageName: 'English',
  languageChange: 'Change language',
  appName: 'Udhaar Book',

  // login
  loginTitle: 'Log in',
  password: 'Password',
  loginButton: 'Log in',
  loggingIn: 'Logging in…',

  // navigation
  navHome: 'Home',
  navCustomers: 'Customers',
  logout: 'Log out',
  close: 'Close',

  // home
  totalPending: 'Total pending',
  customersOwing: (n) => `${n} ${n === 1 ? 'customer owes' : 'customers owe'} money`,
  collectedThisMonth: 'Received this month',
  creditThisMonth: 'Given on credit this month',
  overdueTitle: (days) => `Pending more than ${days} days`,
  topPendingTitle: 'Highest pending',
  nothingPending: 'No pending amounts. 🎉',
  emptyShop: 'No customers yet. Add the first one to start.',

  // customers
  searchPlaceholder: 'Search name, phone or area',
  sortLabel: 'Sort',
  sortByPending: 'Highest pending',
  sortByName: 'A to Z',
  addCustomer: 'Add customer',
  noMatches: 'No customers match your search.',
  pending: 'Pending',
  advance: 'Advance',
  settled: 'Settled',

  // customer form
  name: 'Name',
  phone: 'Phone (10 digits)',
  area: 'Area',
  notes: 'Notes',
  save: 'Save',
  saving: 'Saving…',
  cancel: 'Cancel',
  editCustomer: 'Edit details',

  // customer page
  gaveGoods: 'Gave goods (credit)',
  gotPayment: 'Got payment',
  call: 'Call',
  whatsapp: 'WhatsApp',
  whatsappHint: 'Opens WhatsApp with a message ready. Nothing is sent until you press send.',
  oldestPending: (d) => `Oldest pending amount is ${d} old`,
  since: (d) => `since ${d}`,
  historyTitle: 'History',
  noEntries: 'No entries yet.',
  credit: 'Goods on credit',
  payment: 'Payment received',
  cancelEntry: 'Cancel entry',
  cancelledLabel: 'Cancelled',
  cancelEntryTitle: 'Cancel this entry?',
  cancelEntryHelp: 'The entry stays in the history, marked as cancelled, and will not count in the balance.',
  reason: 'Reason',
  reasonPlaceholder: 'e.g. wrong amount, wrong customer',
  keepEntry: 'Keep it',
  confirmCancel: 'Cancel entry',

  // entry form
  amount: 'Amount (₹)',
  amountError: 'Enter the amount in rupees, for example 2500 or 2500.50',
  date: 'Date',
  whatWasGiven: 'What was given (optional)',
  remark: 'Remark (optional)',
  method: 'Paid by',
  cash: 'Cash',
  upi: 'UPI',
  other: 'Other',
  balanceAfter: 'Balance after this',

  reminderMessage: (name, amount) =>
    `Hello ${name}, your account shows ${amount} pending. Please send it when convenient. Thank you 🙏`,

  // time ("45 days")
  days: (n) => {
    if (n === null || n === undefined) return '';
    if (n === 0) return 'today';
    if (n === 1) return '1 day';
    if (n < 60) return `${n} days`;
    return `${Math.floor(n / 30)} months`;
  },

  // suppliers (Dena hai) and the two home cards
  navSuppliers: 'Suppliers',
  receiveCard: 'To receive',
  payCard: 'To pay',
  suppliersToPay: (n) => `${n} ${n === 1 ? 'supplier' : 'suppliers'} to be paid`,
  topOwedSuppliersTitle: 'Most to pay',
  noRecentPaymentTitle: (days) => `Nothing paid for ${days}+ days`,
  nothingToPay: 'Nothing to pay. 🎉',
  addSupplier: 'Add supplier',
  searchSupplierPlaceholder: 'Search name, area or bill number',
  noSuppliers: 'No suppliers yet. Add the first one.',
  noSupplierMatches: 'No suppliers match your search.',
  sortByToPay: 'Most to pay',
  advancePaid: 'Paid in advance',
  tookGoods: 'Took goods (credit)',
  gavePayment: 'Made payment',
  supplierCredit: 'Goods taken on credit',
  supplierPayment: 'Payment made',
  whatWasTaken: 'What was taken (optional)',
  methodPaid: 'Paid by',
  billNoOptional: 'Bill number (optional)',
  billText: (no) => `Bill: ${no}`,
  lastPaid: (n) => (n === 0 ? 'Last paid today' : `Last paid ${en.days(n)} ago`),
  neverPaid: 'No payment made yet',

  loading: 'Loading…',
  tryAgain: 'Try again',
  genericError: 'Something went wrong. Please try again.',
  offline: 'Could not reach the server. Check your internet and try again.',
};

const hinglish = {
  languageName: 'Hinglish',
  languageChange: 'Bhasha badlein',
  appName: 'Udhaar Bahi',

  loginTitle: 'Log in',
  password: 'Password',
  loginButton: 'Log in karein',
  loggingIn: 'Log in ho raha hai…',

  navHome: 'Home',
  navCustomers: 'Customers',
  logout: 'Log out',
  close: 'Band karein',

  totalPending: 'Kul baaki',
  customersOwing: (n) => `${n} customer ka paisa baaki hai`,
  collectedThisMonth: 'Is mahine mila',
  creditThisMonth: 'Is mahine udhaar diya',
  overdueTitle: (days) => `${days} din se zyada baaki`,
  topPendingTitle: 'Sabse zyada baaki',
  nothingPending: 'Koi paisa baaki nahi. 🎉',
  emptyShop: 'Abhi koi customer nahi hai. Pehla customer jodein.',

  searchPlaceholder: 'Naam, phone ya area khojein',
  sortLabel: 'Kram',
  sortByPending: 'Zyada baaki pehle',
  sortByName: 'Naam se (A-Z)',
  addCustomer: 'Customer jodein',
  noMatches: 'Koi customer nahi mila.',
  pending: 'Baaki',
  advance: 'Advance',
  settled: 'Hisaab saaf',

  name: 'Naam',
  phone: 'Phone (10 digit)',
  area: 'Area',
  notes: 'Note',
  save: 'Save karein',
  saving: 'Save ho raha hai…',
  cancel: 'Rehne dein',
  editCustomer: 'Details badlein',

  gaveGoods: 'Maal diya (udhaar)',
  gotPayment: 'Paisa mila',
  call: 'Call karein',
  whatsapp: 'WhatsApp',
  whatsappHint: 'WhatsApp mein message ready khulega. Aap send dabaoge tabhi jayega.',
  oldestPending: (d) => `Sabse purana baaki ${d} purana hai`,
  since: (d) => `${d} se`,
  historyTitle: 'Purana hisaab',
  noEntries: 'Abhi koi entry nahi.',
  credit: 'Maal udhaar',
  payment: 'Paisa mila',
  cancelEntry: 'Entry cancel karein',
  cancelledLabel: 'Cancel',
  cancelEntryTitle: 'Ye entry cancel karein?',
  cancelEntryHelp: 'Entry history mein cancel dikhegi, mitegi nahi, aur baaki amount mein nahi gini jayegi.',
  reason: 'Karan',
  reasonPlaceholder: 'jaise: galat amount, galat customer',
  keepEntry: 'Rehne dein',
  confirmCancel: 'Cancel karein',

  amount: 'Amount (₹)',
  amountError: 'Amount rupaye mein likhein, jaise 2500 ya 2500.50',
  date: 'Tareekh',
  whatWasGiven: 'Kya maal diya (zaroori nahi)',
  remark: 'Remark (zaroori nahi)',
  method: 'Kaise mila',
  cash: 'Cash',
  upi: 'UPI',
  other: 'Other',
  balanceAfter: 'Iske baad baaki',

  reminderMessage: (name, amount) =>
    `Namaste ${name} ji, aapke khate mein ${amount} baaki dikha raha hai. Suvidha anusaar bhej dijiye. Dhanyavaad 🙏`,

  days: (n) => {
    if (n === null || n === undefined) return '';
    if (n === 0) return 'aaj';
    if (n === 1) return '1 din';
    if (n < 60) return `${n} din`;
    return `${Math.floor(n / 30)} mahine`;
  },

  navSuppliers: 'Suppliers',
  receiveCard: 'Lena hai',
  payCard: 'Dena hai',
  suppliersToPay: (n) => `${n} supplier ko dena hai`,
  topOwedSuppliersTitle: 'Sabse zyada dena hai',
  noRecentPaymentTitle: (days) => `${days} din se paisa nahi diya`,
  nothingToPay: 'Kisi ko kuch dena nahi. 🎉',
  addSupplier: 'Supplier jodein',
  searchSupplierPlaceholder: 'Naam, area ya bill number khojein',
  noSuppliers: 'Abhi koi supplier nahi hai. Pehla supplier jodein.',
  noSupplierMatches: 'Koi supplier nahi mila.',
  sortByToPay: 'Zyada dena pehle',
  advancePaid: 'Advance diya',
  tookGoods: 'Maal liya (udhaar)',
  gavePayment: 'Paisa diya',
  supplierCredit: 'Maal liya udhaar',
  supplierPayment: 'Paisa diya',
  whatWasTaken: 'Kya maal liya (zaroori nahi)',
  methodPaid: 'Kaise diya',
  billNoOptional: 'Bill number (zaroori nahi)',
  billText: (no) => `Bill: ${no}`,
  lastPaid: (n) => (n === 0 ? 'Pichhla paisa aaj diya' : `Pichhla paisa ${hinglish.days(n)} pehle diya`),
  neverPaid: 'Abhi tak koi paisa nahi diya',

  loading: 'Load ho raha hai…',
  tryAgain: 'Dobara koshish karein',
  genericError: 'Kuch gadbad ho gayi. Dobara koshish karein.',
  offline: 'Server se judh nahi paye. Internet check karke dobara koshish karein.',
};

const hi = {
  languageName: 'हिन्दी',
  languageChange: 'भाषा बदलें',
  appName: 'उधार बही',

  loginTitle: 'लॉग इन',
  password: 'पासवर्ड',
  loginButton: 'लॉग इन करें',
  loggingIn: 'लॉग इन हो रहा है…',

  navHome: 'होम',
  navCustomers: 'ग्राहक',
  logout: 'लॉग आउट',
  close: 'बंद करें',

  totalPending: 'कुल बाकी',
  customersOwing: (n) => `${n} ${n === 1 ? 'ग्राहक का' : 'ग्राहकों का'} पैसा बाकी है`,
  collectedThisMonth: 'इस महीने मिला',
  creditThisMonth: 'इस महीने उधार दिया',
  overdueTitle: (days) => `${days} दिन से ज़्यादा बाकी`,
  topPendingTitle: 'सबसे ज़्यादा बाकी',
  nothingPending: 'कोई पैसा बाकी नहीं। 🎉',
  emptyShop: 'अभी कोई ग्राहक नहीं है। पहला ग्राहक जोड़ें।',

  searchPlaceholder: 'नाम, फ़ोन या इलाका खोजें',
  sortLabel: 'क्रम',
  sortByPending: 'ज़्यादा बाकी पहले',
  sortByName: 'नाम से (अ से ह)',
  addCustomer: 'ग्राहक जोड़ें',
  noMatches: 'कोई ग्राहक नहीं मिला।',
  pending: 'बाकी',
  advance: 'एडवांस',
  settled: 'हिसाब साफ़',

  name: 'नाम',
  phone: 'फ़ोन (10 अंक)',
  area: 'इलाका',
  notes: 'नोट',
  save: 'सेव करें',
  saving: 'सेव हो रहा है…',
  cancel: 'रहने दें',
  editCustomer: 'जानकारी बदलें',

  gaveGoods: 'माल दिया (उधार)',
  gotPayment: 'पैसा मिला',
  call: 'फ़ोन करें',
  whatsapp: 'व्हाट्सऐप',
  whatsappHint: 'व्हाट्सऐप में मैसेज तैयार खुलेगा। आप भेजें दबाएँगे तभी जाएगा।',
  oldestPending: (d) => `सबसे पुराना बाकी ${d} पुराना है`,
  since: (d) => `${d} से`,
  historyTitle: 'पुराना हिसाब',
  noEntries: 'अभी कोई एंट्री नहीं।',
  credit: 'माल उधार',
  payment: 'पैसा मिला',
  cancelEntry: 'एंट्री रद्द करें',
  cancelledLabel: 'रद्द',
  cancelEntryTitle: 'यह एंट्री रद्द करें?',
  cancelEntryHelp: 'एंट्री हिसाब में रद्द दिखेगी, मिटेगी नहीं, और बाकी रकम में नहीं गिनी जाएगी।',
  reason: 'कारण',
  reasonPlaceholder: 'जैसे: ग़लत रकम, ग़लत ग्राहक',
  keepEntry: 'रहने दें',
  confirmCancel: 'रद्द करें',

  amount: 'रकम (₹)',
  amountError: 'रकम रुपये में लिखें, जैसे 2500 या 2500.50',
  date: 'तारीख़',
  whatWasGiven: 'क्या माल दिया (ज़रूरी नहीं)',
  remark: 'टिप्पणी (ज़रूरी नहीं)',
  method: 'कैसे मिला',
  cash: 'नकद',
  upi: 'UPI',
  other: 'दूसरा',
  balanceAfter: 'इसके बाद बाकी',

  reminderMessage: (name, amount) =>
    `नमस्ते ${name} जी, आपके खाते में ${amount} बाकी दिख रहा है। सुविधा अनुसार भिजवा दीजिए। धन्यवाद 🙏`,

  days: (n) => {
    if (n === null || n === undefined) return '';
    if (n === 0) return 'आज';
    if (n === 1) return '1 दिन';
    if (n < 60) return `${n} दिन`;
    return `${Math.floor(n / 30)} महीने`;
  },

  navSuppliers: 'सप्लायर',
  receiveCard: 'लेना है',
  payCard: 'देना है',
  suppliersToPay: (n) => `${n} सप्लायर को देना है`,
  topOwedSuppliersTitle: 'सबसे ज़्यादा देना है',
  noRecentPaymentTitle: (days) => `${days} दिन से पैसा नहीं दिया`,
  nothingToPay: 'किसी को कुछ देना नहीं। 🎉',
  addSupplier: 'सप्लायर जोड़ें',
  searchSupplierPlaceholder: 'नाम, इलाका या बिल नंबर खोजें',
  noSuppliers: 'अभी कोई सप्लायर नहीं है। पहला सप्लायर जोड़ें।',
  noSupplierMatches: 'कोई सप्लायर नहीं मिला।',
  sortByToPay: 'ज़्यादा देना पहले',
  advancePaid: 'एडवांस दिया',
  tookGoods: 'माल लिया (उधार)',
  gavePayment: 'पैसा दिया',
  supplierCredit: 'माल लिया उधार',
  supplierPayment: 'पैसा दिया',
  whatWasTaken: 'क्या माल लिया (ज़रूरी नहीं)',
  methodPaid: 'कैसे दिया',
  billNoOptional: 'बिल नंबर (ज़रूरी नहीं)',
  billText: (no) => `बिल: ${no}`,
  lastPaid: (n) => (n === 0 ? 'पिछला पैसा आज दिया' : `पिछला पैसा ${hi.days(n)} पहले दिया`),
  neverPaid: 'अभी तक कोई पैसा नहीं दिया',

  loading: 'लोड हो रहा है…',
  tryAgain: 'फिर कोशिश करें',
  genericError: 'कुछ गड़बड़ हो गई। फिर कोशिश करें।',
  offline: 'सर्वर से जुड़ नहीं पाए। इंटरनेट देखकर फिर कोशिश करें।',
};

export const DICTIONARIES = { hinglish, hi, en };
export const LANGS = ['hinglish', 'hi', 'en'];

const STORAGE_KEY = 'udhaar_lang';

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch { /* no storage available */ }
  return 'hinglish';
}

let current = readSaved();

function markPageLanguage() {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = current === 'hi' ? 'hi' : 'en';
  }
}
markPageLanguage();

export function getLang() {
  return current;
}

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode */ }
  markPageLanguage();
}

// The screens read words as t.something. This looks the word up in the
// language that is chosen right now (and falls back to English if a word
// is ever missing).
export const t = new Proxy({}, {
  get(_, key) {
    const own = DICTIONARIES[current][key];
    return own !== undefined ? own : en[key];
  },
});

// Customers and suppliers use different words for the same two kinds of entry:
//   customer: "Maal udhaar" / "Paisa mila"      supplier: "Maal liya udhaar" / "Paisa diya"
export function entryLabel(kind, type) {
  if (kind === 'supplier') return type === 'credit' ? t.supplierCredit : t.supplierPayment;
  return type === 'credit' ? t.credit : t.payment;
}
