import { useState, useRef, useEffect } from "react";

export function useAiPlanner(projectId: string) {
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [emphasis, setEmphasis] = useState<"efficiency" | "empathy" | "balanced">("balanced");
  const [version, setVersion] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
          
          // Format the warning message to be more user-friendly
          let warningMessage = data.warning;
          
          // Handle specific error types
          if (warningMessage.includes("timeout")) {
            warningMessage = "Your input is complex and took longer than expected to process. We've provided a simplified response. Consider breaking your topic into smaller parts for better results.";
          } else if (warningMessage.includes("HTML") || warningMessage.includes("response format")) {
            warningMessage = "We encountered an issue processing your input. This may be due to sensitive content. We've provided a simplified response instead.";
          }
          
          setError(`Note: ${warningMessage}`);
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
      
      // Provide more user-friendly error messages
      let errorMessage = err.message || "Failed to process input";
      
      if (errorMessage.includes("timeout") || errorMessage.includes("aborted")) {
        errorMessage = "Your input took too long to process. Please try again with a shorter or less complex input.";
      } else if (errorMessage.includes("HTML") || errorMessage.includes("content")) {
        errorMessage = "We couldn't process your input due to content restrictions. Please try rephrasing with less sensitive language.";
      } else if (errorMessage.includes("JSON") || errorMessage.includes("parse")) {
        errorMessage = "We encountered a technical issue processing your input. Please try again or contact support if the issue persists.";
      }
      
      setError(errorMessage);
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
          stage: "oneshot", // For compatibility with existing code
          imageUrl: imageUrl
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
          to_verify_items: output.evidence_slots.to_verify,
          imageUrl: imageUrl
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

  /**
   * Set the image URL for the project
   */
  function setProjectImage(url: string) {
    if (!isMounted.current) return;
    setImageUrl(url);
  }

  return {
    output,
    error,
    loading,
    emphasis,
    version,
    imageUrl,
    processInput,
    regenerateBridgeStory,
    checkTone,
    publish,
    setEmphasis,
    setProjectImage
  };
}
