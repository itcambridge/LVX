import { useState } from "react";

type Stage = 1|2|3|4|5|6|7|8;

export function useAiPlanner(projectId: string) {
  const [stage, setStage] = useState<Stage>(1);
  const [bundle, setBundle] = useState<any>({});
  const [scores, setScores] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Call the AI API with error handling
   */
  async function call(stageKey: string, input: any) {
    try {
      setError(null);
      console.log(`Calling AI for stage ${stageKey} with input:`, input);
      
      const r = await fetch("/api/ai/plan", { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ stage: stageKey, input }) 
      });
      
      const j = await r.json();
      
      if (!j.ok) {
        console.error(`Error in stage ${stageKey}:`, j.error, "Raw:", j.raw);
        setError(Array.isArray(j.error) ? j.error.map((e: any) => e.message).join(", ") : j.error);
        throw new Error(j.error || "AI processing error");
      }
      
      return j.data;
    } catch (err: any) {
      console.error(`Error in stage ${stageKey}:`, err);
      setError(err.message || "Failed to process this stage");
      throw err;
    }
  }

  /**
   * Save the current state to the database
   */
  async function save(partial: any, extra?: any) {
    try {
      const response = await fetch("/api/projects/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ projectId, stage, bundlePatch: partial, ...extra })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error saving draft:", errorData);
      }
    } catch (err: any) {
      console.error("Failed to save draft:", err);
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
