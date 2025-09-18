"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Reply, MoreHorizontal } from "lucide-react"

// Helper function to format timestamp
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

// Interface for comment data
interface Comment {
  id: number;
  project_id: string | number;
  user_id: string;
  content: string;
  created_at: string;
  likes: number;
  author: {
    name: string;
    avatar: string;
  };
  isLiked: boolean;
}

interface CommentsSectionProps {
  projectId: string | number
  commentsCount: number
}

export function CommentsSection({ projectId, commentsCount: initialCommentsCount }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [submitting, setSubmitting] = useState(false)
  
  // Current user info - in a real app, this would come from auth
  // For now, we'll use a mock user with a valid UUID format
  const currentUser = {
    id: '00000000-0000-0000-0000-000000000000', // Valid UUID format
    name: 'You',
    avatar: '/placeholder-user.jpg'
  }
  
  // Fetch comments from Supabase
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        
        // Fetch comments for this project
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            id,
            project_id,
            user_id,
            content,
            created_at,
            likes,
            users(name, avatar)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        if (commentsError) {
          throw new Error(`Error fetching comments: ${commentsError.message}`);
        }
        
        // Initialize liked comments as an empty array
        let likedComments: { comment_id: number }[] = [];
        
        try {
          // Fetch liked comments for current user
          const { data, error } = await supabase
            .from('comment_likes')
            .select('comment_id')
            .eq('user_id', currentUser.id);
          
          if (!error && data) {
            likedComments = data;
          }
        } catch (likedError) {
          console.error('Error fetching liked comments:', likedError);
        }
        
        // Create a set of liked comment IDs for quick lookup
        const likedCommentIds = new Set(likedComments?.map((like: { comment_id: number }) => like.comment_id) || []);
        
        // Transform comments data
        const formattedComments: Comment[] = commentsData.map((comment: any) => ({
          id: comment.id,
          project_id: comment.project_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          likes: comment.likes || 0,
          author: {
            name: comment.users?.name || 'Anonymous',
            avatar: comment.users?.avatar || '/placeholder.svg?height=32&width=32'
          },
          isLiked: likedCommentIds.has(comment.id)
        }));
        
        setComments(formattedComments);
        setCommentsCount(formattedComments.length);
      } catch (err) {
        console.error('Error in fetchComments:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchComments();
  }, [projectId, currentUser.id]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;
    
    setSubmitting(true);
    
    try {
      // For demo purposes, we'll add the comment to the local state without actually
      // inserting it into Supabase. This allows the feature to work without requiring
      // actual authentication.
      
      // Generate a mock ID for the new comment
      const mockId = Date.now();
      
      // In a real app with authentication, we would do:
      /*
      // Insert comment into Supabase
      const { data, error } = await supabase
        .from('comments')
        .insert({
          project_id: projectId,
          user_id: currentUser.id,
          content: newComment,
          created_at: new Date().toISOString(),
          likes: 0
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error posting comment: ${error.message}`);
      }
      
      const commentId = data.id;
      */
      
      // For demo, use the mock ID
      const commentId = mockId;
      
      // Add new comment to state
      const newCommentObj: Comment = {
        id: commentId,
        project_id: projectId,
        user_id: currentUser.id,
        content: newComment,
        created_at: new Date().toISOString(),
        likes: 0,
        author: {
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        isLiked: false
      };
      
      setComments([newCommentObj, ...comments]);
      setCommentsCount(prev => prev + 1);
      setNewComment("");
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleLikeComment = async (commentId: number) => {
    // Find the comment
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    try {
      // For demo purposes, we'll just update the local state without making
      // actual Supabase calls. This allows the feature to work without requiring
      // actual authentication.
      
      // In a real app with authentication, we would do:
      /*
      if (comment.isLiked) {
        // Unlike: Delete the like from comment_likes
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        // Decrement likes count in comments table
        await supabase
          .from('comments')
          .update({ likes: Math.max(0, comment.likes - 1) })
          .eq('id', commentId);
      } else {
        // Like: Insert a new like into comment_likes
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
        
        // Increment likes count in comments table
        await supabase
          .from('comments')
          .update({ likes: comment.likes + 1 })
          .eq('id', commentId);
      }
      */
      
      // Update local state
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !c.isLiked,
                likes: c.isLiked ? c.likes - 1 : c.likes + 1,
              }
            : c,
        ),
      );
    } catch (err) {
      console.error('Error liking/unliking comment:', err);
    }
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
                      <span className="text-xs text-muted-foreground">{formatTimestamp(comment.created_at)}</span>
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
