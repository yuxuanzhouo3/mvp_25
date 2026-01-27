/**
 * 错题本服务层 - 封装 API 调用
 */

export interface WrongQuestionData {
  questionId: string;
  question: any;
  userAnswer: number | number[] | string[];
}

/**
 * 获取用户的错题列表
 */
export async function fetchWrongQuestions(): Promise<any[]> {
  try {
    const response = await fetch("/api/exam/wrong-questions", {
      headers: {
        "x-user-id": getUserId(),
      },
    });

    if (!response.ok) throw new Error("获取错题失败");
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("获取错题失败:", error);
    return [];
  }
}

/**
 * 添加错题
 */
export async function saveWrongQuestion(data: WrongQuestionData): Promise<boolean> {
  try {
    const response = await fetch("/api/exam/wrong-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": getUserId(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("保存错题失败");
    return true;
  } catch (error) {
    console.error("保存错题失败:", error);
    return false;
  }
}

/**
 * 更新错题（标记为已掌握）
 */
export async function updateWrongQuestion(id: string, mastered: boolean): Promise<boolean> {
  try {
    const response = await fetch("/api/exam/wrong-questions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": getUserId(),
      },
      body: JSON.stringify({ id, mastered }),
    });

    if (!response.ok) throw new Error("更新错题失败");
    return true;
  } catch (error) {
    console.error("更新错题失败:", error);
    return false;
  }
}

/**
 * 删除错题
 */
export async function deleteWrongQuestion(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/exam/wrong-questions?id=${id}`, {
      method: "DELETE",
      headers: {
        "x-user-id": getUserId(),
      },
    });

    if (!response.ok) throw new Error("删除错题失败");
    return true;
  } catch (error) {
    console.error("删除错题失败:", error);
    return false;
  }
}

/**
 * 获取用户 ID（根据区域自动选择认证方式）
 */
function getUserId(): string {
  const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || "CN";

  if (region === "CN") {
    // CloudBase Auth - 从 localStorage 获取
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || "guest";
      } catch (e) {
        console.error("Failed to parse user from localStorage");
      }
    }
  } else {
    // Supabase Auth - 从 Supabase 客户端获取
    // 注意：这里需要在客户端组件中调用，因为 Supabase 客户端是浏览器端的
    const userStr = localStorage.getItem("sb-hrcwybaukdyibnwayneq-auth-token");
    if (userStr) {
      try {
        const authData = JSON.parse(userStr);
        return authData?.user?.id || "guest";
      } catch (e) {
        console.error("Failed to parse Supabase auth token");
      }
    }
  }

  return "guest";
}
