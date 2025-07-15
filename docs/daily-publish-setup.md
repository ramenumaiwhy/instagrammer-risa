# Daily Publish Risa - セットアップガイド

## 概要
毎日20時に自動的にInstagramに投稿するn8nワークフローです。

## ワークフロー情報
- **ファイル**: `workflows/daily-publish-risa.json`
- **実行時間**: 毎日20:00
- **Airtableベース**: instagrammer-risa (appT0xl5FQXJkGXJA)
- **対象アカウント**: business_account_id: 17841475916632663

## セットアップ手順

### 1. n8nにワークフローをインポート

1. n8nの管理画面を開く
2. 「Workflows」→「Import from File」を選択
3. `workflows/daily-publish-risa.json`をアップロード

### 2. 認証情報の設定

#### Airtable認証（既存のものを使用可）
- 名前: `Airtable sns workspace PAT`
- API Key: 既に設定済み

#### Discord Webhook（新規作成が必要）
- 名前: `Discord Webhook Risa`
- Webhook URL: `https://discord.com/api/webhooks/1394317186608271400/jb9d34RO3PLZ6kjWwP4puKKNaxEJ_ZhXprVfkAboml-elf5r770Ocu9Bv_DvU87QqBYc`

### 3. ワークフローを有効化

1. ワークフローを開く
2. 右上の「Active」トグルをONにする
3. 保存する

## 投稿の準備方法

### 方法1: 手動でAirtableに登録

1. Airtableの`instagrammer-risa`ベースを開く
2. `posts`テーブルに新規レコードを作成
3. 以下を設定：
   - `caption`: 投稿文
   - `status`: "scheduled"
   - `account`: recX7SczgRslsMUvx を選択
   - `post_attachments`: 画像を関連付け

### 方法2: 自動スケジュールスクリプトを使用

```bash
# 投稿準備スクリプトを実行
node /Users/aiharataketo/projects/instagrammer-risa/scripts/prepare-daily-post.js
```

このスクリプトは：
- `status: draft`の投稿を探す
- 自動的に今日の20:00にスケジュール設定
- `status: scheduled`に変更

### 毎日の投稿準備を自動化（オプション）

```bash
# crontabに追加（毎日19:00に実行）
0 19 * * * /usr/bin/node /Users/aiharataketo/projects/instagrammer-risa/scripts/prepare-daily-post.js
```

## テスト方法

1. Airtableに`status: scheduled`の投稿を作成
2. n8nワークフローの「手動実行用」ノードを有効化
3. 「Execute Workflow」をクリック
4. 動作を確認

## トラブルシューティング

### 投稿が見つからない場合
- Airtableで`status`が`scheduled`になっているか確認
- `account`フィールドが正しく設定されているか確認

### アップロードエラーの場合
- 画像URLが有効か確認
- アクセストークンの有効期限を確認

### Discord通知が来ない場合
- Webhook URLが正しいか確認
- n8nのDiscord認証情報を確認

## 注意事項

- **アクセストークン**: 定期的に更新が必要な場合があります
- **画像URL**: 公開アクセス可能なURLである必要があります
- **投稿時刻**: 日本時間20:00（サーバーのタイムゾーン設定に依存）