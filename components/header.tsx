"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, LogOut, Menu, User } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = supabaseBrowser()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setIsAuthenticated(!!data.user)
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-black text-white border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-black/20">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/">
            <Image src="/logo.png" alt="FreeSpeech.Live" width={150} height={40} className="h-9 w-auto" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <>
              {isAuthenticated ? (
                <>
                  <Link href="/profile">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-black/20">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-black/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm" className="text-white border-white hover:bg-black/20">
                    Login
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" className="text-white hover:bg-black/20">
                <Bell className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
