import { NextResponse } from "next/server";
import { researchClaims } from "@/lib/researchClient";

interface Source {
  label: string;
  url: string;
}

export async function POST(req: Request) {
  try {
    const { claims } = await req.json();
    const data = await researchClaims(claims || []);
    // Normalize to {sources:[{label,url}]}
    const sources: Source[] = []; // TODO shape from data
    return NextResponse.json({ ok: true, sources });
  } catch (error: any) {
    console.error("Research error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Failed to research claims"
    }, { status: 500 });
  }
}
