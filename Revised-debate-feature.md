# Revised Debate Feature Implementation Plan

This document outlines the detailed implementation plan for transforming the current debate feature into a more streamlined approach focused on financial accountability, measurable goals, and bridge stories.

## Overview

The revised feature will help users write convincing stories that bring people on board to push for systemic change. It will:

1. Transform heated statements into constructive "Bridge Stories"
2. Apply a financial accountability lens to all proposals
3. Generate multiple solution paths with trade-offs
4. Set measurable goals with 30-90 day horizons
5. Stop at goal-setting (no implementation plans)

## Phase 1: Database Schema Adjustments

✅ **Database Schema Extensions**
- `version_history`: To store previous versions of the story
- `to_verify_items`: To store claims that need verification

```sql
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS version_history jsonb,
ADD COLUMN IF NOT EXISTS to_verify_items jsonb;
```

## Phase 2: Update AI Schemas and Prompts

### 1. Update AI Schemas (lib/aiSchemas.ts)

Replace the current schemas with new ones that match the preferred output structure:

```typescript
// New schemas for the revised approach
export const concern_map_v1 = z.object({
  themes: z.array(z.string()),
  claims: z.array(z.object({
    text: z.string(),
    type: z.enum(["evidence", "inference", "emotion"])
  })),
  values: z.array(z.string()),
  pains: z.array(z.string()),
  proposals: z.array(z.string())
});

export const steelman_v1 = z.object({
  author: z.object({
    points: z.array(z.object({
      text: z.string(),
      type: z.enum(["evidence", "inference", "emotion"])
    }))
  }),
  opponent: z.object({
    points: z.array(z.object({
      text: z.string(),
      type: z.enum(["evidence", "inference", "emotion"])
    }))
  })
});

export const financial_accountability_v1 = z.object({
  metrics: z.array(z.object({
    name: z.string(),
    baseline: z.string().nullable(),
    target: z.string()
  })),
  distribution: z.object({
    costs: z.array(z.object({
      stakeholder: z.string(),
      impact: z.string()
    })),
    benefits: z.array(z.object({
      stakeholder: z.string(),
      impact: z.string()
    }))
  }),
  rules: z.object({
    sunset: z.string().nullable(),
    scale: z.string().nullable()
  }),
  unknowns: z.array(z.string())
});

export const solution_paths_v1 = z.object({
  paths: z.array(z.object({
    name: z.string(),
    core_moves: z.array(z.string()),
    guardrails: z.array(z.string()),
    trade_offs: z.array(z.string())
  })).min(2).max(4)
});

export const evidence_slots_v1 = z.object({
  to_verify: z.array(z.object({
    claim: z.string(),
    source_types: z.array(z.string())
  }))
});

export const bridge_story_v1 = z.object({
  thin_edge: z.string(),
  paragraphs: z.array(z.string()).min(3).max(5),
  emphasis: z.enum(["efficiency", "empathy", "balanced"])
});

export const goals_v1 = z.object({
  messaging: z.array(z.object({
    text: z.string(),
    metric: z.string(),
    horizon_days: z.number().min(30).max(90)
  })),
  policy: z.array(z.object({
    text: z.string(),
    metric: z.string(),
    horizon_days: z.number().min(30).max(90)
  }))
});

export const safety_notes_v1 = z.object({
  warnings: z.array(z.string()).optional(),
  rejected_content: z.boolean(),
  rejection_reason: z.string().optional()
});

// Combined output schema for one-shot approach
export const bridge_output_v1 = z.object({
  concern_map: concern_map_v1,
  steelman: steelman_v1,
  financial_accountability: financial_accountability_v1,
  solution_paths: solution_paths_v1,
  evidence_slots: evidence_slots_v1,
  bridge_story: bridge_story_v1,
  goals: goals_v1,
  safety_notes: safety_notes_v1
});
```

### 2. Update AI Prompts (lib/aiPrompts.ts)

Replace the current prompts with new ones that align with the preferred approach:

```typescript
export const SYSTEM_CORE = `
You are a neutral, rational solution provider that helps transform heated statements into constructive "Bridge Stories" that can bring people on board to push for systemic change.

PRINCIPLES:
- Apply a financial accountability lens to all proposals
- Emphasize scarcity, price signals, value of money
- Show empathy while maintaining rationality
- Stop at goals - no implementation plans
- Critique policies/incentives, not people or groups
- Mark unknowns clearly as "to_verify"
- Avoid slurs and remain topic-agnostic

