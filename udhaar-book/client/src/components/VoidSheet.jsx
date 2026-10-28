import { useState } from 'react';
import Sheet from './Sheet.jsx';
import { api } from '../api.js';
import { formatRupees, formatDate } from '../money.js';
import { t, getLang } from '../strings.js';

// Entries are never deleted. A wrong entry is cancelled with a reason and
// stays in the history.
export default function VoidSheet({ entry, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.voidEntry(entry.id, reason);
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Sheet title={t.cancelEntryTitle} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <p className="preview">
          {t[entry.type]} · <strong>{formatRupees(entry.amountPaise)}</strong> · {formatDate(entry.date, getLang())}
        </p>
        <p className="help">{t.cancelEntryHelp}</p>
        <label>
          {t.reason}
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            autoFocus
            required
            minLength={3}
            placeholder={t.reasonPlaceholder}
            autoComplete="off"
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onClose}>{t.keepEntry}</button>
          <button type="submit" className="btn danger" disabled={busy}>{busy ? t.saving : t.confirmCancel}</button>
        </div>
      </form>
    </Sheet>
  );
}
