#!/usr/bin/env node

/**
 * risaベースからinstagrammer-risaベースへプロンプトを一括移植
 * 425件のプロンプトを効率的に処理
 */

const axios = require('axios');
const fs = require('fs');

// 設定
const AIRTABLE_API_KEY = 'patmC1XX5DkJ7uSmT.eded4821c82c5963d1fe6538f10210193994ba69d02dbf8e4fc4678a66b0b4c1';
const TARGET_BASE_ID = 'appT0xl5FQXJkGXJA';
const TARGET_TABLE_ID = 'tbl82LazWZ1dO2kN2'; // i2v_prompts

// プロンプトデータを読み込み
async function loadPrompts() {
  try {
    const data = fs.readFileSync('/tmp/risa_prompts.json', 'utf8');
    const lines = data.trim().split('\n');
    const prompts = lines
      .map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error(`行 ${index + 1} のパースエラー:`, e.message);
          return null;
        }
      })
      .filter(prompt => prompt !== null);
    
    console.log(`✅ ${prompts.length}件のプロンプトを読み込みました`);
    return prompts;
  } catch (error) {
    console.error('プロンプトファイルの読み込みエラー:', error);
    throw error;
  }
}

// バッチで挿入（Airtable APIは一度に10件まで）
async function batchInsert(prompts) {
  const batchSize = 10;
  const results = [];
  const errors = [];

  console.log('\n📤 Airtableへの一括挿入を開始します...');

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(prompts.length / batchSize);
    
    try {
      const response = await axios.post(
        `https://api.airtable.com/v0/${TARGET_BASE_ID}/${TARGET_TABLE_ID}`,
        {
          records: batch.map(prompt => ({
            fields: {
              'title': prompt.name || 'Untitled',
              'prompt_en': prompt.prompt || '',
              'prompt_ja': prompt.japanese || '',
              'category': 'fashion',
              'is_active': true,
              'usage_count': 0,
              'created_at': new Date().toISOString()
            }
          }))
        },
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      results.push(...response.data.records);
      console.log(`✅ バッチ ${batchNumber}/${totalBatches} 完了 (${i + 1}-${Math.min(i + batchSize, prompts.length)}件目)`);
      
      // API制限回避のため少し待機（5リクエスト/秒の制限）
      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error(`❌ バッチ ${batchNumber}/${totalBatches} でエラー:`, errorMsg);
      errors.push({
        batch: batchNumber,
        range: `${i + 1}-${Math.min(i + batchSize, prompts.length)}`,
        error: errorMsg
      });
      
      // エラー後も少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return { results, errors };
}

// テーブルの存在確認
async function checkTable() {
  try {
    console.log('📋 テーブルの存在を確認中...');
    const response = await axios.get(
      `https://api.airtable.com/v0/meta/bases/${TARGET_BASE_ID}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
      }
    );

    const table = response.data.tables.find(t => t.id === TARGET_TABLE_ID);
    if (!table) {
      console.error('❌ i2v_promptsテーブルが見つかりません');
      console.log('\n利用可能なテーブル:');
      response.data.tables.forEach(t => {
        console.log(`  - ${t.name} (${t.id})`);
      });
      throw new Error('テーブルが見つかりません');
    }

    console.log(`✅ テーブル「${table.name}」を確認しました`);
    console.log('\nフィールド構成:');
    table.fields.forEach(field => {
      console.log(`  - ${field.name} (${field.type})`);
    });

    return table;
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('❌ ベースが見つかりません。ベースIDを確認してください。');
    }
    throw error;
  }
}

// 既存データの確認
async function checkExistingData() {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${TARGET_BASE_ID}/${TARGET_TABLE_ID}?maxRecords=3&view=Grid%20view`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
      }
    );

    if (response.data.records.length > 0) {
      console.log('\n⚠️  既存のデータが見つかりました:');
      response.data.records.forEach(record => {
        console.log(`  - ${record.fields.title || 'No title'}`);
      });
      console.log(`  他 ${response.data.records.length}件以上...\n`);
      return true;
    } else {
      console.log('\n✅ テーブルは空です\n');
      return false;
    }
  } catch (error) {
    console.error('データ確認エラー:', error.response?.data || error.message);
    return false;
  }
}

// メイン処理
async function main() {
  console.log('🚀 プロンプト一括移植ツール\n');
  console.log('================================');
  console.log(`ベース: instagrammer-risa`);
  console.log(`テーブル: i2v_prompts`);
  console.log('================================\n');

  try {
    // 1. テーブル確認
    await checkTable();

    // 2. 既存データ確認
    const hasExistingData = await checkExistingData();

    // 3. プロンプトデータ読み込み
    console.log('📂 プロンプトデータを読み込み中...');
    const prompts = await loadPrompts();

    // 4. 確認プロンプト
    console.log('\n⚡ 移植の準備が整いました');
    console.log(`  - 移植するプロンプト数: ${prompts.length}件`);
    console.log(`  - 必要なバッチ数: ${Math.ceil(prompts.length / 10)}回`);
    console.log(`  - 推定所要時間: 約${Math.ceil(prompts.length / 10 * 0.25)}秒`);
    
    if (hasExistingData) {
      console.log('\n⚠️  既存データがある場合、重複する可能性があります');
    }

    console.log('\n続行するには Enter キーを押してください（Ctrl+C でキャンセル）');
    
    // ユーザー入力待ち
    await new Promise(resolve => {
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', resolve);
    });

    // 5. バッチ挿入実行
    const startTime = Date.now();
    const { results, errors } = await batchInsert(prompts);
    const endTime = Date.now();

    // 6. 結果表示
    console.log('\n================================');
    console.log('✨ 移植完了！');
    console.log('================================');
    console.log(`✅ 成功: ${results.length}件`);
    console.log(`❌ 失敗: ${errors.length}件`);
    console.log(`⏱️  処理時間: ${((endTime - startTime) / 1000).toFixed(2)}秒`);

    if (errors.length > 0) {
      console.log('\n失敗したバッチ:');
      errors.forEach(err => {
        console.log(`  - バッチ ${err.batch} (${err.range}件目): ${err.error}`);
      });
    }

    // 7. 最初のいくつかの結果を表示
    if (results.length > 0) {
      console.log('\n挿入されたレコードの例:');
      results.slice(0, 3).forEach(record => {
        console.log(`  - ID: ${record.id}, Title: ${record.fields.title}`);
      });
    }

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('未処理のPromise拒否:', reason);
  process.exit(1);
});

// 実行
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  });
}