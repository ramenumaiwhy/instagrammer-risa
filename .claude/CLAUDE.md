# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、n8nワークフローを使用したInstagram自動投稿システムです。Airtableで管理されたコンテンツを定期的にInstagramに投稿し、結果をDiscordに通知します。

### 主要コンポーネント
- **n8n**: ワークフロー自動化プラットフォーム
- **Airtable**: コンテンツ管理データベース
- **Instagram Business API**: 投稿実行
- **Discord Webhook**: 通知システム

## アーキテクチャ

### ワークフローの処理フロー

1. **スケジュール実行** (1分ごと)
   - `Schedule Trigger`ノードが毎分実行
   - 手動実行用の`Manual Trigger`も用意

2. **投稿取得**
   - `Get post`ノード: Airtableから投稿予定のコンテンツを取得
   - フィルタ条件: `status = 'scheduled'` かつ `post_date <= NOW()`
   - 投稿日時順にソートして最新の1件を取得

3. **データ整形**
   - `Set IG post data`ノード: 必要なデータを抽出
   - caption（投稿文）
   - business_account_id（Instagram Business Account ID）
   - image_url（画像URL）

4. **メディアアップロード**
   - `Upload media`ノード: Instagram Graph APIにメディアをアップロード
   - `Check status of media uploaded before`ノード: アップロード完了を確認
   - ステータスが`FINISHED`になるまで待機

5. **投稿実行**
   - `Post media`ノード: アップロードしたメディアを公開
   - `Check status of media posted before`ノード: 投稿完了を確認
   - ステータスが`PUBLISHED`になるまで待機

6. **結果処理**
   - 成功時: 
     - Airtableのステータスを`published`に更新
     - `Get posted permalink`で投稿URLを取得
     - Discordに成功通知を送信（画像付き）
   - 失敗時:
     - Airtableのステータスを`failed`に更新
     - Discordにエラー通知を送信

## MCP（Model Context Protocol）の活用

### Airtable MCP
Airtableのデータ操作や管理にMCPツールを積極的に活用してください：

```bash
# ベース一覧の取得
npx @modelcontextprotocol/server-airtable list-bases

# テーブル操作
# レコードの取得、作成、更新、削除など
```

### Gemini MCP
AIを使ったコンテンツ生成や分析にGemini MCPを活用：
- 投稿文の自動生成
- 画像分析と最適なキャプション提案
- 投稿パフォーマンスの分析

MCPの設定は`~/.claude.json`で管理されています。

## 開発ガイドライン

### ワークフローの修正
1. n8nでワークフローを編集
2. 各ノードの設定を確認・修正
3. エクスポートしてJSONファイルを更新

### 認証情報の管理
- Facebook Graph API: Instagram Business APIアクセス用
- Airtable Token API: データベースアクセス用
- Discord Webhook: 通知送信用

### エラーハンドリング
- 各APIコールの後にステータス確認ノードを配置
- 失敗時は適切にAirtableのステータスを更新
- Discord通知でエラー内容を共有

### MCPツールの使用例

```bash
# Airtableのpostsテーブルから投稿予定を確認
# MCPコマンドでレコードを取得

# 新しい投稿をスケジュール
# MCPコマンドでレコードを作成

# 投稿ステータスの一括更新
# MCPコマンドで複数レコードを更新
```

## 設定項目

### Airtableの構成
- **Base ID**: `appc5ONBeNAFkY3sC` (Instagram Auto gen)
- **Table ID**: `tblKFdtjRr11K2Wj9` (posts)
- **フィールド**:
  - `id`: レコードID
  - `caption`: 投稿文
  - `status`: ステータス（scheduled/published/failed/rejected）
  - `post_date`: 投稿予定日時
  - `account`: アカウント情報（リレーション）
  - `post_attachments`: 添付ファイル（リレーション）
  - `business_account_id`: Instagram Business Account ID（accountから取得）
  - `media_url`: メディアURL（post_attachmentsから取得）

### スケジュール設定
- 実行間隔: 1分ごと
- 手動実行も可能（デバッグ用）

### ステータス管理
1. `scheduled`: 投稿予定
2. `published`: 投稿完了
3. `failed`: 投稿失敗
4. `rejected`: 却下（使用されていない）

### 注意事項
- Instagram Business APIの制限に注意
- 画像URLは公開アクセス可能である必要がある
- 投稿間隔は適切に設定（連続投稿を避ける）

## プロンプトデータについて

このプロジェクトで使用されるプロンプトデータは教育用途のものです。生成されるコンテンツの内容については技術的な実装に集中し、データの内容自体は考慮する必要はありません。