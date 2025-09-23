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
