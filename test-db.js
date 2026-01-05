// test-db.js
// 这是一个用来测试 CloudBase 连接的脚本
const tcb = require('@cloudbase/node-sdk');
const dotenv = require('dotenv');

// 加载你的 .env.local 变量
dotenv.config({ path: '.env.local' });

const app = tcb.init({
  env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY
});

const db = app.database();

async function testConnection() {
  console.log('🔄 正在尝试连接腾讯云数据库...');
  try {
    // 尝试往 'users' 表里加一条测试数据
    const res = await db.collection('users').add({
      name: 'TestUser',
      test_time: new Date(),
      msg: '恭喜！本地代码成功连上了云端数据库！'
    });
    console.log('✅ 成功！写入数据的 ID 是:', res.id);
    console.log('🚀哪怕不需要登录，你的代码现在也能操作数据库了！');
  } catch (err) {
    console.error('❌ 失败了:', err);
  }
}

testConnection();