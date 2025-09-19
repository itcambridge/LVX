import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { db } from "@/lib/db";
import { profiles, userRoles, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    const [existing] = await db.select().from(profiles).where(eq(profiles.userId, uid)).limit(1);

    if (!existing) {
      await db.insert(profiles).values({
        userId: uid,
        displayName: (user.user_metadata?.name as string) ??
                     user.email?.split("@")[0] ??
                     "New User",
        avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
      });
      await db.insert(userRoles).values({ userId: uid, role: "user" });
      await db.insert(accounts).values({
        userId: uid,
        provider: (user.app_metadata?.provider as string) ?? "email",
        providerUserId: user.identities?.[0]?.id ?? null,
      });
    }
  }

  const redirectTo = cookieStore.get("sb-redirect-to")?.value ?? "/";
  return NextResponse.redirect(new URL(redirectTo, url));
}
