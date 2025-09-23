import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/aiClient";
import * as P from "@/lib/aiPrompts";
import { z } from "zod";
import {
  grievances_v1, claims_v1, map_v1, goals_v1, plans_v1, tasks_v1, post_v1, scores_v1
} from "@/lib/aiSchemas";

const stageMap = [
  { key: "s1", prompt: P.P_STAGE1, schema: grievances_v1 },
  { key: "s2", prompt: P.P_STAGE2, schema: claims_v1 },
  { key: "s3", prompt: P.P_STAGE3, schema: map_v1 },
  { key: "s4", prompt: P.P_STAGE4, schema: goals_v1 },
  { key: "s5", prompt: P.P_STAGE5, schema: plans_v1 },
  { key: "s6", prompt: P.P_STAGE6, schema: tasks_v1 },
  { key: "s7", prompt: P.P_STAGE7, schema: post_v1 },
  { key: "s8score", prompt: P.P_STAGE8_SCORE, schema: scores_v1 },
  { key: "s8rewrite", prompt: P.P_STAGE8_REWRITE, schema: null }
];

// Transform functions to fix common response format issues
const transformers = {
  s1: (data: any) => {
    // Fix for stage 1 (grievances)
    if (!data) return { reflection: "I understand your concerns.", grievances: [] };
    
    // Ensure reflection exists
    if (!data.reflection) {
      data.reflection = "I understand your concerns.";
    }
    
    // Fix grievances if it's not an array
    if (!Array.isArray(data.grievances)) {
      // If it's an object with numbered keys, convert to array
      if (data.grievances && typeof data.grievances === 'object') {
        const grievancesArray = [];
        for (const key in data.grievances) {
          if (data.grievances[key]) {
            // If it's already an object with text, use it
            if (typeof data.grievances[key] === 'object' && data.grievances[key].text) {
              grievancesArray.push(data.grievances[key]);
            } else {
              // Otherwise, create a new object with the value as text
              grievancesArray.push({ text: String(data.grievances[key]) });
            }
          }
        }
        data.grievances = grievancesArray;
      } else {
        // Default to empty array if we can't convert
        data.grievances = [];
      }
    }
    
    // Ensure at least one grievance
    if (data.grievances.length === 0) {
      data.grievances.push({ text: "Concern about the situation." });
    }
    
    return data;
  },
  
  s2: (data: any) => {
    // Fix for stage 2 (claims)
    console.log("Transforming stage 2 data:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Create a default structure if data is missing
    if (!data) {
      return {
        claims: [{ 
          claim: "The current situation requires further analysis.", 
          type: "falsifiable" 
        }],
        evidence_request: "Please provide factual information about the current situation."
      };
    }
    
    // Handle the case where the API returns a completely different structure
    const claims = [];
    
    // Try to extract claims from various possible structures
    if (data.falsifiable_claims && Array.isArray(data.falsifiable_claims)) {
      // If we have falsifiable_claims array
      data.falsifiable_claims.forEach((claim: any) => {
        if (typeof claim === 'string') {
          claims.push({ claim, type: "falsifiable" });
        } else if (claim && typeof claim === 'object' && claim.claim) {
          claims.push({ 
            claim: claim.claim, 
            type: "falsifiable",
            proposed_evidence: claim.proposed_evidence || undefined
          });
        }
      });
    } else if (data.claims && Array.isArray(data.claims)) {
      // If we already have a claims array, make sure each item has the right structure
      data.claims.forEach((claim: any) => {
        if (typeof claim === 'string') {
          claims.push({ claim, type: "falsifiable" });
        } else if (claim && typeof claim === 'object') {
          claims.push({
            claim: claim.claim || "Claim requires clarification",
            type: claim.type || "falsifiable",
            proposed_evidence: claim.proposed_evidence || undefined
          });
        }
      });
    } else if (data.grievances && Array.isArray(data.grievances)) {
      // Convert grievances to claims if that's all we have
      data.grievances.forEach((grievance: any) => {
        const text = typeof grievance === 'string' ? grievance : 
                    (grievance && grievance.text ? grievance.text : "Grievance requires clarification");
        claims.push({ 
          claim: `${text} is a concern that needs to be addressed.`, 
          type: "falsifiable" 
        });
      });
    }
    
    // Ensure we have at least one claim
    if (claims.length === 0) {
      claims.push({ 
        claim: "The situation requires further analysis to identify specific claims.", 
        type: "falsifiable" 
      });
    }
    
    // Create evidence request if missing
    const evidence_request = data.evidence_request || 
                            "Please provide factual information, statistics, or case studies related to these claims.";
    
    return { claims, evidence_request };
  },
  
  // Add other transformers as needed for other stages
};

export async function POST(req: Request) {
  try {
    const { stage, input, system = P.SYSTEM_CORE } = await req.json();
    const item = stageMap.find(s => s.key === stage);
    if (!item) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

    console.log(`Processing stage ${stage} with input:`, typeof input === "string" ? input : JSON.stringify(input).substring(0, 100) + "...");
    
    const raw = await chatJSON(system, typeof input === "string" ? input : JSON.stringify(input));
    console.log(`Raw response for stage ${stage}:`, raw);
    
    try {
      // Parse the raw JSON
      let parsedData;
      try {
        parsedData = JSON.parse(raw);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return NextResponse.json({ 
          ok: false, 
          error: "Failed to parse JSON response from AI", 
          raw 
        }, { status: 422 });
      }
      
      // Apply transformer if available for this stage
      if (transformers[stage as keyof typeof transformers]) {
        parsedData = transformers[stage as keyof typeof transformers](parsedData);
      }
      
      // Validate against schema
      const parsed = item.schema ? item.schema.parse(parsedData) : { markdown: raw };
      return NextResponse.json({ ok: true, data: parsed });
    } catch (e: any) {
      console.error(`Validation error for stage ${stage}:`, e);
      
      // Return detailed error information
      return NextResponse.json({ 
        ok: false, 
        error: e?.errors || e?.message || "Validation error", 
        raw,
        parsedData: typeof raw === 'string' ? JSON.parse(raw) : raw
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
