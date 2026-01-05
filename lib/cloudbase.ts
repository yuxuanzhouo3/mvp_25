/**
 * 腾讯云 CloudBase SDK 初始化
 * 仅限服务器端使用
 */

import tcb from '@cloudbase/node-sdk';

// 确保仅在服务器端运行
if (typeof window !== 'undefined') {
  throw new Error('CloudBase SDK 只能在服务器端使用');
}

const app = tcb.init({
  env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID!,
  secretId: process.env.CLOUDBASE_SECRET_ID!,
  secretKey: process.env.CLOUDBASE_SECRET_KEY!
});

const db = app.database();

export { db, app };
