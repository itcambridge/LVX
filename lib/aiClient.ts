import OpenAI from "openai";

// Create OpenAI client with error handling
export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false // Ensure this is only used server-side
});

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
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or your chosen model
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system }, 
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

    // Return the content
    return content;
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
