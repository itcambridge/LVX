"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, Clock, Users, TrendingUp, AlertCircle } from "lucide-react"

// Mock voting data
const activePolls = [
  {
    id: 1,
    title: "Should FreeSpeech.Live add video project pitches?",
    description: "Community members have requested the ability to upload video pitches alongside written descriptions.",
    type: "Platform Feature",
    creator: { name: "FreeSpeech Team", avatar: "/placeholder.svg?height=32&width=32" },
    options: [
      { id: "yes", text: "Yes, add video pitches", votes: 1247, percentage: 68 },
      { id: "no", text: "No, keep text only", votes: 587, percentage: 32 },
    ],
    totalVotes: 1834,
    timeLeft: "3 days left",
    hasVoted: false,
    featured: true,
  },
  {
    id: 2,
    title: "Minimum funding threshold for new projects",
    description: "What should be the minimum funding goal required to launch a project on the platform?",
    type: "Policy",
    creator: { name: "Community Council", avatar: "/placeholder.svg?height=32&width=32" },
    options: [
      { id: "500", text: "$500 minimum", votes: 234, percentage: 25 },
      { id: "1000", text: "$1,000 minimum", votes: 456, percentage: 49 },
      { id: "2000", text: "$2,000 minimum", votes: 243, percentage: 26 },
    ],
    totalVotes: 933,
    timeLeft: "5 days left",
    hasVoted: true,
    userVote: "1000",
    featured: false,
  },
  {
    id: 3,
    title: "Community moderation guidelines update",
    description: "Proposed changes to how we handle project reviews and community standards.",
    type: "Governance",
    creator: { name: "Sarah Chen", avatar: "/placeholder.svg?height=32&width=32" },
    options: [
      { id: "approve", text: "Approve changes", votes: 678, percentage: 72 },
      { id: "reject", text: "Reject changes", votes: 123, percentage: 13 },
      { id: "modify", text: "Needs modification", votes: 142, percentage: 15 },
    ],
    totalVotes: 943,
    timeLeft: "1 day left",
    hasVoted: false,
    featured: false,
  },
]

const completedPolls = [
  {
    id: 4,
    title: "New project categories to add",
    type: "Platform Feature",
    winner: "Arts & Culture, Economic Development",
    completedDate: "2024-01-15",
    totalVotes: 2156,
  },
  {
    id: 5,
    title: "Donation fee structure",
    type: "Policy",
    winner: "2.5% platform fee",
    completedDate: "2024-01-10",
    totalVotes: 1789,
  },
]

export default function VotePage() {
  const [selectedVotes, setSelectedVotes] = useState<Record<number, string>>({})

  const handleVote = (pollId: number, optionId: string) => {
    setSelectedVotes((prev) => ({ ...prev, [pollId]: optionId }))
  }

  const submitVote = (pollId: number) => {
    const selectedOption = selectedVotes[pollId]
    if (!selectedOption) return

    // Mock vote submission - in real app would call API
    console.log(`Voting on poll ${pollId} with option ${selectedOption}`)

    // Update poll to show as voted
    // In real app, would refetch data or update state
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

      {/* Voting Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-accent">{activePolls.length}</div>
            <div className="text-xs text-muted-foreground">Active Polls</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-accent">5,234</div>
            <div className="text-xs text-muted-foreground">Total Votes</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-accent">89%</div>
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
          <Button variant="outline" className="bg-transparent">
            Submit Proposal
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
