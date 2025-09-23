\# LVX – “Debate → Plan → Political Media Post” (MVP)

\*\*with Cline in VS Code\*\*



This guide gives you exact steps (and paste-ready snippets) to ship the enforced debating routine that turns a vent into a civil, persuasive \*\*project post\*\*. Users \*\*must complete the routine\*\* before they can publish.



\- \*\*Tone policy (MVP):\*\* warn if Civility < 80 or Heat > 30 and offer “Rewrite \& Re-score”, but still allow publish after Stage 8.

\- \*\*Debate trace:\*\* stored privately in `projects.plan\_bundle` — never shown publicly.

\- \*\*Reuse\*\* your existing `projects` table; add a few columns.



---



\## 0) Prereqs



\- Repo checked out and running (`pnpm dev`).

\- Supabase project connected.

\- API keys in `.env.local`:

OPENAI\_API\_KEY=...

PERPLEXITY\_API\_KEY=...

NEXT\_PUBLIC\_SUPABASE\_URL=...

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=...



yaml

Copy code



---



\## 1) Create a feature branch



Open \*\*Cline\*\* → \*New Task\*:



Create a new branch feat/debate-posts and open the repo.



sql

Copy code



---



\## 2) Supabase migration (extend `projects`)



Open \*\*Supabase SQL editor\*\* and run:



```sql

ALTER TABLE public.projects

ADD COLUMN IF NOT EXISTS tldr text,

ADD COLUMN IF NOT EXISTS plan\_bundle jsonb,

ADD COLUMN IF NOT EXISTS sources jsonb,

ADD COLUMN IF NOT EXISTS tone\_scores jsonb,

ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',

ADD COLUMN IF NOT EXISTS routine\_completed boolean DEFAULT false,

ADD COLUMN IF NOT EXISTS routine\_stage integer DEFAULT 0;

These are the only DB changes needed. All debate artifacts live in plan\_bundle.



3\) Project structure \& files (Cline tasks)

Open Cline → New Task:



swift

Copy code

Create the following files with the provided content:



/lib/aiSchemas.ts

/lib/aiPrompts.ts

/lib/aiClient.ts

/lib/researchClient.ts

/app/api/ai/plan/route.ts

/app/api/research/route.ts

/app/api/projects/save-draft/route.ts

/app/api/projects/publish/route.ts

/hooks/useAiPlanner.ts

/components/ai/tone-meter.tsx

/app/post/create/page.tsx

Paste the snippets below when Cline asks for content.



4\) Zod schemas (/lib/aiSchemas.ts)

ts

Copy code

import { z } from "zod";



export const grievances\_v1 = z.object({

&nbsp; reflection: z.string(),

&nbsp; grievances: z.array(z.object({

&nbsp;   text: z.string(),

&nbsp;   emotion: z.string().optional()

&nbsp; })).min(1)

});



export const claims\_v1 = z.object({

&nbsp; claims: z.array(z.object({

&nbsp;   claim: z.string(),

&nbsp;   type: z.enum(\["falsifiable", "obstacle"]),

&nbsp;   proposed\_evidence: z.array(z.string()).optional()

&nbsp; })),

&nbsp; evidence\_request: z.string()

});



export const map\_v1 = z.object({

&nbsp; analyses: z.array(z.object({

&nbsp;   claim: z.string(),

&nbsp;   steelman: z.string(),

&nbsp;   stakeholders: z.array(z.object({

&nbsp;     role: z.string(),

&nbsp;     name\_or\_type: z.string(),

&nbsp;     influence: z.enum(\["low","med","high"]),

&nbsp;     likely\_concerns: z.array(z.string()).optional(),

&nbsp;     shared\_interests: z.array(z.string()).optional()

&nbsp;   }))

&nbsp; }))

});



export const goals\_v1 = z.object({

&nbsp; goals: z.array(z.object({

&nbsp;   title: z.string(),

&nbsp;   why\_now: z.string(),

&nbsp;   metric: z.object({

&nbsp;     name: z.string(),

&nbsp;     baseline: z.string().nullable(),

&nbsp;     target: z.string(),

&nbsp;     deadline\_days: z.number()

&nbsp;   }),

&nbsp;   owner\_role: z.string(),

&nbsp;   legitimacy\_check: z.array(z.string())

&nbsp; })).min(1)

});



export const plans\_v1 = z.object({

&nbsp; plans: z.array(z.object({

&nbsp;   name: z.string(), // Fast/Low-cost | Balanced | Ambitious

&nbsp;   steps: z.array(z.object({ desc: z.string(), eta\_days: z.number() })),

&nbsp;   time\_range\_days: z.tuple(\[z.number(), z.number()]),

&nbsp;   budget\_range: z.tuple(\[z.string(), z.string()]),

&nbsp;   risks: z.array(z.string()).optional(),

&nbsp;   dependencies: z.array(z.string()).optional(),

&nbsp;   success\_metrics: z.array(z.string()).optional()

&nbsp; })).length(3)

});



export const tasks\_v1 = z.object({

&nbsp; roles: z.array(z.string()),

&nbsp; sprint\_weeks: z.array(z.object({

&nbsp;   week: z.number(),

&nbsp;   milestones: z.array(z.string()),

&nbsp;   tasks: z.array(z.object({

&nbsp;     title: z.string(),

&nbsp;     owner\_role: z.string()

&nbsp;   }))

&nbsp; }))

});



export const post\_v1 = z.object({

&nbsp; titles: z.array(z.string()).min(1),

&nbsp; tldr: z.string(),

&nbsp; body\_markdown: z.string(),

&nbsp; sources: z.array(z.object({

&nbsp;   label: z.string(),

&nbsp;   url: z.string().url()

&nbsp; })).optional()

});



export const scores\_v1 = z.object({

&nbsp; civility: z.number(),

&nbsp; heat: z.number(),

&nbsp; bridge: z.number(),

&nbsp; factuality\_posture: z.number(),

&nbsp; flagged: z.array(z.object({ phrase: z.string(), reason: z.string() })).optional(),

&nbsp; meets\_thresholds: z.boolean()

});

5\) Stage prompts (/lib/aiPrompts.ts)

ts

Copy code

export const SYSTEM\_CORE =

`You are a neutral de-escalation planner. You:

