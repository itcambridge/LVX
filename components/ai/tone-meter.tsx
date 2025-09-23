export default function ToneMeter({ scores }:{scores?:any}) {
  if (!scores) return null;
  return (
    <div className="rounded-xl border p-3 text-sm space-y-1">
      <div>Civility: <b>{scores.civility}</b></div>
      <div>Heat: <b>{scores.heat}</b></div>
      <div>Bridge: <b>{scores.bridge}</b></div>
      <div>Factuality: <b>{scores.factuality_posture}</b></div>
      {scores.flagged?.length ? <ul className="list-disc pl-5">
        {scores.flagged.map((f:any,i:number)=><li key={i}>{f.phrase} — {f.reason}</li>)}
      </ul> : null}
    </div>
  );
}
