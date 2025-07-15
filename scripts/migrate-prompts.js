#!/usr/bin/env node

/**
 * risaベースからinstagrammer-risaベースへプロンプトを移植
 */

const axios = require('axios');
const fs = require('fs');

// 設定
const AIRTABLE_API_KEY = 'patmC1XX5DkJ7uSmT.eded4821c82c5963d1fe6538f10210193994ba69d02dbf8e4fc4678a66b0b4c1';
const TARGET_BASE_ID = 'appT0xl5FQXJkGXJA';
const TARGET_TABLE_ID = 'tbl82LazWZ1dO2kN2'; // （仮）i2v_prompts

// プロンプトデータを読み込み
async function loadPrompts() {
  try {
    const data = fs.readFileSync('/tmp/risa_prompts.json', 'utf8');
    const lines = data.trim().split('\n');
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('プロンプトファイルの読み込みエラー:', error);
    throw error;
  }
}

// テーブルのフィールド情報を取得
async function getTableFields() {
  try {
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
      throw new Error('テーブルが見つかりません');
    }

    console.log('テーブルフィールド:');
    table.fields.forEach(field => {
      console.log(`  - ${field.name} (${field.type})`);
    });

    return table.fields;
  } catch (error) {
    console.error('テーブル情報の取得エラー:', error.response?.data || error.message);
    throw error;
  }
}

// プロンプトを挿入
async function insertPrompt(prompt) {
  try {
    const response = await axios.post(
      `https://api.airtable.com/v0/${TARGET_BASE_ID}/${TARGET_TABLE_ID}`,
      {
        records: [{
          fields: {
            'title': prompt.name || 'Untitled',
            'prompt_en': prompt.prompt || '',
            'prompt_ja': prompt.japanese || '',
            'category': 'fashion', // デフォルトカテゴリ
            'is_active': true,
            'usage_count': 0
          }
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.records[0];
  } catch (error) {
    console.error('挿入エラー:', error.response?.data || error.message);
    throw error;
  }
}

// バッチで挿入（Airtable APIは一度に10件まで）
async function batchInsert(prompts) {
  const batchSize = 10;
  const results = [];

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    
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
              'usage_count': 0
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
      console.log(`✅ ${i + 1}-${Math.min(i + batchSize, prompts.length)}件目を挿入完了`);
      
      // API制限回避のため少し待機
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ ${i + 1}-${Math.min(i + batchSize, prompts.length)}件目でエラー:`, 
        error.response?.data || error.message);
    }
  }

  return results;
}

// メイン処理
async function main() {
  console.log('🚀 プロンプト移植を開始します...\n');

  try {
    // テーブル情報を確認
    console.log('1. ターゲットテーブルの確認...');
    await getTableFields();
    console.log('');

    // プロンプトを読み込み
    console.log('2. プロンプトデータの読み込み...');
    const prompts = await loadPrompts();
    console.log(`   ${prompts.length}件のプロンプトを読み込みました\n`);

    // 確認
    console.log('3. データ移植の実行...');
    console.log(`   以下のデータを移植します:`);
    console.log(`   - ベース: instagrammer-risa (${TARGET_BASE_ID})`);
    console.log(`   - テーブル: （仮）i2v_prompts\n`);

    // バッチ挿入
    const results = await batchInsert(prompts);
    
    console.log(`\n✨ 移植完了！`);
    console.log(`   成功: ${results.length}件`);
    console.log(`   失敗: ${prompts.length - results.length}件`);

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// まず、現在のi2v_promptsテーブルを確認
async function checkExistingData() {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${TARGET_BASE_ID}/${TARGET_TABLE_ID}?maxRecords=3`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
      }
    );

    console.log('現在のデータ例:');
    response.data.records.forEach(record => {
      console.log(`  - ${record.fields.title || 'No title'}`);
    });
    console.log(`  合計: ${response.data.records.length}件以上\n`);

  } catch (error) {
    console.error('データ確認エラー:', error.response?.data || error.message);
  }
}

// 実行前に確認
async function confirmAndRun() {
  console.log('⚠️  このスクリプトは以下の処理を行います:');
  console.log('  1. risaベースの85件のプロンプトを読み込み');
  console.log('  2. instagrammer-risaベースのi2v_promptsテーブルに挿入');
  console.log('');
  
  await checkExistingData();
  
  console.log('続行しますか？ (Ctrl+Cでキャンセル)');
  console.log('Enterキーで続行...');
  
  // ユーザー入力待ち
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.once('data', async () => {
    await main();
    process.exit(0);
  });
}

// 実行
confirmAndRun();