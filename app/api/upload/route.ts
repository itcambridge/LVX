import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Get the file extension
    const fileExt = file.name.split(".").pop();
    // Create a unique file name
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("project-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });
    
    if (error) {
      console.error("Error uploading file:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("project-images")
      .getPublicUrl(data.path);
    
    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: data.path,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
