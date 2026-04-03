import { Router, Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../validations';
import * as authService from '../services/authService';

const router = Router();

// POST /auth/register
router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = authService.register(input);
    res.status(201).json({ message: 'User registered', user: result });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = authService.login(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
