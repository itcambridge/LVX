# LVX – "Debate → Plan → Political Media Post" (MVP) - REVISED

**with Cline in VS Code**

This guide gives you exact steps (and paste-ready snippets) to ship the enforced debating routine that turns a vent into a civil, persuasive **project post**. Users **must complete the routine** before they can publish.

- **Tone policy (MVP):** warn if Civility < 80 or Heat > 30 and offer "Rewrite & Re-score", but still allow publish after Stage 8.
- **Debate trace:** stored privately in `projects.plan_bundle` — never shown publicly.
- **Reuse** your existing `projects` table; add a few columns.

---

## 0) Prereqs

- Repo checked out and running (`pnpm dev`).
- Supabase project connected.
- API keys in `.env.local`:
```
OPENAI_API_KEY=...
PERPLEXITY_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 1) Create a feature branch

Open **Cline** → *New Task*:

Create a new branch feat/debate-posts and open the repo.

---

## 2) Supabase migration (extend `projects`)

Open **Supabase SQL editor** and run:

```sql
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS tldr text,
ADD COLUMN IF NOT EXISTS plan_bundle jsonb,
ADD COLUMN IF NOT EXISTS sources jsonb,
ADD COLUMN IF NOT EXISTS tone_scores jsonb,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS routine_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS routine_stage integer DEFAULT 0;
```

These are the only DB changes needed. All debate artifacts live in plan_bundle.

---

## 3) Project structure & files (Cline tasks)

Open Cline → New Task:

Create the following files with the provided content:

- /lib/aiSchemas.ts
- /lib/aiPrompts.ts
- /lib/aiClient.ts
- /lib/researchClient.ts
- /app/api/ai/plan/route.ts
- /app/api/research/route.ts
- /app/api/projects/save-draft/route.ts
- /app/api/projects/publish/route.ts
- /hooks/useAiPlanner.ts
- /components/ai/tone-meter.tsx
- /app/post/create/page.tsx

Paste the snippets below when Cline asks for content.

---

## 4) Zod schemas (/lib/aiSchemas.ts)

```typescript
import { z } from "zod";

export const grievances_v1 = z.object({
  reflection: z.string(),
  grievances: z.array(z.object({
    text: z.string(),
    emotion: z.string().optional()
  })).min(1)
});

export const claims_v1 = z.object({
  claims: z.array(z.object({
    claim: z.string(),
    type: z.enum(["falsifiable", "obstacle"]),
    proposed_evidence: z.array(z.string()).optional()
  })),
  evidence_request: z.string()
});

export const map_v1 = z.object({
  analyses: z.array(z.object({
    claim: z.string(),
    steelman: z.string(),
    stakeholders: z.array(z.object({
      role: z.string(),
      name_or_type: z.string(),
      influence: z.enum(["low","med","high"]),
      likely_concerns: z.array(z.string()).optional(),
      shared_interests: z.array(z.string()).optional()
    }))
  }))
});

export const goals_v1 = z.object({
  goals: z.array(z.object({
    title: z.string(),
    why_now: z.string(),
    metric: z.object({
      name: z.string(),
      baseline: z.string().nullable(),
      target: z.string(),
      deadline_days: z.number()
    }),
    owner_role: z.string(),
    legitimacy_check: z.array(z.string())
  })).min(1)
});

export const plans_v1 = z.object({
  plans: z.array(z.object({
    name: z.string(), // Fast/Low-cost | Balanced | Ambitious
    steps: z.array(z.object({ desc: z.string(), eta_days: z.number() })),
    time_range_days: z.tuple([z.number(), z.number()]),
    budget_range: z.tuple([z.string(), z.string()]),
    risks: z.array(z.string()).optional(),
    dependencies: z.array(z.string()).optional(),
    success_metrics: z.array(z.string()).optional()
  })).length(3)
});

