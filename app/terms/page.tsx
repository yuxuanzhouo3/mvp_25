import { isChinaRegion } from "@/lib/config/region"
import { TermsOfServiceIntl } from "@/components/terms/TermsOfServiceIntl"
import { TermsOfServiceCN } from "@/components/terms/TermsOfServiceCN"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function generateMetadata(): Metadata {
  const isCN = isChinaRegion()

  return {
    title: isCN ? "用户服务协议 - SkillMap" : "Terms of Service - SkillMap",
    description: isCN
      ? "SkillMap 用户服务协议 - 使用我们服务的条款和条件"
      : "Terms and conditions for using SkillMap services",
  }
}

export default function TermsPage() {
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
          {isCN ? <TermsOfServiceCN /> : <TermsOfServiceIntl />}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SkillMap. {isCN ? "保留所有权利。" : "All rights reserved."}</p>
        </footer>
      </div>
    </div>
  )
}
