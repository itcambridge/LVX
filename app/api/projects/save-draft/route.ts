import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { projectId, stage, bundlePatch, sources, toneScores } = await req.json();

    const { data: proj, error: fetchError } = await s.from("projects").select("plan_bundle").eq("id", projectId).single();
    if (fetchError) {
      console.error("Error fetching project:", fetchError);
      return NextResponse.json({ ok: false, error: fetchError }, { status: 500 });
    }

    const plan_bundle = { ...(proj?.plan_bundle || {}), ...bundlePatch };

    const { error } = await s.from("projects").update({
      plan_bundle,
      sources: sources ?? undefined,
      tone_scores: toneScores ?? undefined,
      routine_stage: stage
    }).eq("id", projectId);

    if (error) {
      console.error("Error updating project:", error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Failed to save draft"
    }, { status: 500 });
  }
}
