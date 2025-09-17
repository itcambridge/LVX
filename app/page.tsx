"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ProjectCard } from "@/components/project-card"
import { CategoryFilter } from "@/components/category-filter"
import { Search, TrendingUp, Filter } from "lucide-react"

// Enhanced mock data
const projects = [
  {
    id: 1,
    title: "Clean Water for Rural Communities",
    summary: "Building sustainable water systems in underserved areas across three villages in Kenya",
    category: "Environment",
    fundTotal: 12500,
    fundGoal: 25000,
    supporters: 89,
    timeLeft: "12 days left",
    creator: { name: "Sarah Chen", avatar: "/placeholder.svg?height=32&width=32" },
    image: "/clean-water-project.png",
    isLiked: true,
    commentsCount: 23,
  },
  {
    id: 2,
    title: "Digital Literacy for Seniors",
    summary: "Teaching essential tech skills to elderly community members to bridge the digital divide",
    category: "Education",
    fundTotal: 8200,
    fundGoal: 15000,
    supporters: 156,
    timeLeft: "8 days left",
    creator: { name: "Marcus Johnson", avatar: "/placeholder.svg?height=32&width=32" },
    image: "/seniors-learning-computers.jpg",
    isLiked: false,
    commentsCount: 45,
  },
  {
    id: 3,
    title: "Local Food Security Initiative",
    summary: "Creating community gardens and food distribution networks in underserved neighborhoods",
    category: "Community",
    fundTotal: 18750,
    fundGoal: 30000,
    supporters: 203,
    timeLeft: "15 days left",
    creator: { name: "Elena Rodriguez", avatar: "/placeholder.svg?height=32&width=32" },
    image: "/community-garden.png",
    isLiked: false,
    commentsCount: 67,
  },
  {
    id: 4,
    title: "Mental Health Support Network",
    summary: "Establishing peer support groups and counseling services for young adults",
    category: "Healthcare",
    fundTotal: 22100,
    fundGoal: 35000,
    supporters: 178,
    timeLeft: "20 days left",
    creator: { name: "Dr. Aisha Patel", avatar: "/placeholder.svg?height=32&width=32" },
    image: "/mental-health-support-group.jpg",
    isLiked: true,
    commentsCount: 34,
  },
]

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProjects = projects.filter((project) => {
    const matchesCategory = selectedCategory === "all" || project.category.toLowerCase() === selectedCategory
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="px-4 max-w-md mx-auto space-y-6">
      {/* Hero Section */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Your Voice is Live</h1>
        <p className="text-muted-foreground text-balance">
          Join the movement. Fund real change. Make your voice heard.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-accent">1,247</div>
            <div className="text-xs text-muted-foreground">Active Projects</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-accent">$2.1M</div>
            <div className="text-xs text-muted-foreground">Total Funded</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-accent">45K</div>
            <div className="text-xs text-muted-foreground">Voices United</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Category Filter */}
      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {selectedCategory === "all"
              ? "Trending Projects"
              : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Projects`}
          </h2>
          <TrendingUp className="h-5 w-5 text-accent" />
        </div>

        {filteredProjects.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No projects found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <Card className="bg-accent text-accent-foreground">
        <CardContent className="text-center py-6">
          <h3 className="font-bold mb-2">Ready to Make Change?</h3>
          <p className="text-sm mb-4 text-accent-foreground/90">Start your own project and rally your community</p>
          <Button variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Create Project
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
