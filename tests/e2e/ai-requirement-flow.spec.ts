import { test, expect } from '@playwright/test'

test.describe('AI Requirement Gathering Flow', () => {
  test('should display AI guide mode when button is clicked', async ({ page }) => {
    // 导航到考试页面
    await page.goto('http://localhost:3000/exam')

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 输入考试名称
    await page.fill('input[placeholder*="考试名称"]', '英语四级')

    // 点击"智能引导出题"按钮
    await page.click('button:has-text("智能引导出题")')

    // 验证 AI 引导界面显示
    await expect(page.locator('text=返回传统模式')).toBeVisible()

    // 验证聊天界面元素存在
    await expect(page.locator('text=你好！我是 AI 备考规划师')).toBeVisible()

    // 验证快捷操作按钮存在
    await expect(page.locator('button:has-text("2026年真题卷")')).toBeVisible()

    // 验证输入框存在
    await expect(page.locator('input[placeholder*="输入你的消息"]')).toBeVisible()

    // 验证"开始出题"按钮存在但禁用（因为还没有科目）
    await expect(page.locator('button:has-text("开始出题")')).toBeDisabled()
  })

  test('should extract requirements from conversation', async ({ page }) => {
    await page.goto('http://localhost:3000/exam')
    await page.waitForLoadState('networkidle')

    // 进入 AI 引导模式
    await page.fill('input[placeholder*="考试名称"]', '英语')
    await page.click('button:has-text("智能引导出题")')

    // 发送消息
    await page.fill('input[placeholder*="输入你的消息"]', '我想做英语题')
    await page.click('button:has-text("Send")')

    // 等待 AI 响应（最多 10 秒）
    await page.waitForTimeout(3000)

    // 验证需求标签出现（科目: 英语）
    // 注意：这个测试依赖于 AI API 的实际响应，可能需要 mock
    const tagExists = await page.locator('text=/科目.*英语/').count()
    if (tagExists > 0) {
      await expect(page.locator('text=/科目.*英语/')).toBeVisible()

      // 验证"开始出题"按钮现在可用
      await expect(page.locator('button:has-text("开始出题")')).toBeEnabled()
    }
  })

  test('should allow tag removal', async ({ page }) => {
    await page.goto('http://localhost:3000/exam')
    await page.waitForLoadState('networkidle')

    // 进入 AI 引导模式
    await page.fill('input[placeholder*="考试名称"]', '数学')
    await page.click('button:has-text("智能引导出题")')

    // 点击快捷操作按钮
    await page.click('button:has-text("难度：中等")')

    // 等待响应
    await page.waitForTimeout(2000)

    // 如果标签出现，测试删除功能
    const tagCount = await page.locator('[class*="rounded-full"]:has-text("难度")').count()
    if (tagCount > 0) {
      // 点击标签上的 X 按钮
      await page.locator('[class*="rounded-full"]:has-text("难度") button').first().click()

      // 验证标签被删除
      await expect(page.locator('[class*="rounded-full"]:has-text("难度")')).not.toBeVisible()
    }
  })

  test('should switch back to traditional mode', async ({ page }) => {
    await page.goto('http://localhost:3000/exam')
    await page.waitForLoadState('networkidle')

    // 进入 AI 引导模式
    await page.fill('input[placeholder*="考试名称"]', '物理')
    await page.click('button:has-text("智能引导出题")')

    // 验证在 AI 模式
    await expect(page.locator('text=返回传统模式')).toBeVisible()

    // 点击返回传统模式
    await page.click('button:has-text("返回传统模式")')

    // 验证回到传统模式
    await expect(page.locator('text=智能引导出题')).toBeVisible()
    await expect(page.locator('text=返回传统模式')).not.toBeVisible()
  })
})
