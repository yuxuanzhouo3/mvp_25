/**
 * 模拟身份验证助手
 * 用于开发环境模拟已登录用户
 * 在实现真正的身份验证之前使用
 */

/**
 * 获取当前用户ID
 * @returns 硬编码的测试用户ID
 */
export function getCurrentUserId(): string {
  return "test_user_001";
}

/**
 * 获取当前用户信息
 * @returns 模拟的用户对象
 */
export function getCurrentUser() {
  return {
    id: "test_user_001",
    name: "Test Student",
    email: "test@example.com"
  };
}
