"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

// Proposal types
const PROPOSAL_TYPES = [
  "Platform Feature",
  "Policy",
  "Governance",
]

// Duration options
const DURATION_OPTIONS = [
  { value: "3", label: "3 days" },
  { value: "7", label: "1 week" },
  { value: "14", label: "2 weeks" },
  { value: "30", label: "1 month" },
]

interface VotingOption {
  id: string;
  text: string;
}

export default function SubmitProposalPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState("")
  const supabase = supabaseBrowser()

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setIsAuthenticated(!!data.user)
        
        if (data.user) {
          // Get user profile
          const { data: userData, error } = await supabase
            .from('users')
            .select('name')
            .eq('id', data.user.id)
            .single()
          
          if (!error && userData) {
            setUserName(userData.name)
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      }
    }
    
    checkAuth()
  }, [supabase])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    duration: "",
  })
  const [votingOptions, setVotingOptions] = useState<VotingOption[]>([
    { id: Date.now().toString(), text: "" },
    { id: (Date.now() + 1).toString(), text: "" },
  ])

  const addVotingOption = () => {
    if (votingOptions.length >= 5) {
      return // Limit to 5 options
    }
    setVotingOptions([...votingOptions, { id: Date.now().toString(), text: "" }])
  }

  const updateVotingOption = (id: string, text: string) => {
    setVotingOptions(votingOptions.map(option => 
      option.id === id ? { ...option, text } : option
    ))
  }

  const removeVotingOption = (id: string) => {
    if (votingOptions.length <= 2) {
      return // Minimum 2 options
    }
    setVotingOptions(votingOptions.filter(option => option.id !== id))
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Platform Feature":
        return "bg-blue-500 text-white"
      case "Policy":
        return "bg-accent text-accent-foreground"
      case "Governance":
        return "bg-purple-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleSubmit = async () => {
    // Validate form
    if (!formData.title.trim()) {
      setSubmitError("Please enter a proposal title")
      return
    }
    if (!formData.description.trim()) {
      setSubmitError("Please enter a proposal description")
      return
    }
    if (!formData.type) {
      setSubmitError("Please select a proposal type")
      return
    }
    if (!formData.duration) {
      setSubmitError("Please select a poll duration")
      return
    }

    // Validate voting options
    const validOptions = votingOptions.filter(option => option.text.trim() !== "")
    if (validOptions.length < 2) {
      setSubmitError("Please provide at least 2 voting options")
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      // Calculate end date based on duration
      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(now.getDate() + parseInt(formData.duration))

      // Create poll in Supabase
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          creator_id: userData.user.id,
          featured: false,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .select('id')
        .single()

      if (pollError) {
        throw new Error(`Error creating poll: ${pollError.message}`)
      }

      // Save poll options
      const pollId = pollData.id
      const optionsData = validOptions.map(option => ({
        poll_id: pollId,
        text: option.text
      }))

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData)

      if (optionsError) {
        throw new Error(`Error saving poll options: ${optionsError.message}`)
      }

      setSubmitSuccess(true)
      
      // Redirect after a delay to show success message
      setTimeout(() => {
        router.push('/vote')
      }, 3000)
    } catch (error) {
      console.error("Error submitting proposal:", error)
      setSubmitError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <Link href="/vote">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Submit Proposal</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="px-4 max-w-md mx-auto pb-6">
        {submitSuccess ? (
          <Card className="mt-6">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Proposal Submitted!</h2>
              <p className="text-muted-foreground mb-4">
                Thank you for your contribution. Your proposal has been submitted for review by the community moderators.
                You will be notified when it's approved and published for voting.
              </p>
              <Button asChild>
                <Link href="/vote">Return to Voting</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Share your idea for platform improvements or policy changes
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Proposal Title</Label>
                  <Input
                    id="title"
                    placeholder="Give your proposal a clear, concise title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Proposal Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your proposal in detail. What problem does it solve? Why is it important?"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Proposal Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select proposal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPOSAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getTypeColor(type)}`}>{type}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose the category that best fits your proposal
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Poll Duration</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select poll duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    How long should the community have to vote on this proposal?
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voting Options</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Define the choices voters will have
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {votingOptions.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) => updateVotingOption(option.id, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVotingOption(option.id)}
                        disabled={votingOptions.length <= 2}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addVotingOption}
                  disabled={votingOptions.length >= 5}
                  className="w-full gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Minimum 2, maximum 5 options
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This is how your proposal will appear to voters
                </p>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{userName || "Your Name"}</span>
                        {formData.type && (
                          <Badge className={`text-xs ${getTypeColor(formData.type)}`}>{formData.type}</Badge>
                        )}
                      </div>
                      <h3 className="font-medium">{formData.title || "Your Proposal Title"}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formData.description || "Your proposal description will appear here..."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    {votingOptions.map((option, index) => (
                      <div
                        key={option.id}
                        className="border rounded-md p-3 text-sm"
                      >
                        {option.text || `Option ${index + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{submitError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/vote')}
                className="flex-1 bg-transparent"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Proposal"}
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-accent" />
                What happens next?
              </h3>
              <p className="text-sm text-muted-foreground">
                After submission, your proposal will be reviewed by community moderators to ensure it meets our guidelines.
                Once approved, it will be published as a poll for the community to vote on.
                This process typically takes 1-2 business days.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
