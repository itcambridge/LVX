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
  // One-shot fallback with minimal structure
  oneshot: {
    concern_map: {
      themes: ["Communication", "Process Improvement"],
      claims: [{ text: "The system encountered an error processing your input.", type: "inference" }],
      values: ["Transparency", "Efficiency"],
      pains: ["Difficulty in processing the input"],
      proposals: ["Provide more specific information"]
    },
    steelman: {
      author: { points: [{ text: "Your perspective is important.", type: "value" }] },
      opponent: { points: [{ text: "Alternative viewpoints exist.", type: "value" }] }
    },
    financial_accountability: {
      metrics: [
        { name: "Cost-benefit ratio", baseline: "Unknown", target: "Positive" },
        { name: "Return on investment", baseline: "Unknown", target: "Positive" }
      ],
      distribution: {
        costs: [{ stakeholder: "All parties", impact: "Varies" }],
        benefits: [{ stakeholder: "All parties", impact: "Varies" }]
      },
      rules: { 
        sunset: "To be determined", 
        scale: "As appropriate" 
      },
      unknowns: ["Specific financial impacts"]
    },
    solution_paths: {
      paths: [
        {
          name: "Simplified approach",
          core_moves: ["Gather more information", "Consult stakeholders"],
          guardrails: ["Ensure transparency", "Maintain ethical standards"],
          trade_offs: ["Speed vs. thoroughness"]
        },
        {
          name: "Alternative approach",
          core_moves: ["Focus on key priorities", "Implement incremental changes"],
          guardrails: ["Regular feedback loops", "Clear communication channels"],
          trade_offs: ["Depth vs. breadth of implementation"]
        }
      ]
    },
    evidence_slots: {
      to_verify: [{ 
        claim: "The system encountered an error processing your specific input.", 
        source_types: ["Technical logs", "User feedback"] 
      }]
    },
    bridge_story: {
      thin_edge: "Finding common ground",
      paragraphs: [
        "We encountered a technical issue while processing your input. This is a temporary setback that we can work through together.",
        "Despite this challenge, we recognize the importance of your perspective and the need to address your concerns effectively.",
        "Moving forward, we can focus on gathering more specific information and working collaboratively toward a solution that addresses the core issues at hand."
      ],
      emphasis: "balanced"
    },
    goals: {
      messaging: [{ 
        text: "Improve communication clarity", 
        metric: "Reduced misunderstandings", 
        horizon_days: 30 
      }],
      policy: [{ 
        text: "Establish clear guidelines", 
        metric: "Documented procedures", 
        horizon_days: 60 
      }]
    },
    safety_notes: {
      warnings: ["This is a fallback response due to processing limitations."],
      rejected_content: false
    }
  },
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
        
        // Add a timeout for the entire operation (increased from 2 to 4 minutes)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out after 4 minutes")), 240000);
        });
        
        // Race between the actual processing and the timeout
        const result = await Promise.race([
          processOneShot(input, emphasis),
          timeoutPromise
        ]) as any;
        
        // Try to validate the result against the schema
        try {
          const validated = bridge_output_v1.parse(result);
          return NextResponse.json({ ok: true, data: validated });
        } catch (validationError: any) {
          console.error("Schema validation error:", validationError);
          
          // Attempt to sanitize the result
          const sanitizedResult = sanitizeResult(result, validationError);
          
          // Try to validate the sanitized result
          try {
            const validated = bridge_output_v1.parse(sanitizedResult);
            return NextResponse.json({ 
              ok: true, 
              data: validated,
              warning: "Used sanitized data due to validation errors"
            });
          } catch (secondValidationError) {
            console.error("Failed to sanitize result:", secondValidationError);
            // Fall back to the fallback response
            return NextResponse.json({ 
              ok: true, 
              data: fallbacks.oneshot,
              warning: "Used fallback data due to validation errors"
            });
          }
        }
      } catch (e: any) {
        console.error("Error in one-shot processing:", e);
        
        // Check if it's a timeout error
        if (e.message && e.message.includes("timed out")) {
          console.log("Request timed out, using fallback response");
          return NextResponse.json({ 
            ok: true, 
            data: fallbacks.oneshot,
            warning: "Used fallback data due to timeout"
          });
        }
        
        // Check if it's a JSON parsing error or HTML response
        if (e.message && (e.message.includes("JSON") || e.message.includes("parse") || e.message.includes("HTML"))) {
          console.log("JSON parsing error or HTML response, using fallback response");
          return NextResponse.json({ 
            ok: true, 
            data: fallbacks.oneshot,
            warning: "Used fallback data due to response format error: " + e.message
          });
        }
        
        // For other errors, use the fallback with more detailed error information
        console.log("Using fallback due to error:", e.message);
        return NextResponse.json({ 
          ok: true, 
          data: fallbacks.oneshot,
          warning: "Used fallback data due to processing error: " + e.message,
          error_details: {
            message: e.message,
            type: e.name || "Unknown",
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
          }
        });
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

/**
 * Sanitize the result to handle schema validation errors
 * @param result The result to sanitize
 * @param validationError The validation error
 * @returns Sanitized result
 */
function sanitizeResult(result: any, validationError: any): any {
  if (!result) return fallbacks.oneshot;
  
  try {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(result));
    
    // Extract error paths from the validation error
    const errorPaths: string[][] = [];
    if (validationError.errors) {
      validationError.errors.forEach((err: any) => {
        if (err.path) {
          errorPaths.push(err.path);
        }
      });
    }
    
    // Fix each error path
    errorPaths.forEach(path => {
      let current = sanitized;
      let fallbackCurrent: any = fallbacks.oneshot;
      
      // Navigate to the parent of the problematic field
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i] as string;
        if (current[key] === undefined) {
          current[key] = {};
        }
        current = current[key];
        
        // Also navigate the fallback
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && key in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[key];
        } else {
          fallbackCurrent = null;
        }
      }
      
      // Replace the problematic field with the fallback value
      const lastKey = path[path.length - 1] as string;
      if (fallbackCurrent && typeof fallbackCurrent === 'object' && lastKey in fallbackCurrent) {
        current[lastKey] = fallbackCurrent[lastKey];
      } else if (lastKey === 'type' && (path.includes('steelman') || path.includes('concern_map'))) {
        // Special handling for type fields in steelman and concern_map
        current[lastKey] = 'inference'; // Default to inference for invalid types
      }
    });
    
    // Ensure all required sections exist
    const requiredSections = [
      'concern_map', 'steelman', 'financial_accountability', 
      'solution_paths', 'evidence_slots', 'bridge_story', 
      'goals', 'safety_notes'
    ] as const;
    
    requiredSections.forEach(section => {
      if (!sanitized[section]) {
        sanitized[section] = (fallbacks.oneshot as any)[section];
      }
    });
    
    return sanitized;
  } catch (err) {
    console.error("Error sanitizing result:", err);
    return fallbacks.oneshot; // Return fallback if sanitization fails
  }
}
