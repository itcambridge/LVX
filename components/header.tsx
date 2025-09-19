import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, Menu, User } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-black text-white border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-black/20">
            <Menu className="h-5 w-5" />
          </Button>
          <Image src="/logo.png" alt="FreeSpeech.Live" width={150} height={40} className="h-9 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/onboarding">
            <Button variant="ghost" size="icon" className="text-white hover:bg-black/20">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-white hover:bg-black/20">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
