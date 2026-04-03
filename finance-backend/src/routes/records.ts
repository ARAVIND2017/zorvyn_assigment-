import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { createRecordSchema, updateRecordSchema, recordFilterSchema } from '../validations';
import * as recordService from '../services/recordService';

const router = Router();

// All record routes require a valid token
router.use(authenticate);

// GET /records — all roles can view
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = recordFilterSchema.parse(req.query);
    res.json(recordService.getRecords(filter));
  } catch (err) {
    next(err);
  }
});

// GET /records/:id — all roles can view
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(recordService.getRecordById(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
});

// POST /records — admin and analyst only
router.post('/', requireRole('admin', 'analyst'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createRecordSchema.parse(req.body);
    const record = recordService.createRecord(req.user!.id, input);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// PATCH /records/:id — admin and analyst only
router.patch('/:id', requireRole('admin', 'analyst'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateRecordSchema.parse(req.body);
    res.json(recordService.updateRecord(Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
});

// DELETE /records/:id — admin only
router.delete('/:id', requireRole('admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    recordService.deleteRecord(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
