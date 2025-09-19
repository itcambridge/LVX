import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabase as supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Exchange ?code= for a session and set cookies
  const { data, error } = await supabase.auth.exchangeCodeForSession(
    url.searchParams.get("code") || ""
  );
  
  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth", url));
  }

  const user = data.user;
  if (user) {
    const uid = user.id;
    
    // Check if user exists in the users table
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', uid)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking user:', userError);
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
      }
    }
  }

  const redirectTo = cookieStore.get("sb-redirect-to")?.value ?? "/";
  return NextResponse.redirect(new URL(redirectTo, url));
}
