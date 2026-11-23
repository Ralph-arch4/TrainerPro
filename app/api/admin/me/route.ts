import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/admin";

// Lets admin pages check access before loading data (401/403 when not admin).
export async function GET() {
  const g = await adminGuard();
  if (g.error) return g.error;
  return NextResponse.json({ admin: true });
}
