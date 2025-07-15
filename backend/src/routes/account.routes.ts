import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// 全てのルートに認証を適用
router.use(authenticate);

// コントローラーをインポート
import * as accountController from '../controllers/account.controller';

// アカウント一覧取得
router.get('/', accountController.getAccounts);

// アカウント詳細取得
router.get('/:id', accountController.getAccountById);

// Instagramアカウント連携
router.post('/connect', accountController.connectInstagram);

// アカウント連携解除
router.delete('/:id/disconnect', accountController.disconnectAccount);

// アカウント設定更新
router.put('/:id/settings', accountController.updateAccountSettings);

// アカウント情報同期
router.post('/:id/sync', accountController.syncAccountInfo);

export default router;