1\) validate feelings,

2\) distill grievances into falsifiable claims,

3\) STEELMAN opponents,

4\) propose SMART goals,

5\) produce 3 plan options,

6\) create a task board,

7\) craft a Nonviolent Communication (NVC) story post,

8\) score tone (Civility, Heat, Bridge, Factuality).

Always lawful, non-violent, no doxxing or harassment. Critique systems/policies, not people/groups. Keep debate artifacts concise and structured JSON.`;



export const P\_STAGE1 = `Reflect the user's feeling in ONE sentence ("It sounds like you feel ... because ..."), then extract 3–6 NEUTRAL grievances (no labels/blame). Output JSON per grievances\_v1.`;



export const P\_STAGE2 = `Turn each grievance into a falsifiable claim or concrete obstacle. Propose evidence categories (laws, budgets, stats, case studies). Output claims\_v1.`;



export const P\_STAGE3 = `For each claim: (a) good-faith steelman (1–2 sentences), (b) stakeholder map (role, name\_or\_type, influence, likely concerns, shared interests). Output map\_v1.`;



export const P\_STAGE4 = `Propose 1–3 SMART goals (lawful, non-violent). Include metric {name, baseline?, target, deadline\_days}, owner\_role, legitimacy\_check. Output goals\_v1.`;



export const P\_STAGE5 = `Generate exactly three plan options: Fast/Low-cost, Balanced, Ambitious. Include steps, time\_range\_days, budget\_range, risks, dependencies, success\_metrics. Output plans\_v1.`;



export const P\_STAGE6 = `List roles we need (e.g., Research Lead, Policy, Legal, Outreach, Comms, Fundraising, Design, Engineering). Create a 6–8 week task board. Output tasks\_v1.`;



export const P\_STAGE7 = `Draft a 400–600 word post in NVC style:

\- Open with shared values + one verifiable observation.

\- Include the best opposing concern (steelman nod).

\- State the concrete goal and plan options.

\- Make a respectful, specific request to a stakeholder.

\- End with a "join" CTA.

If sources are provided, include an optional "Sources" list.

Return post\_v1.`;



