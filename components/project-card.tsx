import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Clock, Users } from "lucide-react"
import Link from "next/link"

interface ProjectCardProps {
  project: {
    id: number
    title: string
    summary: string
    category: string
    fundTotal: number
    fundGoal: number
    supporters: number
    timeLeft: string
    creator: {
      name: string
      avatar?: string
    }
    image?: string
    isLiked?: boolean
    commentsCount: number
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progressPercentage = (project.fundTotal / project.fundGoal) * 100

  return (
    <Card className="hover:shadow-md transition-shadow">
      {/* Project Image */}
      {project.image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img src={project.image || "/placeholder.svg"} alt={project.title} className="w-full h-full object-cover" />
        </div>
      )}

      <CardHeader className="pb-3">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={project.creator.avatar || "/placeholder.svg"} />
            <AvatarFallback className="text-xs">{project.creator.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{project.creator.name}</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {project.category}
          </Badge>
        </div>

        {/* Title and Summary */}
        <div>
          <CardTitle className="text-base leading-tight mb-2 line-clamp-2">{project.title}</CardTitle>
          <p className="text-sm text-muted-foreground text-pretty line-clamp-2">{project.summary}</p>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-accent">${project.fundTotal.toLocaleString()}</span>
            <span className="text-muted-foreground">${project.fundGoal.toLocaleString()} goal</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{project.supporters} supporters</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{project.timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href={`/project/${project.id}`} className="flex-1">
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Support Project</Button>
          </Link>
          <Button variant="outline" size="icon" className={project.isLiked ? "text-accent border-accent" : ""}>
            <Heart className={`h-4 w-4 ${project.isLiked ? "fill-current" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" className="relative bg-transparent">
            <MessageCircle className="h-4 w-4" />
            {project.commentsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center font-medium px-1 border border-background">
                {project.commentsCount > 9 ? "9+" : project.commentsCount}
              </span>
            )}
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
