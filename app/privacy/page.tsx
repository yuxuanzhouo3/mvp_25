import { isChinaRegion } from "@/lib/config/region"
import { PrivacyPolicyIntl } from "@/components/privacy/PrivacyPolicyIntl"
import { PrivacyPolicyCN } from "@/components/privacy/PrivacyPolicyCN"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function generateMetadata(): Metadata {
  const isCN = isChinaRegion()

  return {
    title: isCN ? "隐私政策 - SkillMap" : "Privacy Policy - SkillMap",
    description: isCN
      ? "SkillMap 隐私政策 - 我们如何收集、使用和保护您的信息"
      : "Learn how SkillMap collects, uses, and protects your information",
  }
}

export default function PrivacyPage() {
  const isCN = isChinaRegion()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isCN ? "返回登录" : "Back to Login"}
        </Link>

        {/* Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 md:p-12">
          {isCN ? <PrivacyPolicyCN /> : <PrivacyPolicyIntl />}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SkillMap. {isCN ? "保留所有权利。" : "All rights reserved."}</p>
        </footer>
      </div>
    </div>
  )
}
