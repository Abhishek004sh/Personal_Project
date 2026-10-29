import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../useLoad.js';
import { formatRupees } from '../money.js';
import { t } from '../strings.js';
import CustomerRow from '../components/CustomerRow.jsx';

export default function Home() {
  // Two questions asked together: how much will we receive (customers)
  // and how much do we have to pay (suppliers).
  const { data, error, loading, reload } = useLoad(
    () =>
      Promise.all([api.dashboard('customer'), api.dashboard('supplier')]).then(([lena, dena]) => ({ lena, dena })),
    []
  );

  if (loading && !data) return <p className="center muted">{t.loading}</p>;
  if (error && !data) {
    return (
      <div className="center">
        <p className="error">{error}</p>
        <button className="btn" onClick={reload}>{t.tryAgain}</button>
      </div>
    );
  }

  const { lena, dena } = data;

  if (lena.totalCustomers === 0 && dena.totalCustomers === 0) {
    return (
      <div className="center">
        <p>{t.emptyShop}</p>
        <Link to="/customers?add=1" className="btn primary">{t.addCustomer}</Link>
        <Link to="/suppliers?add=1" className="btn">{t.addSupplier}</Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="cards">
        <Link to="/customers" className="hero-card receive">
          <div className="hero-label">{t.receiveCard}</div>
          <div className="hero-amount">{formatRupees(lena.totalPendingPaise)}</div>
          <div className="hero-sub">{t.customersOwing(lena.customersOwing)}</div>
        </Link>
        <Link to="/suppliers" className="hero-card pay">
          <div className="hero-label">{t.payCard}</div>
          <div className="hero-amount">{formatRupees(dena.totalPendingPaise)}</div>
          <div className="hero-sub">{t.suppliersToPay(dena.customersOwing)}</div>
        </Link>
      </section>

      {lena.totalCustomers > 0 && (
        <>
          <section className="stats">
            <div className="stat">
              <div className="stat-label">{t.collectedThisMonth}</div>
              <div className="stat-value paid">{formatRupees(lena.collectedThisMonthPaise)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">{t.creditThisMonth}</div>
              <div className="stat-value">{formatRupees(lena.creditThisMonthPaise)}</div>
            </div>
          </section>

          {lena.overdueCount > 0 && (
            <section>
              <h2 className="section-title">
                {t.overdueTitle(lena.overdueDays)}
                <span className="section-note">{lena.overdueCount} · {formatRupees(lena.overduePaise)}</span>
              </h2>
              <div className="list">
                {lena.overdue.map((c) => <CustomerRow key={c.id} customer={c} />)}
              </div>
            </section>
          )}

          <section>
            <h2 className="section-title">{t.topPendingTitle}</h2>
            {lena.topOwing.length === 0 ? (
              <p className="muted">{t.nothingPending}</p>
            ) : (
              <div className="list">
                {lena.topOwing.map((c) => <CustomerRow key={c.id} customer={c} />)}
              </div>
            )}
          </section>
        </>
      )}

      {dena.totalCustomers > 0 && (
        <>
          {dena.noRecentPayment.length > 0 && (
            <section>
              <h2 className="section-title">{t.noRecentPaymentTitle(dena.overdueDays)}</h2>
              <div className="list">
                {dena.noRecentPayment.map((c) => <CustomerRow key={c.id} customer={c} />)}
              </div>
            </section>
          )}

          <section>
            <h2 className="section-title">{t.topOwedSuppliersTitle}</h2>
            {dena.topOwing.length === 0 ? (
              <p className="muted">{t.nothingToPay}</p>
            ) : (
              <div className="list">
                {dena.topOwing.map((c) => <CustomerRow key={c.id} customer={c} />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