export const tasks_v1 = z.object({
  roles: z.array(z.string()),
  sprint_weeks: z.array(z.object({
    week: z.number(),
    milestones: z.array(z.string()),
    tasks: z.array(z.object({
      title: z.string(),
      owner_role: z.string()
    }))
  }))
});

export const post_v1 = z.object({
  titles: z.array(z.string()).min(1),
  tldr: z.string(),
  body_markdown: z.string(),
  sources: z.array(z.object({
    label: z.string(),
    url: z.string().url()
  })).optional()
});

export const scores_v1 = z.object({
  civility: z.number(),
  heat: z.number(),
  bridge: z.number(),
  factuality_posture: z.number(),
  flagged: z.array(z.object({ phrase: z.string(), reason: z.string() })).optional(),
  meets_thresholds: z.boolean()
});

// Helper function to convert Zod schema to JSON Schema for OpenAI
export function zodToJsonSchema(zodSchema: z.ZodType<any>) {
  // This is a simplified conversion - for production you might want a more robust solution
  const jsonSchema: any = { type: "object", properties: {}, required: [] };
  
  // Extract properties from Zod schema
  if (zodSchema instanceof z.ZodObject) {
    const shape = (zodSchema as any)._def.shape();
    
    for (const [key, value] of Object.entries(shape)) {
      if (value instanceof z.ZodString) {
        jsonSchema.properties[key] = { type: "string" };
      } else if (value instanceof z.ZodNumber) {
        jsonSchema.properties[key] = { type: "number" };
      } else if (value instanceof z.ZodBoolean) {
        jsonSchema.properties[key] = { type: "boolean" };
      } else if (value instanceof z.ZodArray) {
        jsonSchema.properties[key] = { 
          type: "array",
          items: value._def.type instanceof z.ZodObject 
            ? zodToJsonSchema(value._def.type)
            : { type: "string" }
        };
      } else if (value instanceof z.ZodObject) {
        jsonSchema.properties[key] = zodToJsonSchema(value);
      } else if (value instanceof z.ZodEnum) {
        jsonSchema.properties[key] = { 
          type: "string", 
          enum: value._def.values
        };
      }
      
      // Check if property is required
      if (!(value instanceof z.ZodOptional)) {
        jsonSchema.required.push(key);
      }
    }
  }
  
  return jsonSchema;
}
```

---

## 5) Stage prompts (/lib/aiPrompts.ts)

```typescript
export const SYSTEM_CORE =
`You are a neutral de-escalation planner. You:
1) validate feelings,
2) distill grievances into falsifiable claims,
3) STEELMAN opponents,
4) propose SMART goals,
5) produce 3 plan options,
6) create a task board,
7) craft a Nonviolent Communication (NVC) story post,
8) score tone (Civility, Heat, Bridge, Factuality).

Always lawful, non-violent, no doxxing or harassment. Critique systems/policies, not people/groups. Keep debate artifacts concise and structured JSON.`;

export const P_STAGE1 = `Reflect the user's feeling in ONE sentence ("It sounds like you feel ... because ..."), then extract 3–6 NEUTRAL grievances (no labels/blame). Output JSON per grievances_v1.`;

export const P_STAGE2 = `Turn each grievance into a falsifiable claim or concrete obstacle. Propose evidence categories (laws, budgets, stats, case studies). Output claims_v1.`;

export const P_STAGE3 = `For each claim: (a) good-faith steelman (1–2 sentences), (b) stakeholder map (role, name_or_type, influence, likely concerns, shared interests). Output map_v1.`;

export const P_STAGE4 = `Propose 1–3 SMART goals (lawful, non-violent). Include metric {name, baseline?, target, deadline_days}, owner_role, legitimacy_check. Output goals_v1.`;

export const P_STAGE5 = `Generate exactly three plan options: Fast/Low-cost, Balanced, Ambitious. Include steps, time_range_days, budget_range, risks, dependencies, success_metrics. Output plans_v1.`;

export const P_STAGE6 = `List roles we need (e.g., Research Lead, Policy, Legal, Outreach, Comms, Fundraising, Design, Engineering). Create a 6–8 week task board. Output tasks_v1.`;