export const P\_STAGE8\_SCORE = `Score the provided text (0–100) on Civility, Heat (anger/absolutes), Bridge (shared values + concrete invites), and Factuality posture. Flag phrases that raise heat. Return scores\_v1. Thresholds: Civility≥80, Heat≤30.`;



export const P\_STAGE8\_REWRITE = `Rewrite to reduce Heat and increase Civility/Bridge while preserving the core ask and specificity. Replace accusations with effects, add one explicit concession, keep ≤600 words. Return ONLY the rewritten markdown.`;

6\) OpenAI \& Perplexity clients

/lib/aiClient.ts



ts

Copy code

import OpenAI from "openai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI\_API\_KEY! });



export async function chatJSON(system: string, user: string) {

&nbsp; const res = await openai.chat.completions.create({

&nbsp;   model: "gpt-4o-mini", // or your chosen model

&nbsp;   response\_format: { type: "json\_object" },

&nbsp;   messages: \[{ role: "system", content: system }, { role: "user", content: user }]

&nbsp; });

&nbsp; return res.choices\[0]?.message?.content ?? "{}";

}

/lib/researchClient.ts



ts

Copy code

export async function researchClaims(claims: string\[]) {

&nbsp; // Replace endpoint/model per your Perplexity plan.

&nbsp; const r = await fetch("https://api.perplexity.ai/chat/completions", {

&nbsp;   method: "POST",

&nbsp;   headers: {

&nbsp;     "Authorization": `Bearer ${process.env.PERPLEXITY\_API\_KEY!}`,

&nbsp;     "Content-Type": "application/json"

&nbsp;   },

&nbsp;   body: JSON.stringify({

&nbsp;     model: "sonar-large-online", // placeholder

&nbsp;     messages: \[{

&nbsp;       role: "user",

&nbsp;       content: `For each of these claims, return 3–5 reputable sources (title + url + 1-line summary). Claims: ${claims.join(" | ")}`

&nbsp;     }]

&nbsp;   })

&nbsp; });

&nbsp; const data = await r.json();

&nbsp; // Normalize to \[{label,url}] minimal structure expected by post\_v1

&nbsp; return data; // shape to fit your UI

}

7\) AI Stage Router (/app/api/ai/plan/route.ts)

ts

Copy code

import { NextResponse } from "next/server";

import { chatJSON } from "@/lib/aiClient";

import \* as P from "@/lib/aiPrompts";

import { z } from "zod";

import {

&nbsp; grievances\_v1, claims\_v1, map\_v1, goals\_v1, plans\_v1, tasks\_v1, post\_v1, scores\_v1

} from "@/lib/aiSchemas";



const stageMap = \[

&nbsp; { key: "s1", prompt: P.P\_STAGE1, schema: grievances\_v1 },

&nbsp; { key: "s2", prompt: P.P\_STAGE2, schema: claims\_v1 },

&nbsp; { key: "s3", prompt: P.P\_STAGE3, schema: map\_v1 },

&nbsp; { key: "s4", prompt: P.P\_STAGE4, schema: goals\_v1 },

&nbsp; { key: "s5", prompt: P.P\_STAGE5, schema: plans\_v1 },

&nbsp; { key: "s6", prompt: P.P\_STAGE6, schema: tasks\_v1 },

&nbsp; { key: "s7", prompt: P.P\_STAGE7, schema: post\_v1 },

&nbsp; { key: "s8score", prompt: P.P\_STAGE8\_SCORE, schema: scores\_v1 },

&nbsp; { key: "s8rewrite", prompt: P.P\_STAGE8\_REWRITE, schema: null }

];



export async function POST(req: Request) {

&nbsp; const { stage, input, system = P.SYSTEM\_CORE } = await req.json();

&nbsp; const item = stageMap.find(s => s.key === stage);

&nbsp; if (!item) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });



&nbsp; const raw = await chatJSON(system, typeof input === "string" ? input : JSON.stringify(input));

&nbsp; try {

&nbsp;   const parsed = item.schema ? item.schema.parse(JSON.parse(raw)) : { markdown: raw };

&nbsp;   return NextResponse.json({ ok: true, data: parsed });

&nbsp; } catch (e:any) {

&nbsp;   return NextResponse.json({ ok: false, error: e?.message, raw }, { status: 422 });

&nbsp; }

}

