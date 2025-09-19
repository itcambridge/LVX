import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabase as supabaseAdmin } from "@/lib/supabase";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }
  
  // Ensure the user exists in our database
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', data.user.id)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error checking user:', error);
  }
  
  // If user doesn't exist, create a new user record
  if (!user) {
    // Bootstrap the user by calling our API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/me/bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Error bootstrapping user:', await response.text());
    }
  }
  
  return <>{children}</>;
}
