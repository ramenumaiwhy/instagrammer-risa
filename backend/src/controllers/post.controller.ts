import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { InstagramService } from '../services/instagram.service';
import { PostStatus } from '@prisma/client';

// 投稿一覧取得
export const getPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { accountId, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // クエリ条件を構築
    const where: any = {
      account: {
        userId: req.user.userId,
      },
    };

    if (accountId) {
      where.accountId = accountId;
    }

    if (status) {
      where.status = status as PostStatus;
    }

    // 投稿を取得
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              username: true,
              profilePictureUrl: true,
            },
          },
          media: true,
          _count: {
            select: {
              hashtags: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: '投稿一覧の取得に失敗しました' });
  }
};

// 投稿詳細取得
export const getPostById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { id } = req.params;

    const post = await prisma.post.findFirst({
      where: {
        id,
        account: {
          userId: req.user.userId,
        },
      },
      include: {
        account: true,
        media: true,
        hashtags: true,
        analytics: {
          orderBy: {
            date: 'desc',
          },
          take: 7,
        },
      },
    });

    if (!post) {
      res.status(404).json({ error: '投稿が見つかりません' });
      return;
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Get post by id error:', error);
    res.status(500).json({ error: '投稿の取得に失敗しました' });
  }
};

// 投稿作成
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { accountId, caption, mediaUrl, mediaType, scheduledAt, hashtags } = req.body;

    // アカウントの所有権を確認
    const account = await prisma.instagramAccount.findFirst({
      where: {
        id: accountId,
        userId: req.user.userId,
      },
    });

    if (!account) {
      res.status(404).json({ error: 'アカウントが見つかりません' });
      return;
    }

    // ハッシュタグを処理
    const hashtagRecords = hashtags ? await Promise.all(
      hashtags.map(async (tag: string) => {
        const name = tag.startsWith('#') ? tag.substring(1) : tag;
        return prisma.hashtag.upsert({
          where: { name },
          update: {},
          create: { name },
        });
      })
    ) : [];

    // 投稿を作成
    const post = await prisma.post.create({
      data: {
        accountId,
        caption,
        mediaUrl,
        mediaType: mediaType || 'IMAGE',
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        media: {
          create: {
            url: mediaUrl,
            type: mediaType || 'IMAGE',
          },
        },
        hashtags: {
          connect: hashtagRecords.map((tag) => ({ id: tag.id })),
        },
      },
      include: {
        account: true,
        media: true,
        hashtags: true,
      },
    });

    // スケジュールされた場合、スケジュールレコードを作成
    if (scheduledAt) {
      await prisma.schedule.create({
        data: {
          postId: post.id,
          scheduledAt: new Date(scheduledAt),
        },
      });
    }

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: '投稿の作成に失敗しました' });
  }
};

// 投稿更新
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { id } = req.params;
    const { caption, scheduledAt, status } = req.body;

    // 投稿の所有権を確認
    const existingPost = await prisma.post.findFirst({
      where: {
        id,
        account: {
          userId: req.user.userId,
        },
      },
    });

    if (!existingPost) {
      res.status(404).json({ error: '投稿が見つかりません' });
      return;
    }

    // 公開済みの投稿は編集不可
    if (existingPost.status === 'PUBLISHED') {
      res.status(400).json({ error: '公開済みの投稿は編集できません' });
      return;
    }

    // 投稿を更新
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        caption: caption !== undefined ? caption : existingPost.caption,
        status: status !== undefined ? status : existingPost.status,
        scheduledAt: scheduledAt !== undefined ? new Date(scheduledAt) : existingPost.scheduledAt,
      },
      include: {
        account: true,
        media: true,
        hashtags: true,
      },
    });

    res.json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: '投稿の更新に失敗しました' });
  }
};

// 投稿削除
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { id } = req.params;

    // 投稿の所有権を確認
    const post = await prisma.post.findFirst({
      where: {
        id,
        account: {
          userId: req.user.userId,
        },
      },
    });

    if (!post) {
      res.status(404).json({ error: '投稿が見つかりません' });
      return;
    }

    // 公開済みの投稿は削除不可
    if (post.status === 'PUBLISHED') {
      res.status(400).json({ error: '公開済みの投稿は削除できません' });
      return;
    }

    // 投稿を削除
    await prisma.post.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '投稿を削除しました',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: '投稿の削除に失敗しました' });
  }
};

// 投稿スケジュール
export const schedulePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      res.status(400).json({ error: 'スケジュール日時が必要です' });
      return;
    }

    // 投稿の所有権を確認
    const post = await prisma.post.findFirst({
      where: {
        id,
        account: {
          userId: req.user.userId,
        },
      },
    });

    if (!post) {
      res.status(404).json({ error: '投稿が見つかりません' });
      return;
    }

    if (post.status === 'PUBLISHED') {
      res.status(400).json({ error: '公開済みの投稿はスケジュールできません' });
      return;
    }

    // 投稿をスケジュール
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
      },
    });

    // スケジュールレコードを作成
    await prisma.schedule.create({
      data: {
        postId: post.id,
        scheduledAt: new Date(scheduledAt),
      },
    });

    res.json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    console.error('Schedule post error:', error);
    res.status(500).json({ error: '投稿のスケジュールに失敗しました' });
  }
};

// 投稿公開
export const publishPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '認証が必要です' });
      return;
    }

    const { id } = req.params;

    // 投稿とアカウント情報を取得
    const post = await prisma.post.findFirst({
      where: {
        id,
        account: {
          userId: req.user.userId,
        },
      },
      include: {
        account: true,
      },
    });

    if (!post) {
      res.status(404).json({ error: '投稿が見つかりません' });
      return;
    }

    if (post.status === 'PUBLISHED') {
      res.status(400).json({ error: 'すでに公開されています' });
      return;
    }

    // Instagram API を使用して投稿
    const instagramService = new InstagramService(post.account.accessToken);
    
    // メディアオブジェクトを作成
    const mediaObject = await instagramService.createMediaObject(
      post.account.accountId,
      post.mediaUrl,
      post.caption
    );

    // メディアを公開
    const publishedMedia = await instagramService.publishMedia(
      post.account.accountId,
      mediaObject.id
    );

    // 投稿情報を取得
    const mediaInfo = await instagramService.getMedia(publishedMedia.id);

    // データベースを更新
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        instagramPostId: publishedMedia.id,
        permalink: mediaInfo.permalink,
      },
    });

    res.json({
      success: true,
      data: updatedPost,
      message: 'Instagramに投稿しました',
    });
  } catch (error) {
    console.error('Publish post error:', error);
    
    // 失敗した場合、ステータスを更新
    await prisma.post.update({
      where: { id: req.params.id },
      data: { status: 'FAILED' },
    });

    res.status(500).json({ error: '投稿の公開に失敗しました' });
  }
};