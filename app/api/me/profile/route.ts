import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabase as supabaseAdmin } from "@/lib/supabase";
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

    // Update the user profile in the existing users table
    const { displayName, bio, avatarUrl, skills } = result.data;
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        name: displayName,
        bio: bio,
        avatar: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Handle skills if provided
    if (skills && skills.length > 0) {
      // First, get all skills from the skills table
      const { data: existingSkills, error: skillsError } = await supabaseAdmin
        .from('skills')
        .select('id, name');

      if (skillsError) {
        console.error("Error fetching skills:", skillsError);
        return NextResponse.json(
          { error: "Failed to fetch skills" },
          { status: 500 }
        );
      }

      // Create a map of skill names to IDs
      const skillMap = new Map();
      existingSkills.forEach(skill => {
        skillMap.set(skill.name.toLowerCase(), skill.id);
      });

      // Create any new skills that don't exist yet
      const newSkills = skills.filter(skill => !skillMap.has(skill.toLowerCase()));
      if (newSkills.length > 0) {
        const skillsToInsert = newSkills.map(skill => ({ name: skill }));
        const { data: insertedSkills, error: insertSkillsError } = await supabaseAdmin
          .from('skills')
          .insert(skillsToInsert)
          .select();

        if (insertSkillsError) {
          console.error("Error inserting new skills:", insertSkillsError);
        } else if (insertedSkills) {
          // Add new skills to the map
          insertedSkills.forEach(skill => {
            skillMap.set(skill.name.toLowerCase(), skill.id);
          });
        }
      }

      // Delete existing user_skills for this user
      const { error: deleteSkillsError } = await supabaseAdmin
        .from('user_skills')
        .delete()
        .eq('user_id', data.user.id);

      if (deleteSkillsError) {
        console.error("Error deleting user skills:", deleteSkillsError);
      }

      // Insert new user_skills
      const userSkillsToInsert = skills
        .filter(skill => skillMap.has(skill.toLowerCase()))
        .map(skill => ({
          user_id: data.user.id,
          skill_id: skillMap.get(skill.toLowerCase())
        }));

      if (userSkillsToInsert.length > 0) {
        const { error: insertUserSkillsError } = await supabaseAdmin
          .from('user_skills')
          .insert(userSkillsToInsert);

        if (insertUserSkillsError) {
          console.error("Error inserting user skills:", insertUserSkillsError);
        }
      }
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
