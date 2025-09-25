import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { projectId, title, tldr, body_markdown, to_verify_items, imageUrl } = await req.json();
    
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
        summary: tldr || "Bridge Story Summary", // Required field
        tldr: tldr || "",
        description: body_markdown || "",
        to_verify_items: to_verify_items || null,
        status: "published",
        routine_completed: true,
        created_at: new Date().toISOString(),
        fund_goal: 0 // Required field with a default value
      });

      if (insertError) {
        console.error("Error creating project:", insertError);
        return NextResponse.json({ ok: false, error: insertError }, { status: 500 });
      }

      // If an image URL was provided, create a record in the project_images table
      if (imageUrl) {
        const { error: imageError } = await s.from("project_images").insert({
          project_id: projectId,
          image_url: imageUrl,
          display_order: 1
        });

        if (imageError) {
          console.error("Error creating project image:", imageError);
          // Continue even if image creation fails
        }
      }

      // Return success after creating the project
      return NextResponse.json({ ok: true, created: true });
    }

    // For the new approach, we don't enforce a specific stage number
    // Just mark as completed when published
    const routine_completed = true;

    const { error } = await s.from("projects").update({
      title, 
      summary: tldr || "Bridge Story Summary", // Ensure summary is updated
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
    
    // If an image URL was provided, update or create a record in the project_images table
    if (imageUrl) {
      // First check if an image already exists for this project
      const { data: existingImages } = await s.from("project_images")
        .select("id")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true })
        .limit(1);
      
      if (existingImages && existingImages.length > 0) {
        // Update the existing image
        const { error: updateImageError } = await s.from("project_images")
          .update({ image_url: imageUrl })
          .eq("id", existingImages[0].id);
        
        if (updateImageError) {
          console.error("Error updating project image:", updateImageError);
          // Continue even if image update fails
        }
      } else {
        // Create a new image record
        const { error: insertImageError } = await s.from("project_images").insert({
          project_id: projectId,
          image_url: imageUrl,
          display_order: 1
        });
        
        if (insertImageError) {
          console.error("Error creating project image:", insertImageError);
          // Continue even if image creation fails
        }
      }
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
