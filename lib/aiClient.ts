import OpenAI from "openai";
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function chatJSON(system: string, user: string) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini", // or your chosen model
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, { role: "user", content: user }]
  });
  return res.choices[0]?.message?.content ?? "{}";
}
