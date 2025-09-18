"use client"

import { Home, Plus, User, Vote, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/create", icon: Plus, label: "Create" },
  { href: "/vote", icon: Vote, label: "Vote" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  const pathname = usePathname()
  
  // Check if admin mode is enabled via URL parameter or localStorage
  const isAdminMode = typeof window !== 'undefined' && 
    (window.location.search.includes('admin=true') || localStorage.getItem('adminMode') === 'true')
  
  // If admin mode is enabled via URL, store it in localStorage
  if (typeof window !== 'undefined' && window.location.search.includes('admin=true')) {
    localStorage.setItem('adminMode', 'true')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
                isActive ? "text-white bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
        
        {/* Admin link - only visible when admin mode is enabled */}
        {isAdminMode && (
          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
              pathname === "/admin" ? "text-white bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
