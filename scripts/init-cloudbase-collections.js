/**
 * CloudBase 数据库集合初始化脚本
 * 运行: node scripts/init-cloudbase-collections.js
 */

const cloudbase = require("@cloudbase/node-sdk");
require("dotenv").config({ path: ".env.local" });

const app = cloudbase.init({
  env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});

const db = app.database();

const collections = [
  {
    name: "web_users",
    description: "用户表",
  },
  {
    name: "payments",
    description: "支付记录",
  },
  {
    name: "subscriptions",
    description: "订阅记录",
  },
  {
    name: "refresh_tokens",
    description: "Refresh Token 管理",
  },
  {
    name: "assessments",
    description: "评估记录",
  },
  {
    name: "chat_history",
    description: "聊天历史",
  },
];

async function initCollections() {
  console.log("开始初始化 CloudBase 数据库集合...");
  console.log(`环境 ID: ${process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID}`);

  for (const collection of collections) {
    try {
      console.log(`\n正在创建集合: ${collection.name} (${collection.description})`);

      // 尝试创建集合（CloudBase 会自动创建）
      const collectionRef = db.collection(collection.name);

      // 插入一条临时数据来触发集合创建
      await collectionRef.add({
        _init: true,
        created_at: new Date().toISOString(),
      });

      console.log(`✓ 集合 ${collection.name} 创建成功`);

      // 删除临时数据
      const result = await collectionRef.where({ _init: true }).get();
      if (result.data && result.data.length > 0) {
        await collectionRef.doc(result.data[0]._id).remove();
        console.log(`  已清理临时数据`);
      }
    } catch (error) {
      if (error.message && error.message.includes("already exists")) {
        console.log(`  集合 ${collection.name} 已存在，跳过`);
      } else {
        console.error(`✗ 创建集合 ${collection.name} 失败:`, error.message);
      }
    }
  }

  console.log("\n数据库集合初始化完成！");
}

initCollections()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("初始化失败:", error);
    process.exit(1);
  });
