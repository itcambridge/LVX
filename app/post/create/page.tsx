"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAiPlanner } from "@/hooks/useAiPlanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";

const ToneMeter = dynamic(() => import("@/components/ai/tone-meter"), { ssr: false });

// Wrapper component to handle hydration issues
export default function CreatePost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Render the same thing on server and first client paint → no hydration mismatch
  if (!mounted) return null;

  return (
    <ErrorBoundary>
      <CreatePostInner />
    </ErrorBoundary>
  );
}

// Inner component with all the hooks
function CreatePostInner() {
  const [projectId, setProjectId] = useState<string>("temp-id");
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    setProjectId(crypto.randomUUID());
    setReady(true);
  }, []);

  const planner = useAiPlanner(projectId);

  async function handleProcess() {
    await planner.processInput(input);
  }

  async function handlePublish() {
    try {
      setError(null);
      const success = await planner.publish();
      if (success) {
        router.push(`/project/${projectId}`);
      }
    } catch (err: any) {
      console.error("Error in handlePublish:", err);
      setError(err.message || "Failed to publish. Please try again.");
    }
  }

  function handleEmphasisChange(newEmphasis: "efficiency" | "empathy" | "balanced") {
    planner.regenerateBridgeStory(newEmphasis);
  }

  function handleCheckTone() {
    planner.checkTone();
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Create Bridge Story</h1>
      
      {planner.error && (
        <div className={`${planner.error.startsWith('Note:') ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 rounded relative mb-4 border`}>
          <p className="font-medium">{planner.error.startsWith('Note:') ? 'Note:' : 'Error:'}</p>
          <p>{planner.error.startsWith('Note:') ? planner.error.substring(6) : planner.error}</p>
          <button 
            className="absolute top-0 right-0 px-4 py-3" 
            onClick={() => planner.error?.startsWith('Note:') ? null : setError(null)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          <button 
            className="absolute top-0 right-0 px-4 py-3" 
            onClick={() => setError(null)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}
      
      {!planner.output ? (
        <Card>
          <CardHeader>
            <CardTitle>Start with your statement</CardTitle>
            <CardDescription>
              Paste a heated statement or transcript of a back-and-forth. We'll transform it into a constructive Bridge Story.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Enter your statement here..."
              className="min-h-[200px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleProcess}
              disabled={!ready || !input.trim() || planner.loading}
            >
              {planner.loading ? "Processing..." : "Generate Bridge Story"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Tabs defaultValue="bridge-story">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="concern-map">Concern Map</TabsTrigger>
            <TabsTrigger value="solutions">Solutions</TabsTrigger>
            <TabsTrigger value="bridge-story">Bridge Story</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>
          
          {/* Concern Map Tab */}
          <TabsContent value="concern-map">
            <Card>
              <CardHeader>
                <CardTitle>Concern Map</CardTitle>
                <CardDescription>Claims, values, pains, and proposals identified in your statement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Themes */}
                <div>
                  <h3 className="font-medium mb-2">Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {planner.output.concern_map.themes.map((theme: string, i: number) => (
                      <Badge key={i} variant="outline">{theme}</Badge>
                    ))}
                  </div>
                </div>
                
                {/* Claims */}
                <div>
                  <h3 className="font-medium mb-2">Claims</h3>
                  <ul className="space-y-2">
                    {planner.output.concern_map.claims.map((claim: any, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Badge variant="secondary">{claim.type}</Badge>
                        <span>{claim.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Values */}
                <div>
                  <h3 className="font-medium mb-2">Values</h3>
                  <ul className="list-disc pl-5">
                    {planner.output.concern_map.values.map((value: string, i: number) => (
                      <li key={i}>{value}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Pains */}
                <div>
                  <h3 className="font-medium mb-2">Pains</h3>
                  <ul className="list-disc pl-5">
                    {planner.output.concern_map.pains.map((pain: string, i: number) => (
                      <li key={i}>{pain}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Proposals */}
                <div>
                  <h3 className="font-medium mb-2">Proposals</h3>
                  <ul className="list-disc pl-5">
                    {planner.output.concern_map.proposals.map((proposal: string, i: number) => (
                      <li key={i}>{proposal}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Steelman */}
                <div>
                  <h3 className="font-medium mb-2">Steelman Arguments</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Author's Best Case</h4>
                    <ul className="space-y-2">
                      {planner.output.steelman.author.points.map((point: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Badge variant="secondary">{point.type}</Badge>
                          <span>{point.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Opponent's Best Case</h4>
                    <ul className="space-y-2">
                      {planner.output.steelman.opponent.points.map((point: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Badge variant="secondary">{point.type}</Badge>
                          <span>{point.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Solutions Tab */}
          <TabsContent value="solutions">
            <Card>
              <CardHeader>
                <CardTitle>Solution Paths</CardTitle>
                <CardDescription>Different approaches to address the concerns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Financial Accountability */}
                <div>
                  <h3 className="font-medium mb-2">Financial Accountability</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Metrics</h4>
                    <ul className="list-disc pl-5">
                      {planner.output.financial_accountability.metrics.map((metric: any, i: number) => (
                        <li key={i}>
                          {metric.name}: {metric.baseline || "N/A"} → {metric.target}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Distribution of Costs & Benefits</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-medium">Costs</h5>
                        <ul className="list-disc pl-5 text-sm">
                          {planner.output.financial_accountability.distribution.costs.map((item: any, i: number) => (
                            <li key={i}>
                              {item.stakeholder}: {item.impact}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-xs font-medium">Benefits</h5>
                        <ul className="list-disc pl-5 text-sm">
                          {planner.output.financial_accountability.distribution.benefits.map((item: any, i: number) => (
                            <li key={i}>
                              {item.stakeholder}: {item.impact}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Rules</h4>
                    <p className="text-sm">
                      <span className="font-medium">Sunset:</span> {planner.output.financial_accountability.rules.sunset || "None specified"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Scale:</span> {planner.output.financial_accountability.rules.scale || "None specified"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Unknowns</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {planner.output.financial_accountability.unknowns.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Solution Paths */}
                <div>
                  <h3 className="font-medium mb-2">Solution Paths</h3>
                  
                  {planner.output.solution_paths.paths.map((path: any, i: number) => (
                    <div key={i} className="mb-6 p-4 border rounded">
                      <h4 className="font-medium text-lg mb-2">{path.name}</h4>
                      
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">Core Moves</h5>
                        <ul className="list-disc pl-5 text-sm">
                          {path.core_moves.map((move: string, j: number) => (
                            <li key={j}>{move}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">Guardrails</h5>
                        <ul className="list-disc pl-5 text-sm">
                          {path.guardrails.map((guardrail: string, j: number) => (
                            <li key={j}>{guardrail}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Trade-offs</h5>
                        <ul className="list-disc pl-5 text-sm">
                          {path.trade_offs.map((tradeoff: string, j: number) => (
                            <li key={j}>{tradeoff}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Evidence Slots */}
                <div>
                  <h3 className="font-medium mb-2">Evidence Needed</h3>
                  <ul className="list-disc pl-5">
                    {planner.output.evidence_slots.to_verify.map((item: any, i: number) => (
                      <li key={i} className="mb-2">
                        <p className="font-medium">{item.claim}</p>
                        <p className="text-sm text-gray-600">
                          Sources: {item.source_types.join(", ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Bridge Story Tab */}
          <TabsContent value="bridge-story">
            <Card>
              <CardHeader>
                <CardTitle>{planner.output.bridge_story.thin_edge}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <span>Emphasis:</span>
                    <div className="flex gap-1">
                      <Button 
                        variant={planner.emphasis === "efficiency" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => handleEmphasisChange("efficiency")}
                        disabled={planner.loading}
                      >
                        Efficiency
                      </Button>
                      <Button 
                        variant={planner.emphasis === "empathy" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => handleEmphasisChange("empathy")}
                        disabled={planner.loading}
                      >
                        Empathy
                      </Button>
                      <Button 
                        variant={planner.emphasis === "balanced" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => handleEmphasisChange("balanced")}
                        disabled={planner.loading}
                      >
                        Balanced
                      </Button>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {planner.output.bridge_story.paragraphs.map((paragraph: string, i: number) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))}
                </div>
                
                {planner.output.safety_notes && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Tone Analysis</h3>
                    <ToneMeter scores={planner.output.safety_notes} />
                    
                    {planner.output.safety_notes.warnings && planner.output.safety_notes.warnings.length > 0 && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded">
                        <h4 className="font-medium text-amber-800">Warnings</h4>
                        <ul className="list-disc pl-5 text-amber-700">
                          {planner.output.safety_notes.warnings.map((warning: string, i: number) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleCheckTone}
                      disabled={planner.loading}
                    >
                      {planner.loading ? "Checking..." : "Re-check Tone"}
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handlePublish}
                  disabled={planner.loading}
                  className="w-full"
                >
                  {planner.loading ? "Publishing..." : "Publish Bridge Story"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Goals Tab */}
          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Goals</CardTitle>
                <CardDescription>Short-term, measurable goals (30-90 day horizons)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messaging Goals */}
                <div>
                  <h3 className="font-medium mb-2">Messaging Goals</h3>
                  <ul className="space-y-4">
                    {planner.output.goals.messaging.map((goal: any, i: number) => (
                      <li key={i} className="p-3 border rounded">
                        <p className="font-medium">{goal.text}</p>
                        <div className="flex justify-between text-sm mt-1">
                          <span>Metric: {goal.metric}</span>
                          <span>Timeline: {goal.horizon_days} days</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Policy Goals */}
                <div>
                  <h3 className="font-medium mb-2">Policy Goals</h3>
                  <ul className="space-y-4">
                    {planner.output.goals.policy.map((goal: any, i: number) => (
                      <li key={i} className="p-3 border rounded">
                        <p className="font-medium">{goal.text}</p>
                        <div className="flex justify-between text-sm mt-1">
                          <span>Metric: {goal.metric}</span>
                          <span>Timeline: {goal.horizon_days} days</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