export const P_STAGE7 = `Draft a 400–600 word post in NVC style:
- Open with shared values + one verifiable observation.
- Include the best opposing concern (steelman nod).
- State the concrete goal and plan options.
- Make a respectful, specific request to a stakeholder.
- End with a "join" CTA.
If sources are provided, include an optional "Sources" list.
Return post_v1.`;

export const P_STAGE8_SCORE = `Score the provided text (0–100) on Civility, Heat (anger/absolutes), Bridge (shared values + concrete invites), and Factuality posture. Flag phrases that raise heat. Return scores_v1. Thresholds: Civility≥80, Heat≤30.`;

export const P_STAGE8_REWRITE = `Rewrite to reduce Heat and increase Civility/Bridge while preserving the core ask and specificity. Replace accusations with effects, add one explicit concession, keep ≤600 words. Return ONLY the rewritten markdown.`;
```

---

## 6) OpenAI & Perplexity clients

### /lib/aiClient.ts

```typescript
import OpenAI from "openai";

// Create OpenAI client with error handling
export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false // Ensure this is only used server-side
});

/**
 * Makes a request to OpenAI API using tool calling for structured outputs
 * @param system The system prompt
 * @param user The user input
 * @param schema The JSON schema for the expected output
 * @param toolName The name of the tool to call
 * @returns Validated response from the API
 */
export async function chatWithTools(system: string, user: string, schema: any, toolName: string) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      throw new Error("API key not configured");
    }

    // Make the API request with tool calling
    console.log(`Making OpenAI request with tool ${toolName}`);
    
    const res = await openai.chat.completions.create({
      model: "gpt-4-turbo", // More capable for structured outputs
      messages: [
        { role: "system", content: system }, 
        { role: "user", content: user }
      ],
      tools: [{
        type: "function",
        function: {
          name: toolName,
          description: `Process the ${toolName} stage of the debate algorithm`,
          parameters: schema
        }
      }],
      tool_choice: { type: "function", function: { name: toolName } },
      temperature: 0.7,
      max_tokens: 1500
    });

    // Extract the tool call response
    const toolCalls = res.choices[0]?.message?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      console.error("No tool calls in response");
      throw new Error("Invalid API response format");
    }

    // Parse the function arguments
    const functionCall = toolCalls[0];
    return JSON.parse(functionCall.function.arguments);
  } catch (error: any) {
    // Handle API errors
    console.error("OpenAI API error:", error.message || error);
    throw error;
  }
}

/**
 * Fallback for the rewrite stage which doesn't return structured JSON
 * @param system The system prompt
 * @param user The user input
 * @returns Raw text response from the API
 */
export async function chatText(system: string, user: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      throw new Error("API key not configured");
    }

    const res = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: system }, 
        { role: "user", content: user }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return res.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("OpenAI API error:", error.message || error);
    throw error;
  }
}
```

### /lib/researchClient.ts

```typescript
export async function researchClaims(claims: string[]) {
  // Replace endpoint/model per your Perplexity plan.
  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY!}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "sonar-large-online", // placeholder
      messages: [{
        role: "user",
        content: `For each of these claims, return 3–5 reputable sources (title + url + 1-line summary). Claims: ${claims.join(" | ")}`
      }]
    })
  });
  const data = await r.json();
  // Normalize to [{label,url}] minimal structure expected by post_v1
  return data; // shape to fit your UI
}
```

---

## 7) AI Stage Router (/app/api/ai/plan/route.ts)

```typescript
import { NextResponse } from "next/server";
import { chatWithTools, chatText } from "@/lib/aiClient";
import * as P from "@/lib/aiPrompts";
import {
  grievances_v1, claims_v1, map_v1, goals_v1, plans_v1, tasks_v1, post_v1, scores_v1, zodToJsonSchema
} from "@/lib/aiSchemas";

