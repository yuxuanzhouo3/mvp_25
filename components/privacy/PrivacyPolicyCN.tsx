"use client"

import { useEffect } from "react"

export function PrivacyPolicyCN() {
  // Set document language for accessibility
  useEffect(() => {
    document.documentElement.lang = "zh-CN"
  }, [])

  return (
    <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
      <h1>隐私政策</h1>

      <p className="text-sm text-muted-foreground">
        最后更新时间：2025年1月
      </p>

      <p>
        本应用尊重并保护您的隐私。我们将按照中国法律法规（包括《个人信息保护法》）的要求，保护您的个人信息安全。
      </p>

      <hr />

      <h2>信息收集</h2>

      <p>我们可能收集以下类型的信息：</p>
      <ul>
        <li><strong>账户信息：</strong>包括您注册时提供的邮箱地址、用户名和登录凭证。</li>
        <li><strong>学习内容：</strong>您上传的文档、文本文件等学习材料。</li>
        <li><strong>使用数据：</strong>您的学习进度、测验成绩、学习时长等信息。</li>
        <li><strong>设备信息：</strong>设备类型、操作系统、错误日志等技术数据。</li>
      </ul>

      <hr />

      <h2>信息使用</h2>

      <p>我们使用收集的信息用于：</p>
      <ul>
        <li>提供、维护和改进我们的服务</li>
        <li>生成个性化的学习评估和测验内容</li>
        <li>处理您的请求和交易</li>
        <li>发送技术通知和更新</li>
        <li>分析使用趋势以优化服务</li>
      </ul>

      <hr />

      <h2>信息保护</h2>

      <p>我们采取合理的技术和组织措施保护您的个人信息：</p>
      <ul>
        <li>数据传输采用加密技术（HTTPS）</li>
        <li>访问控制限制，仅授权人员可访问</li>
        <li>定期安全审计和漏洞检测</li>
        <li>遵守中国法律法规的安全标准</li>
      </ul>

      <hr />

      <h2>您的权利</h2>

      <p>根据《个人信息保护法》，您享有以下权利：</p>
      <ul>
        <li><strong>知情权：</strong>了解我们如何收集、使用您的信息</li>
        <li><strong>访问权：</strong>查阅我们持有的您的个人信息</li>
        <li><strong>更正权：</strong>要求更正不准确的个人信息</li>
        <li><strong>删除权：</strong>要求删除您的个人信息</li>
        <li><strong>撤回同意：</strong>随时撤回对信息处理的同意</li>
        <li><strong>注销账户：</strong>通过应用设置或联系我们删除账户</li>
      </ul>

      <hr />

      <h2>未成年人保护</h2>

      <p>我们的服务主要面向成年用户。如果您是未满18周岁的未成年人，请在监护人的陪同下阅读本政策。如果我们发现收集了未成年人的个人信息，将及时删除。</p>

      <hr />

      <h2>政策更新</h2>

      <p>我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，"最后更新时间"将相应调整。继续使用本应用即表示您接受更新后的政策。</p>

      <hr />

      <h2>联系我们</h2>

      <p>如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：</p>

      <ul>
        <li><strong>开发者：</strong>MornScience</li>
        <li><strong>邮箱：</strong>support@mornscience.com</li>
      </ul>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm mb-2">
          <strong>提示：</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          {t.privacy.complianceNotice}
          敬请期待完整版的隐私政策，其中将包含详细的数据处理活动说明、跨境传输规则、敏感个人信息处理规定等内容。
        </p>
      </div>

      <style jsx>{`
        article {
          font-feature-settings: "liga" 1, "kern" 1;
        }
      `}</style>
    </article>
  )
}
