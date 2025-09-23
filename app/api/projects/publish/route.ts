import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  const { projectId, title, tldr, body_markdown } = await req.json();
  const { data: p, error: e1 } = await s.from("projects").select("routine_stage").eq("id", projectId).single();
  if (e1) return NextResponse.json({ ok:false, error: e1 }, { status: 500 });

  // Enforce completion of the routine (Stage 8); allow publish even if tone low (MVP rule).
  const routine_completed = (p?.routine_stage ?? 0) >= 8;

  const { error } = await s.from("projects").update({
    title, tldr, description: body_markdown,
    routine_completed,
    status: "published"
  }).eq("id", projectId);

  if (error) return NextResponse.json({ ok:false, error }, { status: 500 });
  return NextResponse.json({ ok:true });
}
