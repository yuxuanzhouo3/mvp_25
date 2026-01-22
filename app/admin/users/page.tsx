"use client";

/**
 * 管理后台 - 用户管理页面
 *
 * 完整功能：
 * - 用户列表展示（支持分页）
 * - 搜索和筛选
 * - 查看用户详情
 * - 禁用/启用用户
 * - 编辑用户信息
 * - 用户统计展示
 */

import { useState, useEffect, useMemo } from "react";
import {
  listUsers,
  getUserStats,
  updateUser,
  disableUser,
  enableUser,
  type User,
  type UserStats,
} from "@/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  User as UserIcon,
  Shield,
  Crown,
  Gem,
  Ban,
  Check,
  X,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function UsersManagementPage() {
  // ==================== 状态管理 ====================
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");

  // 对话框状态
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [banningUser, setBanningUser] = useState<User | null>(null);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: "",
    subscription_plan: "free" as "free" | "pro" | "enterprise",
    pro_expires_at: "",
    status: "active" as "active" | "disabled" | "banned",
  });

  // ==================== 筛选后的用户列表 ====================
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filterStatus !== "all" && user.status !== filterStatus) {
        return false;
      }
      if (filterPlan !== "all" && user.subscription_plan !== filterPlan) {
        return false;
      }
      if (filterRegion !== "all" && user.region !== filterRegion) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [users, filterStatus, filterPlan, filterRegion, searchQuery]);

  // ==================== 数据加载 ====================
  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * pageSize;
      const result = await listUsers({
        limit: pageSize,
        offset,
      });

      if (result.success && result.data) {
        setUsers(result.data.items);
        setTotal(result.data.total);
      } else {
        setError(result.error || "加载失败");
      }
    } catch (err) {
      setError("加载用户列表失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const result = await getUserStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("加载统计失败:", err);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [page]);

  useEffect(() => {
    loadStats();
  }, []);

  // ==================== 用户操作 ====================
  async function handleToggleStatus(user: User) {
    setToggling(user.id);
    setError(null);

    try {
      const action = user.status === "active" ? disableUser : enableUser;
      const result = await action(user.id);

      if (result.success) {
        // 更新本地状态
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, status: user.status === "active" ? "disabled" : "active" }
              : u
          )
        );
        loadStats();
      } else {
        setError(result.error || "操作失败");
      }
    } catch (err) {
      setError("操作失败");
    } finally {
      setToggling(null);
    }
  }

  async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);
    setError(null);

    try {
      const result = await updateUser(editingUser.id, {
        name: editForm.name,
        subscription_plan: editForm.subscription_plan,
        pro_expires_at: editForm.pro_expires_at || null,
        status: editForm.status,
      });

      if (result.success) {
        // 更新本地状态
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? result.data! : u))
        );
        setEditingUser(null);
        loadStats();
      } else {
        setError(result.error || "更新失败");
      }
    } catch (err) {
      setError("更新失败");
    } finally {
      setUpdating(false);
    }
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      subscription_plan: user.subscription_plan,
      pro_expires_at: user.pro_expires_at ? user.pro_expires_at.split("T")[0] : "",
      status: user.status,
    });
  }

  // ==================== 工具函数 ====================
  function getRoleBadge(plan: string) {
    switch (plan) {
      case "enterprise":
        return (
          <Badge variant="default" className="gap-1">
            <Crown className="h-3 w-3" />
            企业版
          </Badge>
        );
      case "yearly":
      case "monthly":
        return (
          <Badge variant="secondary" className="gap-1">
            <Gem className="h-3 w-3" />
            专业版
          </Badge>
        );
      case "pro":
        return (
          <Badge variant="secondary" className="gap-1">
            <Gem className="h-3 w-3" />
            专业版
          </Badge>
        );
      default:
        return <Badge variant="outline">免费版</Badge>;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">正常</Badge>;
      case "disabled":
        return <Badge variant="secondary">已禁用</Badge>;
      case "banned":
        return <Badge variant="destructive">已封禁</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateOnly(dateStr: string | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  // ==================== 分页 ====================
  const totalPages = Math.ceil(total / pageSize);

  // ==================== 渲染 ====================
  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看和管理平台用户，共 {total} 名用户
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statsLoading ? (
          // 骨架屏：加载时显示
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : stats ? (
          // 数据加载完成：显示实际数据
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  总用户数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  本月新增 {stats.newThisMonth}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  免费用户
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.free}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  专业版用户
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.pro}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  企业版用户
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.enterprise}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  本周活跃
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activeThisWeek}</div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* 搜索和筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户名或邮箱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 订阅类型筛选 */}
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="订阅类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="free">免费版</SelectItem>
                <SelectItem value="pro">专业版</SelectItem>
                <SelectItem value="enterprise">企业版</SelectItem>
              </SelectContent>
            </Select>

            {/* 状态筛选 */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="disabled">已禁用</SelectItem>
                <SelectItem value="banned">已封禁</SelectItem>
              </SelectContent>
            </Select>

            {/* 地区筛选 */}
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="地区" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部地区</SelectItem>
                <SelectItem value="CN">国内</SelectItem>
                <SelectItem value="INTL">国际</SelectItem>
              </SelectContent>
            </Select>

            {/* 清除筛选 */}
            {(searchQuery || filterPlan !== "all" || filterStatus !== "all" || filterRegion !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchQuery("");
                setFilterPlan("all");
                setFilterStatus("all");
                setFilterRegion("all");
              }}>
                <X className="h-4 w-4 mr-1" />
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || filterPlan !== "all" || filterStatus !== "all" || filterRegion !== "all"
                ? "没有符合筛选条件的用户"
                : "暂无用户数据"}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">用户</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>订阅</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>地区</TableHead>
                      <TableHead>注册时间</TableHead>
                      <TableHead>最后登录</TableHead>
                      <TableHead>会员到期</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <UserIcon className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{user.name || "未设置"}</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {user.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.subscription_plan)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.region}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateOnly(user.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.last_login_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.pro_expires_at ? (
                            <span className={
                              new Date(user.pro_expires_at) > new Date()
                                ? "text-green-600"
                                : "text-red-600"
                            }>
                              {formatDateOnly(user.pro_expires_at)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingUser(user)}
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(user)}
                              title="编辑"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${
                                user.status === "active"
                                  ? "text-orange-600 hover:text-orange-700"
                                  : "text-green-600 hover:text-green-700"
                              }`}
                              onClick={() => handleToggleStatus(user)}
                              disabled={toggling === user.id}
                              title={user.status === "active" ? "禁用" : "启用"}
                            >
                              {toggling === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : user.status === "active" ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页 */}
              {total > pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    显示第 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 条
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      上一页
                    </Button>
                    <div className="text-sm">
                      第 <span className="font-medium">{page}</span> / <span>{totalPages}</span> 页
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 查看用户详情对话框 */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-6">
              {/* 用户头像和基本信息 */}
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {viewingUser.avatar ? (
                    <img
                      src={viewingUser.avatar}
                      alt={viewingUser.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-10 w-10 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold">{viewingUser.name || "未设置"}</div>
                  <div className="text-sm text-muted-foreground">{viewingUser.email}</div>
                  <div className="mt-2">{getRoleBadge(viewingUser.subscription_plan)}</div>
                </div>
              </div>

              {/* 详细信息 */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">用户ID：</span>
                    <div className="font-mono text-xs mt-1">{viewingUser.id}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">状态：</span>
                    <div className="mt-1">{getStatusBadge(viewingUser.status)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">地区：</span>
                    <div className="mt-1">
                      <Badge variant="outline">{viewingUser.region}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">角色：</span>
                    <div className="mt-1">{viewingUser.role}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">注册时间：</span>
                    <div className="mt-1">{formatDate(viewingUser.created_at)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">最后登录：</span>
                    <div className="mt-1">{formatDate(viewingUser.last_login_at)}</div>
                  </div>
                </div>

                {viewingUser.pro_expires_at && (
                  <div className="text-sm pt-3 border-t">
                    <span className="text-muted-foreground">会员到期时间：</span>
                    <span className={`ml-2 ${
                      new Date(viewingUser.pro_expires_at) > new Date()
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {formatDate(viewingUser.pro_expires_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingUser(null)}
            >
              关闭
            </Button>
            {viewingUser && viewingUser.status === "active" && (
              <Button
                variant="destructive"
                onClick={() => {
                  setBanningUser(viewingUser);
                  setViewingUser(null);
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                禁用用户
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户信息和权限
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">姓名</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-plan">订阅类型</Label>
                <Select
                  value={editForm.subscription_plan}
                  onValueChange={(value) => setEditForm({ ...editForm, subscription_plan: value as any })}
                >
                  <SelectTrigger id="edit-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">免费版</SelectItem>
                    <SelectItem value="pro">专业版</SelectItem>
                    <SelectItem value="enterprise">企业版</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expires">会员到期时间</Label>
                <Input
                  id="edit-expires"
                  type="date"
                  value={editForm.pro_expires_at}
                  onChange={(e) => setEditForm({ ...editForm, pro_expires_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">留空表示无到期时间</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">账户状态</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value as any })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">正常</SelectItem>
                    <SelectItem value="disabled">已禁用</SelectItem>
                    <SelectItem value="banned">已封禁</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  disabled={updating}
                >
                  取消
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 禁用用户确认对话框 */}
      <AlertDialog open={!!banningUser} onOpenChange={() => setBanningUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认禁用用户</AlertDialogTitle>
            <AlertDialogDescription>
              确定要禁用用户 <span className="font-semibold">"{banningUser?.name}"</span> 吗？
              <br />
              禁用后用户将无法登录和访问系统功能。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling !== null}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (banningUser) {
                  handleToggleStatus(banningUser);
                  setBanningUser(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={toggling !== null}
            >
              {toggling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                "确认禁用"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
