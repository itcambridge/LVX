import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { projectId, stage, bundlePatch, sources, toneScores, version, emphasis, imageUrl } = await req.json();
    
    // Sanitize bundlePatch to handle potential schema validation issues
    const sanitizedBundlePatch = sanitizeBundle(bundlePatch);

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
        summary: bundlePatch?.bridge_story?.thin_edge || "Draft Bridge Story Summary",
        tldr: bundlePatch?.bridge_story?.paragraphs?.[0] || "Draft summary paragraph",
        description: bundlePatch?.bridge_story?.paragraphs?.join("\n\n") || "Draft description",
        status: "draft",
        routine_stage: stage || "oneshot",
        plan_bundle: bundlePatch,
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

    // Project exists, proceed with update
    const proj = existingProject[0];
    const plan_bundle = { ...(proj?.plan_bundle || {}), ...sanitizedBundlePatch };
    
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
      error: error.message || "Failed to save draft"
    }, { status: 500 });
  }
}

/**
 * Sanitize the bundle to handle potential schema validation issues
 * @param bundle The bundle to sanitize
 * @returns Sanitized bundle
 */
function sanitizeBundle(bundle: any): any {
  if (!bundle) return bundle;
  
  try {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(bundle));
    
    // Sanitize steelman points
    if (sanitized.steelman) {
      if (sanitized.steelman.author && sanitized.steelman.author.points) {
        sanitized.steelman.author.points = sanitizePoints(sanitized.steelman.author.points);
      }
      
      if (sanitized.steelman.opponent && sanitized.steelman.opponent.points) {
        sanitized.steelman.opponent.points = sanitizePoints(sanitized.steelman.opponent.points);
      }
    }
    
    // Sanitize concern map claims
    if (sanitized.concern_map && sanitized.concern_map.claims) {
      sanitized.concern_map.claims = sanitized.concern_map.claims.map((claim: any) => {
        if (claim.type && !["evidence", "inference", "emotion", "empathy", "value"].includes(claim.type)) {
          return { ...claim, type: "inference" }; // Default to inference for invalid types
        }
        return claim;
      });
    }
    
    return sanitized;
  } catch (err) {
    console.error("Error sanitizing bundle:", err);
    return bundle; // Return original if sanitization fails
  }
}

/**
 * Sanitize steelman points to ensure valid types
 * @param points Array of points to sanitize
 * @returns Sanitized points
 */
function sanitizePoints(points: any[]): any[] {
  if (!Array.isArray(points)) return points;
  
  return points.map(point => {
    if (point.type && !["evidence", "inference", "emotion", "empathy", "value"].includes(point.type)) {
      return { ...point, type: "inference" }; // Default to inference for invalid types
    }
    return point;
  });
}
