import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { projectId, title, tldr, body_markdown, to_verify_items } = await req.json();
    
    const { data: p, error: e1 } = await s.from("projects").select("routine_stage").eq("id", projectId).single();
    if (e1) {
      console.error("Error fetching project:", e1);
      return NextResponse.json({ ok: false, error: e1 }, { status: 500 });
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
    
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Failed to publish project"
    }, { status: 500 });
  }
}
