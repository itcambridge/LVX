"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { DonationPanel } from "@/components/donation-panel"
import { CommentsSection } from "@/components/comments-section"
import { RolesNeeded } from "@/components/roles-needed"
import {
  ArrowLeft,
  Heart,
  Share2,
  Calendar,
  MapPin,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock project data - in real app would fetch from API
const projectData = {
  id: 1,
  title: "Clean Water for Rural Communities",
  summary: "Building sustainable water systems in underserved areas across three villages in Kenya",
  description: `This project aims to provide clean, accessible water to three rural villages in Kenya that currently lack reliable water infrastructure. 

Our approach includes:
• Installing solar-powered water pumps
• Building water storage tanks and distribution systems  
• Training local technicians for maintenance
• Establishing community water management committees

The impact will be immediate and long-lasting, serving over 2,500 people including 800 children who currently walk hours daily to collect water from unsafe sources.

All funds will go directly to materials, equipment, and local labor. We've partnered with established NGOs and have all necessary permits in place.`,
  category: "Environment",
  fundTotal: 12500,
  fundGoal: 25000,
  supporters: 89,
  timeLeft: "12 days left",
  endDate: "2024-02-15",
  location: "Machakos County, Kenya",
  creator: {
    name: "Sarah Chen",
    avatar: "/placeholder.svg?height=64&width=64",
    bio: "Water engineer with 8 years experience in rural development projects across East Africa.",
    verified: true,
  },
  images: ["/clean-water-project.png", "/water-well-construction.jpg", "/community-meeting-about-water-project.jpg"],
  milestones: [
    { title: "Site Survey & Permits", completed: true, date: "2024-01-05" },
    { title: "Equipment Procurement", completed: true, date: "2024-01-15" },
    { title: "Well Drilling", completed: false, date: "2024-02-01" },
    { title: "Pump Installation", completed: false, date: "2024-02-10" },
    { title: "Community Training", completed: false, date: "2024-02-20" },
  ],
  updates: [
    {
      id: 1,
      date: "2024-01-20",
      title: "Equipment Arrived Successfully",
      content:
        "All solar pumps and storage tanks have arrived at the project site. Local team is ready to begin installation.",
    },
    {
      id: 2,
      date: "2024-01-15",
      title: "Community Meeting Held",
      content:
        "Met with village leaders and community members. Everyone is excited and committed to the project success.",
    },
  ],
  isLiked: true,
  commentsCount: 23,
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [showDonationPanel, setShowDonationPanel] = useState(false)
  const [activeTab, setActiveTab] = useState("about")

  const progressPercentage = (projectData.fundTotal / projectData.fundGoal) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className={projectData.isLiked ? "text-accent" : ""}>
              <Heart className={`h-5 w-5 ${projectData.isLiked ? "fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-md mx-auto pb-6">
        {/* Project Images */}
        <div className="aspect-video w-full overflow-hidden rounded-lg mb-4">
          <Image
            src={projectData.images[0] || "/placeholder.svg"}
            alt={projectData.title}
            width={400}
            height={225}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Project Header */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={projectData.creator.avatar || "/placeholder.svg"} />
              <AvatarFallback>{projectData.creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{projectData.creator.name}</span>
                {projectData.creator.verified && <CheckCircle className="h-4 w-4 text-accent" />}
              </div>
              <p className="text-sm text-muted-foreground">{projectData.creator.bio}</p>
            </div>
            <Badge variant="secondary">{projectData.category}</Badge>
          </div>

          <div>
            <h1 className="text-xl font-bold mb-2 text-balance">{projectData.title}</h1>
            <p className="text-muted-foreground text-pretty">{projectData.summary}</p>
          </div>

          {/* Project Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{projectData.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Ends {projectData.endDate}</span>
            </div>
          </div>
        </div>

        {/* Funding Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-bold text-accent">${projectData.fundTotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    raised of ${projectData.fundGoal.toLocaleString()} goal
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{Math.round(progressPercentage)}%</div>
                  <div className="text-sm text-muted-foreground">funded</div>
                </div>
              </div>

              <Progress value={progressPercentage} className="h-3" />

              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{projectData.supporters} supporters</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{projectData.timeLeft}</span>
                </div>
              </div>

              <Button
                onClick={() => setShowDonationPanel(true)}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                size="lg"
              >
                Support This Project
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Project Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {projectData.description.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-3 text-sm leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Project Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectData.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {milestone.completed ? (
                        <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1">
                        <div
                          className={`font-medium ${milestone.completed ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {milestone.title}
                        </div>
                        <div className="text-sm text-muted-foreground">Target: {milestone.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="updates" className="space-y-4">
            {projectData.updates.map((update) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{update.title}</CardTitle>
                    <span className="text-sm text-muted-foreground">{update.date}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{update.content}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="roles">
            <RolesNeeded projectId={projectData.id} />
          </TabsContent>

          <TabsContent value="comments">
            <CommentsSection projectId={projectData.id} commentsCount={projectData.commentsCount} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Donation Panel */}
      {showDonationPanel && <DonationPanel project={projectData} onClose={() => setShowDonationPanel(false)} />}
    </div>
  )
}
