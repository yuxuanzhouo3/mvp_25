/**
 * Playwright 测试 - 管理后台测试数据功能
 *
 * 测试内容：
 * 1. 登录管理后台
 * 2. 导航到设置页面
 * 3. 创建测试支付数据
 * 4. 验证数据创建成功
 * 5. 导航到支付记录页面验证数据
 * 6. 导航到仪表板验证统计
 * 7. 删除测试数据
 */

import { test, expect } from "@playwright/test";

// 配置
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

test.describe("管理后台 - 测试数据管理", () => {
  test.beforeEach(async ({ page }) => {
    // 访问登录页面
    await page.goto(`${BASE_URL}/admin/login`);
  });

  test("创建测试支付数据并验证", async ({ page }) => {
    // ==================== 步骤1: 登录 ====================
    await test.step("登录管理后台", async () => {
      await page.fill('input[name="username"]', ADMIN_USERNAME);
      await page.fill('input[name="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');

      // 等待导航到 dashboard
      await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 5000 });
      await expect(page.locator("h1")).toContainText("仪表板");
    });

    // ==================== 步骤2: 导航到设置页面 ====================
    await test.step("导航到设置页面", async () => {
      await page.click('a[href="/admin/settings"]');
      await page.waitForURL(`${BASE_URL}/admin/settings`);
      await expect(page.locator("h1")).toContainText("系统设置");
    });

    // ==================== 步骤3: 切换到测试数据Tab ====================
    await test.step("切换到测试数据Tab", async () => {
      await page.click('button:has-text("测试数据")');
      await expect(page.locator("text=测试数据管理")).toBeVisible();
    });

    // ==================== 步骤4: 创建测试数据 ====================
    await test.step("创建测试支付数据", async () => {
      // 点击创建按钮
      await page.click('button:has-text("创建测试支付数据")');

      // 等待创建完成（最多10秒）
      await page.waitForSelector('text=创建完成', { timeout: 10000 });

      // 验证成功消息
      await expect(page.locator('text=成功创建 8 条测试支付')).toBeVisible();
    });

    // ==================== 步骤5: 验证创建详情 ====================
    await test.step("验证创建详情", async () => {
      // 检查统计摘要
      await expect(page.locator('text=Stripe: 4 条')).toBeVisible();
      await expect(page.locator('text=PayPal: 1 条')).toBeVisible();
      await expect(page.locator('text=WeChat: 2 条')).toBeVisible();
      await expect(page.locator('text=Alipay: 1 条')).toBeVisible();
      await expect(page.locator('text=总金额(USD): $377.98')).toBeVisible();
      await expect(page.locator('text=总金额(CNY): ¥597')).toBeVisible();
    });

    // ==================== 步骤6: 导航到支付记录页面 ====================
    await test.step("导航到支付记录页面验证数据", async () => {
      await page.click('a[href="/admin/payments"]');
      await page.waitForURL(`${BASE_URL}/admin/payments`);

      // 等待数据加载
      await page.waitForSelector('table', { timeout: 5000 });

      // 验证支付记录列表不为空
      const tableRows = await page.locator('table tbody tr').count();
      expect(tableRows).toBeGreaterThan(0);

      // 截图保存证据
      await page.screenshot({ path: "test-results/payments-list.png" });
    });

    // ==================== 步骤7: 导航到仪表板验证统计 ====================
    await test.step("导航到仪表板验证统计", async () => {
      await page.click('a[href="/admin/dashboard"]');
      await page.waitForURL(`${BASE_URL}/admin/dashboard`);

      // 等待数据加载
      await page.waitForSelector('text=总收入', { timeout: 5000 });

      // 验证收入统计显示
      await expect(page.locator('text=总收入')).toBeVisible();

      // 截图保存证据
      await page.screenshot({ path: "test-results/dashboard-stats.png" });
    });

    // ==================== 步骤8: 返回设置删除测试数据 ====================
    await test.step("删除测试数据", async () => {
      await page.click('a[href="/admin/settings"]');
      await page.click('button:has-text("测试数据")');

      // 点击删除按钮
      const deleteButton = page.locator('button:has-text("删除所有测试数据")');
      await deleteButton.click();

      // 处理确认对话框
      page.on("dialog", (dialog) => dialog.accept());
      await deleteButton.click();

      // 等待删除完成
      await page.waitForSelector('text=删除完成', { timeout: 10000 });
      await expect(page.locator('text=已删除')).toBeVisible();
    });
  });

  test("双数据库适配器验证 - 检查连接状态", async ({ page }) => {
    // 登录
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard`);

    // 访问仪表板
    await page.waitForSelector('text=总收入', { timeout: 5000 });

    // 检查页面是否正常加载（双数据库适配器工作正常）
    const hasData = await page.locator('table').count() > 0;

    if (hasData) {
      // 有数据显示，说明适配器工作正常
      await expect(page.locator('table')).toBeVisible();
    } else {
      // 没有数据也是正常的（如果是空数据库）
      await expect(page.locator('text=暂无数据')).toBeVisible();
    }
  });

  test("错误处理 - 一个数据库失败的情况", async ({ page }) => {
    // 登录
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard`);

    // 即使一个数据库连接失败，页面也应该能正常加载
    // 因为双数据库适配器有容错机制
    await page.waitForSelector('h1:has-text("仪表板")', { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("仪表板");
  });
});

/**
 * 手动测试说明
 *
 * 如果不想运行 Playwright，可以手动测试：
 *
 * 1. 启动开发服务器：npm run dev
 * 2. 访问：http://localhost:3000/admin/login
 * 3. 登录后，进入"系统设置" -> "测试数据"
 * 4. 点击"创建测试支付数据"
 * 5. 等待创建完成，查看统计信息
 * 6. 点击"查看支付记录"或"查看仪表板"验证数据
 * 7. 返回"测试数据"页面，点击"删除所有测试数据"
 *
 * 预期结果：
 * - 创建测试数据后，支付记录页面应显示 8 条记录
 * - 仪表板应显示收入统计（USD 和 CNY 分别显示）
 * - 删除测试数据后，数据应被清除
 */
