import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { projectId, title, tldr, body_markdown, to_verify_items } = await req.json();
    
    // First check if the project exists
    const { data: existingProject, error: checkError } = await s.from("projects")
      .select("id, routine_stage")
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
        title: title || "Bridge Story",
        tldr: tldr || "",
        description: body_markdown || "",
        to_verify_items: to_verify_items || null,
        status: "published",
        routine_completed: true,
        created_at: new Date().toISOString()
      });

      if (insertError) {
        console.error("Error creating project:", insertError);
        return NextResponse.json({ ok: false, error: insertError }, { status: 500 });
      }

      // Return success after creating the project
      return NextResponse.json({ ok: true, created: true });
    }

    // For the new approach, we don't enforce a specific stage number
    // Just mark as completed when published
    const routine_completed = true;

    const { error } = await s.from("projects").update({
      title, 
      tldr, 
      description: body_markdown,
      to_verify_items: to_verify_items || null,
      routine_completed,
      status: "published"
    }).eq("id", projectId);

    if (error) {
      console.error("Error publishing project:", error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, updated: true });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Failed to publish project"
    }, { status: 500 });
  }
}
