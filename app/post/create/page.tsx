"use client";
import { useState } from "react";
import { useAiPlanner } from "@/hooks/useAiPlanner";
import ToneMeter from "@/components/ai/tone-meter";

export default function CreatePost() {
  const [projectId] = useState<string>(crypto.randomUUID()); // or create a draft project row first
  const planner = useAiPlanner(projectId);
  const [vent, setVent] = useState("");
  const [draft, setDraft] = useState<any>({});
  const [post, setPost] = useState<any>(null);
  const [finalMd, setFinalMd] = useState("");

  async function publish() {
    const body = post?.body_markdown || finalMd;
    await fetch("/api/projects/publish", {
      method:"POST",
      body: JSON.stringify({ projectId, title: post?.titles?.[0] || "Untitled", tldr: post?.tldr || "", body_markdown: body })
    });
    window.location.href = `/project/${projectId}`;
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Create Political Media Post</h1>

      {/* Stage 1 */}
      <section>
        <h2 className="font-medium">1) Vent</h2>
        <textarea className="w-full border rounded p-2" rows={4} value={vent} onChange={e=>setVent(e.target.value)} />
        <button className="btn" onClick={async ()=>{
          const s1 = await planner.runStage1(vent); setDraft((d:any)=>({...d, s1}));
        }}>Next</button>
      </section>

      {/* Repeat similarly for Stages 2–6 using planner.runStageX(...) */}

      {/* Stage 7 */}
      <section>
        <h2 className="font-medium">7) Draft Story</h2>
        <button className="btn" onClick={async ()=>{
          const p = await planner.runStage7({ ...draft }); setPost(p); setFinalMd(p.body_markdown);
        }}>Generate Post</button>
        {post && (
          <div>
            <h3 className="mt-3">Preview</h3>
            <textarea className="w-full border rounded p-2" rows={12} value={finalMd} onChange={e=>setFinalMd(e.target.value)} />
          </div>
        )}
      </section>

      {/* Stage 8 */}
      <section>
        <h2 className="font-medium">8) Tone Score</h2>
        <button className="btn" onClick={async ()=>{
          const { scores, rewrite } = await planner.scoreAndMaybeRewrite(finalMd);
          if (rewrite) setFinalMd(rewrite);
        }}>Score / Rewrite</button>
        <ToneMeter scores={planner.scores} />
        {(planner.scores && (planner.scores.civility < 80 || planner.scores.heat > 30)) && (
          <div className="text-amber-600 text-sm">
            Warning: Civility below target or Heat above target. You can rewrite (recommended) or continue.
          </div>
        )}
      </section>

      {/* Publish (enabled only after Stage 8 reached) */}
      <button
        disabled={planner.stage < 8}
        className="btn-primary disabled:opacity-50"
        onClick={publish}
      >
        Publish
      </button>
    </div>
  );
}
