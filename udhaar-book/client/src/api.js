import { t } from './strings.js';

const TOKEN_KEY = 'udhaar_token';

export const auth = {
  get token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* private mode */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(t.offline, 0);
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    // A 401 on anything except the login call means the session ended.
    if (res.status === 401 && path !== '/auth/login') {
      auth.clear();
      window.dispatchEvent(new Event('udhaar-logout'));
    }
    throw new ApiError((data && data.error) || t.genericError, res.status);
  }
  return data;
}

export const api = {
  login: (password) => request('POST', '/auth/login', { password }),
  // kind is 'customer' (Lena hai) or 'supplier' (Dena hai)
  dashboard: (kind = 'customer') => request('GET', `/dashboard?kind=${kind}`),
  customers: (q = '', sort = 'balance', kind = 'customer') =>
    request('GET', `/customers?kind=${kind}&sort=${sort}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  customer: (id) => request('GET', `/customers/${id}`),
  createCustomer: (data) => request('POST', '/customers', data),
  updateCustomer: (id, data) => request('PATCH', `/customers/${id}`, data),
  addEntry: (customerId, data) => request('POST', `/customers/${customerId}/entries`, data),
  voidEntry: (entryId, reason) => request('POST', `/entries/${entryId}/void`, { reason }),
};
