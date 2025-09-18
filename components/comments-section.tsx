"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Reply, MoreHorizontal } from "lucide-react"

// Mock comments data
const mockComments = [
  {
    id: 1,
    author: { name: "Maria Santos", avatar: "/placeholder.svg?height=32&width=32" },
    content:
      "This is exactly what our community needs! I've seen firsthand how lack of clean water affects families. Thank you for taking action.",
    timestamp: "2 hours ago",
    likes: 12,
    isLiked: false,
  },
  {
    id: 2,
    author: { name: "James Wilson", avatar: "/placeholder.svg?height=32&width=32" },
    content:
      "Great project! I work in water engineering too and your approach looks solid. Have you considered adding water quality testing equipment?",
    timestamp: "5 hours ago",
    likes: 8,
    isLiked: true,
  },
  {
    id: 3,
    author: { name: "Aisha Mohamed", avatar: "/placeholder.svg?height=32&width=32" },
    content: "Donated $50. Every child deserves access to clean water. Keep up the amazing work! 💧",
    timestamp: "1 day ago",
    likes: 15,
    isLiked: false,
  },
]

interface CommentsSectionProps {
  projectId: string | number
  commentsCount: number
}

export function CommentsSection({ projectId, commentsCount }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState(mockComments)

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    const comment = {
      id: comments.length + 1,
      author: { name: "You", avatar: "/placeholder.svg?height=32&width=32" },
      content: newComment,
      timestamp: "Just now",
      likes: 0,
      isLiked: false,
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  const handleLikeComment = (commentId: number) => {
    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment,
      ),
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            placeholder="Share your thoughts or ask questions..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {commentsCount} comment{commentsCount !== 1 ? "s" : ""}
            </span>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{comment.author.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-sm leading-relaxed">{comment.content}</p>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-auto p-1 gap-1 ${comment.isLiked ? "text-accent" : "text-muted-foreground"}`}
                      onClick={() => handleLikeComment(comment.id)}
                    >
                      <Heart className={`h-3 w-3 ${comment.isLiked ? "fill-current" : ""}`} />
                      <span className="text-xs">{comment.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-auto p-1 gap-1 text-muted-foreground">
                      <Reply className="h-3 w-3" />
                      <span className="text-xs">Reply</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
