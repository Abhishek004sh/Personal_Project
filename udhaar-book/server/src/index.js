require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const { createApp } = require('./app');
const { createMongoStore } = require('./stores/mongoStore');

function required(name, minLength = 1) {
  const v = process.env[name];
  if (!v || v.length < minLength) {
    console.error(`Missing or too short setting: ${name} (see .env.example)`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const mongoUri = required('MONGODB_URI');
  const config = {
    jwtSecret: required('JWT_SECRET', 32),
    adminPassword: required('ADMIN_PASSWORD', 8),
    corsOrigin: process.env.CORS_ORIGIN || '',
    trustProxy: process.env.TRUST_PROXY === 'true',
    clientDist: path.join(__dirname, '..', '..', 'client', 'dist'),
  };

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const app = createApp({ store: createMongoStore(), config });
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => console.log(`Udhaar Book running on http://localhost:${port}`));
}

main().catch((err) => {
  console.error('Could not start:', err.message);
  process.exit(1);
});
