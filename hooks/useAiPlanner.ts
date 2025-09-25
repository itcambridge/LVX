import { useState, useRef, useEffect } from "react";

export function useAiPlanner(projectId: string) {
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [emphasis, setEmphasis] = useState<"efficiency" | "empathy" | "balanced">("balanced");
  const [version, setVersion] = useState<number>(1);
  const isMounted = useRef(true);
  
  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => { 
      isMounted.current = false; 
    };
  }, []);

  /**
   * Process input using one-shot approach with fallback to staged
   */
  async function processInput(input: string) {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    
    try {
      // Try one-shot approach first
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stage: "oneshot", 
          input,
          emphasis
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Check if a fallback was used
        if (data.warning) {
          // Still set the output but also show a warning
          setOutput(data.data);
          await save(data.data);
          setError(`Note: ${data.warning}`);
          setLoading(false);
          return data.data;
        } else {
          // Normal successful response
          setOutput(data.data);
          await save(data.data);
          setLoading(false);
          return data.data;
        }
      } else if (data.fallback) {
        // Fall back to staged approach
        setError("One-shot processing failed. Staged approach not yet implemented.");
        setLoading(false);
        return null;
      } else {
        setError(data.error || "Processing failed");
        setLoading(false);
        return null;
      }
    } catch (err: any) {
      console.error("Error processing input:", err);
      setError(err.message || "Failed to process input");
      setLoading(false);
      return null;
    }
  }

  /**
   * Save the current state to the database
   */
  async function save(bundlePatch: any) {
    if (!isMounted.current) return;
    
    try {
      const response = await fetch("/api/projects/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          projectId, 
          bundlePatch,
          version,
          emphasis,
          stage: "oneshot" // For compatibility with existing code
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error saving draft:", errorData);
        // Don't show error to user for background saves
      } else {
        const data = await response.json();
        console.log("Save result:", data);
        // Increment version for next save
        setVersion(v => v + 1);
      }
    } catch (err: any) {
      console.error("Failed to save draft:", err);
      // Don't show error to user for background saves
    }
  }

  /**
   * Regenerate the bridge story with a different emphasis
   */
  async function regenerateBridgeStory(newEmphasis: "efficiency" | "empathy" | "balanced") {
    if (!output || !output.bridge_story || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    setEmphasis(newEmphasis);
    
    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stage: "rewrite", 
          input: output.bridge_story.paragraphs.join("\n\n"),
          emphasis: newEmphasis
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Update only the bridge story part
        const updatedOutput = {
          ...output,
          bridge_story: {
            ...output.bridge_story,
            paragraphs: data.data.markdown.split("\n\n"),
            emphasis: newEmphasis
          }
        };
        
        setOutput(updatedOutput);
        await save(updatedOutput);
        setLoading(false);
        return updatedOutput;
      } else {
        setError(data.error || "Regeneration failed");
        setLoading(false);
        return null;
      }
    } catch (err: any) {
      console.error("Error regenerating bridge story:", err);
      setError(err.message || "Failed to regenerate bridge story");
      setLoading(false);
      return null;
    }
  }

  /**
   * Publish the project
   */
  async function publish() {
    if (!output || !output.bridge_story || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First ensure the draft is saved
      await save(output);
      
      const response = await fetch("/api/projects/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId, 
          title: output.bridge_story.thin_edge,
          tldr: output.bridge_story.paragraphs[0],
          body_markdown: output.bridge_story.paragraphs.join("\n\n"),
          to_verify_items: output.evidence_slots.to_verify
        })
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        console.error("Publish error:", data.error);
        throw new Error(typeof data.error === 'string' ? data.error : "Failed to publish");
      }
      
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Publish error:", err);
      setError(err.message || "Failed to publish. Please try again.");
      setLoading(false);
      return false;
    }
  }

  /**
   * Check tone of the bridge story
   */
  async function checkTone() {
    if (!output || !output.bridge_story || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stage: "tone", 
          input: output.bridge_story.paragraphs.join("\n\n")
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        const updatedOutput = {
          ...output,
          safety_notes: data.data
        };
        
        setOutput(updatedOutput);
        await save(updatedOutput);
        setLoading(false);
        return data.data;
      } else {
        setError(data.error || "Tone check failed");
        setLoading(false);
        return null;
      }
    } catch (err: any) {
      console.error("Error checking tone:", err);
      setError(err.message || "Failed to check tone");
      setLoading(false);
      return null;
    }
  }

  return {
    output,
    error,
    loading,
    emphasis,
    version,
    processInput,
    regenerateBridgeStory,
    checkTone,
    publish,
    setEmphasis
  };
}
