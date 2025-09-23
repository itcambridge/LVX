import { useState } from "react";

type Stage = 1|2|3|4|5|6|7|8;

export function useAiPlanner(projectId: string) {
  const [stage, setStage] = useState<Stage>(1);
  const [bundle, setBundle] = useState<any>({});
  const [scores, setScores] = useState<any>(null);

  async function call(stageKey: string, input: any) {
    const r = await fetch("/api/ai/plan", { method:"POST", body: JSON.stringify({ stage: stageKey, input }) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "AI error");
    return j.data;
  }

  async function save(partial: any, extra?: any) {
    await fetch("/api/projects/save-draft", {
      method:"POST",
      body: JSON.stringify({ projectId, stage, bundlePatch: partial, ...extra })
    });
  }

  return {
    stage, setStage, bundle, setBundle, scores, setScores,
    runStage1: async (vent: string) => {
      const data = await call("s1", vent); setBundle((b:any)=>({...b, s1:data})); setStage(2); await save({ s1:data });
      return data;
    },
    runStage2: async (s1:any) => {
      const data = await call("s2", s1); setBundle((b:any)=>({...b, s2:data})); setStage(3); await save({ s2:data });
      return data;
    },
    runStage3: async (s2:any) => { const d = await call("s3", s2); setBundle((b:any)=>({...b, s3:d})); setStage(4); await save({ s3:d }); return d; },
    runStage4: async (s3:any) => { const d = await call("s4", s3); setBundle((b:any)=>({...b, s4:d})); setStage(5); await save({ s4:d }); return d; },
    runStage5: async (s4:any) => { const d = await call("s5", s4); setBundle((b:any)=>({...b, s5:d})); setStage(6); await save({ s5:d }); return d; },
    runStage6: async (s5:any) => { const d = await call("s6", s5); setBundle((b:any)=>({...b, s6:d})); setStage(7); await save({ s6:d }); return d; },
    runStage7: async (input:any, sources?:any[]) => {
      const d = await call("s7", { ...input, sources }); setBundle((b:any)=>({...b, s7:d})); setStage(8); await save({ s7:d }, { sources }); return d;
    },
    scoreAndMaybeRewrite: async (markdown: string) => {
      const s = await call("s8score", markdown); setScores(s);
      if (s.civility < 80 || s.heat > 30) {
        const rw = await call("s8rewrite", markdown);
        return { scores: s, rewrite: rw?.markdown || rw };
      }
      return { scores: s, rewrite: null };
    }
  };
}
