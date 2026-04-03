import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/db';
import { JWT_SECRET } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../validations';
import { User } from '../types';

const TOKEN_TTL = '24h';

export function register(input: RegisterInput) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(input.email);
  if (existing) throw new AppError(409, 'Email already registered');

  const password_hash = bcrypt.hashSync(input.password, 10);

  const result = db
    .prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)')
    .run(input.email, password_hash, input.role);

  return { id: result.lastInsertRowid, email: input.email, role: input.role };
}

export function login(input: LoginInput) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(input.email) as User | undefined;

  if (!user || !bcrypt.compareSync(input.password, user.password_hash)) {
    // Same error for both cases — avoids email enumeration
    throw new AppError(401, 'Invalid email or password');
  }

  if (!user.is_active) {
    throw new AppError(403, 'Account is deactivated');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  };
}
