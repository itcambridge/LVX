import type React from "react"
import type { Metadata } from "next"
import { GeistSans, GeistMono } from "geist/font"
import "./globals.css"
import { Header } from "@/components/header"
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
            <main className="pb-20 pt-4">{children}</main>
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