8\) Research endpoint (/app/api/research/route.ts)

ts

Copy code

import { NextResponse } from "next/server";

import { researchClaims } from "@/lib/researchClient";



export async function POST(req: Request) {

&nbsp; const { claims } = await req.json();

&nbsp; const data = await researchClaims(claims || \[]);

&nbsp; // Normalize to {sources:\[{label,url}]}

&nbsp; const sources = \[]; // TODO shape from data

&nbsp; return NextResponse.json({ ok: true, sources });

}

9\) Save \& publish endpoints

/app/api/projects/save-draft/route.ts



ts

Copy code

import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";



const s = createClient(process.env.NEXT\_PUBLIC\_SUPABASE\_URL!, process.env.NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY!);



export async function POST(req: Request) {

&nbsp; const { projectId, stage, bundlePatch, sources, toneScores } = await req.json();



&nbsp; const { data: proj } = await s.from("projects").select("plan\_bundle").eq("id", projectId).single();

&nbsp; const plan\_bundle = { ...(proj?.plan\_bundle || {}), ...bundlePatch };



&nbsp; const { error } = await s.from("projects").update({

&nbsp;   plan\_bundle,

&nbsp;   sources: sources ?? undefined,

&nbsp;   tone\_scores: toneScores ?? undefined,

&nbsp;   routine\_stage: stage

&nbsp; }).eq("id", projectId);



&nbsp; if (error) return NextResponse.json({ ok:false, error }, { status: 500 });

&nbsp; return NextResponse.json({ ok:true });

}

/app/api/projects/publish/route.ts



ts

Copy code

import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";



const s = createClient(process.env.NEXT\_PUBLIC\_SUPABASE\_URL!, process.env.NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY!);



export async function POST(req: Request) {

&nbsp; const { projectId, title, tldr, body\_markdown } = await req.json();

&nbsp; const { data: p, error: e1 } = await s.from("projects").select("routine\_stage").eq("id", projectId).single();

&nbsp; if (e1) return NextResponse.json({ ok:false, error: e1 }, { status: 500 });



&nbsp; // Enforce completion of the routine (Stage 8); allow publish even if tone low (MVP rule).

&nbsp; const routine\_completed = (p?.routine\_stage ?? 0) >= 8;



&nbsp; const { error } = await s.from("projects").update({

&nbsp;   title, tldr, description: body\_markdown,

&nbsp;   routine\_completed,

&nbsp;   status: "published"

&nbsp; }).eq("id", projectId);



&nbsp; if (error) return NextResponse.json({ ok:false, error }, { status: 500 });

&nbsp; return NextResponse.json({ ok:true });

}

10\) Planner hook (/hooks/useAiPlanner.ts)

ts

Copy code

import { useState } from "react";



type Stage = 1|2|3|4|5|6|7|8;



