import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import authRoutes      from './routes/auth';
import userRoutes      from './routes/users';
import recordRoutes    from './routes/records';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(express.json());

// Health check — useful for deployment and CI
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth',      authRoutes);
app.use('/users',     userRoutes);
app.use('/records',   recordRoutes);
app.use('/dashboard', dashboardRoutes);

// 404 for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Central error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Finance backend running on http://localhost:${PORT}`);
});

export default app;
