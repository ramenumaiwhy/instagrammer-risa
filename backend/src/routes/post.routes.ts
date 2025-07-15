import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// 全てのルートに認証を適用
router.use(authenticate);

// コントローラーをインポート
import * as postController from '../controllers/post.controller';

// 投稿一覧取得
router.get('/', postController.getPosts);

// 投稿詳細取得
router.get('/:id', postController.getPostById);

// 投稿作成
router.post('/', postController.createPost);

// 投稿更新
router.put('/:id', postController.updatePost);

// 投稿削除
router.delete('/:id', postController.deletePost);

// 投稿スケジュール
router.post('/:id/schedule', postController.schedulePost);

// 投稿公開
router.post('/:id/publish', postController.publishPost);

export default router;