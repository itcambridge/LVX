"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Edit, Settings, Heart, TrendingUp, Award, Loader2, X } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Interface for user data
interface UserData {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  location: string | null;
  join_date: string;
  verified: boolean;
  skills: string[];
  stats: {
    projectsCreated: number;
    projectsSupported: number;
    totalDonated: number;
    impactScore: number;
  };
}

// Default user data
const defaultUserData: UserData = {
  id: "",
  name: "Loading...",
  bio: null,
  avatar: null,
  location: null,
  join_date: new Date().toISOString(),
  verified: false,
  skills: [],
  stats: {
    projectsCreated: 0,
    projectsSupported: 0,
    totalDonated: 0,
    impactScore: 0,
  },
}

const myProjects = [
  {
    id: 1,
    title: "Clean Water for Rural Communities",
    status: "Active",
    fundTotal: 12500,
    fundGoal: 25000,
    supporters: 89,
    daysLeft: 12,
  },
  {
    id: 2,
    title: "Solar Power for Schools",
    status: "Completed",
    fundTotal: 18000,
    fundGoal: 18000,
    supporters: 156,
    daysLeft: 0,
  },
  {
    id: 3,
    title: "Community Health Training",
    status: "Planning",
    fundTotal: 0,
    fundGoal: 8000,
    supporters: 0,
    daysLeft: 30,
  },
]

const supportedProjects = [
  {
    id: 4,
    title: "Digital Literacy for Seniors",
    donated: 100,
    status: "Active",
    progress: 55,
  },
  {
    id: 5,
    title: "Local Food Security Initiative",
    donated: 250,
    status: "Active",
    progress: 62,
  },
  {
    id: 6,
    title: "Mental Health Support Network",
    donated: 75,
    status: "Completed",
    progress: 100,
  },
]

const roleApplications = [
  {
    id: 1,
    projectTitle: "Urban Garden Network",
    role: "Community Coordinator",
    status: "Pending",
    appliedDate: "2024-01-15",
  },
  {
    id: 2,
    projectTitle: "Tech Skills Workshop",
    role: "Technical Mentor",
    status: "Accepted",
    appliedDate: "2024-01-10",
  },
  {
    id: 3,
    projectTitle: "Youth Leadership Program",
    role: "Program Advisor",
    status: "Declined",
    appliedDate: "2024-01-05",
  },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    bio: "",
    location: "",
    skills: [] as string[]
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = supabaseBrowser()

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        // Get authenticated user
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) {
          router.push('/login')
          return
        }

        // Get user profile from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
          return
        }

        // Get user skills
        const { data: userSkillsData, error: skillsError } = await supabase
          .from('user_skills')
          .select('skill_id')
          .eq('user_id', authData.user.id)

        if (skillsError) {
          console.error('Error fetching user skills:', skillsError)
        }

        // Get skill names from skill IDs
        let skills: string[] = []
        if (userSkillsData && userSkillsData.length > 0) {
          const skillIds = userSkillsData.map(item => item.skill_id)
          const { data: skillsData } = await supabase
            .from('skills')
            .select('name')
            .in('id', skillIds)
          
          skills = skillsData?.map(skill => skill.name) || []
        }

        // Format join date
        const joinDate = userData.join_date 
          ? new Date(userData.join_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long'
            })
          : 'Recently'

        // Set user data
        setUserData({
          id: userData.id,
          name: userData.name || 'Anonymous User',
          bio: userData.bio,
          avatar: userData.avatar,
          location: userData.location,
          join_date: joinDate,
          verified: userData.verified || false,
          skills: skills.filter(Boolean), // Remove empty strings
          stats: {
            // For now, use mock stats
            projectsCreated: 0,
            projectsSupported: 0,
            totalDonated: 0,
            impactScore: 0,
          }
        })

        // Initialize edit form data
        setEditFormData({
          name: userData.name || '',
          bio: userData.bio || '',
          location: userData.location || '',
          skills: skills.filter(Boolean)
        })
      } catch (error) {
        console.error('Error in fetchUserData:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, router])

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setSaving(true)
      
      // Call the profile API to update the user data
      const response = await fetch('/api/me/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: editFormData.name,
          bio: editFormData.bio,
          location: editFormData.location,
          skills: editFormData.skills,
          // Keep the existing avatar
          avatarUrl: userData.avatar
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Update the local state with the new data
      setUserData(prev => ({
        ...prev,
        name: editFormData.name,
        bio: editFormData.bio,
        location: editFormData.location,
        skills: editFormData.skills
      }))

      // Close the dialog
      setEditDialogOpen(false)
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  // Handle skill toggle in edit form
  const handleSkillToggle = (skill: string) => {
    setEditFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-accent text-accent-foreground"
      case "Completed":
        return "bg-green-500 text-white"
      case "Planning":
        return "bg-blue-500 text-white"
      case "Pending":
        return "bg-yellow-500 text-white"
      case "Accepted":
        return "bg-green-500 text-white"
      case "Declined":
        return "bg-red-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="px-4 max-w-md mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={userData.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">{userData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{userData.name}</h1>
                {userData.verified && <Award className="h-5 w-5 text-accent" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{userData.location}</p>
              <p className="text-sm text-muted-foreground">Joined {userData.join_date}</p>
            </div>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editFormData.bio}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editFormData.location}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {/* Show existing skills with toggle functionality */}
                      {editFormData.skills.map(skill => (
                        <Badge 
                          key={skill} 
                          variant="default" 
                          className="cursor-pointer bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => handleSkillToggle(skill)}
                        >
                          {skill}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                      
                      {/* Show some suggested skills */}
                      <div className="w-full mt-2">
                        <Label className="text-xs">Suggested Skills</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {["Community Organizing", "Fundraising", "Project Management", "Writing", "Design"].map(skill => (
                            !editFormData.skills.includes(skill) && (
                              <Badge 
                                key={skill} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => handleSkillToggle(skill)}
                              >
                                {skill}
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateProfile} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <p className="text-sm leading-relaxed mb-4 text-pretty">{userData.bio}</p>

          {/* Skills */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-1">
              {userData.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-accent">{userData.stats.impactScore}</div>
              <div className="text-xs text-muted-foreground">Impact Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-accent">${userData.stats.totalDonated.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Donated</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-2xl font-bold">{userData.stats.projectsCreated}</span>
            </div>
            <div className="text-xs text-muted-foreground">Projects Created</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-accent" />
              <span className="text-2xl font-bold">{userData.stats.projectsSupported}</span>
            </div>
            <div className="text-xs text-muted-foreground">Projects Supported</div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start bg-transparent"
            onClick={() => setEditDialogOpen(true)}
          >
            Edit Profile
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            Notification Preferences
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            Privacy Settings
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
