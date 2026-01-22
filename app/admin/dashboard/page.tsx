"use client";

/**
 * 管理后台 - 数据统计仪表板
 *
 * 完整功能：
 * - 综合数据统计展示
 * - 用户、支付、评估、广告等模块数据汇总
 * - 实时数据刷新
 * - 图表展示
 */

import { useState, useEffect } from "react";
import { getUserStats } from "@/actions/admin-users";
import { getPaymentStats } from "@/actions/admin-payments";
import { getAdStats } from "@/actions/admin-ads";
import { getReleaseStats } from "@/actions/admin-releases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  RefreshCw,
  Users,
  DollarSign,
  Image,
  Tag,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function DashboardPage() {
  // ==================== 状态管理 ====================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userStats, setUserStats] = useState<any>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [adStats, setAdStats] = useState<any>(null);
  const [releaseStats, setReleaseStats] = useState<any>(null);

  // ==================== 数据加载 ====================
  async function loadAllStats() {
    setError(null);
    try {
      const [users, payments, ads, releases] = await Promise.all([
        getUserStats(),
        getPaymentStats(),
        getAdStats(),
        getReleaseStats(),
      ]);

      if (users.success && users.data) setUserStats(users.data);
      if (payments.success && payments.data) setPaymentStats(payments.data);
      if (ads.success && ads.data) setAdStats(ads.data);
      if (releases.success && releases.data) setReleaseStats(releases.data);
    } catch (err) {
      setError("加载统计数据失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAllStats();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAllStats();
  }

  // ==================== 格式化函数 ====================
  function formatAmount(amount: number) {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount);
  }

  function formatNumber(num: number) {
    return new Intl.NumberFormat("zh-CN").format(num);
  }

  // ==================== 渲染 ====================
  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">数据统计仪表板</h1>
          <p className="text-sm text-muted-foreground mt-1">
            实时查看系统各项数据统计
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          刷新数据
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-600">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 加载状态 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 总用户数 */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100 flex items-center justify-between">
                  <span>总用户数</span>
                  <Users className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats?.total || 0}</div>
                <div className="text-xs text-blue-100 mt-2">
                  本月新增: {userStats?.newThisMonth || 0}
                </div>
              </CardContent>
            </Card>

            {/* 总收入 */}
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100 flex items-center justify-between">
                  <span>总收入</span>
                  <DollarSign className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatAmount(paymentStats?.totalRevenue || 0)}
                </div>
                <div className="text-xs text-green-100 mt-2">
                  本月: {formatAmount(paymentStats?.thisMonthAmount || 0)}
                </div>
              </CardContent>
            </Card>

            {/* 活跃广告 */}
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-100 flex items-center justify-between">
                  <span>活跃广告</span>
                  <Image className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{adStats?.active || 0}</div>
                <div className="text-xs text-orange-100 mt-2">
                  总数: {adStats?.total || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 详细统计 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 用户统计详情 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  用户统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">免费用户</span>
                    <span className="font-semibold">{userStats?.free || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">专业版用户</span>
                    <span className="font-semibold text-green-600">
                      {userStats?.pro || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">企业版用户</span>
                    <span className="font-semibold text-purple-600">
                      {userStats?.enterprise || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">本周活跃</span>
                    <span className="font-semibold text-blue-600">
                      {userStats?.activeThisWeek || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 支付统计详情 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  收入统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">总订单数</span>
                    <span className="font-semibold">{paymentStats?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">本月订单</span>
                    <span className="font-semibold">{paymentStats?.thisMonth || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">今日订单</span>
                    <span className="font-semibold">{paymentStats?.today || 0}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-2">按支付方式</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>微信: {formatAmount(paymentStats?.byMethod?.wechat || 0)}</div>
                      <div>支付宝: {formatAmount(paymentStats?.byMethod?.alipay || 0)}</div>
                      <div>Stripe: {formatAmount(paymentStats?.byMethod?.stripe || 0)}</div>
                      <div>PayPal: {formatAmount(paymentStats?.byMethod?.paypal || 0)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 系统状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  系统状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">广告总数</span>
                    <span className="font-semibold">{adStats?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">草稿版本</span>
                    <span className="font-semibold">{releaseStats?.draft || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">已发布版本</span>
                    <span className="font-semibold text-green-600">
                      {releaseStats?.published || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">最新版本</span>
                    <span className="font-semibold font-mono">
                      {releaseStats?.latestVersion || "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 趋势图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 用户类型分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">用户类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "免费用户", value: userStats?.free || 0, color: "bg-gray-500" },
                    { label: "专业版", value: userStats?.pro || 0, color: "bg-green-500" },
                    { label: "企业版", value: userStats?.enterprise || 0, color: "bg-purple-500" },
                  ].map((item) => {
                    const total = (userStats?.total || 1);
                    const percentage = (item.value / total * 100).toFixed(1);
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span className="text-muted-foreground">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 广告状态分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">广告状态分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "激活", value: adStats?.active || 0, color: "bg-green-500" },
                    { label: "禁用", value: adStats?.inactive || 0, color: "bg-gray-400" },
                  ].map((item) => {
                    const total = (adStats?.total || 1);
                    const percentage = (item.value / total * 100).toFixed(1);
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span className="text-muted-foreground">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
