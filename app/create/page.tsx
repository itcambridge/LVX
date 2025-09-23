"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CreateProjectPage() {
  const router = useRouter()
  
  // Redirect to the new post creation page
  useEffect(() => {
    router.push('/post/create')
  }, [router])
  
  // Show a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to new project creation flow...</p>
    </div>
  )
}