export function useAiPlanner(projectId: string) {

&nbsp; const \[stage, setStage] = useState<Stage>(1);

&nbsp; const \[bundle, setBundle] = useState<any>({});

&nbsp; const \[scores, setScores] = useState<any>(null);



&nbsp; async function call(stageKey: string, input: any) {

&nbsp;   const r = await fetch("/api/ai/plan", { method:"POST", body: JSON.stringify({ stage: stageKey, input }) });

&nbsp;   const j = await r.json();

&nbsp;   if (!j.ok) throw new Error(j.error || "AI error");

&nbsp;   return j.data;

&nbsp; }



&nbsp; async function save(partial: any, extra?: any) {

&nbsp;   await fetch("/api/projects/save-draft", {

&nbsp;     method:"POST",

&nbsp;     body: JSON.stringify({ projectId, stage, bundlePatch: partial, ...extra })

&nbsp;   });

&nbsp; }



&nbsp; return {

&nbsp;   stage, setStage, bundle, setBundle, scores, setScores,

&nbsp;   runStage1: async (vent: string) => {

&nbsp;     const data = await call("s1", vent); setBundle((b:any)=>({...b, s1:data})); setStage(2); await save({ s1:data });

&nbsp;     return data;

&nbsp;   },

&nbsp;   runStage2: async (s1:any) => {

&nbsp;     const data = await call("s2", s1); setBundle((b:any)=>({...b, s2:data})); setStage(3); await save({ s2:data });

&nbsp;     return data;

&nbsp;   },

&nbsp;   runStage3: async (s2:any) => { const d = await call("s3", s2); setBundle((b:any)=>({...b, s3:d})); setStage(4); await save({ s3:d }); return d; },

&nbsp;   runStage4: async (s3:any) => { const d = await call("s4", s3); setBundle((b:any)=>({...b, s4:d})); setStage(5); await save({ s4:d }); return d; },

&nbsp;   runStage5: async (s4:any) => { const d = await call("s5", s4); setBundle((b:any)=>({...b, s5:d})); setStage(6); await save({ s5:d }); return d; },

&nbsp;   runStage6: async (s5:any) => { const d = await call("s6", s5); setBundle((b:any)=>({...b, s6:d})); setStage(7); await save({ s6:d }); return d; },

&nbsp;   runStage7: async (input:any, sources?:any\[]) => {

&nbsp;     const d = await call("s7", { ...input, sources }); setBundle((b:any)=>({...b, s7:d})); setStage(8); await save({ s7:d }, { sources }); return d;

&nbsp;   },

&nbsp;   scoreAndMaybeRewrite: async (markdown: string) => {

&nbsp;     const s = await call("s8score", markdown); setScores(s);

&nbsp;     if (s.civility < 80 || s.heat > 30) {

&nbsp;       const rw = await call("s8rewrite", markdown);

&nbsp;       return { scores: s, rewrite: rw?.markdown || rw };

&nbsp;     }

&nbsp;     return { scores: s, rewrite: null };

&nbsp;   }

&nbsp; };

}

11\) Tone meter (/components/ai/tone-meter.tsx)

tsx

Copy code

export default function ToneMeter({ scores }:{scores?:any}) {

&nbsp; if (!scores) return null;

&nbsp; return (

&nbsp;   <div className="rounded-xl border p-3 text-sm space-y-1">

&nbsp;     <div>Civility: <b>{scores.civility}</b></div>

&nbsp;     <div>Heat: <b>{scores.heat}</b></div>

&nbsp;     <div>Bridge: <b>{scores.bridge}</b></div>

&nbsp;     <div>Factuality: <b>{scores.factuality\_posture}</b></div>

&nbsp;     {scores.flagged?.length ? <ul className="list-disc pl-5">

&nbsp;       {scores.flagged.map((f:any,i:number)=><li key={i}>{f.phrase} — {f.reason}</li>)}

&nbsp;     </ul> : null}

&nbsp;   </div>

&nbsp; );

}

12\) Creator wizard (/app/post/create/page.tsx)

(Skeleton – wire up your UI components / styling as desired.)



tsx

Copy code

"use client";

import { useState } from "react";

import { useAiPlanner } from "@/hooks/useAiPlanner";

import ToneMeter from "@/components/ai/tone-meter";



export default function CreatePost() {

&nbsp; const \[projectId] = useState<string>(crypto.randomUUID()); // or create a draft project row first

&nbsp; const planner = useAiPlanner(projectId);

&nbsp; const \[vent, setVent] = useState("");

&nbsp; const \[draft, setDraft] = useState<any>({});

&nbsp; const \[post, setPost] = useState<any>(null);

&nbsp; const \[finalMd, setFinalMd] = useState("");



&nbsp; async function publish() {

&nbsp;   const body = post?.body\_markdown || finalMd;

&nbsp;   await fetch("/api/projects/publish", {

&nbsp;     method:"POST",

&nbsp;     body: JSON.stringify({ projectId, title: post?.titles?.\[0] || "Untitled", tldr: post?.tldr || "", body\_markdown: body })

&nbsp;   });

&nbsp;   window.location.href = `/project/${projectId}`;

&nbsp; }



&nbsp; return (

&nbsp;   <div className="max-w-xl mx-auto p-4 space-y-6">

&nbsp;     <h1 className="text-xl font-semibold">Create Political Media Post</h1>



&nbsp;     {/\* Stage 1 \*/}

&nbsp;     <section>

&nbsp;       <h2 className="font-medium">1) Vent</h2>

&nbsp;       <textarea className="w-full border rounded p-2" rows={4} value={vent} onChange={e=>setVent(e.target.value)} />

&nbsp;       <button className="btn" onClick={async ()=>{

&nbsp;         const s1 = await planner.runStage1(vent); setDraft((d:any)=>({...d, s1}));

&nbsp;       }}>Next</button>

&nbsp;     </section>



&nbsp;     {/\* Repeat similarly for Stages 2–6 using planner.runStageX(...) \*/}



&nbsp;     {/\* Stage 7 \*/}

&nbsp;     <section>

&nbsp;       <h2 className="font-medium">7) Draft Story</h2>

