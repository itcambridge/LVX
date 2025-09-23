import OpenAI from "openai";

// Create OpenAI client with error handling
export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false // Ensure this is only used server-side
});

/**
 * Sanitizes a JSON string to remove problematic characters
 * @param jsonString The JSON string to sanitize
 * @returns Sanitized JSON string
 */
function sanitizeJsonString(jsonString: string): string {
  if (typeof jsonString !== 'string') return '{}';
  
  try {
    // Remove control characters and other problematic Unicode
    const sanitized = jsonString
      .replace(/[\u0000-\u001F\u007F-\u009F\u2000-\u200F\u2028-\u202F\uFFF0-\uFFFF]/g, '')
      // Fix common JSON syntax errors
      .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
      .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
      .replace(/([^\\])\\([^"\\/bfnrtu])/g, '$1\\\\$2'); // Escape backslashes properly
    
    // Validate by parsing and re-stringifying
    const parsed = JSON.parse(sanitized);
    return JSON.stringify(parsed);
  } catch (e) {
    // If sanitization fails, return the original string
    // The calling code will handle the parsing error
    return jsonString;
  }
}

/**
 * Makes a request to OpenAI API for JSON-formatted chat completion
 * @param system The system prompt
 * @param user The user input
 * @returns JSON string response from the API
 */
export async function chatJSON(system: string, user: string) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return JSON.stringify({
        error: "API key not configured",
        fallback: true,
        reflection: "I'm unable to process your request at this time due to configuration issues.",
        grievances: [{ text: "System configuration issue" }]
      });
    }

    // Make the API request
    console.log("Making OpenAI request with system prompt:", system.substring(0, 50) + "...");
    
    // Add explicit instructions to return valid JSON
    const enhancedSystem = `${system}\n\nIMPORTANT: Your response MUST be valid JSON. Ensure all strings are properly quoted and escaped.`;
    
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or your chosen model
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: enhancedSystem }, 
        { role: "user", content: user }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Extract and validate the response
    const content = res.choices[0]?.message?.content;
    if (!content) {
      console.error("Empty response from OpenAI");
      return "{}";
    }

    // Try to sanitize the JSON string
    try {
      const sanitized = sanitizeJsonString(content);
      return sanitized;
    } catch (sanitizeError) {
      console.error("Failed to sanitize JSON:", sanitizeError);
      // Return the original content if sanitization fails
      return content;
    }
  } catch (error: any) {
    // Handle API errors
    console.error("OpenAI API error:", error.message || error);
    
    // Return a fallback response
    return JSON.stringify({
      error: error.message || "Unknown error",
      fallback: true,
      reflection: "I encountered an error while processing your request.",
      grievances: [{ text: "Error in processing" }]
    });
  }
}