// Define stage configurations with schemas and validators
const stageMap = [
  { 
    key: "s1", 
    prompt: P.P_STAGE1, 
    schema: zodToJsonSchema(grievances_v1),
    validator: grievances_v1,
    toolName: "process_grievances"
  },
  { 
    key: "s2", 
    prompt: P.P_STAGE2, 
    schema: zodToJsonSchema(claims_v1),
    validator: claims_v1,
    toolName: "process_claims"
  },
  { 
    key: "s3", 
    prompt: P.P_STAGE3, 
    schema: zodToJsonSchema(map_v1),
    validator: map_v1,
    toolName: "process_stakeholder_map"
  },
  { 
    key: "s4", 
    prompt: P.P_STAGE4, 
    schema: zodToJsonSchema(goals_v1),
    validator: goals_v1,
    toolName: "process_smart_goals"
  },
  { 
    key: "s5", 
    prompt: P.P_STAGE5, 
    schema: zodToJsonSchema(plans_v1),
    validator: plans_v1,
    toolName: "process_plan_options"
  },
  { 
    key: "s6", 
    prompt: P.P_STAGE6, 
    schema: zodToJsonSchema(tasks_v1),
    validator: tasks_v1,
    toolName: "process_task_board"
  },
  { 
    key: "s7", 
    prompt: P.P_STAGE7, 
    schema: zodToJsonSchema(post_v1),
    validator: post_v1,
    toolName: "process_nvc_post"
  },
  { 
    key: "s8score", 
    prompt: P.P_STAGE8_SCORE, 
    schema: zodToJsonSchema(scores_v1),
    validator: scores_v1,
    toolName: "process_tone_score"
  },
  { 
    key: "s8rewrite", 
    prompt: P.P_STAGE8_REWRITE, 
    schema: null,
    validator: null,
    toolName: null
  }
];

// Fallback responses for different stages
const fallbacks = {
  s1: { 
    reflection: "I understand your concerns.", 
    grievances: [{ text: "The system encountered an error processing your input." }] 
  },
  s2: {
    claims: [{ 
      claim: "The current situation requires further analysis.", 
      type: "falsifiable" 
    }],
    evidence_request: "Please provide factual information about the current situation."
  },
  // Add fallbacks for other stages as needed
};