OUTPUT STRUCTURE:
1. Concern Map: claims, values, pains, proposals
2. Steelman: best-case for author and opponent
3. Financial Accountability: metrics, distribution of costs/benefits, sunset/scale rules, unknowns
4. Solution Paths: 2-4 distinct approaches with core moves, guardrails, and trade-offs
5. Evidence Slots: items to verify and suggested source types
6. Bridge Story: one "thin-edge" sentence + 3-5 short paragraphs
7. Goals: 3-6 short, measurable goals (30-90 day horizons)
8. Safety Notes: any warnings or rejected content
`;

export const P_ONE_SHOT = `
Process the user's input and generate a complete structured response following these steps:

1. Pre-filter for abuse or doxxing - reject or rewrite as needed
2. Parse the input to identify claims, values, pains, and proposals
3. Steelman both sides, tagging points as evidence/inference/emotion
4. Apply the Financial Accountability Lens to all policies/ideas
5. Generate multiple distinct solution paths
6. Identify evidence slots for verification
7. Compose a Bridge Story that is empathetic, practical, money-aware, and persuasive
8. Set short-term goals for messaging and policy-shaping
9. Include any safety notes

Return the complete structured output according to the bridge_output_v1 schema.
`;

// Fallback staged approach prompts if one-shot is too long
export const P_STAGE1 = `
Parse the user's input to extract:
1. Key themes
2. Claims (tagged as evidence/inference/emotion)
3. Values expressed
4. Pains described
5. Proposals suggested

Return a structured concern_map_v1 object.
`;

export const P_STAGE2 = `
Create steelman arguments for both the author and an opponent:
1. Upgrade both positions to their strongest form
2. Tag each point as evidence, inference, or emotion
3. Ensure fair representation of both sides

Return a structured steelman_v1 object.
`;

export const P_STAGE3 = `
Apply a Financial Accountability Lens to all policies and ideas:
1. Identify metrics for measuring success
2. Map distribution of costs and benefits across stakeholders
3. Suggest sunset and scale rules
4. Mark unknowns that require verification

Return a structured financial_accountability_v1 object.
`;

export const P_STAGE4 = `
Generate 2-4 distinct solution paths:
1. Each path should have a clear approach (e.g., efficiency-first, balanced, etc.)
2. List core moves for each path
3. Include guardrails to prevent misuse
4. Identify likely trade-offs

Return a structured solution_paths_v1 object.
`;

export const P_STAGE5 = `
Identify claims that need verification:
1. Mark contentious claims with "to_verify"
2. Suggest appropriate source types for verification
3. Focus on factual claims rather than opinions

Return a structured evidence_slots_v1 object.
`;

export const P_STAGE6 = `
Compose a Bridge Story that:
1. Opens with shared values
2. Names the friction (cost/efficiency)
3. Offers a both/and route
4. Invites co-ownership
5. Includes one crisp "thin-edge" sentence both sides can accept
6. Uses an empathetic, practical, money-aware tone

Return a structured bridge_story_v1 object.
`;

export const P_STAGE7 = `
Set 3-6 short, measurable goals:
1. Messaging goals (adoption, trust, recall)
2. Policy-shaping goals (transparency commitments, lightweight audits)
3. All goals should have 30-90 day horizons
4. No implementation plans beyond goals

Return a structured goals_v1 object.
`;

export const P_TONE_CHECK = `
Analyze the Bridge Story for tone and safety:
1. Check for civility, heat, bridge-building, and factuality
2. Flag any concerning phrases
3. Identify any content that should be rejected
4. Suggest alternative phrasing if needed

Return a structured safety_notes_v1 object.
`;

export const P_REWRITE = `
Rewrite the Bridge Story to:
1. Reduce heat and increase civility
2. Preserve the core ask and specificity
3. Replace accusations with effects
4. Add one explicit concession
5. Keep under 600 words
6. Shift emphasis toward the specified style (efficiency/empathy/balanced)

Return ONLY the rewritten Bridge Story.
`;
```

## Phase 3: Update AI Client and API Routes

### 1. Update AI Client (lib/aiClient.ts)

Modify the existing client to support both one-shot and staged approaches:

```typescript
// Add a new function for one-shot processing
export async function processOneShot(input: string, emphasis: string = "balanced") {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("API key not configured");
    }

    const res = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: SYSTEM_CORE }, 
        { role: "user", content: P_ONE_SHOT + `\nInput: ${input}\nEmphasis: ${emphasis}` }
      ],
      tools: [{
        type: "function",
        function: {
          name: "process_bridge_output",
          description: "Process the complete bridge output",
          parameters: zodToJsonSchema(bridge_output_v1)
        }
      }],
      tool_choice: { type: "function", function: { name: "process_bridge_output" } },
      temperature: 0.7,
      max_tokens: 4000
    });

    // Extract the tool call response
    const toolCalls = res.choices[0]?.message?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      throw new Error("Invalid API response format");
    }

    // Parse the function arguments
    const functionCall = toolCalls[0];
    return JSON.parse(functionCall.function.arguments);
  } catch (error: any) {
    console.error("OpenAI API error:", error.message || error);
    throw error;
  }
}
```

