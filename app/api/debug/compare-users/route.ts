/**
 * Debug API to compare auth.users and profiles tables
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    console.log("🔍 [Debug-Compare] Comparing auth.users and profiles tables...");

    // Get all users from auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ [Debug-Compare] Error listing auth users:", authError);
      return NextResponse.json({
        success: false,
        error: "Failed to list auth users",
        details: authError,
      });
    }

    console.log(`✅ [Debug-Compare] Found ${users.length} users in auth.users`);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("❌ [Debug-Compare] Error querying profiles:", profilesError);
      return NextResponse.json({
        success: false,
        error: "Failed to query profiles",
        details: profilesError,
      });
    }

    console.log(`✅ [Debug-Compare] Found ${profiles.length} profiles in profiles table`);

    // Compare the two lists
    const authUserIds = new Set(users.map(u => u.id));
    const profileUserIds = new Set(profiles.map(p => p.id));

    // Users in auth.users but not in profiles
    const usersWithoutProfiles = users.filter(u => !profileUserIds.has(u.id));

    // Profiles not in auth.users (shouldn't happen due to FK)
    const orphanedProfiles = profiles.filter(p => !authUserIds.has(p.id));

    // Detailed comparison
    const comparison = {
      auth_users_count: users.length,
      profiles_count: profiles.length,
      users_without_profiles: usersWithoutProfiles.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      })),
      orphaned_profiles: orphanedProfiles.map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
      })),
      mismatch_count: usersWithoutProfiles.length,
    };

    console.log(`📊 [Debug-Compare] Comparison result:`, comparison);

    return NextResponse.json({
      success: true,
      comparison,
      message: usersWithoutProfiles.length > 0
        ? `Found ${usersWithoutProfiles.length} users without profiles`
        : "All users have profiles",
    });
  } catch (error: any) {
    console.error("❌ [Debug-Compare] Error:", error);
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
