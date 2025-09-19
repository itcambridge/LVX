import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const uid = user.id;
  const [existing] = await db.select().from(profiles).where(eq(profiles.userId, uid)).limit(1);
  if (!existing) {
    await db.insert(profiles).values({ userId: uid });
    await db.insert(userRoles).values({ userId: uid, role: "user" });
  }
  return NextResponse.json({ ok: true });
}
