"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Heart, DollarSign, Copy, CheckCircle } from "lucide-react"

const SUGGESTED_AMOUNTS = [10, 25, 50, 100, 250]

interface DonationPanelProps {
  project: {
    id: string | number
    title: string
    fundGoal: number
    fundTotal: number
  }
  onClose: () => void
}

export function DonationPanel({ project, onClose }: DonationPanelProps) {
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [step, setStep] = useState(1) // 1: amount, 2: payment, 3: confirmation
  const [copied, setCopied] = useState(false)

  // Mock treasury address - in real app would be dynamic
  const treasuryAddress = "0x742d35Cc6634C0532925a3b8D4C9db96590b5b8e"

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString())
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(treasuryAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDonate = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return
    setStep(2)
  }

  const handleConfirmDonation = () => {
    // Mock donation confirmation - in real app would process payment
    console.log("Donation confirmed:", { amount, message, projectId: project.id })
    setStep(3)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">
            {step === 1 && "Support Project"}
            {step === 2 && "Complete Donation"}
            {step === 3 && "Thank You!"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="text-center mb-4">
                <h3 className="font-semibold text-balance">{project.title}</h3>
                <p className="text-sm text-muted-foreground">
                  ${project.fundTotal.toLocaleString()} raised of ${project.fundGoal.toLocaleString()} goal
                </p>
              </div>

              {/* Suggested Amounts */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Quick Select</Label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_AMOUNTS.map((suggestedAmount) => (
                    <Badge
                      key={suggestedAmount}
                      variant={amount === suggestedAmount.toString() ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        amount === suggestedAmount.toString() ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      }`}
                      onClick={() => handleAmountSelect(suggestedAmount)}
                    >
                      ${suggestedAmount}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Custom Amount (LVX)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Share why this project matters to you..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleDonate}
                disabled={!amount || Number.parseFloat(amount) <= 0}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Heart className="mr-2 h-4 w-4" />
                Donate ${amount || "0"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-accent">${amount}</div>
                <p className="text-sm text-muted-foreground">Donation Amount</p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Project Fund Address:</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-auto p-1">
                    {copied ? <CheckCircle className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-background p-2 rounded text-xs font-mono break-all">{treasuryAddress}</div>
                <p className="text-xs text-muted-foreground">
                  Send your LVX tokens to this address, then paste the transaction hash below.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash</Label>
                <Input id="txHash" placeholder="Paste transaction hash here..." className="font-mono text-sm" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleConfirmDonation}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Confirm Donation
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Heart className="h-8 w-8 text-accent fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Donation Submitted!</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Your ${amount} donation is being processed. You'll receive a confirmation once it's verified on the
                  blockchain.
                </p>
              </div>
              {message && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm italic">"{message}"</p>
                </div>
              )}
              <Button onClick={onClose} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
