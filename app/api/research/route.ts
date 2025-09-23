import { NextResponse } from "next/server";
import { researchClaims } from "@/lib/researchClient";

interface Source {
  label: string;
  url: string;
}

export async function POST(req: Request) {
  const { claims } = await req.json();
  const data = await researchClaims(claims || []);
  // Normalize to {sources:[{label,url}]}
  const sources: Source[] = []; // TODO shape from data
  return NextResponse.json({ ok: true, sources });
}
