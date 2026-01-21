/**
 * Debug API to batch create profiles for users who don't have one
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    console.log("🔄 [Batch-Create] Starting batch profile creation...");

    // Get all users from auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ [Batch-Create] Error listing auth users:", authError);
      return NextResponse.json({
        success: false,
        error: "Failed to list auth users",
        details: authError,
      });
    }

    console.log(`✅ [Batch-Create] Found ${users.length} users in auth.users`);

    // Get all existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id");

    if (profilesError) {
      console.error("❌ [Batch-Create] Error querying profiles:", profilesError);
      return NextResponse.json({
        success: false,
        error: "Failed to query profiles",
        details: profilesError,
      });
    }

    const profileIds = new Set(profiles.map(p => p.id));
    const usersWithoutProfiles = users.filter(u => !profileIds.has(u.id));

    console.log(`📊 [Batch-Create] Found ${usersWithoutProfiles.length} users without profiles`);

    // Batch create profiles
    const results = {
      total: usersWithoutProfiles.length,
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const user of usersWithoutProfiles) {
      const displayName = user.email?.split("@")[0] || "User";

      const { data, error } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        name: displayName,
        display_name: displayName,
        region: "INTL",
      }).select();

      if (error) {
        console.error(`❌ [Batch-Create] Failed to create profile for ${user.email}:`, error);
        results.failed++;
        results.errors.push({
          email: user.email,
          error: error.message,
          details: error,
        });
      } else {
        console.log(`✅ [Batch-Create] Created profile for ${user.email}`);
        results.success++;
      }
    }

    console.log(`📊 [Batch-Create] Batch creation complete:`, results);

    return NextResponse.json({
      success: true,
      results,
      message: `Batch creation complete: ${results.success} succeeded, ${results.failed} failed`,
    });
  } catch (error: any) {
    console.error("❌ [Batch-Create] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
