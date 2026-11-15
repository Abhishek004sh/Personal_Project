import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../useLoad.js';
import { formatRupees } from '../money.js';
import { t } from '../strings.js';

// Home is kept deliberately minimal: just the two numbers that matter most
// (what we'll receive, what we owe). Full lists, sorted by balance, live on
// the Customers and Suppliers tabs — Home does not repeat them, so there is
// only one place to look for the detail and nothing extra to read here.
export default function Home() {
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
    </div>
  );
}
