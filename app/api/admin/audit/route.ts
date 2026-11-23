import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/admin";

// Latest admin actions across all trainers.
export async function GET() {
  const g = await adminGuard();
  if (g.error) return g.error;
  const { data, error } = await g.admin.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(300);
  if (error) return NextResponse.json({ entries: [], missing: true });
  return NextResponse.json({
    entries: (data ?? []).map((a) => ({
      id: a.id, action: a.action, adminEmail: a.admin_email, targetUserId: a.target_user_id, details: a.details, createdAt: a.created_at,
    })),
  });
}
