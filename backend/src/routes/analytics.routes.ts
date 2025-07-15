import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// 全てのルートに認証を適用
router.use(authenticate);

// 全体の統計情報
router.get('/overview', async (req, res) => {
  res.json({ message: '統計概要エンドポイント' });
});

// 投稿パフォーマンス
router.get('/posts', async (req, res) => {
  res.json({ message: '投稿パフォーマンスエンドポイント' });
});

// アカウント成長分析
router.get('/growth', async (req, res) => {
  res.json({ message: 'アカウント成長分析エンドポイント' });
});

// エンゲージメント分析
router.get('/engagement', async (req, res) => {
  res.json({ message: 'エンゲージメント分析エンドポイント' });
});

// ハッシュタグパフォーマンス
router.get('/hashtags', async (req, res) => {
  res.json({ message: 'ハッシュタグ分析エンドポイント' });
});

// 最適投稿時間分析
router.get('/best-time', async (req, res) => {
  res.json({ message: '最適投稿時間エンドポイント' });
});

export default router;