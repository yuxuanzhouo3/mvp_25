"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Copy, Gift, Crown, Zap } from "lucide-react"

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSuccess: () => void
}

export function InviteModal({ isOpen, onClose, onInviteSuccess }: InviteModalProps) {
  const [inviteCode] = useState("ALEX2024")
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")

  const inviteLink = `https://devgrowth.dev?invite=${inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleEmailInvite = () => {
    if (email) {
      // Simulate sending invite
      setTimeout(() => {
        onInviteSuccess()
        setEmail("")
        alert("邀请已发送！")
      }, 1000)
    }
  }

  const rewards = [
    { count: 1, reward: "解锁专属皮肤", icon: <Gift className="w-4 h-4" />, unlocked: true },
    { count: 3, reward: "暗黑模式技能树", icon: <Crown className="w-4 h-4" />, unlocked: true },
    { count: 5, reward: "双倍经验加成", icon: <Zap className="w-4 h-4" />, unlocked: false },
    { count: 10, reward: "AI学习路径规划", icon: <Gift className="w-4 h-4" />, unlocked: false },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-400" />
            邀请好友
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Benefits */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">🎁 邀请奖励</h3>
            <div className="space-y-2">
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    reward.unlocked ? "bg-green-500/20 border border-green-500/30" : "bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded ${reward.unlocked ? "text-green-400" : "text-slate-400"}`}>
                      {reward.icon}
                    </div>
                    <span className="text-sm">{reward.reward}</span>
                  </div>
                  <Badge
                    className={`text-xs ${
                      reward.unlocked
                        ? "bg-green-600/20 text-green-300 border-green-500/30"
                        : "bg-slate-600/20 text-slate-400 border-slate-500/30"
                    }`}
                  >
                    {reward.count}人
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Invite Code */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">专属邀请码</h3>
            <div className="flex space-x-2">
              <Input value={inviteCode} readOnly className="bg-slate-700 border-slate-600 text-white" />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10 bg-transparent"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {copied && <p className="text-sm text-green-400">✅ 邀请码已复制！</p>}
          </div>

          {/* Invite Link */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">邀请链接</h3>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-sm text-slate-300 break-all">{inviteLink}</p>
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/10 bg-transparent"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "已复制链接！" : "复制邀请链接"}
            </Button>
          </div>

          {/* Email Invite */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">邮箱邀请</h3>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="输入好友邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              <Button
                onClick={handleEmailInvite}
                disabled={!email}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                发送
              </Button>
            </div>
          </div>

          {/* Growth Tip */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-sm text-yellow-200">
              💡 <strong>增长秘诀：</strong>邀请的好友越活跃，你获得的奖励越丰厚！一起学习，共同成长。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
