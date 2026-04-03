import db from '../models/db';
import { AppError } from '../middleware/errorHandler';
import { User } from '../types';

export function getAllUsers() {
  return db
    .prepare('SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at DESC')
    .all();
}

export function getUserById(id: number) {
  const user = db
    .prepare('SELECT id, email, role, is_active, created_at FROM users WHERE id = ?')
    .get(id);
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export function updateUser(id: number, updates: { role?: User['role']; is_active?: boolean }) {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError(404, 'User not found');

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.role !== undefined) {
    fields.push('role = ?');
    values.push(updates.role);
  }
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }

  if (fields.length === 0) throw new AppError(400, 'No valid fields to update');

  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return getUserById(id);
}

export function deleteUser(id: number) {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes === 0) throw new AppError(404, 'User not found');
}