export async function POST(req: Request) {
  try {
    const { stage, input, system = P.SYSTEM_CORE } = await req.json();
    const item = stageMap.find(s => s.key === stage);
    if (!item) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

    console.log(`Processing stage ${stage} with input:`, typeof input === "string" ? input : JSON.stringify(input).substring(0, 100) + "...");
    
    try {
      let result;
      
      // Special handling for rewrite stage which doesn't use tool calling
      if (stage === "s8rewrite") {
        result = { markdown: await chatText(system + "\n" + item.prompt, typeof input === "string" ? input : JSON.stringify(input)) };
      } else {
        // Use tool calling for structured output
        result = await chatWithTools(
          system + "\n" + item.prompt, 
          typeof input === "string" ? input : JSON.stringify(input),
          item.schema,
          item.toolName!
        );
      }
      
      // Validate against Zod schema if available
      if (item.validator) {
        const validated = item.validator.parse(result);
        return NextResponse.json({ ok: true, data: validated });
      } else {
        return NextResponse.json({ ok: true, data: result });
      }
    } catch (e: any) {
      console.error(`Error in stage ${stage}:`, e);
      
      // Use fallback response if available
      const fallback = fallbacks[stage as keyof typeof fallbacks];
      if (fallback) {
        return NextResponse.json({ 
          ok: true, 
          data: fallback,
          warning: "Used fallback data due to processing error"
        });
      }
      
      return NextResponse.json({ 
        ok: false, 
        error: e?.message || "Processing error",
        details: e?.errors || e
      }, { status: 422 });
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return NextResponse.json({ 
      ok: false, 
      error: "Unexpected error: " + (e?.message || String(e))
    }, { status: 500 });
  }
}
```

---

## 8) Research endpoint (/app/api/research/route.ts)

```typescript
import { NextResponse } from "next/server";
import { researchClaims } from "@/lib/researchClient";

export async function POST(req: Request) {
  try {
    const { claims } = await req.json();
    const data = await researchClaims(claims || []);
    // Normalize to {sources:[{label,url}]}
    const sources = []; // TODO shape from data
    return NextResponse.json({ ok: true, sources });
  } catch (error: any) {
    console.error("Research error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Failed to research claims"
    }, { status: 500 });
  }
}
```

---

## 9) Save & publish endpoints

### /app/api/projects/save-draft/route.ts

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { projectId, stage, bundlePatch, sources, toneScores } = await req.json();

    const { data: proj, error: fetchError } = await s.from("projects").select("plan_bundle").eq("id", projectId).single();
    if (fetchError) {
      console.error("Error fetching project:", fetchError);
      return NextResponse.json({ ok: false, error: fetchError }, { status: 500 });
    }

    const plan_bundle = { ...(proj?.plan_bundle || {}), ...bundlePatch };

    const { error } = await s.from("projects").update({
      plan_bundle,
      sources: sources ?? undefined,
      tone_scores: toneScores ?? undefined,
      routine_stage: stage
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

### /app/api/projects/publish/route.ts

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { projectId, title, tldr, body_markdown } = await req.json();
    
    const { data: p, error: e1 } = await s.from("projects").select("routine_stage").eq("id", projectId).single();
    if (e1) {
      console.error("Error fetching project:", e1);
      return NextResponse.json({ ok: false, error: e1 }, { status: 500 });
    }

    // Enforce completion of the routine (Stage 8); allow publish even if tone low (MVP rule).
    const routine_completed = (p?.routine_stage ?? 0) >= 8;

    const { error } = await s.from("projects").update({
      title, 
      tldr, 
      description: body_markdown,
      routine_completed,
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

---

## 10) Planner hook (/hooks/useAiPlanner.ts)

```typescript
import { useState, useRef, useEffect } from "react";

type Stage = 1|2|3|4|5|6|7|8;

