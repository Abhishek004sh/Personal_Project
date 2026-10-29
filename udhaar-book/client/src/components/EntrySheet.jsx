import { useState } from 'react';
import Sheet from './Sheet.jsx';
import { api } from '../api.js';
import { parseRupeesToPaise, formatRupees, todayIST } from '../money.js';
import { t } from '../strings.js';

// Form for one new entry: goods given on credit, or a payment received.
export default function EntrySheet({ type, customer, onClose, onSaved }) {
  const isCredit = type === 'credit';
  // For a supplier "credit" means we took goods (we owe more) and "payment" means we paid.
  const isSupplier = customer.kind === 'supplier';
  const [billNo, setBillNo] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIST());
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('cash');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const paise = parseRupeesToPaise(amount);
  const after = paise ? customer.balancePaise + (isCredit ? paise : -paise) : null;

  async function submit(e) {
    e.preventDefault();
    if (!paise) {
      setError(t.amountError);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.addEntry(customer.id, {
        type,
        amountPaise: paise,
        date,
        note,
        ...(isCredit ? {} : { method }),
        ...(isSupplier && isCredit ? { billNo } : {}),
      });
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Sheet
      title={isSupplier ? (isCredit ? t.tookGoods : t.gavePayment) : isCredit ? t.gaveGoods : t.gotPayment}
      onClose={onClose}
    >
      <form onSubmit={submit} className="form">
        <label>
          {t.amount}
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            required
            className="amount-input"
          />
        </label>

        {!isCredit && (
          <fieldset className="chips">
            <legend>{isSupplier ? t.methodPaid : t.method}</legend>
            {['cash', 'upi', 'other'].map((m) => (
              <label key={m} className={`chip ${method === m ? 'on' : ''}`}>
                <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} />
                {t[m]}
              </label>
            ))}
          </fieldset>
        )}

        <label>
          {t.date}
          <input type="date" value={date} max={todayIST()} onChange={(e) => setDate(e.target.value)} required />
        </label>

        {isSupplier && isCredit && (
          <label>
            {t.billNoOptional}
            <input value={billNo} onChange={(e) => setBillNo(e.target.value)} maxLength={40} autoComplete="off" />
          </label>
        )}

        <label>
          {isCredit ? (isSupplier ? t.whatWasTaken : t.whatWasGiven) : t.remark}
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} autoComplete="off" />
        </label>

        {after !== null && (
          <p className="preview">
            {t.balanceAfter}: <strong>{after < 0 ? `${t.advance} ${formatRupees(-after)}` : formatRupees(after)}</strong>
          </p>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onClose}>{t.cancel}</button>
          <button type="submit" className={`btn ${isCredit ? 'credit' : 'payment'}`} disabled={busy}>
            {busy ? t.saving : t.save}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
