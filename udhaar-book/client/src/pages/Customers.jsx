import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad, useDebounced } from '../useLoad.js';
import { t } from '../strings.js';
import CustomerRow from '../components/CustomerRow.jsx';
import CustomerForm from '../components/CustomerForm.jsx';
import Sheet from '../components/Sheet.jsx';

export default function Customers() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('balance');
  const q = useDebounced(query.trim());
  const adding = params.get('add') === '1';

  const { data, error, loading, reload } = useLoad(() => api.customers(q, sort), [q, sort]);

  const closeAdd = () => setParams({}, { replace: true });

  async function create(form) {
    const customer = await api.createCustomer(form);
    navigate(`/customers/${customer.id}`);
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          autoComplete="off"
        />
        <div className="segmented" role="group" aria-label={t.sortLabel}>
          <button type="button" className={sort === 'balance' ? 'on' : ''} onClick={() => setSort('balance')}>
            {t.sortByPending}
          </button>
          <button type="button" className={sort === 'name' ? 'on' : ''} onClick={() => setSort('name')}>
            {t.sortByName}
          </button>
        </div>
      </div>

      {loading && !data && <p className="center muted">{t.loading}</p>}
      {error && (
        <div className="center">
          <p className="error">{error}</p>
          <button className="btn" onClick={reload}>{t.tryAgain}</button>
        </div>
      )}
      {data && data.length === 0 && (
        <p className="center muted">{q ? t.noMatches : t.emptyShop}</p>
      )}
      {data && data.length > 0 && (
        <div className="list">
          {data.map((c) => <CustomerRow key={c.id} customer={c} />)}
        </div>
      )}

      <button type="button" className="fab" onClick={() => setParams({ add: '1' })} aria-label={t.addCustomer}>
        + {t.addCustomer}
      </button>

      {adding && (
        <Sheet title={t.addCustomer} onClose={closeAdd}>
          <CustomerForm onSubmit={create} onCancel={closeAdd} />
        </Sheet>
      )}
    </div>
  );
}
