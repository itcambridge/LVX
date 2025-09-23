"use client";
import { useState, useEffect } from "react";
import { useAiPlanner } from "@/hooks/useAiPlanner";
import ToneMeter from "@/components/ai/tone-meter";

export default function CreatePost() {
  const [projectId] = useState<string>(crypto.randomUUID()); // or create a draft project row first
  const planner = useAiPlanner(projectId);
  const [vent, setVent] = useState("");
  const [draft, setDraft] = useState<any>({});
  const [post, setPost] = useState<any>(null);
  const [finalMd, setFinalMd] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync error state with planner error
  useEffect(() => {
    if (planner.error) {
      setError(planner.error);
    }
  }, [planner.error]);

  async function publish() {
    try {
      setLoading("publishing");
      setError(null);
      const body = post?.body_markdown || finalMd;
      
      const response = await fetch("/api/projects/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          projectId, 
          title: post?.titles?.[0] || "Untitled", 
          tldr: post?.tldr || "", 
          body_markdown: body 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to publish");
      }
      
      window.location.href = `/project/${projectId}`;
    } catch (err: any) {
      console.error("Publish error:", err);
      setError(err.message || "Failed to publish. Please try again.");
      setLoading(null);
    }
  }

  async function runStage(stageNum: number, input: any) {
    try {
      setLoading(`stage${stageNum}`);
      setError(null);
      let result: any;
      
      switch(stageNum) {
        case 1:
          result = await planner.runStage1(input);
          break;
        case 2:
          result = await planner.runStage2(input);
          break;
        case 3:
          result = await planner.runStage3(input);
          break;
        case 4:
          result = await planner.runStage4(input);
          break;
        case 5:
          result = await planner.runStage5(input);
          break;
        case 6:
          result = await planner.runStage6(input);
          break;
        case 7:
          result = await planner.runStage7(input);
          if (result) {
            setPost(result);
            setFinalMd(result.body_markdown || "");
          }
          break;
        case 8:
          const { scores, rewrite, error: scoreError } = await planner.scoreAndMaybeRewrite(input);
          if (scoreError) {
            setError("Failed to score the post. You can still publish.");
          } else if (rewrite) {
            setFinalMd(rewrite);
          }
          result = scores;
          break;
      }
      
      if (stageNum < 7 && result) {
        setDraft((d:any) => ({...d, [`s${stageNum}`]: result}));
      }
      
      setLoading(null);
      return result;
    } catch (err: any) {
      console.error(`Error in stage ${stageNum}:`, err);
      // Error is already set by the planner
      setLoading(null);
      return null;
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Create Political Media Post</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          <button 
            className="absolute top-0 right-0 px-4 py-3" 
            onClick={() => {
              setError(null);
              planner.setError(null);
            }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stage 1 */}
      <section className={planner.stage !== 1 ? "opacity-50" : ""}>
        <h2 className="font-medium">1) Vent</h2>
        <textarea 
          className="w-full border rounded p-2 mb-2" 
          rows={4} 
          value={vent} 
          onChange={e => setVent(e.target.value)}
          disabled={planner.stage !== 1}
        />
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => runStage(1, vent)}
          disabled={!vent.trim() || loading === "stage1" || planner.stage !== 1}
        >
          {loading === "stage1" ? "Processing..." : "Next"}
        </button>
      </section>

      {/* Stage 2 */}
      {planner.stage >= 2 && (
        <section className={planner.stage !== 2 ? "opacity-50" : ""}>
          <h2 className="font-medium">2) Claims</h2>
          {draft.s1 && (
            <div className="mb-2 p-3 bg-gray-50 rounded text-sm">
              <p className="italic">{typeof draft.s1.reflection === 'string' ? draft.s1.reflection : "I understand your concerns."}</p>
              <ul className="list-disc pl-5 mt-2">
                {Array.isArray(draft.s1.grievances) ? 
                  draft.s1.grievances.map((g: any, i: number) => (
                    <li key={i}>
                      {typeof g === 'string' ? g : 
                       typeof g === 'object' && g !== null && 'text' in g ? g.text : 
                       "Grievance details unavailable"}
                      {typeof g === 'object' && g !== null && 'emotion' in g && g.emotion ? ` (${g.emotion})` : ""}
                    </li>
                  )) : 
                  <li>Grievance information not available in expected format</li>
                }
              </ul>
            </div>
          )}
          
          {draft.s2 && (
            <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
              <p className="font-medium mb-2">Generated Claims:</p>
              
              {/* Debug information */}
              <div className="mb-2 p-2 bg-gray-100 text-xs">
                <p>Debug - Claims data structure:</p>
                <pre>{JSON.stringify(draft.s2, null, 2)}</pre>
              </div>
              
              <ul className="list-disc pl-5">
                {Array.isArray(draft.s2.claims) ? 
                  draft.s2.claims.map((c: any, i: number) => {
                    console.log("Claim object:", c);
                    
                    // Safely extract claim text with more detailed fallbacks
                    let claimText = "Claim details unavailable";
                    if (typeof c === 'string') {
                      claimText = c;
                    } else if (typeof c === 'object' && c !== null) {
                      if ('claim' in c) {
                        claimText = c.claim;
                      } else if ('text' in c) {
                        claimText = c.text;
                      } else {
                        // Try to stringify the object for debugging
                        claimText = `Object: ${JSON.stringify(c)}`;
                      }
                    }
                    
                    // Safely extract claim type
                    const claimType = typeof c === 'object' && c !== null && 'type' in c ? c.type : 
                                     (typeof c === 'object' && c !== null && 'falsifiable' in c ? 
                                      (c.falsifiable ? "falsifiable" : "unfalsifiable") : null);
                    
                    // Safely extract proposed evidence
                    const evidence = typeof c === 'object' && c !== null && 'proposed_evidence' in c ? c.proposed_evidence : null;
                    
                    return (
                      <li key={i} className="mb-1">
                        <span className="font-medium">{claimText}</span>
                        {claimType && (
                          <span className="ml-1 text-xs bg-blue-100 px-1 py-0.5 rounded">{claimType}</span>
                        )}
                        {evidence && Array.isArray(evidence) && evidence.length > 0 && (
                          <div className="ml-4 mt-1 text-xs text-gray-600">
                            <p>Proposed evidence:</p>
                            <ul className="list-disc pl-4">
                              {evidence.map((e: any, j: number) => (
                                <li key={j}>{typeof e === 'string' ? e : JSON.stringify(e)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    );
                  }) : 
                  <li>No claims generated yet</li>
                }
              </ul>
              {draft.s2 && typeof draft.s2.evidence_request === 'string' && (
                <p className="mt-2 text-xs italic">{draft.s2.evidence_request}</p>
              )}
            </div>
          )}
          
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => runStage(2, draft.s1)}
            disabled={loading === "stage2" || planner.stage !== 2}
          >
            {loading === "stage2" ? "Processing..." : draft.s2 ? "Regenerate Claims" : "Generate Claims"}
          </button>
        </section>
      )}

      {/* Stage 3 */}
      {planner.stage >= 3 && (
        <section className={planner.stage !== 3 ? "opacity-50" : ""}>
          <h2 className="font-medium">3) Steelman & Stakeholders</h2>
          {draft.s2 && (
            <div className="mb-2 p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium">Claims:</p>
              <ul className="list-disc pl-5">
                {Array.isArray(draft.s2.claims) ? 
                  draft.s2.claims.map((c: any, i: number) => {
                    // Safely extract claim text and type
                    const claimText = typeof c === 'string' ? c : 
                                     (typeof c === 'object' && c !== null && 'claim' in c ? c.claim : 
                                     "Claim details unavailable");
                    
                    const claimType = typeof c === 'object' && c !== null && 'type' in c ? c.type : "falsifiable";
                    
                    return (
                      <li key={i}>{claimText} ({claimType})</li>
                    );
                  }) : 
                  <li>No claims available</li>
                }
              </ul>
              {typeof draft.s2.evidence_request === 'string' && (
                <p className="mt-2 text-xs italic">{draft.s2.evidence_request}</p>
              )}
            </div>
          )}
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => runStage(3, draft.s2)}
            disabled={loading === "stage3" || planner.stage !== 3}
          >
            {loading === "stage3" ? "Processing..." : "Map Stakeholders"}
          </button>
        </section>
      )}

      {/* Stage 4 */}
      {planner.stage >= 4 && (
        <section className={planner.stage !== 4 ? "opacity-50" : ""}>
          <h2 className="font-medium">4) SMART Goals</h2>
          {draft.s3 && (
            <div className="mb-2 p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium">Analyses:</p>
              {draft.s3.analyses.map((a: any, i: number) => (
                <div key={i} className="mb-2">
                  <p><strong>Claim:</strong> {a.claim}</p>
                  <p><strong>Steelman:</strong> {a.steelman}</p>
                  <p><strong>Stakeholders:</strong> {a.stakeholders.length}</p>
                </div>
              ))}
            </div>
          )}
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => runStage(4, draft.s3)}
            disabled={loading === "stage4" || planner.stage !== 4}
          >
            {loading === "stage4" ? "Processing..." : "Set Goals"}
          </button>
        </section>
      )}

      {/* Stage 5 */}
      {planner.stage >= 5 && (
        <section className={planner.stage !== 5 ? "opacity-50" : ""}>
          <h2 className="font-medium">5) Plan Options</h2>
          {draft.s4 && (
            <div className="mb-2 p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium">Goals:</p>
              <ul className="list-disc pl-5">
                {draft.s4.goals.map((g: any, i: number) => (
                  <li key={i}>
                    <strong>{g.title}</strong>
                    <p className="text-xs">Metric: {g.metric.name} ({g.metric.baseline} → {g.metric.target})</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => runStage(5, draft.s4)}
            disabled={loading === "stage5" || planner.stage !== 5}
          >
            {loading === "stage5" ? "Processing..." : "Generate Plans"}
          </button>
        </section>
      )}

      {/* Stage 6 */}
      {planner.stage >= 6 && (
        <section className={planner.stage !== 6 ? "opacity-50" : ""}>
          <h2 className="font-medium">6) Task Board</h2>
          {draft.s5 && (
            <div className="mb-2 p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium">Plans:</p>
              {draft.s5.plans.map((p: any, i: number) => (
                <div key={i} className="mb-2 pb-2 border-b">
                  <p><strong>{p.name}</strong></p>
                  <p className="text-xs">Time: {p.time_range_days[0]}-{p.time_range_days[1]} days</p>
                  <p className="text-xs">Budget: {p.budget_range[0]}-{p.budget_range[1]}</p>
                </div>
              ))}
            </div>
          )}
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => runStage(6, draft.s5)}
            disabled={loading === "stage6" || planner.stage !== 6}
          >
            {loading === "stage6" ? "Processing..." : "Create Tasks"}
          </button>
        </section>
      )}

      {/* Stage 7 */}
      {planner.stage >= 7 && (
        <section className={planner.stage !== 7 ? "opacity-50" : ""}>
          <h2 className="font-medium">7) Draft Story</h2>
          {draft.s6 && (
            <div className="mb-2 p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium">Roles: {draft.s6.roles.join(", ")}</p>
              <p className="font-medium mt-2">Sprint Weeks: {draft.s6.sprint_weeks.length}</p>
            </div>
          )}
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => runStage(7, draft)}
            disabled={loading === "stage7" || planner.stage !== 7}
          >
            {loading === "stage7" ? "Processing..." : "Generate Post"}
          </button>
          {post && (
            <div className="mt-3">
              <h3 className="font-medium">Preview</h3>
              <p className="text-sm font-medium mt-2">{post.titles?.[0]}</p>
              <p className="text-sm italic mb-2">{post.tldr}</p>
              <textarea 
                className="w-full border rounded p-2" 
                rows={12} 
                value={finalMd} 
                onChange={e => setFinalMd(e.target.value)} 
              />
            </div>
          )}
        </section>
      )}

      {/* Stage 8 */}
      {planner.stage >= 8 && (
        <section>
          <h2 className="font-medium">8) Tone Score</h2>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => runStage(8, finalMd)}
            disabled={loading === "stage8" || !finalMd}
          >
            {loading === "stage8" ? "Processing..." : "Score / Rewrite"}
          </button>
          <ToneMeter scores={planner.scores} />
          {(planner.scores && (planner.scores.civility < 80 || planner.scores.heat > 30)) && (
            <div className="text-amber-600 text-sm mt-2">
              Warning: Civility below target or Heat above target. You can rewrite (recommended) or continue.
            </div>
          )}
        </section>
      )}

      {/* Publish (enabled only after Stage 8 reached) */}
      <button
        disabled={planner.stage < 8 || !finalMd || loading === "publishing"}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full mt-4"
        onClick={publish}
      >
        {loading === "publishing" ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}
