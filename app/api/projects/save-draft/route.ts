import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  const { projectId, stage, bundlePatch, sources, toneScores } = await req.json();

  const { data: proj } = await s.from("projects").select("plan_bundle").eq("id", projectId).single();
  const plan_bundle = { ...(proj?.plan_bundle || {}), ...bundlePatch };

  const { error } = await s.from("projects").update({
    plan_bundle,
    sources: sources ?? undefined,
    tone_scores: toneScores ?? undefined,
    routine_stage: stage
  }).eq("id", projectId);

  if (error) return NextResponse.json({ ok:false, error }, { status: 500 });
  return NextResponse.json({ ok:true });
}
