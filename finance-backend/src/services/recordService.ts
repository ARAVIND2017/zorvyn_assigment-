import db from '../models/db';
import { AppError } from '../middleware/errorHandler';
import { CreateRecordInput, UpdateRecordInput, RecordFilter } from '../validations';
import { FinancialRecord } from '../types';

export function getRecords(filter: RecordFilter) {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];

  if (filter.type) {
    conditions.push('type = ?');
    params.push(filter.type);
  }
  if (filter.category) {
    conditions.push('category = ?');
    params.push(filter.category);
  }
  if (filter.from) {
    conditions.push('date >= ?');
    params.push(filter.from);
  }
  if (filter.to) {
    conditions.push('date <= ?');
    params.push(filter.to);
  }

  const where = conditions.join(' AND ');
  const offset = (filter.page - 1) * filter.limit;

  const rows = db
    .prepare(`SELECT * FROM records WHERE ${where} ORDER BY date DESC LIMIT ? OFFSET ?`)
    .all(...params, filter.limit, offset) as FinancialRecord[];

  const { total } = db
    .prepare(`SELECT COUNT(*) as total FROM records WHERE ${where}`)
    .get(...params) as { total: number };

  return {
    data: rows,
    pagination: {
      page: filter.page,
      limit: filter.limit,
      total,
      pages: Math.ceil(total / filter.limit),
    },
  };
}

export function getRecordById(id: number) {
  const record = db
    .prepare('SELECT * FROM records WHERE id = ? AND deleted_at IS NULL')
    .get(id) as FinancialRecord | undefined;
  if (!record) throw new AppError(404, 'Record not found');
  return record;
}

export function createRecord(userId: number, input: CreateRecordInput) {
  const result = db
    .prepare(
      'INSERT INTO records (user_id, amount, type, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(userId, input.amount, input.type, input.category, input.date, input.notes ?? null);

  return getRecordById(result.lastInsertRowid as number);
}

export function updateRecord(id: number, input: UpdateRecordInput) {
  const existing = getRecordById(id); // throws 404 if not found

  const merged = { ...existing, ...input };

  db.prepare(
    'UPDATE records SET amount = ?, type = ?, category = ?, date = ?, notes = ? WHERE id = ?'
  ).run(merged.amount, merged.type, merged.category, merged.date, merged.notes ?? null, id);

  return getRecordById(id);
}

export function deleteRecord(id: number) {
  // Soft delete — preserves history and satisfies the dashboard aggregates
  const result = db
    .prepare("UPDATE records SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL")
    .run(id);
  if (result.changes === 0) throw new AppError(404, 'Record not found');
}
