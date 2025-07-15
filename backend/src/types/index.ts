// ユーザー関連の型定義
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Instagram アカウント
export interface InstagramAccount {
  id: string;
  userId: string;
  username: string;
  accountId: string;
  accessToken: string;
  profilePictureUrl?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 投稿
export interface Post {
  id: string;
  accountId: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  scheduledAt?: Date;
  publishedAt?: Date;
  instagramPostId?: string;
  permalink?: string;
  likesCount?: number;
  commentsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// スケジュール
export interface Schedule {
  id: string;
  postId: string;
  scheduledAt: Date;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API レスポンス
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ページネーション
export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}