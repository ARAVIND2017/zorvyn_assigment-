import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { updateUserSchema } from '../validations';
import * as userService from '../services/userService';

const router = Router();

// All user management routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

// GET /users
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(userService.getAllUsers());
  } catch (err) {
    next(err);
  }
});

// GET /users/:id
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(userService.getUserById(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
});

// PATCH /users/:id  — update role or active status
router.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateUserSchema.parse(req.body);
    res.json(userService.updateUser(Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
});

// DELETE /users/:id
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    userService.deleteUser(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
