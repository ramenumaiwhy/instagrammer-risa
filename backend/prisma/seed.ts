import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('開始: データベースのシード処理');

  // テストユーザー作成
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'テストユーザー',
    },
  });

  console.log('ユーザーを作成しました:', user);

  // サンプルハッシュタグ作成
  const hashtags = [
    'instagram',
    'marketing',
    'socialmedia',
    '写真',
    'フォトグラフィー',
    'ビジネス',
    'マーケティング',
  ];

  for (const tag of hashtags) {
    await prisma.hashtag.upsert({
      where: { name: tag },
      update: {},
      create: { name: tag },
    });
  }

  console.log('ハッシュタグを作成しました');
  console.log('完了: データベースのシード処理');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });