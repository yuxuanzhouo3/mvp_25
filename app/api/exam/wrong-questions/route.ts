import { NextRequest, NextResponse } from "next/server";
import { app } from "@/lib/cloudbase";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";
import { CLOUDBASE_COLLECTIONS, WrongQuestion } from "@/lib/database/cloudbase-schema";

const REGION = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || "CN";

// GET - 获取用户的错题列表
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    if (REGION === "CN") {
      const db = app.database();
      const result = await db
        .collection(CLOUDBASE_COLLECTIONS.WRONG_QUESTIONS)
        .where({ user_id: userId })
        .orderBy("lastWrongAt", "desc")
        .get();

      return NextResponse.json({ data: result.data || [] });
    } else {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("wrong_questions")
        .select("*")
        .eq("user_id", userId)
        .order("last_wrong_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }
  } catch (error: any) {
    console.error("获取错题失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 添加错题
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const { questionId, question, userAnswer } = body;

    if (REGION === "CN") {
      const db = app.database();

      // 检查是否已存在
      const existing = await db
        .collection(CLOUDBASE_COLLECTIONS.WRONG_QUESTIONS)
        .where({ user_id: userId, questionId })
        .get();

      if (existing.data && existing.data.length > 0) {
        // 更新现有记录
        const existingDoc = existing.data[0] as WrongQuestion;
        await db
          .collection(CLOUDBASE_COLLECTIONS.WRONG_QUESTIONS)
          .doc(existingDoc._id!)
          .update({
            wrongCount: existingDoc.wrongCount + 1,
            lastWrongAt: new Date().toISOString(),
            userAnswers: [...existingDoc.userAnswers, userAnswer],
            updated_at: new Date().toISOString(),
          });

        return NextResponse.json({ success: true, updated: true });
      } else {
        // 创建新记录
        await db.collection(CLOUDBASE_COLLECTIONS.WRONG_QUESTIONS).add({
          user_id: userId,
          questionId,
          question,
          wrongCount: 1,
          lastWrongAt: new Date().toISOString(),
          mastered: false,
          userAnswers: [userAnswer],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, created: true });
      }
    } else {
      const supabase = getSupabaseAdmin();

      // 检查是否已存在
      const { data: existing } = await supabase
        .from("wrong_questions")
        .select("*")
        .eq("user_id", userId)
        .eq("question_id", questionId)
        .single();

      if (existing) {
        // 更新现有记录
        const { error } = await supabase
          .from("wrong_questions")
          .update({
            wrong_count: existing.wrong_count + 1,
            last_wrong_at: new Date().toISOString(),
            user_answers: [...existing.user_answers, userAnswer],
          })
          .eq("id", existing.id);

        if (error) throw error;
        return NextResponse.json({ success: true, updated: true });
      } else {
        // 创建新记录
        const { error } = await supabase.from("wrong_questions").insert({
          user_id: userId,
          question_id: questionId,
          question,
          wrong_count: 1,
          last_wrong_at: new Date().toISOString(),
          mastered: false,
          user_answers: [userAnswer],
        });

        if (error) throw error;
        return NextResponse.json({ success: true, created: true });
      }
    }
  } catch (error: any) {
    console.error("添加错题失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除错题
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
    }

    if (REGION === "CN") {
      const db = app.database();
      await db.collection(CLOUDBASE_COLLECTIONS.WRONG_QUESTIONS).doc(id).remove();
      return NextResponse.json({ success: true });
    } else {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("wrong_questions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error("删除错题失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - 更新错题（如标记为已掌握）
export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const { id, mastered } = body;

    if (REGION === "CN") {
      const db = app.database();
      await db
        .collection(CLOUDBASE_COLLECTIONS.WRONG_QUESTIONS)
        .doc(id)
        .update({
          mastered,
          updated_at: new Date().toISOString(),
        });

      return NextResponse.json({ success: true });
    } else {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("wrong_questions")
        .update({ mastered })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error("更新错题失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
