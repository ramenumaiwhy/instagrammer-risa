# Instagrammer Risa - Instagram 自動投稿システム

## 概要
Instagram への投稿を自動化・管理するための統合システムです。
スケジューリング、分析、マルチアカウント対応など、SNS マーケティングに必要な機能を提供します。

## 主な機能
- 📅 投稿スケジューリング
- 📊 パフォーマンス分析
- 🤖 AI によるキャプション生成
- 🖼️ 画像編集・最適化
- 👥 マルチアカウント管理
- 🔔 通知機能（Discord 連携）

## 技術スタック
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: Next.js, React, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Queue**: Bull (Redis)
- **Workflow**: n8n
- **Deploy**: Docker

## プロジェクト構造
```
instagrammer-risa/
├── backend/          # API サーバー
├── frontend/         # 管理画面
├── workflows/        # n8n ワークフロー
├── scripts/          # ユーティリティスクリプト
├── docs/            # ドキュメント
└── docker-compose.yml
```

## セットアップ
詳細なセットアップ手順は [docs/setup.md](docs/setup.md) を参照してください。

## n8n ワークフロー設定

### T2I (Text-to-Image) ランダムプロンプトワークフロー

`workflows/daily-t2i-risa-random-prompt.json` の設定項目：

1. **APIキー設定**
   - `YOUR_T2I_API_KEY`: 画像生成APIのキーに置き換える
   - 該当箇所: HTTPリクエストノードの Authorization ヘッダー

2. **APIエンドポイント**
   - `https://api.example.com/generate-image`: 実際の画像生成APIのURLに変更
   - 該当箇所: 「画像を生成」ノードの URL フィールド

3. **実行スケジュール**
   - デフォルト: 毎日21:00
   - 変更方法: 「毎日21:00に実行」ノードの cronExpression を編集

4. **Airtableで必要なフィールド**
   - `i2v_prompts` テーブル:
     - `category`: プロンプトのカテゴリ（t2i/both/空）
     - `t2i_usage_count`: T2I使用回数（自動更新）
     - `last_t2i_used`: 最終T2I使用日時（自動更新）

5. **Discord Webhook**
   - 既存の設定を使用していますが、必要に応じて webhookId を更新

### 注意事項
- ワークフローを有効化する前に、すべてのAPI設定を完了してください
- 初回実行前にAirtableのフィールドが正しく設定されていることを確認してください
