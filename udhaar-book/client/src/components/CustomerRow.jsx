import { Link } from 'react-router-dom';
import { formatRupees, daysText } from '../money.js';
import { t } from '../strings.js';

export default function CustomerRow({ customer }) {
  const { id, name, area, phone, balancePaise, oldestUnpaidDays } = customer;
  const sub = [area, phone].filter(Boolean).join(' · ');

  let amountClass = 'muted';
  let amountText = t.settled;
  let amountSub = '';
  if (balancePaise > 0) {
    amountClass = 'owed';
    amountText = formatRupees(balancePaise);
    amountSub = oldestUnpaidDays !== null ? `since ${daysText(oldestUnpaidDays)}` : '';
  } else if (balancePaise < 0) {
    amountClass = 'paid';
    amountText = `${t.advance} ${formatRupees(-balancePaise)}`;
  }

  return (
    <Link to={`/customers/${id}`} className="row">
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
