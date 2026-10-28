// In-memory store. Same interface as the MongoDB store.
// Used for automated tests, and handy for trying the API without a database.

const crypto = require('crypto');

function createMemoryStore() {
  const customers = new Map();
  const entries = new Map();

  const copy = (o) => (o ? JSON.parse(JSON.stringify(o)) : null);
  const newId = () => crypto.randomBytes(12).toString('hex');

  return {
    name: 'memory',

    async listCustomers() {
      return [...customers.values()].filter((c) => !c.archived).map(copy);
    },

    async getCustomer(id) {
      return copy(customers.get(id));
    },

    async createCustomer(data) {
      const now = new Date().toISOString();
      const customer = {
        id: newId(),
        name: data.name,
        phone: data.phone || '',
        area: data.area || '',
        notes: data.notes || '',
        roles: ['customer'],
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      customers.set(customer.id, customer);
      return copy(customer);
    },

    async updateCustomer(id, patch) {
      const c = customers.get(id);
      if (!c) return null;
      Object.assign(c, patch, { updatedAt: new Date().toISOString() });
      return copy(c);
    },

    async listEntries(customerId) {
      return [...entries.values()].filter((e) => e.customerId === customerId).map(copy);
    },

    async listAllEntries() {
      return [...entries.values()].map(copy);
    },

    async getEntry(id) {
      return copy(entries.get(id));
    },

    async createEntry(data) {
      const entry = {
        id: newId(),
        customerId: data.customerId,
        type: data.type,
        amountPaise: data.amountPaise,
        date: new Date(data.date).toISOString(),
        note: data.note || '',
        method: data.method || '',
        voided: null,
        createdAt: new Date().toISOString(),
      };
      entries.set(entry.id, entry);
      return copy(entry);
    },

    async voidEntry(id, { reason, at }) {
      const e = entries.get(id);
      if (!e) return null;
      e.voided = { reason, at: new Date(at).toISOString() };
      return copy(e);
    },
  };
}

module.exports = { createMemoryStore };
