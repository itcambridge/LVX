import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Bell, Menu } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Image src="/logo.png" alt="FreeSpeech.Live" width={120} height={40} className="h-8 w-auto" />
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
