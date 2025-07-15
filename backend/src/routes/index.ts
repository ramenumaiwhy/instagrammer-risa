import { Router } from 'express';
import authRoutes from './auth.routes';
import postRoutes from './post.routes';
import accountRoutes from './account.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// API v1 ルート
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/accounts', accountRoutes);
router.use('/analytics', analyticsRoutes);

export default router;