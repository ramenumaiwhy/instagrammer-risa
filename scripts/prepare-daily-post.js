#!/usr/bin/env node

/**
 * Airtableに毎日の投稿を準備するスクリプト
 * 投稿時刻を自動的に今日の20:00に設定
 */

const axios = require('axios');

// 設定
const AIRTABLE_API_KEY = 'patmC1XX5DkJ7uSmT.eded4821c82c5963d1fe6538f10210193994ba69d02dbf8e4fc4678a66b0b4c1';
const BASE_ID = 'appT0xl5FQXJkGXJA';
const TABLE_NAME = 'posts';
const ACCOUNT_ID = 'recX7SczgRslsMUvx';

// 今日の20時を取得
function getTodayAt20() {
  const now = new Date();
  const today20 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
  return today20.toISOString();
}

// 次の利用可能な投稿を取得
async function getNextAvailablePost() {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        },
        params: {
          filterByFormula: `AND({status} = 'draft', {account} = '${ACCOUNT_ID}')`,
          maxRecords: 1,
          sort: [{ field: 'created_time', direction: 'asc' }]
        }
      }
    );

    if (response.data.records.length === 0) {
      console.log('準備可能な投稿（status: draft）が見つかりません');
      return null;
    }

    return response.data.records[0];
  } catch (error) {
    console.error('投稿の取得エラー:', error.response?.data || error.message);
    throw error;
  }
}

// 投稿を今日の20時にスケジュール
async function schedulePost(recordId) {
  try {
    const response = await axios.patch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${recordId}`,
      {
        fields: {
          status: 'scheduled',
          post_date: getTodayAt20()
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ 投稿をスケジュールしました！`);
    console.log(`   レコードID: ${recordId}`);
    console.log(`   投稿予定時刻: ${getTodayAt20()}`);
    console.log(`   キャプション: ${response.data.fields.caption?.substring(0, 50)}...`);
    
    return response.data;
  } catch (error) {
    console.error('スケジュール設定エラー:', error.response?.data || error.message);
    throw error;
  }
}

// メイン処理
async function main() {
  console.log('🚀 毎日の投稿準備を開始します...\n');

  try {
    // 次の投稿を取得
    const nextPost = await getNextAvailablePost();
    
    if (!nextPost) {
      console.log('\n⚠️  スケジュール可能な投稿がありません。');
      console.log('Airtableで新しい投稿を「draft」ステータスで作成してください。');
      return;
    }

    // 投稿をスケジュール
    await schedulePost(nextPost.id);
    
    console.log('\n✨ 完了！20:00に自動投稿されます。');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// 実行
main();