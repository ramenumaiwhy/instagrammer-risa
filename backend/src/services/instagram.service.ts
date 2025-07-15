import axios from 'axios';

const GRAPH_API_BASE_URL = 'https://graph.facebook.com/v20.0';
const INSTAGRAM_API_BASE_URL = 'https://graph.instagram.com/v20.0';

export interface InstagramMediaData {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  impressions?: number;
  reach?: number;
}

export interface InstagramAccountData {
  id: string;
  username: string;
  profile_picture_url?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
}

export class InstagramService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // アカウント情報取得
  async getAccountInfo(accountId: string): Promise<InstagramAccountData> {
    try {
      const response = await axios.get(`${INSTAGRAM_API_BASE_URL}/${accountId}`, {
        params: {
          fields: 'id,username,profile_picture_url,followers_count,follows_count,media_count',
          access_token: this.accessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Instagram API Error (getAccountInfo):', error);
      throw new Error('アカウント情報の取得に失敗しました');
    }
  }

  // メディアアップロード（ステップ1: メディアオブジェクト作成）
  async createMediaObject(
    accountId: string,
    imageUrl: string,
    caption: string
  ): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${INSTAGRAM_API_BASE_URL}/${accountId}/media`,
        null,
        {
          params: {
            image_url: imageUrl,
            caption: caption,
            access_token: this.accessToken,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Instagram API Error (createMediaObject):', error);
      throw new Error('メディアオブジェクトの作成に失敗しました');
    }
  }

  // メディア公開（ステップ2: メディアを投稿）
  async publishMedia(
    accountId: string,
    creationId: string
  ): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${INSTAGRAM_API_BASE_URL}/${accountId}/media_publish`,
        null,
        {
          params: {
            creation_id: creationId,
            access_token: this.accessToken,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Instagram API Error (publishMedia):', error);
      throw new Error('メディアの公開に失敗しました');
    }
  }

  // メディアステータス確認
  async getMediaStatus(mediaId: string): Promise<{
    id: string;
    status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
  }> {
    try {
      const response = await axios.get(`${INSTAGRAM_API_BASE_URL}/${mediaId}`, {
        params: {
          fields: 'id,status_code',
          access_token: this.accessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Instagram API Error (getMediaStatus):', error);
      throw new Error('メディアステータスの取得に失敗しました');
    }
  }

  // 投稿情報取得
  async getMedia(mediaId: string): Promise<InstagramMediaData> {
    try {
      const response = await axios.get(`${INSTAGRAM_API_BASE_URL}/${mediaId}`, {
        params: {
          fields:
            'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
          access_token: this.accessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Instagram API Error (getMedia):', error);
      throw new Error('投稿情報の取得に失敗しました');
    }
  }

  // 投稿インサイト取得
  async getMediaInsights(mediaId: string): Promise<{
    impressions: number;
    reach: number;
    engagement: number;
  }> {
    try {
      const response = await axios.get(
        `${INSTAGRAM_API_BASE_URL}/${mediaId}/insights`,
        {
          params: {
            metric: 'impressions,reach,engagement',
            access_token: this.accessToken,
          },
        }
      );

      const insights = response.data.data.reduce(
        (acc: any, insight: any) => {
          acc[insight.name] = insight.values[0].value;
          return acc;
        },
        {}
      );

      return {
        impressions: insights.impressions || 0,
        reach: insights.reach || 0,
        engagement: insights.engagement || 0,
      };
    } catch (error) {
      console.error('Instagram API Error (getMediaInsights):', error);
      throw new Error('インサイトの取得に失敗しました');
    }
  }

  // 最近の投稿取得
  async getRecentMedia(
    accountId: string,
    limit: number = 25
  ): Promise<InstagramMediaData[]> {
    try {
      const response = await axios.get(
        `${INSTAGRAM_API_BASE_URL}/${accountId}/media`,
        {
          params: {
            fields:
              'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
            limit,
            access_token: this.accessToken,
          },
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Instagram API Error (getRecentMedia):', error);
      throw new Error('投稿の取得に失敗しました');
    }
  }

  // アクセストークンの検証
  async verifyToken(): Promise<boolean> {
    try {
      await axios.get(`${GRAPH_API_BASE_URL}/debug_token`, {
        params: {
          input_token: this.accessToken,
          access_token: this.accessToken,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}