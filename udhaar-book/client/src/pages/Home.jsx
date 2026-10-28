import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../useLoad.js';
import { formatRupees } from '../money.js';
import { t } from '../strings.js';
import CustomerRow from '../components/CustomerRow.jsx';

export default function Home() {
  const { data, error, loading, reload } = useLoad(() => api.dashboard(), []);

  if (loading && !data) return <p className="center muted">{t.loading}</p>;
  if (error && !data) {
    return (
      <div className="center">
        <p className="error">{error}</p>
        <button className="btn" onClick={reload}>{t.tryAgain}</button>
      </div>
    );
  }

  if (data.totalCustomers === 0) {
    return (
      <div className="center">
        <p>{t.emptyShop}</p>
        <Link to="/customers?add=1" className="btn primary">{t.addCustomer}</Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-label">{t.totalPending}</div>
        <div className="hero-amount">{formatRupees(data.totalPendingPaise)}</div>
        <div className="hero-sub">{t.customersOwing(data.customersOwing)}</div>
      </section>

      <section className="stats">
        <div className="stat">
          <div className="stat-label">{t.collectedThisMonth}</div>
          <div className="stat-value paid">{formatRupees(data.collectedThisMonthPaise)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">{t.creditThisMonth}</div>
          <div className="stat-value">{formatRupees(data.creditThisMonthPaise)}</div>
        </div>
      </section>

      {data.overdueCount > 0 && (
        <section>
          <h2 className="section-title">
            {t.overdueTitle(data.overdueDays)}
            <span className="section-note">{data.overdueCount} · {formatRupees(data.overduePaise)}</span>
          </h2>
          <div className="list">
            {data.overdue.map((c) => <CustomerRow key={c.id} customer={c} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">{t.topPendingTitle}</h2>
        {data.topOwing.length === 0 ? (
          <p className="muted">{t.nothingPending}</p>
        ) : (
          <div className="list">
            {data.topOwing.map((c) => <CustomerRow key={c.id} customer={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}
