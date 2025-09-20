"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, LogOut, Menu, User, X } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useOnClickOutside } from "@/hooks/use-click-outside"
import { useIsMobile } from "@/hooks/use-mobile"

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = supabaseBrowser()
  const isMobile = useIsMobile()
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Close the menu when clicking outside
  useOnClickOutside(menuRef, () => setMobileMenuOpen(false))

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

  // Close mobile menu when navigating to a new page
  const handleNavigation = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-black text-white border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white hover:bg-black/20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/">
            <Image src="/logo.png" alt="FreeSpeech.Live" width={150} height={40} className="h-9 w-auto" />
          </Link>
        </div>
        
        {/* Desktop menu */}
        {!isMobile && (
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
        )}
      </div>

      {/* Mobile menu */}
      {isMobile && mobileMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute top-full left-0 w-full bg-black border-b border-border shadow-lg z-50 transition-all duration-200 ease-in-out"
        >
          <div className="p-4 space-y-3">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Link href="/profile" onClick={handleNavigation}>
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-black/20">
                        <User className="h-5 w-5 mr-2" />
                        Profile
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-white hover:bg-black/20"
                      onClick={() => {
                        handleLogout()
                        handleNavigation()
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link href="/login" onClick={handleNavigation}>
                    <Button variant="outline" className="w-full justify-start text-white border-white hover:bg-black/20">
                      <User className="h-5 w-5 mr-2" />
                      Login
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-black/20">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
