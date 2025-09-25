import { z } from "zod";

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
    baseline: z.string().nullable().optional(),
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
    sunset: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    scale: z.union([z.string(), z.array(z.string())]).nullable().optional()
  }),
  unknowns: z.array(z.string())
});

export const solution_paths_v1 = z.object({
  paths: z.array(z.object({
    name: z.string(),
    core_moves: z.array(z.string()),
    guardrails: z.array(z.string()),
    trade_offs: z.array(z.string())
  })).min(1).max(4)
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

// Legacy schemas (keeping for backward compatibility)
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
