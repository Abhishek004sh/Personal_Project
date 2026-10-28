// All words shown in the app live here, so a Hindi version can be added
// later by providing a second set of the same keys.

export const t = {
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
  historyTitle: 'History',
  noEntries: 'No entries yet.',
  credit: 'Goods on credit',
  payment: 'Payment received',
  cancelEntry: 'Cancel entry',
  cancelledLabel: 'Cancelled',
  cancelEntryTitle: 'Cancel this entry?',
  cancelEntryHelp: 'The entry stays in the history, marked as cancelled, and will not count in the balance.',
  reason: 'Reason',
  keepEntry: 'Keep it',
  confirmCancel: 'Cancel entry',

  // entry form
  amount: 'Amount (₹)',
  date: 'Date',
  whatWasGiven: 'What was given (optional)',
  remark: 'Remark (optional)',
  method: 'Paid by',
  cash: 'Cash',
  upi: 'UPI',
  other: 'Other',
  balanceAfter: 'Balance after this',

  reminderMessage: (name, amount) =>
    `Namaste ${name} ji, aapke khate mein ${amount} baaki dikha raha hai. Suvidha anusaar bhej dijiye. Dhanyavaad 🙏`,

  loading: 'Loading…',
  tryAgain: 'Try again',
  genericError: 'Something went wrong. Please try again.',
  offline: 'Could not reach the server. Check your internet and try again.',
};
