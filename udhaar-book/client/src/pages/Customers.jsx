import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad, useDebounced } from '../useLoad.js';
import { t } from '../strings.js';
import CustomerRow from '../components/CustomerRow.jsx';
import CustomerForm from '../components/CustomerForm.jsx';
import Sheet from '../components/Sheet.jsx';

// One list page for both sections. kind="customer" is "Lena hai",
// kind="supplier" is "Dena hai". Only the words and the web address change.
export default function Customers({ kind = 'customer' }) {
  const isSupplier = kind === 'supplier';
  const base = isSupplier ? '/suppliers' : '/customers';
  const words = isSupplier
    ? {
        placeholder: t.searchSupplierPlaceholder,
        sortFirst: t.sortByToPay,
        add: t.addSupplier,
        empty: t.noSuppliers,
        noMatch: t.noSupplierMatches,
      }
    : {
        placeholder: t.searchPlaceholder,
        sortFirst: t.sortByPending,
        add: t.addCustomer,
        empty: t.emptyShop,
        noMatch: t.noMatches,
      };

  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('balance');
  const q = useDebounced(query.trim());
  const adding = params.get('add') === '1';

  const { data, error, loading, reload } = useLoad(() => api.customers(q, sort, kind), [q, sort, kind]);

  const closeAdd = () => setParams({}, { replace: true });

  async function create(form) {
    const person = await api.createCustomer({ ...form, kind });
    navigate(`${base}/${person.id}`);
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={words.placeholder}
          aria-label={words.placeholder}
          autoComplete="off"
        />
        <div className="segmented" role="group" aria-label={t.sortLabel}>
          <button type="button" className={sort === 'balance' ? 'on' : ''} onClick={() => setSort('balance')}>
            {words.sortFirst}
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
        <p className="center muted">{q ? words.noMatch : words.empty}</p>
      )}
      {data && data.length > 0 && (
        <div className="list">
          {data.map((c) => <CustomerRow key={c.id} customer={c} />)}
        </div>
      )}

      <button type="button" className="fab" onClick={() => setParams({ add: '1' })} aria-label={words.add}>
        + {words.add}
      </button>

      {adding && (
        <Sheet title={words.add} onClose={closeAdd}>
          <CustomerForm onSubmit={create} onCancel={closeAdd} />
        </Sheet>
      )}
    </div>
  );
}
