export type Role = 'viewer' | 'analyst' | 'admin';
export type RecordType = 'income' | 'expense';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: Role;
  is_active: number; // SQLite stores booleans as 0/1
  created_at: string;
}

export interface FinancialRecord {
  id: number;
  user_id: number;
  amount: number;
  type: RecordType;
  category: string;
  date: string;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
}

// Extends Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, 'id' | 'email' | 'role'>;
    }
  }
}
