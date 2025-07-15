import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// ユーザー登録
router.post('/register', authController.register);

// ログイン
router.post('/login', authController.login);

// ログアウト
router.post('/logout', authController.logout);

// トークンリフレッシュ
router.post('/refresh', authController.refreshToken);

// 現在のユーザー情報（認証必須）
router.get('/me', authenticate, authController.getCurrentUser);

export default router;