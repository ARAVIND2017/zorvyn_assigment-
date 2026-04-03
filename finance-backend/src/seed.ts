/**
 * Seed script — run once with: npm run seed
 * Creates three users (one per role) and sample financial records.
 */
import db from './models/db';
import bcrypt from 'bcryptjs';

const users = [
  { email: 'admin@example.com',   password: 'admin123',   role: 'admin'   },
  { email: 'analyst@example.com', password: 'analyst123', role: 'analyst' },
  { email: 'viewer@example.com',  password: 'viewer123',  role: 'viewer'  },
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)'
);

users.forEach(({ email, password, role }) => {
  const hash = bcrypt.hashSync(password, 10);
  insertUser.run(email, hash, role);
  console.log(`Seeded user: ${email} (${role})`);
});

const adminId = (db.prepare('SELECT id FROM users WHERE email = ?').get('admin@example.com') as { id: number }).id;

const records = [
  { amount: 5000,  type: 'income',  category: 'Salary',       date: '2024-01-15', notes: 'Monthly salary' },
  { amount: 1200,  type: 'expense', category: 'Rent',          date: '2024-01-20', notes: null },
  { amount: 250,   type: 'expense', category: 'Utilities',     date: '2024-01-22', notes: 'Electricity + internet' },
  { amount: 3500,  type: 'income',  category: 'Freelance',     date: '2024-02-05', notes: 'Web project' },
  { amount: 800,   type: 'expense', category: 'Groceries',     date: '2024-02-10', notes: null },
  { amount: 5000,  type: 'income',  category: 'Salary',        date: '2024-02-15', notes: 'Monthly salary' },
  { amount: 1200,  type: 'expense', category: 'Rent',          date: '2024-02-20', notes: null },
  { amount: 400,   type: 'expense', category: 'Subscriptions', date: '2024-02-28', notes: 'Annual tools' },
  { amount: 2000,  type: 'income',  category: 'Freelance',     date: '2024-03-08', notes: null },
  { amount: 5000,  type: 'income',  category: 'Salary',        date: '2024-03-15', notes: 'Monthly salary' },
  { amount: 950,   type: 'expense', category: 'Travel',        date: '2024-03-18', notes: 'Conference trip' },
  { amount: 1200,  type: 'expense', category: 'Rent',          date: '2024-03-20', notes: null },
];

const insertRecord = db.prepare(
  'INSERT INTO records (user_id, amount, type, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)'
);

records.forEach((r) => {
  insertRecord.run(adminId, r.amount, r.type, r.category, r.date, r.notes);
});

console.log(`Seeded ${records.length} financial records`);
console.log('\nReady to test:');
users.forEach(({ email, password, role }) => {
  console.log(`  ${role.padEnd(8)} → email: ${email}  password: ${password}`);
});
