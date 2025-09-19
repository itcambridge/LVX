import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabase as supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const uid = user.id;
  
  // Check if user exists in the users table
  const { data: existingUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', uid)
    .single();

  if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error checking user:', userError);
    return NextResponse.json({ ok: false, error: userError }, { status: 500 });
  }

  // If user doesn't exist, create a new user record
  if (!existingUser) {
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: uid,
        name: (user.user_metadata?.name as string) ?? 
              user.email?.split("@")[0] ?? 
              "New User",
        avatar: (user.user_metadata?.avatar_url as string) ?? null,
        join_date: new Date().toISOString(),
        verified: false
      });

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json({ ok: false, error: insertError }, { status: 500 });
    }
  }
  
  return NextResponse.json({ ok: true });
}
