"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, Clock, Users, TrendingUp, AlertCircle } from "lucide-react"

// Types for polls
interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface PollCreator {
  id: string;
  name: string;
  avatar: string | null;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  type: string;
  creator: PollCreator;
  options: PollOption[];
  totalVotes: number;
  timeLeft: string;
  hasVoted: boolean;
  userVote?: string;
  featured: boolean;
  endDate: Date;
}

interface CompletedPoll {
  id: string;
  title: string;
  type: string;
  winner: string;
  completedDate: string;
  totalVotes: number;
}

export default function VotePage() {
  const [activePolls, setActivePolls] = useState<Poll[]>([])
  const [completedPolls, setCompletedPolls] = useState<CompletedPoll[]>([])
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [votingStats, setVotingStats] = useState({
    activeCount: 0,
    totalVotes: 0,
    participation: 0
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const supabase = supabaseBrowser()

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      setIsAuthenticated(!!data.user)
    }
    checkAuth()
  }, [supabase])

  // Fetch polls from Supabase
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true)
        
        // Get current user if authenticated
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id
        
        // Fetch active polls (end_date is in the future or null)
        const { data: pollsData, error: pollsError } = await supabase
          .from('polls')
          .select(`
            id, 
            title, 
            description, 
            type, 
            featured,
            start_date,
            end_date,
            creator_id
          `)
          .gt('end_date', new Date().toISOString())
          .order('featured', { ascending: false })
          .order('end_date', { ascending: true })
        
        if (pollsError) {
          console.error('Error fetching polls:', pollsError)
          return
        }

        // Fetch poll options for each poll
        const pollsWithOptions = await Promise.all(pollsData.map(async (poll) => {
          // Get poll options
          const { data: optionsData, error: optionsError } = await supabase
            .from('poll_options')
            .select('id, text')
            .eq('poll_id', poll.id)
          
          if (optionsError) {
            console.error('Error fetching poll options:', optionsError)
            return null
          }

          // Get poll results
          const { data: resultsData, error: resultsError } = await supabase
            .rpc('get_poll_results', { poll_id: poll.id })
          
          if (resultsError) {
            console.error('Error fetching poll results:', resultsError)
            return null
          }

          // Get creator info
          const { data: creatorData, error: creatorError } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', poll.creator_id)
            .single()
          
          if (creatorError) {
            console.error('Error fetching creator:', creatorError)
            return null
          }

          // Check if user has voted
          let userVote = null
          let hasVoted = false
          
          if (userId) {
            const { data: voteData, error: voteError } = await supabase
              .from('votes')
              .select('option_id')
              .eq('poll_id', poll.id)
              .eq('user_id', userId)
              .single()
            
            if (!voteError && voteData) {
              hasVoted = true
              userVote = voteData.option_id
            }
          }

          // Calculate time left
          const endDate = new Date(poll.end_date)
          const now = new Date()
          const diffTime = Math.abs(endDate.getTime() - now.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          const timeLeft = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`

          // Calculate total votes
          const totalVotes = resultsData.reduce((sum: number, option: any) => sum + Number(option.votes), 0)

          // Format options with votes and percentages
          const options = optionsData.map((option) => {
            const result = resultsData.find((r: any) => r.option_id === option.id)
            return {
              id: option.id,
              text: option.text,
              votes: result ? Number(result.votes) : 0,
              percentage: result ? Number(result.percentage) : 0
            }
          })

          return {
            id: poll.id,
            title: poll.title,
            description: poll.description,
            type: poll.type,
            creator: {
              id: creatorData.id,
              name: creatorData.name,
              avatar: creatorData.avatar
            },
            options,
            totalVotes,
            timeLeft,
            hasVoted,
            userVote,
            featured: poll.featured,
            endDate
          }
        }))

        // Filter out null values (in case of errors)
        const validPolls = pollsWithOptions.filter(Boolean) as Poll[]
        setActivePolls(validPolls)

        // Fetch completed polls
        const { data: completedData, error: completedError } = await supabase
          .from('polls')
          .select(`
            id, 
            title, 
            type, 
            end_date
          `)
          .lt('end_date', new Date().toISOString())
          .order('end_date', { ascending: false })
          .limit(5)
        
        if (completedError) {
          console.error('Error fetching completed polls:', completedError)
          return
        }

        // Process completed polls
        const completedPollsData = await Promise.all(completedData.map(async (poll) => {
          // Get poll results to find winner
          const { data: resultsData, error: resultsError } = await supabase
            .rpc('get_poll_results', { poll_id: poll.id })
          
          if (resultsError) {
            console.error('Error fetching poll results:', resultsError)
            return null
          }

          // Calculate total votes
          const totalVotes = resultsData.reduce((sum: number, option: any) => sum + Number(option.votes), 0)

          // Find winning option
          const winner = resultsData.length > 0 ? 
            resultsData.sort((a: any, b: any) => b.votes - a.votes)[0].option_text : 
            'No votes'

          return {
            id: poll.id,
            title: poll.title,
            type: poll.type,
            winner,
            completedDate: new Date(poll.end_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }),
            totalVotes
          }
        }))

        // Filter out null values
        const validCompletedPolls = completedPollsData.filter(Boolean) as CompletedPoll[]
        setCompletedPolls(validCompletedPolls)

        // Calculate voting stats
        const totalActivePolls = validPolls.length
        const totalVotesCast = validPolls.reduce((sum, poll) => sum + poll.totalVotes, 0)
        
        // For participation, we'd need total users count, but for now use a placeholder
        const participation = 89 // Placeholder

        setVotingStats({
          activeCount: totalActivePolls,
          totalVotes: totalVotesCast,
          participation
        })

      } catch (error) {
        console.error('Error in fetchPolls:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPolls()
  }, [supabase])

  const handleVote = (pollId: string, optionId: string) => {
    setSelectedVotes((prev) => ({ ...prev, [pollId]: optionId }))
  }

  const submitVote = async (pollId: string) => {
    const selectedOption = selectedVotes[pollId]
    if (!selectedOption) return

    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.push('/login')
      return
    }

    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      // Insert vote into database
      const { error } = await supabase
        .from('votes')
        .insert({
          poll_id: pollId,
          option_id: selectedOption,
          user_id: userData.user.id
        })

      if (error) {
        console.error('Error submitting vote:', error)
        return
      }

      // Update local state to show user has voted
      setActivePolls(prev => 
        prev.map(poll => 
          poll.id === pollId 
            ? { 
                ...poll, 
                hasVoted: true, 
                userVote: selectedOption,
                options: poll.options.map(option => ({
                  ...option,
                  votes: option.id === selectedOption ? option.votes + 1 : option.votes,
                  // Recalculate percentages
                  percentage: Math.round(
                    (option.id === selectedOption ? option.votes + 1 : option.votes) / 
                    (poll.totalVotes + 1) * 100
                  )
                })),
                totalVotes: poll.totalVotes + 1
              } 
            : poll
        )
      )

    } catch (error) {
      console.error('Error in submitVote:', error)
    }
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

  return (
    <div className="px-4 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Community Voice</h1>
        <p className="text-muted-foreground text-balance">
          Shape the future of FreeSpeech.Live through democratic participation
        </p>
      </div>

      {loading ? (
        // Loading state
        <div className="space-y-4">
          <div className="h-20 bg-muted animate-pulse rounded-md"></div>
          <div className="h-64 bg-muted animate-pulse rounded-md"></div>
          <div className="h-64 bg-muted animate-pulse rounded-md"></div>
        </div>
      ) : activePolls.length === 0 ? (
        // No polls state
        <Card className="text-center py-8">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Active Polls</h3>
            <p className="text-sm text-muted-foreground mb-4">
              There are currently no active polls. Check back later for new community polls.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Voting Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-accent">{votingStats.activeCount}</div>
                <div className="text-xs text-muted-foreground">Active Polls</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-accent">{votingStats.totalVotes.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Votes</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-accent">{votingStats.participation}%</div>
                <div className="text-xs text-muted-foreground">Participation</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Polls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Active Polls</h2>
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>

            {activePolls.map((poll) => (
              <Card key={poll.id} className={poll.featured ? "border-accent shadow-md" : ""}>
                {poll.featured && (
                  <div className="bg-accent text-accent-foreground text-xs font-medium px-3 py-1 rounded-t-lg">
                    Featured Poll
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3 mb-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={poll.creator.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{poll.creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{poll.creator.name}</span>
                        <Badge className={`text-xs ${getTypeColor(poll.type)}`}>{poll.type}</Badge>
                      </div>
                      <CardTitle className="text-base leading-tight">{poll.title}</CardTitle>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty">{poll.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Voting Options */}
                  <div className="space-y-3 mb-4">
                    {poll.options.map((option) => {
                      const isSelected = selectedVotes[poll.id] === option.id
                      const hasVoted = poll.hasVoted
                      const isUserVote = poll.userVote === option.id

                      return (
                        <div key={option.id} className="space-y-2">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            className={`w-full justify-start text-left h-auto p-3 ${
                              hasVoted ? "cursor-default" : ""
                            } ${isSelected ? "bg-accent text-accent-foreground" : ""} ${
                              isUserVote ? "border-accent bg-accent/10" : ""
                            }`}
                            onClick={() => !hasVoted && handleVote(poll.id, option.id)}
                            disabled={hasVoted}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm">{option.text}</span>
                              {isUserVote && <CheckCircle className="h-4 w-4 text-accent" />}
                            </div>
                          </Button>
                          {hasVoted && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{option.votes.toLocaleString()} votes</span>
                                <span>{option.percentage}%</span>
                              </div>
                              <Progress value={option.percentage} className="h-2" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Poll Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{poll.totalVotes.toLocaleString()} votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{poll.timeLeft}</span>
                    </div>
                  </div>

                  {/* Vote Button */}
                  {!poll.hasVoted && (
                    <Button
                      onClick={() => submitVote(poll.id)}
                      disabled={!selectedVotes[poll.id]}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      Cast Your Vote
                    </Button>
                  )}

                  {poll.hasVoted && (
                    <div className="flex items-center justify-center gap-2 py-2 text-sm text-accent">
                      <CheckCircle className="h-4 w-4" />
                      <span>You voted in this poll</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Completed Polls */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Recent Results</h2>

            {completedPolls.map((poll) => (
              <Card key={poll.id} className="opacity-75">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1">{poll.title}</h3>
                      <Badge className={`text-xs ${getTypeColor(poll.type)}`}>{poll.type}</Badge>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  </div>
                  <div className="space-y-2">
                    <div className="bg-muted p-2 rounded text-sm">
                      <span className="font-medium">Winner: </span>
                      {poll.winner}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{poll.totalVotes.toLocaleString()} total votes</span>
                      <span>Completed {poll.completedDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <Card className="bg-muted">
            <CardContent className="text-center py-6">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-accent" />
              <h3 className="font-semibold mb-2">Have a Proposal?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Community members can propose new polls for platform improvements and policy changes.
              </p>
              <Button variant="outline" className="bg-transparent" asChild>
                <a href="/vote/submit">Submit Proposal</a>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
