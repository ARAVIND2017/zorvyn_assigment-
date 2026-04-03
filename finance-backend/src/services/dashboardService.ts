import db from '../models/db';

export function getSummary() {
  // Single query for top-level KPIs
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_balance,
      COUNT(*) AS total_records
    FROM records
    WHERE deleted_at IS NULL
  `).get() as {
    total_income: number;
    total_expenses: number;
    net_balance: number;
    total_records: number;
  };

  return totals;
}

export function getCategoryBreakdown() {
  return db.prepare(`
    SELECT
      category,
      type,
      ROUND(SUM(amount), 2) AS total,
      COUNT(*)              AS count
    FROM records
    WHERE deleted_at IS NULL
    GROUP BY category, type
    ORDER BY total DESC
  `).all();
}

export function getMonthlyTrends() {
  // Returns last 12 months of income/expense grouped by month
  return db.prepare(`
    SELECT
      strftime('%Y-%m', date)                                              AS month,
      ROUND(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 2)   AS income,
      ROUND(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 2)   AS expenses,
      ROUND(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 2) AS net
    FROM records
    WHERE deleted_at IS NULL
      AND date >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all();
}

export function getRecentActivity(limit = 10) {
  return db.prepare(`
    SELECT r.id, r.amount, r.type, r.category, r.date, r.notes, r.created_at,
           u.email AS created_by
    FROM records r
    JOIN users u ON r.user_id = u.id
    WHERE r.deleted_at IS NULL
    ORDER BY r.created_at DESC
    LIMIT ?
  `).all(limit);
}
