import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as dashboardService from '../services/dashboardService';

const router = Router();

// Dashboard is read-only — any authenticated user can access
router.use(authenticate);

// GET /dashboard/summary — total income, expenses, net balance
router.get('/summary', (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(dashboardService.getSummary());
  } catch (err) {
    next(err);
  }
});

// GET /dashboard/categories — breakdown by category and type
router.get('/categories', (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(dashboardService.getCategoryBreakdown());
  } catch (err) {
    next(err);
  }
});

// GET /dashboard/trends — monthly income/expense for last 12 months
router.get('/trends', (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(dashboardService.getMonthlyTrends());
  } catch (err) {
    next(err);
  }
});

// GET /dashboard/activity — recent transactions with creator info
router.get('/activity', (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json(dashboardService.getRecentActivity(limit));
  } catch (err) {
    next(err);
  }
});

export default router;
