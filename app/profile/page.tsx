"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Edit, Settings, Heart, TrendingUp, Award } from "lucide-react"

// Mock user data
const userData = {
  name: "Sarah Chen",
  bio: "Water engineer passionate about sustainable development and community empowerment. 8+ years experience in rural infrastructure projects.",
  avatar: "/placeholder.svg?height=80&width=80",
  location: "San Francisco, CA",
  joinDate: "January 2024",
  verified: true,
  skills: ["Project Management", "Water Engineering", "Community Organizing", "Fundraising", "Technical Writing"],
  stats: {
    projectsCreated: 3,
    projectsSupported: 12,
    totalDonated: 2450,
    impactScore: 89,
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
              <p className="text-sm text-muted-foreground">Joined {userData.joinDate}</p>
            </div>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">Donated $100 to Digital Literacy for Seniors</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">Updated Clean Water project milestone</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-muted rounded-full shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">Applied for Community Coordinator role</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {/* My Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Projects ({myProjects.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{project.title}</h4>
                    <Badge className={`text-xs ${getStatusColor(project.status)}`}>{project.status}</Badge>
                  </div>
                  {project.status === "Active" && (
                    <div className="space-y-2">
                      <Progress value={(project.fundTotal / project.fundGoal) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${project.fundTotal.toLocaleString()} raised</span>
                        <span>{project.daysLeft} days left</span>
                      </div>
                    </div>
                  )}
                  {project.status === "Completed" && (
                    <div className="text-xs text-muted-foreground">
                      Successfully funded • {project.supporters} supporters
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Supported Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supported Projects ({supportedProjects.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supportedProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{project.title}</h4>
                    <div className="text-xs text-accent font-medium">${project.donated}</div>
                  </div>
                  <div className="space-y-2">
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.progress}% funded</span>
                      <Badge className={`text-xs ${getStatusColor(project.status)}`}>{project.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {/* Role Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roleApplications.map((application) => (
                <div key={application.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{application.role}</h4>
                      <p className="text-xs text-muted-foreground">{application.projectTitle}</p>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(application.status)}`}>{application.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Applied {application.appliedDate}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