### 2. Update API Routes

#### a. Modify /app/api/ai/plan/route.ts

```typescript
import { NextResponse } from "next/server";
import { chatWithTools, processOneShot } from "@/lib/aiClient";
import * as P from "@/lib/aiPrompts";
import {
  concern_map_v1, steelman_v1, financial_accountability_v1, 
  solution_paths_v1, evidence_slots_v1, bridge_story_v1, 
  goals_v1, safety_notes_v1, bridge_output_v1, zodToJsonSchema
} from "@/lib/aiSchemas";

// Define stage configurations with schemas and validators
const stageMap = [
  { 
    key: "oneshot", 
    schema: zodToJsonSchema(bridge_output_v1),
    validator: bridge_output_v1
  },
  { 
    key: "s1", 
    prompt: P.P_STAGE1, 
    schema: zodToJsonSchema(concern_map_v1),
    validator: concern_map_v1,
    toolName: "process_concern_map"
  },
  { 
    key: "s2", 
    prompt: P.P_STAGE2, 
    schema: zodToJsonSchema(steelman_v1),
    validator: steelman_v1,
    toolName: "process_steelman"
  },
  { 
    key: "s3", 
    prompt: P.P_STAGE3, 
    schema: zodToJsonSchema(financial_accountability_v1),
    validator: financial_accountability_v1,
    toolName: "process_financial_accountability"
  },
  { 
    key: "s4", 
    prompt: P.P_STAGE4, 
    schema: zodToJsonSchema(solution_paths_v1),
    validator: solution_paths_v1,
    toolName: "process_solution_paths"
  },
  { 
    key: "s5", 
    prompt: P.P_STAGE5, 
    schema: zodToJsonSchema(evidence_slots_v1),
    validator: evidence_slots_v1,
    toolName: "process_evidence_slots"
  },
  { 
    key: "s6", 
    prompt: P.P_STAGE6, 
    schema: zodToJsonSchema(bridge_story_v1),
    validator: bridge_story_v1,
    toolName: "process_bridge_story"
  },
  { 
    key: "s7", 
    prompt: P.P_STAGE7, 
    schema: zodToJsonSchema(goals_v1),
    validator: goals_v1,
    toolName: "process_goals"
  },
  { 
    key: "tone", 
    prompt: P.P_TONE_CHECK, 
    schema: zodToJsonSchema(safety_notes_v1),
    validator: safety_notes_v1,
    toolName: "process_tone_check"
  },
  { 
    key: "rewrite", 
    prompt: P.P_REWRITE, 
    schema: null,
    validator: null,
    toolName: null
  }
];

export async function POST(req: Request) {
  try {
    const { stage, input, emphasis = "balanced", system = P.SYSTEM_CORE } = await req.json();
    
    // Handle one-shot processing
    if (stage === "oneshot") {
      try {
        const result = await processOneShot(input, emphasis);
        const validated = bridge_output_v1.parse(result);
        return NextResponse.json({ ok: true, data: validated });
      } catch (e: any) {
        console.error("Error in one-shot processing:", e);
        // Fall back to staged approach if one-shot fails
        return NextResponse.json({ 
          ok: false, 
          error: "One-shot processing failed. Please try the staged approach.",
          fallback: true
        }, { status: 422 });
      }
    }
    
    // Handle staged processing (similar to existing code)
    const item = stageMap.find(s => s.key === stage);
    if (!item) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

    // Rest of the existing code for staged processing...
    // (Keep your current implementation for staged processing)
    
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return NextResponse.json({ 
      ok: false, 
      error: "Unexpected error: " + (e?.message || String(e))
    }, { status: 500 });
  }
}
```

#### b. Update /app/api/projects/save-draft/route.ts

```typescript
// Add support for versioning
export async function POST(req: Request) {
  try {
    const { projectId, bundlePatch, version, emphasis } = await req.json();

    const { data: proj, error: fetchError } = await s.from("projects").select("plan_bundle, version_history").eq("id", projectId).single();
    if (fetchError) {
      console.error("Error fetching project:", fetchError);
      return NextResponse.json({ ok: false, error: fetchError }, { status: 500 });
    }

    const plan_bundle = { ...(proj?.plan_bundle || {}), ...bundlePatch };
    
    // Handle versioning
    let version_history = proj?.version_history || [];
    if (version) {
      // Add current state to version history before updating
      version_history = [
        ...(Array.isArray(version_history) ? version_history : []),
        {
          timestamp: new Date().toISOString(),
          plan_bundle: proj?.plan_bundle || {},
          version
        }
      ];
    }

    const { error } = await s.from("projects").update({
      plan_bundle,
      version_history,
      emphasis: emphasis || undefined
    }).eq("id", projectId);

    if (error) {
      console.error("Error updating project:", error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Failed to save draft"
    }, { status: 500 });
  }
}
```

