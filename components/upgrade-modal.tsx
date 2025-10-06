"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Crown, Check, Brain, Target, Calendar, Star } from "lucide-react"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgradeSuccess: () => void
  currentRole: string
}

export function UpgradeModal({ isOpen, onClose, onUpgradeSuccess, currentRole }: UpgradeModalProps) {
  const handleUpgrade = () => {
    // Simulate payment processing
    setTimeout(() => {
      onUpgradeSuccess()
      alert("升级成功！欢迎使用Premium功能！")
    }, 1000)
  }

  const freeFeatures = ["多维度技能评估", "角色智能分类", "竞争力分析报告", "技能热力图", "基础学习建议"]

  const premiumFeatures = [
    "AI个性化学习路径生成",
    "每日学习计划制定",
    "实时进度追踪",
    "无限AI教练分析", // 新增
    "桌面学习行为监控", // 新增
    "专业学习效率报告", // 新增
    "专属学习资源推荐",
    "优先客服支持",
    "高级数据分析",
    "无限目标设定",
    "学习效果预测",
  ]

  const pricingPlans = [
    {
      name: "月度会员",
      price: "¥29",
      period: "/月",
      popular: false,
      savings: "",
    },
    {
      name: "季度会员",
      price: "¥69",
      period: "/季",
      popular: true,
      savings: "节省20%",
    },
    {
      name: "年度会员",
      price: "¥199",
      period: "/年",
      popular: false,
      savings: "节省43%",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Crown className="w-6 h-6 mr-2 text-yellow-400" />
            升级到 SkillMap Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Value Proposition */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">解锁AI驱动的个性化学习体验</h3>
            <p className="text-slate-400">
              基于你的 <span className="text-blue-400 font-medium">{currentRole}</span> 评估结果，获得专属学习路径
            </p>
          </div>

          {/* Feature Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card className="bg-slate-700/50 border-slate-600 p-6">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-white">免费版</h4>
                <div className="text-2xl font-bold text-slate-300 mt-2">¥0</div>
              </div>
              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-slate-300">
                    <Check className="w-4 h-4 mr-3 text-green-400" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/50 p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">推荐</Badge>
              </div>
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-white flex items-center justify-center">
                  <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                  Premium版
                </h4>
                <div className="text-2xl font-bold text-yellow-400 mt-2">起步价 ¥29</div>
              </div>
              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-slate-300">
                    <Check className="w-4 h-4 mr-3 text-green-400" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-white">
                    <Star className="w-4 h-4 mr-3 text-yellow-400" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Premium Features Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-600/20 border-blue-500/30 p-4">
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 mr-2 text-blue-400" />
                <h4 className="text-white font-semibold">AI路径生成</h4>
              </div>
              <p className="text-sm text-blue-200">基于你的技能评估和目标，AI生成个性化学习路径，精确到每日计划</p>
            </Card>

            <Card className="bg-green-600/20 border-green-500/30 p-4">
              <div className="flex items-center mb-3">
                <Target className="w-5 h-5 mr-2 text-green-400" />
                <h4 className="text-white font-semibold">智能追踪</h4>
              </div>
              <p className="text-sm text-green-200">实时监控学习进度，智能调整计划，确保高效达成学习目标</p>
            </Card>

            <Card className="bg-purple-600/20 border-purple-500/30 p-4">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                <h4 className="text-white font-semibold">每日规划</h4>
              </div>
              <p className="text-sm text-purple-200">精确到30分钟的每日学习安排，最大化学习效率和时间利用</p>
            </Card>
            <Card className="bg-green-600/20 border-green-500/30 p-4">
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 mr-2 text-green-400" />
                <h4 className="text-white font-semibold">AI学习教练</h4>
              </div>
              <p className="text-sm text-green-200">实时监控学习行为，AI分析学习效率，提供个性化改进建议</p>
            </Card>
          </div>

          {/* Pricing Options */}
          <div>
            <h4 className="text-lg font-semibold text-white text-center mb-4">选择订阅计划</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`p-4 cursor-pointer transition-all ${
                    plan.popular
                      ? "bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/50 scale-105"
                      : "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                  }`}
                >
                  {plan.popular && (
                    <div className="text-center mb-2">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">最受欢迎</Badge>
                    </div>
                  )}
                  <div className="text-center">
                    <h5 className="text-white font-semibold">{plan.name}</h5>
                    <div className="flex items-baseline justify-center mt-2">
                      <span className="text-2xl font-bold text-white">{plan.price}</span>
                      <span className="text-slate-400 ml-1">{plan.period}</span>
                    </div>
                    {plan.savings && <div className="text-sm text-green-400 mt-1">{plan.savings}</div>}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Social Proof */}
          <Card className="bg-slate-700/50 border-slate-600 p-4">
            <div className="text-center">
              <h4 className="text-white font-semibold mb-2">已有 12,000+ 开发者选择Premium</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">94%</div>
                  <div className="text-slate-400">用户学习效率提升</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">3.2x</div>
                  <div className="text-slate-400">技能掌握速度</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">89%</div>
                  <div className="text-slate-400">成功达成学习目标</div>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Button
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8 py-3 text-lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              立即升级Premium
            </Button>
            <div className="text-sm text-slate-400">💡 7天无理由退款保证 | 🔒 安全支付 | 📞 专属客服支持</div>
          </div>

          {/* Limited Time Offer */}
          <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/30 rounded-lg p-4 text-center">
            <h4 className="text-red-200 font-semibold mb-2">🔥 限时优惠</h4>
            <p className="text-sm text-red-200">
              新用户首月仅需 <span className="font-bold">¥19</span>，立省¥10！
              <br />
              优惠仅剩 <span className="font-bold text-yellow-400">23小时47分钟</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
