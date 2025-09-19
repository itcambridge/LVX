import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles, userSkills } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Define the schema for profile update
const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Get the current user
    const supabase = supabaseServer();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const result = profileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    // Update the user profile
    const { displayName, bio, avatarUrl, skills } = result.data;
    await db
      .update(profiles)
      .set({
        displayName,
        bio,
        avatarUrl,
        // Don't update createdAt
      })
      .where(eq(profiles.userId, data.user.id));

    // Handle skills if provided
    if (skills && skills.length > 0) {
      // First, delete existing skills for this user
      await db
        .delete(userSkills)
        .where(eq(userSkills.userId, data.user.id));
      
      // Then insert the new skills
      const skillsToInsert = skills.map(skill => ({
        userId: data.user.id,
        skill
      }));
      
      await db.insert(userSkills).values(skillsToInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
