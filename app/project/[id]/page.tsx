"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
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

// Default project data structure
interface ProjectData {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  category: string;
  fundTotal: number;
  fundGoal: number;
  supporters: number;
  timeLeft: string;
  endDate: string | null;
  location: string | null;
  creator: {
    name: string;
    avatar: string | null;
    bio: string | null;
    verified: boolean;
  };
  images: string[];
  milestones: {
    title: string;
    completed: boolean;
    date: string;
  }[];
  updates: {
    id: number;
    date: string;
    title: string;
    content: string;
  }[];
  isLiked: boolean;
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

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [showDonationPanel, setShowDonationPanel] = useState(false)
  const [activeTab, setActiveTab] = useState("comments")
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjectData() {
      try {
        setLoading(true);
        
        // Fetch project data
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select(`
            *,
            categories(name)
          `)
          .eq('id', params.id)
          .single();
        
        if (projectError) {
          throw new Error(`Error fetching project: ${projectError.message}`);
        }
        
        if (!project) {
          throw new Error('Project not found');
        }
        
        // Fetch project images
        const { data: images, error: imagesError } = await supabase
          .from('project_images')
          .select('image_url')
          .eq('project_id', project.id)
          .order('display_order', { ascending: true });
        
        if (imagesError) {
          console.error('Error fetching project images:', imagesError);
        }
        
        // Fetch project milestones
        const { data: milestones, error: milestonesError } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', project.id)
          .order('target_date', { ascending: true });
        
        if (milestonesError) {
          console.error('Error fetching project milestones:', milestonesError);
        }
        
        // Fetch project updates
        const { data: updates, error: updatesError } = await supabase
          .from('project_updates')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false });
        
        if (updatesError) {
          console.error('Error fetching project updates:', updatesError);
        }
        
        // Fetch creator info
        const { data: creator, error: creatorError } = await supabase
          .from('users')
          .select('*')
          .eq('id', project.creator_id || '')
          .single();
        
        if (creatorError && creatorError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error fetching creator:', creatorError);
        }
        
        // Transform data to match expected format
        const formattedProject: ProjectData = {
          id: project.id.toString(),
          title: project.title,
          summary: project.summary,
          description: project.description,
          category: project.categories?.name || 'Uncategorized',
          fundTotal: project.fund_total || 0,
          fundGoal: project.fund_goal || 0,
          supporters: project.supporters || 0,
          timeLeft: project.end_date ? calculateTimeLeft(project.end_date) : 'Ongoing',
          endDate: project.end_date,
          location: project.location,
          creator: {
            name: creator?.name || 'Anonymous',
            avatar: creator?.avatar || '/placeholder.svg?height=64&width=64',
            bio: creator?.bio || null,
            verified: creator?.verified || false,
          },
          images: images?.map((img: any) => img.image_url) || ['/placeholder.jpg'],
          milestones: milestones?.map((m: any) => ({
            title: m.title,
            completed: m.completed || false,
            date: m.target_date ? new Date(m.target_date).toISOString().split('T')[0] : '',
          })) || [],
          updates: updates?.map((u: any, index: number) => ({
            id: index + 1,
            date: new Date(u.created_at).toISOString().split('T')[0],
            title: u.title,
            content: u.content,
          })) || [],
          isLiked: false, // Would need to check against current user
          commentsCount: 0, // Would need to count comments
        };
        
        setProjectData(formattedProject);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjectData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Error Loading Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'Project not found'}</p>
            <Button asChild className="mt-4">
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <span>Ends {projectData.endDate ? new Date(projectData.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Ongoing'}</span>
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

              <Progress value={Math.min(progressPercentage, 100)} className="h-3" />

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
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
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
                  {(projectData.description || '').split("\n").map((paragraph, index) => (
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
      {showDonationPanel && <DonationPanel 
        project={{
          id: parseInt(projectData.id) || 0,
          title: projectData.title,
          fundGoal: projectData.fundGoal,
          fundTotal: projectData.fundTotal
        }} 
        onClose={() => setShowDonationPanel(false)} 
      />}
    </div>
  )
}
