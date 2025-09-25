import { NextResponse } from "next/server";
import { chatWithTools, chatText, processOneShot } from "@/lib/aiClient";
import * as P from "@/lib/aiPrompts";
import {
  concern_map_v1, steelman_v1, financial_accountability_v1, 
  solution_paths_v1, evidence_slots_v1, bridge_story_v1, 
  goals_v1, safety_notes_v1, bridge_output_v1, zodToJsonSchema,
  // Legacy schemas
  grievances_v1, claims_v1, map_v1, plans_v1, tasks_v1, post_v1, scores_v1
} from "@/lib/aiSchemas";

// Define stage configurations with schemas and validators
const stageMap = [
  // New one-shot approach
  { 
    key: "oneshot", 
    schema: zodToJsonSchema(bridge_output_v1),
    validator: bridge_output_v1
  },
  
  // New staged approach
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
  },
  
  // Legacy stages (keeping for backward compatibility)
  { 
    key: "legacy_s1", 
    prompt: P.P_LEGACY_STAGE1, 
    schema: zodToJsonSchema(grievances_v1),
    validator: grievances_v1,
    toolName: "process_grievances"
  },
  { 
    key: "legacy_s2", 
    prompt: P.P_LEGACY_STAGE2, 
    schema: zodToJsonSchema(claims_v1),
    validator: claims_v1,
    toolName: "process_claims"
  },
  { 
    key: "legacy_s3", 
    prompt: P.P_LEGACY_STAGE3, 
    schema: zodToJsonSchema(map_v1),
    validator: map_v1,
    toolName: "process_stakeholder_map"
  },
  { 
    key: "legacy_s4", 
    prompt: P.P_LEGACY_STAGE4, 
    schema: zodToJsonSchema(goals_v1),
    validator: goals_v1,
    toolName: "process_smart_goals"
  },
  { 
    key: "legacy_s5", 
    prompt: P.P_LEGACY_STAGE5, 
    schema: zodToJsonSchema(plans_v1),
    validator: plans_v1,
    toolName: "process_plan_options"
  },
  { 
    key: "legacy_s6", 
    prompt: P.P_LEGACY_STAGE6, 
    schema: zodToJsonSchema(tasks_v1),
    validator: tasks_v1,
    toolName: "process_task_board"
  },
  { 
    key: "legacy_s7", 
    prompt: P.P_LEGACY_STAGE7, 
    schema: zodToJsonSchema(post_v1),
    validator: post_v1,
    toolName: "process_nvc_post"
  },
  { 
    key: "legacy_s8score", 
    prompt: P.P_LEGACY_STAGE8_SCORE, 
    schema: zodToJsonSchema(scores_v1),
    validator: scores_v1,
    toolName: "process_tone_score"
  },
  { 
    key: "legacy_s8rewrite", 
    prompt: P.P_LEGACY_STAGE8_REWRITE, 
    schema: null,
    validator: null,
    toolName: null
  }
];

// Fallback responses for different stages
const fallbacks = {
  s1: { 
    themes: ["Communication", "Process Improvement"],
    claims: [{ text: "The system encountered an error processing your input.", type: "inference" }],
    values: ["Transparency", "Efficiency"],
    pains: ["Difficulty in processing the input"],
    proposals: ["Provide more specific information"]
  },
  // Legacy fallbacks
  legacy_s1: { 
    reflection: "I understand your concerns.", 
    grievances: [{ text: "The system encountered an error processing your input." }] 
  },
  legacy_s2: {
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
    const { stage, input, emphasis = "balanced", system = P.SYSTEM_CORE } = await req.json();
    
    // Handle one-shot processing
    if (stage === "oneshot") {
      try {
        console.log("Processing one-shot request with emphasis:", emphasis);
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
    
    // Handle staged processing
    const item = stageMap.find(s => s.key === stage);
    if (!item) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

    console.log(`Processing stage ${stage} with input:`, typeof input === "string" ? input : JSON.stringify(input).substring(0, 100) + "...");
    
    try {
      let result;
      
      // Special handling for rewrite stage which doesn't use tool calling
      if (stage === "rewrite" || stage === "legacy_s8rewrite") {
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
