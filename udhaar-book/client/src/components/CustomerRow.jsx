import { Link } from 'react-router-dom';
import { formatRupees } from '../money.js';
import { t } from '../strings.js';

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