#### c. Update /app/api/projects/publish/route.ts

```typescript
export async function POST(req: Request) {
  try {
    const { projectId, title, tldr, body_markdown, to_verify_items } = await req.json();
    
    const { error } = await s.from("projects").update({
      title, 
      tldr, 
      description: body_markdown,
      to_verify_items: to_verify_items || null,
      routine_completed: true,
      status: "published"
    }).eq("id", projectId);

    if (error) {
      console.error("Error publishing project:", error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Failed to publish project"
    }, { status: 500 });
  }
}
```

## Phase 4: Update the AI Planner Hook

Modify hooks/useAiPlanner.ts to support the new approach:

```typescript
import { useState, useRef, useEffect } from "react";

export function useAiPlanner(projectId: string) {
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [emphasis, setEmphasis] = useState<"efficiency" | "empathy" | "balanced">("balanced");
  const [version, setVersion] = useState<number>(1);
  const isMounted = useRef(true);
  
  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => { 
      isMounted.current = false; 
    };
  }, []);

  /**
   * Process input using one-shot approach with fallback to staged
   */
  async function processInput(input: string) {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    
    try {
      // Try one-shot approach first
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stage: "oneshot", 
          input,
          emphasis
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setOutput(data.data);
        await save(data.data);
        setLoading(false);
        return data.data;
      } else if (data.fallback) {
        // Fall back to staged approach
        // Implementation for staged approach would go here
        setError("One-shot processing failed. Staged approach not yet implemented.");
        setLoading(false);
        return null;
      } else {
        setError(data.error || "Processing failed");
        setLoading(false);
        return null;
      }
    } catch (err: any) {
      console.error("Error processing input:", err);
      setError(err.message || "Failed to process input");
      setLoading(false);
      return null;
    }
  }

  /**
   * Save the current state to the database
   */
  async function save(bundlePatch: any) {
    if (!isMounted.current) return;
    
    try {
      const response = await fetch("/api/projects/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          projectId, 
          bundlePatch,
          version,
          emphasis
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error saving draft:", errorData);
      } else {
        // Increment version for next save
        setVersion(v => v + 1);
      }
    } catch (err: any) {
      console.error("Failed to save draft:", err);
    }
  }

  /**
   * Regenerate the bridge story with a different emphasis
   */
  async function regenerateBridgeStory(newEmphasis: "efficiency" | "empathy" | "balanced") {
    if (!output || !output.bridge_story || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    setEmphasis(newEmphasis);
    
    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stage: "rewrite", 
          input: output.bridge_story.paragraphs.join("\n\n"),
          emphasis: newEmphasis
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Update only the bridge story part
        const updatedOutput = {
          ...output,
          bridge_story: {
            ...output.bridge_story,
            paragraphs: data.data.split("\n\n"),
            emphasis: newEmphasis
          }
        };
        
        setOutput(updatedOutput);
        await save(updatedOutput);
        setLoading(false);
        return updatedOutput;
      } else {
        setError(data.error || "Regeneration failed");
        setLoading(false);
        return null;
      }
    } catch (err: any) {
      console.error("Error regenerating bridge story:", err);
      setError(err.message || "Failed to regenerate bridge story");
      setLoading(false);
      return null;
    }
  }

  /**
   * Publish the project
   */
  async function publish() {
    if (!output || !output.bridge_story || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/projects/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId, 
          title: output.bridge_story.thin_edge,
          tldr: output.bridge_story.paragraphs[0],
          body_markdown: output.bridge_story.paragraphs.join("\n\n"),
          to_verify_items: output.evidence_slots.to_verify
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to publish");
      }
      
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Publish error:", err);
      setError(err.message || "Failed to publish");
      setLoading(false);
      return false;
    }
  }

  return {
    output,
    error,
    loading,
    emphasis,
    version,
    processInput,
    regenerateBridgeStory,
    publish,
    setEmphasis
  };
}
```

## Phase 5: Create a New UI Component

Create a new UI component for the revised debate feature:

### Create /app/post/create/page.tsx

```tsx
"use client";
import { useState, useEffect } from "react";
import { useAiPlanner } from "@/hooks/useAiPlanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

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
    const success = await planner.publish();
    if (success) {
      router.push(`/project/${projectId}`);
    }
  }

  function handleEmphasisChange(newEmphasis: "efficiency" | "empathy" | "balanced") {
    planner.regenerateBridgeStory(newEmphasis);
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Create Bridge Story</h1>
      
      {planner.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <p className="font-medium">Error:</p>
          <p>{planner.error}</p>
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
                      <li key={i}>{proposal
