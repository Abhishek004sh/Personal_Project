import { Link } from 'react-router-dom';
import { formatRupees } from '../money.js';
import { t } from '../strings.js';

// A few soft, brand-matching colors so names are easy to tell apart at a
// glance in a long list. Picked by the name itself, so the same person
// always gets the same color.
const AVATAR_COLORS = ['#7a4b1e', '#1b7a43', '#2d5f8a', '#8a3a6b', '#a3671f', '#3a6b6b'];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function CustomerRow({ customer }) {
  const { id, name, area, phone, balancePaise, oldestUnpaidDays, lastPaymentDays, kind } = customer;
  const isSupplier = kind === 'supplier';
  const sub = [area, phone].filter(Boolean).join(' · ');

  let amountClass = 'muted';
  let amountText = t.settled;
  let amountSub = '';
  if (balancePaise > 0) {
    amountClass = 'owed';
    amountText = formatRupees(balancePaise);
    // Customers: how long the oldest amount has been pending.
    // Suppliers: when we last paid them.
    if (isSupplier) {
      amountSub = lastPaymentDays === null ? t.neverPaid : t.lastPaid(lastPaymentDays);
    } else {
      amountSub = oldestUnpaidDays !== null ? t.since(t.days(oldestUnpaidDays)) : '';
    }
  } else if (balancePaise < 0) {
    amountClass = 'paid';
    amountText = `${isSupplier ? t.advancePaid : t.advance} ${formatRupees(-balancePaise)}`;
  }

  return (
    <Link to={`${isSupplier ? '/suppliers' : '/customers'}/${id}`} className="row">
      <div className="avatar" style={{ background: avatarColor(name) }} aria-hidden="true">
        {name.trim().charAt(0).toUpperCase()}
      </div>
      <div className="row-main">
        <div className="row-title">{name}</div>
        {sub && <div className="row-sub">{sub}</div>}
      </div>
      <div className="row-amount">
        <div className={amountClass}>{amountText}</div>
        {amountSub && <div className="row-sub">{amountSub}</div>}
      </div>
    </Link>
  );
}