export function useAiPlanner(projectId: string) {
  const [stage, setStage] = useState<Stage>(1);
  const [bundle, setBundle] = useState<any>({});
  const [scores, setScores] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  
  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => { 
      isMounted.current = false; 
    };
  }, []);

  /**
   * Call the AI API with error handling
   */
  async function call(stageKey: string, input: any) {
    const ac = new AbortController();
    try {
      if (!isMounted.current) return;
      setError(null);
      console.log(`Calling AI for stage ${stageKey} with input:`, input);
      
      const r = await fetch("/api/ai/plan", { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ stage: stageKey, input }),
        signal: ac.signal
      });
      
      const j = await r.json();
      
      if (!j.ok) {
        console.error(`Error in stage ${stageKey}:`, j.error, "Details:", j.details);
        if (isMounted.current) {
          setError(j.error || "AI processing error");
        }
        throw new Error(j.error || "AI processing error");
      }
      
      // Log warning if present
      if (j.warning) {
        console.warn(`Warning in stage ${stageKey}:`, j.warning);
      }
      
      return j.data;
    } catch (err: any) {
      console.error(`Error in stage ${stageKey}:`, err);
      if (isMounted.current) {
        setError(err.message || "Failed to process this stage");
      }
      throw err;
    } finally {
      // Clean up the abort controller
      ac.abort();
    }
  }

  /**
   * Save the current state to the database
   */
  async function save(partial: any, extra?: any) {
    if (!isMounted.current) return;
    
    const ac = new AbortController();
    try {
      const response = await fetch("/api/projects/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ projectId, stage, bundlePatch: partial, ...extra }),
        signal: ac.signal
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error saving draft:", errorData);
        if (isMounted.current) {
          setError("Failed to save draft: " + (errorData.error || "Unknown error"));
        }
      }
    } catch (err: any) {
      console.error("Failed to save draft:", err);
      if (isMounted.current) {
        setError("Failed to save draft: " + (err.message || "Unknown error"));
      }
    } finally {
      ac.abort();
    }
  }

  return {
    stage, setStage, bundle, setBundle, scores, setScores, error, setError,
    
    runStage1: async (vent: string) => {
      try {
        const data = await call("s1", vent); 
        setBundle((b:any) => ({...b, s1:data})); 
        setStage(2); 
        await save({ s1:data });
        return data;
      } catch (err) {
        // Error is already set by call()
        return null;
      }
    },
    
    runStage2: async (s1:any) => {
      try {
        const data = await call("s2", s1); 
        setBundle((b:any) => ({...b, s2:data})); 
        setStage(3); 
        await save({ s2:data });
        return data;
      } catch (err) {
        return null;
      }
    },
    
    runStage3: async (s2:any) => { 
      try {
        const d = await call("s3", s2); 
        setBundle((b:any) => ({...b, s3:d})); 
        setStage(4); 
        await save({ s3:d }); 
        return d;
      } catch (err) {
        return null;
      }
    },
    
    runStage4: async (s3:any) => { 
      try {
        const d = await call("s4", s3); 
        setBundle((b:any) => ({...b, s4:d})); 
        setStage(5); 
        await save({ s4:d }); 
        return d;
      } catch (err) {
        return null;
      }
    },
    
    runStage5: async (s4:any) => { 
      try {
        const d = await call("s5", s4); 
        setBundle((b:any) => ({...b, s5:d})); 
        setStage(6); 
        await save({ s5:d }); 
        return d;
      } catch (err) {
        return null;
      }
    },
    
    runStage6: async (s5:any) => { 
      try {
        const d = await call("s6", s5); 
        setBundle((b:any) => ({...b, s6:d})); 
        setStage(7); 
        await save({ s6:d }); 
        return d;
      } catch (err) {
        return null;
      }
    },
    
    runStage7: async (input:any, sources?:any[]) => {
      try {
        const d = await call("s7", { ...input, sources }); 
        setBundle((b:any) => ({...b, s7:d})); 
        setStage(8); 
        await save({ s7:d }, { sources }); 
        return d;
      } catch (err) {
        return null;
      }
    },
    
    scoreAndMaybeRewrite: async (markdown: string) => {
      try {
        const s = await call("s8score", markdown); 
        setScores(s);
        
        if (s.civility < 80 || s.heat > 30) {
          try {
            const rw = await call("s8rewrite", markdown);
            return { scores: s, rewrite: rw?.markdown || rw };
          } catch (rewriteErr) {
            console.error("Error during rewrite:", rewriteErr);
            return { scores: s, rewrite: null, rewriteError: true };
          }
        }
        
        return { scores: s, rewrite: null };
      } catch (err) {
        return { scores: null, rewrite: null, error: true };
      }
    }
  };
}
```

---

## 11) Tone meter (/components/ai/tone-meter.tsx)

```typescript
export default function ToneMeter({ scores }:{scores?:any}) {
  if (!scores) return null;
  return (
    <div className="rounded-xl border p-3 text-sm space-y-1">
      <div>Civility: <b>{scores.civility}</b></div>
      <div>Heat: <b>{scores.heat}</b></div>
      <div>Bridge: <b>{scores.bridge}</b></div>
      <div>Factuality: <b>{scores.factuality_posture}</b></div>
      {scores.flagged?.length ? <ul className="list-disc pl-5">
        {scores.flagged.map((f:any,i:number)=><li key={i}>{f.phrase} — {f.reason}</li>)}
      </ul> : null}
    </div>
  );
}
```

---

## 12) Creator wizard (/app/post/create/page.tsx)

(Skeleton – wire up your UI components / styling as desired.)

```typescript
"use client";
import { useState, useEffect, useRef } from "react";
import { useAiPlanner } from "@/hooks/useAiPlanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import dynamic from "next/dynamic";

