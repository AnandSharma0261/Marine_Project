import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import shipRoutes from './routes/shipRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import drillRoutes from './routes/drillRoutes';
import userRoutes from './routes/userRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { notFound, errorHandler } from './middleware/error';

const app: Application = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl === '*' ? true : clientUrl.split(','),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'marine-api', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/ships', shipRoutes);
app.use('/api/tasks', maintenanceRoutes);
app.use('/api/drills', drillRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
