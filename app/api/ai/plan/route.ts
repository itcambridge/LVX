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

export async function POST(req: Request) {
  const { stage, input, system = P.SYSTEM_CORE } = await req.json();
  const item = stageMap.find(s => s.key === stage);
  if (!item) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

  const raw = await chatJSON(system, typeof input === "string" ? input : JSON.stringify(input));
  try {
    const parsed = item.schema ? item.schema.parse(JSON.parse(raw)) : { markdown: raw };
    return NextResponse.json({ ok: true, data: parsed });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message, raw }, { status: 422 });
  }
}
