import type React from "react"
import type { Metadata } from "next"
import { GeistSans, GeistMono } from "geist/font"
import "./globals.css"
import { Header } from "@/components/header"
import { ScrollingMessage } from "@/components/scrolling-message"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = GeistSans
const geistMono = GeistMono

export const metadata: Metadata = {
  title: "FreeSpeech.Live - Your Voice is Live",
  description:
    "A global social platform where people can propose initiatives, donate, connect skills, and reward contributors.",
  manifest: "/manifest.json",
  themeColor: "#FF0000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-background">
            <Header />
            <ScrollingMessage 
              message="On September 13th, 2025, in the heart of London, over a million voices rose as one. Not just in protest, but in a plea for recognition. These were not faceless numbers—they were builders, doctors, teachers, drivers, engineers, and dreamers. They were the working people who keep our society alive. For too long, their voices have been drowned out by the hum of boardrooms and the quiet deals of power. Successive governments have leaned closer to big business while the will of the people drifts further away. In that widening gap, frustration grows. Anger festers. Trust fractures. But what if anger is only the beginning? What if it's the spark, not the fire? Within every marcher, every overlooked citizen, lies not just a grievance, but a skill. A resource. An idea. Together, those fragments form something unstoppable: the ability to build, not just protest. To create solutions, not just demand them. Freespeech.live is not another social network—it is a digital commons. A place where the ignored become the architects of their future. Here, people pool their skills, share their resources, and vote democratically on the paths that matter most. No waiting for permission. No silencing by hidden agendas. With tools for collaboration, decision-making, and funding, Freespeech.live transforms disillusion into direction. In an age where citizens face prison for words while violent crimes go unpunished, it protects the space for voices to build rather than be silenced. Unite the Kingdom showed the world our numbers. Now it's time to show the world our strength. We are not powerless. We are the builders. And together, we are unstoppable."
              speed={10}
              pauseOnHover={true}
            />
            <main className="pb-20 pt-4">{children}</main>
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
