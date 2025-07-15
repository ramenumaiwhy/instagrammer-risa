import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { InstagramService } from '../services/instagram.service';

// アカウント一覧取得
export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const accounts = await prisma.instagramAccount.findMany({
      where: {
        userId: req.user.userId,
      },
      select: {
        id: true,
        username: true,
        profilePictureUrl: true,
        followersCount: true,
        followingCount: true,
        postsCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'アカウント一覧の取得に失敗しました' });
  }
};

// アカウント詳細取得
export const getAccountById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { id } = req.params;

    const account = await prisma.instagramAccount.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!account) {
      res.status(404).json({ error: 'アカウントが見つかりません' });
      return;
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Get account by id error:', error);
    res.status(500).json({ error: 'アカウント情報の取得に失敗しました' });
  }
};

// Instagram アカウント連携
export const connectInstagram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { accessToken, accountId } = req.body;

    if (!accessToken || !accountId) {
      res.status(400).json({ error: 'アクセストークンとアカウントIDが必要です' });
      return;
    }

    // Instagram サービスを使用してアカウント情報を取得
    const instagramService = new InstagramService(accessToken);
    const accountInfo = await instagramService.getAccountInfo(accountId);

    // 既存のアカウントをチェック
    const existingAccount = await prisma.instagramAccount.findUnique({
      where: { accountId },
    });

    if (existingAccount) {
      // 既存のアカウントを更新
      const updatedAccount = await prisma.instagramAccount.update({
        where: { accountId },
        data: {
          userId: req.user.userId,
          username: accountInfo.username,
          accessToken,
          profilePictureUrl: accountInfo.profile_picture_url,
          followersCount: accountInfo.followers_count,
          followingCount: accountInfo.follows_count,
          postsCount: accountInfo.media_count,
          isActive: true,
        },
      });

      res.json({
        success: true,
        data: updatedAccount,
        message: 'アカウントの連携を更新しました',
      });
    } else {
      // 新規アカウントを作成
      const newAccount = await prisma.instagramAccount.create({
        data: {
          userId: req.user.userId,
          accountId,
          username: accountInfo.username,
          accessToken,
          profilePictureUrl: accountInfo.profile_picture_url,
          followersCount: accountInfo.followers_count,
          followingCount: accountInfo.follows_count,
          postsCount: accountInfo.media_count,
        },
      });

      res.status(201).json({
        success: true,
        data: newAccount,
        message: 'アカウントを連携しました',
      });
    }
  } catch (error) {
    console.error('Connect Instagram error:', error);
    res.status(500).json({ error: 'Instagram連携に失敗しました' });
  }
};

// アカウント連携解除
export const disconnectAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { id } = req.params;

    // アカウントの所有権を確認
    const account = await prisma.instagramAccount.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!account) {
      res.status(404).json({ error: 'アカウントが見つかりません' });
      return;
    }

    // アカウントを無効化（削除はしない）
    await prisma.instagramAccount.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'アカウントの連携を解除しました',
    });
  } catch (error) {
    console.error('Disconnect account error:', error);
    res.status(500).json({ error: '連携解除に失敗しました' });
  }
};

// アカウント設定更新
export const updateAccountSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { id } = req.params;
    const { isActive } = req.body;

    // アカウントの所有権を確認
    const account = await prisma.instagramAccount.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!account) {
      res.status(404).json({ error: 'アカウントが見つかりません' });
      return;
    }

    // 設定を更新
    const updatedAccount = await prisma.instagramAccount.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : account.isActive,
      },
    });

    res.json({
      success: true,
      data: updatedAccount,
    });
  } catch (error) {
    console.error('Update account settings error:', error);
    res.status(500).json({ error: 'アカウント設定の更新に失敗しました' });
  }
};

// アカウント情報を同期
export const syncAccountInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { id } = req.params;

    // アカウントを取得
    const account = await prisma.instagramAccount.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!account) {
      res.status(404).json({ error: 'アカウントが見つかりません' });
      return;
    }

    // Instagram から最新情報を取得
    const instagramService = new InstagramService(account.accessToken);
    const accountInfo = await instagramService.getAccountInfo(account.accountId);

    // アカウント情報を更新
    const updatedAccount = await prisma.instagramAccount.update({
      where: { id },
      data: {
        username: accountInfo.username,
        profilePictureUrl: accountInfo.profile_picture_url,
        followersCount: accountInfo.followers_count,
        followingCount: accountInfo.follows_count,
        postsCount: accountInfo.media_count,
      },
    });

    res.json({
      success: true,
      data: updatedAccount,
      message: 'アカウント情報を同期しました',
    });
  } catch (error) {
    console.error('Sync account info error:', error);
    res.status(500).json({ error: 'アカウント情報の同期に失敗しました' });
  }
};