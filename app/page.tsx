"use client"

import { useState, useEffect } from "react"
import { Database } from "@/types/supabase"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ProjectCard } from "@/components/project-card"
import { CategoryFilter } from "@/components/category-filter"
import { Search, TrendingUp, Filter } from "lucide-react"

// Define types for our project data to match ProjectCard component
interface Project {
  id: string;
  title: string;
  summary: string;
  category: string;
  fundTotal: number;
  fundGoal: number;
  supporters: number;
  timeLeft: string;
  creator: {
    name: string;
    avatar?: string;
  };
  image?: string;
  isLiked?: boolean;
  commentsCount: number;
}

// Helper function to calculate time left
function calculateTimeLeft(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} days left`;
}

// Function to fetch projects from Supabase
async function fetchProjects(): Promise<Project[]> {
  // Type for the raw project data from Supabase
  type RawProject = {
    id: string;
    title: string;
    summary: string;
    fund_total: number;
    fund_goal: number;
    supporters: number;
    end_date: string | null;
    categories: { id: string; name: string } | null;
    creator_id: string | null;
    users: { name: string; avatar: string | null } | null;
  };
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      summary,
      fund_total,
      fund_goal,
      supporters,
      end_date,
      categories(id, name),
      creator_id,
      users!creator_id(name, avatar)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  // Skip comment counts for now due to .group() method not being supported
  // We'll just use a default value of 0 for commentsCount
  console.log('Skipping comment counts due to .group() method not being supported');
  
  // Get project IDs for image query
  const projectIds = data.map((project: any) => project.id);

  // Get project images - handle case where .in() method might not be supported
  let projectImages = [];
  try {
    const { data: images, error: imageError } = await supabase
      .from('project_images')
      .select('project_id, image_url')
      .in('project_id', projectIds)
      .order('display_order', { ascending: true });

    if (imageError) {
      throw imageError;
    }
    
    projectImages = images;
  } catch (error) {
    console.error('Error fetching project images with .in():', error);
    console.log('Skipping project images due to .in() method not being supported');
    // We'll use default images instead
  }

  // Transform the data to match the expected format
  return data.map((project: any) => {
    // Use a default comment count of 0 for now
    const commentCount = 0;

    // Find image for this project
    const imageData = projectImages?.find((img: any) => img.project_id === project.id);
    const imagePath = imageData?.image_url || "/placeholder.jpg";

    return {
      id: project.id, // Keep the original UUID string
      title: project.title,
      summary: project.summary,
      category: project.categories?.name || "Uncategorized",
      fundTotal: project.fund_total || 0,
      fundGoal: project.fund_goal || 0,
      supporters: project.supporters || 0,
      timeLeft: project.end_date ? calculateTimeLeft(project.end_date) : "Ongoing",
      creator: { 
        name: project.users?.name || "Anonymous", 
        avatar: project.users?.avatar || "/placeholder.svg?height=32&width=32" 
      },
      image: imagePath,
      isLiked: false, // This would need to be determined based on the current user
      commentsCount: commentCount,
    };
  });
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch projects when component mounts
  useEffect(() => {
    async function loadProjects() {
      try {
        const projectData = await fetchProjects();
        setProjects(projectData);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProjects();
  }, []);

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

        {loading ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">Loading projects...</p>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
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
