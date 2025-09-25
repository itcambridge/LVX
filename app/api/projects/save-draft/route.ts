import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { projectId, stage, bundlePatch, sources, toneScores, version, emphasis } = await req.json();

    // First check if the project exists
    const { data: existingProject, error: checkError } = await s.from("projects")
      .select("id, plan_bundle, version_history")
      .eq("id", projectId);
    
    if (checkError) {
      console.error("Error checking project:", checkError);
      return NextResponse.json({ ok: false, error: checkError }, { status: 500 });
    }

    // If project doesn't exist, create it first
    if (!existingProject || existingProject.length === 0) {
      console.log("Project doesn't exist, creating new project with ID:", projectId);
      const { error: insertError } = await s.from("projects").insert({
        id: projectId,
        title: "Draft Bridge Story",
        status: "draft",
        routine_stage: stage || "oneshot",
        plan_bundle: bundlePatch,
        created_at: new Date().toISOString()
      });

      if (insertError) {
        console.error("Error creating project:", insertError);
        return NextResponse.json({ ok: false, error: insertError }, { status: 500 });
      }

      // Return success after creating the project
      return NextResponse.json({ ok: true, created: true });
    }

    // Project exists, proceed with update
    const proj = existingProject[0];
    const plan_bundle = { ...(proj?.plan_bundle || {}), ...bundlePatch };
    
    // Handle versioning
    let version_history = proj?.version_history || [];
    if (version) {
      // Add current state to version history before updating
      version_history = [
        ...(Array.isArray(version_history) ? version_history : []),
        {
          timestamp: new Date().toISOString(),
          plan_bundle: proj?.plan_bundle || {},
          version
        }
      ];
    }

    const { error } = await s.from("projects").update({
      plan_bundle,
      sources: sources ?? undefined,
      tone_scores: toneScores ?? undefined,
      routine_stage: stage,
      version_history,
      emphasis: emphasis || undefined
    }).eq("id", projectId);

    if (error) {
      console.error("Error updating project:", error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, updated: true });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Failed to save draft"
    }, { status: 500 });
  }
}
