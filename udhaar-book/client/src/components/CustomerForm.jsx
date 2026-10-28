import { useState } from 'react';
import { t } from '../strings.js';

export default function CustomerForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    phone: initial.phone || '',
    area: initial.area || '',
    notes: initial.notes || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="form">
      <label>
        {t.name}
        <input value={form.name} onChange={set('name')} maxLength={80} required autoFocus autoComplete="off" />
      </label>
      <label>
        {t.phone}
        <input value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="off" />
      </label>
      <label>
        {t.area}
        <input value={form.area} onChange={set('area')} maxLength={80} autoComplete="off" />
      </label>
      <label>
        {t.notes}
        <textarea value={form.notes} onChange={set('notes')} maxLength={500} rows={2} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>{t.cancel}</button>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? t.saving : t.save}</button>
      </div>
    </form>
  );
}