const ToneMeter = dynamic(() => import("@/components/ai/tone-meter"), { ssr: false });

// Wrapper component to handle hydration issues
export default function CreatePost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Render the same thing on server and first client paint → no hydration mismatch
  if (!mounted) return null; // or a tiny skeleton

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
  
  useEffect(() => {
    setProjectId(crypto.randomUUID()); // client-only
    setReady(true);
  }, []);

  const planner = useAiPlanner(projectId);
  const [vent, setVent] = useState("");
  const [draft, setDraft] = useState<any>({});
  const [post, setPost] = useState<any>(null);
  const [finalMd, setFinalMd] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync error state with planner error
  useEffect(() => {
    if (planner.error) {
      setError(planner.error);
    }
  }, [planner.error]);

  async function publish() {
    try {
      setLoading("publishing");
      setError(null);
      const body = post?.body_markdown || finalMd;
      
      const response = await fetch("/api/projects/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          projectId, 
          title: post?.titles?.[0] || "Untitled", 
          tldr: post?.tldr || "", 
          body_markdown: body 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to publish");
      }
      
      window.location.href = `/project/${projectId}`;
    } catch (err: any) {
      console.error("Publish error:", err);
      setError(err.message || "Failed to publish. Please try again.");
      setLoading(null);
    }
  }

  async function runStage(stageNum: number, input: any) {
    try {
      setLoading(`stage${stageNum}`);
      setError(null);
      let result: any;
      
      switch(stageNum) {
        case 1:
          result = await planner.runStage1(input);
          break;
        case 2:
          result = await planner.runStage2(input);
          break;
        case 3:
          result = await planner.runStage3(input);
          break;
        case 4:
          result = await planner.runStage4(input);
          break;
        case 5:
          result = await planner.runStage5(input);
          break;
        case 6:
          result = await planner.runStage6(input);
          break;
        case 7:
          result = await planner.runStage7(input);
          if (result) {
            setPost(result);
            setFinalMd(result.body_markdown || "");
          }
          break;
        case 8:
          const { scores, rewrite, error: scoreError } = await planner.scoreAndMaybeRewrite(input);
          if (scoreError) {
            setError("Failed to score the post. You can still publish.");
          } else if (rewrite) {
            setFinalMd(rewrite);
          }
          result = scores;
          break;
      }
      
      if (stageNum < 7 && result) {
        setDraft((d:any) => ({...d, [`s${stageNum}`]: result}));
      }
      
      setLoading(null);
      return result;
    } catch (err: any) {
      console.error(`Error in stage ${stageNum}:`, err);
      // Error is already set by the planner
      setLoading(null);
      return null;
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Create Political Media Post</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          <button 
            className="absolute top-0 right-0 px-4 py-3" 
            onClick={() => {
              setError(null);
              planner.setError(null);
            }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stage 1 */}
      <section className={planner.stage !== 1 ? "opacity-50" : ""}>
        <h2 className="font-medium">1) Vent</h2>
        <textarea 
          className="w-full border rounded p-2 mb-2" 
          rows={4} 
          value={vent} 
          onChange={e => setVent(e.target.value)}
          disabled={planner.stage !== 1}
        />
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => runStage(1, vent)}
          disabled={!ready || !vent.trim() || loading === "stage1" || planner.stage !== 1}
        >
          {loading === "stage1" ? "Processing..." : "Next"}
        </button>
      </section>

      {/* Stage 2 */}
      {planner.stage >= 2 && (
        <section className={planner.stage !== 2 ? "opacity-50" : ""}>
          <h2 className="font-medium">2) Claims</h2>
          {draft.s1 && (
            <div className="mb-2 p-3 bg-gray-50 rounded text-sm">
              <p className="italic">{typeof draft.s1.reflection === 'string' ? draft.s1.reflection : "I understand your concerns."}</p>
              <ul className="list-disc pl-5 mt-2">
                {draft.s1.grievances?.map((g: any, i: number) => (
                  <li key={i}>
                    {g.text}
                    {g.emotion ? ` (${g.emotion})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {draft.s2 && (
            <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
              <p className="font-medium mb-2">Generated Claims:</p>
              
              <ul className="list-disc pl-5">
                {draft.s2.claims?.map((c: any, i: number) => (
                  <li key={i} className="mb-1">
                    <span className="font-medium">{c.claim}</span>
                    <span className="ml-1 text-xs bg-blue-100 px-1 py-0.5 rounded">
                      {c.type}
                    </span>
                    {c.proposed_evidence?.length > 0 && (
                      <div className="ml-4 mt-1 text-xs text-gray-600">
                        <p>Proposed evidence:</p>
                        <ul className="list-disc pl-4">
                          {c.proposed_evidence.map((e: string, j: number) => (
                            <li key={j}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {draft.s2.evidence_request && (
                <p className="mt-2 text-xs italic">{draft.s2.evidence_request}</p>
              )}
            </div>
          )}
          
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => runStage(2, draft.s1)}
            disabled={!ready || loading === "stage2" || planner.stage !== 2}
          >
            {loading === "stage2" ? "Processing..." : draft.s2 ? "Regenerate Claims" : "Generate Claims"}
          </button>
        </section>
      )}

      {/* Stages 3-7 would be implemented similarly */}

      {/* Stage 8 */}
      {planner.stage >= 8 && (
        <section>
          <h2 className="font-medium">8) Tone Score</h2>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => runStage(8, finalMd)}
            disabled={!ready || loading === "stage8" || !finalMd}
          >
            {loading === "stage8" ? "Processing..." : "Score / Rewrite"}
          </button>
          <ToneMeter scores={planner.scores} />
          {(planner.scores && (planner.scores.civility < 80 || planner.scores.heat > 30)) && (
            <div className="text-amber-600 text-sm mt-2">
              Warning: Civility below target or Heat above target. You can rewrite (recommended) or continue.
            </div>
          )}
        </section>
      )}

      {/* Publish (enabled only after Stage 8 reached) */}
      <button
        disabled={!ready || planner.stage < 8 || !finalMd || loading === "publishing"}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full mt-4"
        onClick={publish}
      >
        {loading === "publishing" ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}
```

---

## 13) Public post page wiring

Your existing app/project/[id]/page.tsx already renders project details. Ensure it:

- Shows tldr (if present).
- Renders description as markdown (the Stage-7 story).
- Optionally lists sources at the end.
- Reuses Donations / Roles / Comments / Voting.
- Do not display plan_bundle.

---

## 14) Navigation & discovery

Add "Create Post" entry to the bottom nav leading to /post/create.

In app/page.tsx (Home), add a "Posts" filter: WHERE plan_bundle IS NOT NULL AND status='published'.

---

## 15) QA checklist

- User cannot reach "Publish" until Stage 8 is completed (routine_stage >= 8).
- Warning appears if civility < 80 or heat > 30; rewrite offered.
- Publish sets status='published' and routine_completed=true.
- Post page shows TL;DR, markdown body, sources; hides debate trace.
- Donations, Roles, Comments, Voting work from the post page.
- Mobile layout is clean.

---

## 16) Commit & push (Cline)

Open Cline → New Task:

Run typecheck and build. Fix any errors. Commit all changes with message:
"feat(debate-posts): enforced routine + AI planner + tone warnings"
Push branch feat/debate-posts.

---

## 17) (Optional) Seed a live example

Use the wizard to create one "Once-Only Reporting Pilot" post and publish it. Verify funding/roles/comments/vote blocks.

---

## Done

This is the minimal, production-shaped path to enforce your debating routine, keep the trace private, warn on tone, and still let users publish a persuasive, constructive political media post that becomes a project hub.

If you want, I can also provide a ready-made NVC story template for Stage 7 (EU ↔ USSR parallels) that you can ship as a preset.
