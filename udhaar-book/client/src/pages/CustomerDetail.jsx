import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../useLoad.js';
import { formatRupees, formatDate, whatsappLink } from '../money.js';
import { t, getLang } from '../strings.js';
import Sheet from '../components/Sheet.jsx';
import CustomerForm from '../components/CustomerForm.jsx';
import EntrySheet from '../components/EntrySheet.jsx';
import VoidSheet from '../components/VoidSheet.jsx';

export default function CustomerDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useLoad(() => api.customer(id), [id]);
  const [sheet, setSheet] = useState(null); // 'credit' | 'payment' | 'edit' | { void: entry }

  if (loading && !data) return <p className="center muted">{t.loading}</p>;
  if (error && !data) {
    return (
      <div className="center">
        <p className="error">{error}</p>
        <Link to="/customers" className="btn">{t.navCustomers}</Link>
      </div>
    );
  }

  const { customer, entries } = data;
  const { balancePaise } = customer;
  const close = () => setSheet(null);
  const saved = () => { close(); reload(); };

  const reminder =
    balancePaise > 0
      ? whatsappLink(customer.phone, t.reminderMessage(customer.name, formatRupees(balancePaise)))
      : null;

  let balanceClass = 'muted';
  let balanceLabel = t.settled;
  let balanceText = formatRupees(0);
  if (balancePaise > 0) {
    balanceClass = 'owed'; balanceLabel = t.pending; balanceText = formatRupees(balancePaise);
  } else if (balancePaise < 0) {
    balanceClass = 'paid'; balanceLabel = t.advance; balanceText = formatRupees(-balancePaise);
  }

  async function saveCustomer(form) {
    await api.updateCustomer(customer.id, form);
    saved();
  }

  return (
    <div className="stack">
      <Link to="/customers" className="back">← {t.navCustomers}</Link>

      <section className="card">
        <div className="detail-head">
          <div>
            <h1 className="detail-name">{customer.name}</h1>
            <div className="row-sub">{[customer.area, customer.phone].filter(Boolean).join(' · ')}</div>
            {customer.notes && <div className="row-sub notes">{customer.notes}</div>}
          </div>
          <button type="button" className="link-btn" onClick={() => setSheet('edit')}>{t.editCustomer}</button>
        </div>

        <div className="balance">
          <div className="hero-label">{balanceLabel}</div>
          <div className={`balance-amount ${balanceClass}`}>{balanceText}</div>
          {balancePaise > 0 && customer.oldestUnpaidDays !== null && (
            <div className="row-sub">{t.oldestPending(t.days(customer.oldestUnpaidDays))}</div>
          )}
        </div>

        <div className="actions">
          <button type="button" className="btn credit" onClick={() => setSheet('credit')}>{t.gaveGoods}</button>
          <button type="button" className="btn payment" onClick={() => setSheet('payment')}>{t.gotPayment}</button>
        </div>

        {customer.phone && (
          <div className="actions small">
            <a className="btn" href={`tel:+91${customer.phone}`}>{t.call}</a>
            {reminder && (
              <a className="btn" href={reminder} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>
            )}
          </div>
        )}
        {reminder && <p className="help">{t.whatsappHint}</p>}
      </section>

      <section>
        <h2 className="section-title">{t.historyTitle}</h2>
        {entries.length === 0 ? (
          <p className="muted">{t.noEntries}</p>
        ) : (
          <ul className="history">
            {entries.map((e) => (
              <li key={e.id} className={e.voided ? 'voided' : ''}>
                <div className="history-main">
                  <div className="history-type">
                    {t[e.type]}
                    {e.type === 'payment' && e.method ? ` · ${t[e.method] || e.method}` : ''}
                  </div>
                  <div className="row-sub">{formatDate(e.date, getLang())}{e.note ? ` · ${e.note}` : ''}</div>
                  {e.voided && (
                    <div className="row-sub">{t.cancelledLabel}: {e.voided.reason}</div>
                  )}
                </div>
                <div className="history-side">
                  <div className={e.type === 'credit' ? 'owed' : 'paid'}>
                    {e.type === 'credit' ? '+' : '−'}{formatRupees(e.amountPaise)}
                  </div>
                  {!e.voided && (
                    <button type="button" className="link-btn" onClick={() => setSheet({ void: e })}>
                      {t.cancelEntry}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(sheet === 'credit' || sheet === 'payment') && (
        <EntrySheet type={sheet} customer={customer} onClose={close} onSaved={saved} />
      )}
      {sheet === 'edit' && (
        <Sheet title={t.editCustomer} onClose={close}>
          <CustomerForm initial={customer} onSubmit={saveCustomer} onCancel={close} />
        </Sheet>
      )}
      {sheet && sheet.void && <VoidSheet entry={sheet.void} onClose={close} onDone={saved} />}
    </div>
  );
}
