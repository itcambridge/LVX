export async function researchClaims(claims: string[]) {
  // Replace endpoint/model per your Perplexity plan.
  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY!}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "sonar-large-online", // placeholder
      messages: [{
        role: "user",
        content: `For each of these claims, return 3–5 reputable sources (title + url + 1-line summary). Claims: ${claims.join(" | ")}`
      }]
    })
  });
  const data = await r.json();
  // Normalize to [{label,url}] minimal structure expected by post_v1
  return data; // shape to fit your UI
}
