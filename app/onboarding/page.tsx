"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, Upload, X } from "lucide-react"
import Image from "next/image"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const SUGGESTED_SKILLS = [
  "Community Organizing",
  "Social Media",
  "Fundraising",
  "Event Planning",
  "Writing",
  "Design",
  "Photography",
  "Legal Aid",
  "Translation",
  "Teaching",
  "Healthcare",
  "Technology",
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    skills: [] as string[],
    avatar: "",
  })
  const [loading, setLoading] = useState(false)
  const supabase = supabaseBrowser()
  const router = useRouter()
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        // If user is authenticated, move to step 2
        setStep(2)
        // Pre-fill name if available
        if (data.user.user_metadata?.name) {
          setFormData(prev => ({ 
            ...prev, 
            name: data.user.user_metadata.name as string,
            avatar: data.user.user_metadata.avatar_url as string || ""
          }))
        }
      }
    }
    
    checkUser()
  }, [])

  const callbackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "/auth/callback"

  const handleSocialLogin = async (provider: string) => {
    setLoading(true)
    try {
      await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase() as any,
        options: { redirectTo: callbackUrl }
      })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      setLoading(false)
    }
  }

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }))
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      // Get current user
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        throw new Error("User not authenticated")
      }
      
      // Update profile in database
      const response = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.name,
          bio: formData.bio,
          skills: formData.skills,
          avatarUrl: formData.avatar
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to update profile")
      }
      
      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Error completing onboarding:", error)
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Welcome */}
          <div className="text-center">
            <Image src="/logo.png" alt="FreeSpeech.Live" width={160} height={60} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Your Voice is Live</h1>
            <p className="text-muted-foreground text-balance">Join thousands of activists making real change happen</p>
          </div>

          {/* Social Login Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleSocialLogin("google")}
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                disabled={loading}
              >
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  G
                </div>
                {loading ? "Connecting..." : "Continue with Google"}
              </Button>

              {/* Facebook and Apple authentication can be added later */}
              {/* <Button
                onClick={() => handleSocialLogin("facebook")}
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                disabled
              >
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  f
                </div>
                Continue with Facebook (Coming Soon)
              </Button>

              <Button
                onClick={() => handleSocialLogin("apple")}
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                disabled
              >
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold"></div>
                Continue with Apple (Coming Soon)
              </Button> */}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Optional</span>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {loading ? "Please wait..." : "Continue without signing in"}
              </Button>
            </CardContent>
          </Card>

          {/* Trust Message */}
          <div className="text-center text-sm text-muted-foreground">
            <p>We respect your privacy. No spam, ever.</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div className="flex-1 h-1 bg-accent rounded" />
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tell Us About Yourself</CardTitle>
              <p className="text-sm text-muted-foreground">
                Help others know who you are and what you bring to the movement
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={formData.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-muted">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="How should others address you?"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">About You (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Share your story, passions, or what drives you to create change..."
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button onClick={() => setStep(3)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div className="flex-1 h-1 bg-accent rounded" />
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Skills & Interests</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select skills you can contribute to projects. This helps match you with relevant opportunities.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.map((skill) => {
                  const isSelected = formData.skills.includes(skill)
                  return (
                    <Badge
                      key={skill}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-accent text-accent-foreground hover:bg-accent/90" : "hover:bg-muted"
                      }`}
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  )
                })}
              </div>

              {formData.skills.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Selected {formData.skills.length} skill{formData.skills.length !== 1 ? "s" : ""}
                </div>
              )}

              <div className="pt-4 space-y-3">
                <Button 
                  onClick={handleComplete} 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Join the Movement"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                <Button 
                  onClick={handleComplete} 
                  variant="ghost" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Skip for Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