&nbsp;       <button className="btn" onClick={async ()=>{

&nbsp;         const p = await planner.runStage7({ ...draft }); setPost(p); setFinalMd(p.body\_markdown);

&nbsp;       }}>Generate Post</button>

&nbsp;       {post \&\& (

&nbsp;         <div>

&nbsp;           <h3 className="mt-3">Preview</h3>

&nbsp;           <textarea className="w-full border rounded p-2" rows={12} value={finalMd} onChange={e=>setFinalMd(e.target.value)} />

&nbsp;         </div>

&nbsp;       )}

&nbsp;     </section>



&nbsp;     {/\* Stage 8 \*/}

&nbsp;     <section>

&nbsp;       <h2 className="font-medium">8) Tone Score</h2>

&nbsp;       <button className="btn" onClick={async ()=>{

&nbsp;         const { scores, rewrite } = await planner.scoreAndMaybeRewrite(finalMd);

&nbsp;         if (rewrite) setFinalMd(rewrite);

&nbsp;       }}>Score / Rewrite</button>

&nbsp;       <ToneMeter scores={planner.scores} />

&nbsp;       {(planner.scores \&\& (planner.scores.civility < 80 || planner.scores.heat > 30)) \&\& (

&nbsp;         <div className="text-amber-600 text-sm">

&nbsp;           Warning: Civility below target or Heat above target. You can rewrite (recommended) or continue.

&nbsp;         </div>

&nbsp;       )}

&nbsp;     </section>



&nbsp;     {/\* Publish (enabled only after Stage 8 reached) \*/}

&nbsp;     <button

&nbsp;       disabled={planner.stage < 8}

&nbsp;       className="btn-primary disabled:opacity-50"

&nbsp;       onClick={publish}

&nbsp;     >

&nbsp;       Publish

&nbsp;     </button>

&nbsp;   </div>

&nbsp; );

}

Policy enforcement (MVP): We allow publish after Stage 8 even if scores are low — but we warn and offer an auto-rewrite first.



13\) Public post page wiring

Your existing app/project/\[id]/page.tsx already renders project details. Ensure it:



Shows tldr (if present).



Renders description as markdown (the Stage-7 story).



Optionally lists sources at the end.



Reuses Donations / Roles / Comments / Voting.



Do not display plan\_bundle.



14\) Navigation \& discovery

Add “Create Post” entry to the bottom nav leading to /post/create.



In app/page.tsx (Home), add a “Posts” filter: WHERE plan\_bundle IS NOT NULL AND status='published'.



15\) QA checklist

&nbsp;User cannot reach “Publish” until Stage 8 is completed (routine\_stage >= 8).



&nbsp;Warning appears if civility < 80 or heat > 30; rewrite offered.



&nbsp;Publish sets status='published' and routine\_completed=true.



&nbsp;Post page shows TL;DR, markdown body, sources; hides debate trace.



&nbsp;Donations, Roles, Comments, Voting work from the post page.



&nbsp;Mobile layout is clean.



16\) Commit \& push (Cline)

Open Cline → New Task:



sql

Copy code

Run typecheck and build. Fix any errors. Commit all changes with message:

"feat(debate-posts): enforced routine + AI planner + tone warnings"

Push branch feat/debate-posts.

17\) (Optional) Seed a live example

Use the wizard to create one “Once-Only Reporting Pilot” post and publish it. Verify funding/roles/comments/vote blocks.



Done

This is the minimal, production-shaped path to enforce your debating routine, keep the trace private, warn on tone, and still let users publish a persuasive, constructive political media post that becomes a project hub.



If you want, I can also provide a ready-made NVC story template for Stage 7 (EU ↔ USSR parallels) that you can ship as a preset.

