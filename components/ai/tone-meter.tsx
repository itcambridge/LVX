export default function ToneMeter({ scores }:{scores?:any}) {
  if (!scores) return null;
  
  // Support both legacy scores format and new safety_notes format
  const hasCivility = typeof scores.civility === 'number';
  const hasHeat = typeof scores.heat === 'number';
  const hasBridge = typeof scores.bridge === 'number';
  const hasFactuality = typeof scores.factuality_posture === 'number';
  const hasWarnings = Array.isArray(scores.warnings);
  const hasFlagged = Array.isArray(scores.flagged);
  
  return (
    <div className="rounded-xl border p-3 text-sm space-y-1">
      {hasCivility && <div>Civility: <b>{scores.civility}</b></div>}
      {hasHeat && <div>Heat: <b>{scores.heat}</b></div>}
      {hasBridge && <div>Bridge: <b>{scores.bridge}</b></div>}
      {hasFactuality && <div>Factuality: <b>{scores.factuality_posture}</b></div>}
      
      {/* Legacy flagged items */}
      {hasFlagged && scores.flagged.length > 0 && (
        <div>
          <div className="font-medium mt-2">Flagged Content:</div>
          <ul className="list-disc pl-5">
            {scores.flagged.map((f:any, i:number) => (
              <li key={i}>{f.phrase} — {f.reason}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* New warnings */}
      {hasWarnings && scores.warnings.length > 0 && (
        <div>
          <div className="font-medium mt-2">Warnings:</div>
          <ul className="list-disc pl-5">
            {scores.warnings.map((warning:string, i:number) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Rejected content notice */}
      {scores.rejected_content && (
        <div className="mt-2 text-red-600">
          <span className="font-medium">Content Rejected: </span>
          {scores.rejection_reason || "Content does not meet community standards."}
        </div>
      )}
    </div>
  );
}
