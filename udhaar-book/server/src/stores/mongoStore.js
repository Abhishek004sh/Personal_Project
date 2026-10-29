// MongoDB store (Mongoose). Same interface as the memory store.

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, default: '' },
    area: { type: String, default: '' },
    notes: { type: String, default: '' },
    // Every person is one record with roles, so carpenters/contractors can
    // be added later without a second list.
    roles: { type: [String], default: ['customer'] },
    // Customers owe us ("Lena hai"); suppliers are owed by us ("Dena hai").
    // Records saved before this existed have no kind and count as customers.
    kind: { type: String, enum: ['customer', 'supplier'], default: 'customer' },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);
customerSchema.index({ name: 1 });

// Entries are never deleted or edited. A wrong entry is "voided" with a reason.
const entrySchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: ['credit', 'payment'], required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
    method: { type: String, default: '' },
    billNo: { type: String, default: '', maxlength: 40 },
    voided: {
      type: new mongoose.Schema({ reason: String, at: Date }, { _id: false }),
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
const Entry = mongoose.models.Entry || mongoose.model('Entry', entrySchema);

const isId = (id) => mongoose.isValidObjectId(id);

function plainCustomer(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    phone: doc.phone || '',
    area: doc.area || '',
    notes: doc.notes || '',
    kind: doc.kind || 'customer',
    roles: doc.roles || ['customer'],
    archived: !!doc.archived,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

function plainEntry(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    customerId: String(doc.customerId),
    type: doc.type,
    amountPaise: doc.amountPaise,
    date: new Date(doc.date).toISOString(),
    note: doc.note || '',
    method: doc.method || '',
    billNo: doc.billNo || '',
    voided: doc.voided
      ? { reason: doc.voided.reason, at: new Date(doc.voided.at).toISOString() }
      : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

function createMongoStore() {
  return {
    name: 'mongo',

    async listCustomers() {
      const docs = await Customer.find({ archived: { $ne: true } }).lean();
      return docs.map(plainCustomer);
    },

    async getCustomer(id) {
      if (!isId(id)) return null;
      return plainCustomer(await Customer.findById(id).lean());
    },

    async createCustomer(data) {
      const doc = await Customer.create({
        name: data.name,
        phone: data.phone || '',
        area: data.area || '',
        notes: data.notes || '',
        kind: data.kind || 'customer',
        roles: [data.kind || 'customer'],
      });
      return plainCustomer(doc.toObject());
    },

    async updateCustomer(id, patch) {
      if (!isId(id)) return null;
      const doc = await Customer.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
      return plainCustomer(doc);
    },

    async listEntries(customerId) {
      if (!isId(customerId)) return [];
      const docs = await Entry.find({ customerId }).lean();
      return docs.map(plainEntry);
    },

    async listAllEntries() {
      const docs = await Entry.find({}).lean();
      return docs.map(plainEntry);
    },

    async getEntry(id) {
      if (!isId(id)) return null;
      return plainEntry(await Entry.findById(id).lean());
    },

    async createEntry(data) {
      const doc = await Entry.create({
        customerId: data.customerId,
        type: data.type,
        amountPaise: data.amountPaise,
        date: data.date,
        note: data.note || '',
        method: data.method || '',
        billNo: data.billNo || '',
      });
      return plainEntry(doc.toObject());
    },

    async voidEntry(id, { reason, at }) {
      if (!isId(id)) return null;
      // Only voids an entry that is not voided yet. Returns null otherwise,
      // so two people pressing "void" together cannot overwrite the reason.
      const doc = await Entry.findOneAndUpdate(
        { _id: id, voided: null },
        { $set: { voided: { reason, at } } },
        { new: true }
      ).lean();
      return plainEntry(doc);
    },
  };
}

module.exports = { createMongoStore };
