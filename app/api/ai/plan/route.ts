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
